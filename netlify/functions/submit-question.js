// netlify/functions/submit-question.js
// Server-side rate limiting and validation for question submissions

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');

// Initialize Firebase Admin (only once)
let db;
function getFirebaseDb() {
  if (!db) {
    if (getApps().length === 0) {
      // Use environment variables for Firebase Admin credentials
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };

      initializeApp({
        credential: cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    }
    db = getDatabase();
  }
  return db;
}

// In-memory rate limit store (resets on cold start, but provides basic protection)
// For production, consider using Netlify Blobs or an external store like Upstash Redis
const rateLimitStore = new Map();

// Rate limit configuration
const RATE_LIMITS = {
  questionsPerIP: {
    max: 20,           // Max questions per IP
    windowMs: 3600000, // 1 hour
  },
  questionsPerFingerprint: {
    max: 10,           // Max questions per browser fingerprint
    windowMs: 3600000, // 1 hour
  },
  globalPerMinute: {
    max: 100,          // Max questions globally per minute (anti-DDoS)
    windowMs: 60000,   // 1 minute
  },
};

// Check rate limit
function checkRateLimit(key, config) {
  const now = Date.now();
  const record = rateLimitStore.get(key) || { count: 0, resetAt: now + config.windowMs };

  // Reset if window has passed
  if (now >= record.resetAt) {
    record.count = 0;
    record.resetAt = now + config.windowMs;
  }

  if (record.count >= config.max) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true, remaining: config.max - record.count - 1 };
}

// Increment rate limit counter
function incrementRateLimit(key, config) {
  const now = Date.now();
  const record = rateLimitStore.get(key) || { count: 0, resetAt: now + config.windowMs };

  if (now >= record.resetAt) {
    record.count = 1;
    record.resetAt = now + config.windowMs;
  } else {
    record.count += 1;
  }

  rateLimitStore.set(key, record);
}

// Sanitize text input
function sanitizeText(input, maxLength = 1000) {
  if (!input || typeof input !== 'string') return '';

  // Remove HTML tags
  let cleaned = input.replace(/<[^>]*>/g, '');

  // Remove null bytes
  cleaned = cleaned.replace(/\0/g, '');

  // Trim and limit length
  cleaned = cleaned.trim().substring(0, maxLength);

  return cleaned;
}

// Validate question
function validateQuestion(text) {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: 'Question is required' };
  }

  const sanitized = sanitizeText(text, 1000);

  if (sanitized.length < 5) {
    return { valid: false, error: 'Question must be at least 5 characters' };
  }

  if (sanitized.length > 1000) {
    return { valid: false, error: 'Question cannot exceed 1000 characters' };
  }

  // Check for spam patterns
  if (/(.)\1{10,}/.test(sanitized)) {
    return { valid: false, error: 'Question appears to be spam' };
  }

  return { valid: true, sanitized };
}

// Validate author name
function validateAuthor(author) {
  if (!author || typeof author !== 'string') {
    return { valid: true, sanitized: 'Anonymous' };
  }

  const sanitized = sanitizeText(author, 100);
  return { valid: true, sanitized: sanitized || 'Anonymous' };
}

// Main handler
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Fingerprint',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Get client IP (Netlify provides this)
    const clientIP = event.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || event.headers['client-ip']
      || 'unknown';

    // Get browser fingerprint from header (optional, for additional protection)
    const fingerprint = event.headers['x-fingerprint'] || 'unknown';

    // Check global rate limit (anti-DDoS)
    const globalCheck = checkRateLimit('global', RATE_LIMITS.globalPerMinute);
    if (!globalCheck.allowed) {
      return {
        statusCode: 429,
        headers: { ...headers, 'Retry-After': String(globalCheck.retryAfter) },
        body: JSON.stringify({
          error: 'Server is busy. Please try again later.',
          retryAfter: globalCheck.retryAfter
        }),
      };
    }

    // Check IP-based rate limit
    const ipCheck = checkRateLimit(`ip:${clientIP}`, RATE_LIMITS.questionsPerIP);
    if (!ipCheck.allowed) {
      return {
        statusCode: 429,
        headers: { ...headers, 'Retry-After': String(ipCheck.retryAfter) },
        body: JSON.stringify({
          error: 'Too many questions from your network. Please try again later.',
          retryAfter: ipCheck.retryAfter
        }),
      };
    }

    // Check fingerprint-based rate limit
    if (fingerprint !== 'unknown') {
      const fpCheck = checkRateLimit(`fp:${fingerprint}`, RATE_LIMITS.questionsPerFingerprint);
      if (!fpCheck.allowed) {
        return {
          statusCode: 429,
          headers: { ...headers, 'Retry-After': String(fpCheck.retryAfter) },
          body: JSON.stringify({
            error: 'Too many questions from this device. Please try again later.',
            retryAfter: fpCheck.retryAfter
          }),
        };
      }
    }

    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid request body' }),
      };
    }

    const { eventId, question, author, anonymous } = body;

    // Validate eventId
    if (!eventId || typeof eventId !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Event ID is required' }),
      };
    }

    // Validate question
    const questionValidation = validateQuestion(question);
    if (!questionValidation.valid) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: questionValidation.error }),
      };
    }

    // Validate author
    const authorValidation = validateAuthor(anonymous ? 'Anonymous' : author);

    // Get Firebase database
    const database = getFirebaseDb();

    // Verify event exists and is accepting questions
    const eventRef = database.ref(`events/${eventId}`);
    const eventSnapshot = await eventRef.once('value');
    const eventData = eventSnapshot.val();

    if (!eventData) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Event not found' }),
      };
    }

    // Check if event is published/unlisted and accepting questions
    const validStatuses = ['published', 'unlisted', 'active'];
    if (!validStatuses.includes(eventData.status)) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'This event is not currently active' }),
      };
    }

    if (eventData.enableQuestionSubmission === false || eventData.acceptingQuestions === false) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'This event is not accepting questions' }),
      };
    }

    // All checks passed - increment rate limits
    incrementRateLimit('global', RATE_LIMITS.globalPerMinute);
    incrementRateLimit(`ip:${clientIP}`, RATE_LIMITS.questionsPerIP);
    if (fingerprint !== 'unknown') {
      incrementRateLimit(`fp:${fingerprint}`, RATE_LIMITS.questionsPerFingerprint);
    }

    // Create the question in Firebase
    const questionsRef = database.ref(`questions/${eventId}`);
    const newQuestionRef = questionsRef.push();

    const questionData = {
      question: questionValidation.sanitized,
      author: authorValidation.sanitized,
      source: anonymous ? 'anonymous' : 'audience',
      timestamp: new Date().toISOString(),
      createdAt: Date.now(),
      answered: false,
      status: eventData.requireApproval ? 'pending' : 'approved',
    };

    await newQuestionRef.set(questionData);

    // Update question count on event
    const currentCount = eventData.questionCount || 0;
    await eventRef.update({ questionCount: currentCount + 1 });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Question submitted successfully',
        questionId: newQuestionRef.key,
      }),
    };

  } catch (error) {
    console.error('Error submitting question:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to submit question. Please try again.' }),
    };
  }
};
