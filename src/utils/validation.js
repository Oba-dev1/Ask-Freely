// ============================================
// INPUT VALIDATION & SANITIZATION UTILITIES
// Protects against XSS, injection attacks, and invalid data
// ============================================

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes dangerous tags and attributes
 */
export function sanitizeHtml(input) {
  if (!input || typeof input !== 'string') return '';

  // Remove script tags and their content
  let cleaned = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers (onclick, onerror, etc.)
  cleaned = cleaned.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  cleaned = cleaned.replace(/on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocol
  cleaned = cleaned.replace(/javascript:/gi, '');

  // Remove data: protocol (can be used for XSS)
  cleaned = cleaned.replace(/data:text\/html/gi, '');

  // Remove dangerous tags
  const dangerousTags = ['iframe', 'object', 'embed', 'link', 'style', 'meta', 'base'];
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi');
    cleaned = cleaned.replace(regex, '');
  });

  return cleaned.trim();
}

/**
 * Sanitize plain text input (for questions, descriptions, etc.)
 * Removes HTML tags and dangerous characters
 */
export function sanitizeText(input, maxLength = 1000) {
  if (!input || typeof input !== 'string') return '';

  // Remove all HTML tags
  let cleaned = input.replace(/<[^>]*>/g, '');

  // Remove null bytes
  cleaned = cleaned.replace(/\0/g, '');

  // Trim whitespace
  cleaned = cleaned.trim();

  // Limit length
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }

  return cleaned;
}

/**
 * Validate and sanitize email address
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, sanitized: '', error: 'Email is required' };
  }

  const trimmed = email.trim().toLowerCase();

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(trimmed)) {
    return { valid: false, sanitized: trimmed, error: 'Invalid email format' };
  }

  if (trimmed.length > 254) {
    return { valid: false, sanitized: trimmed, error: 'Email too long' };
  }

  return { valid: true, sanitized: trimmed, error: null };
}

/**
 * Validate password strength
 */
export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, strength: 0, error: 'Password is required' };
  }

  const errors = [];
  let strength = 0;

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[@$!%*?&#]/.test(password)) strength++;

  // Check for common passwords (sample list)
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common');
    strength = 0;
  }

  return {
    valid: errors.length === 0,
    strength, // 0-4
    errors
  };
}

/**
 * Sanitize URL to prevent javascript: and data: protocols
 */
export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '';

  const trimmed = url.trim();

  // Check for dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = trimmed.toLowerCase();

  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return '';
    }
  }

  // Only allow http:, https:, and relative URLs
  if (!trimmed.match(/^(https?:\/\/|\/)/i) && trimmed.includes(':')) {
    return '';
  }

  return trimmed;
}

/**
 * Validate and sanitize slug (for event URLs)
 */
export function validateSlug(slug) {
  if (!slug || typeof slug !== 'string') {
    return { valid: false, sanitized: '', error: 'Slug is required' };
  }

  // Convert to lowercase and remove invalid characters
  let sanitized = slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')  // Replace invalid chars with hyphens
    .replace(/-+/g, '-')          // Replace multiple hyphens with single
    .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens

  if (sanitized.length < 3) {
    return { valid: false, sanitized, error: 'Slug must be at least 3 characters' };
  }

  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }

  // Reserved slugs that shouldn't be allowed
  const reservedSlugs = ['admin', 'api', 'login', 'signup', 'dashboard', 'settings', 'profile'];
  if (reservedSlugs.includes(sanitized)) {
    return { valid: false, sanitized, error: 'This slug is reserved' };
  }

  return { valid: true, sanitized, error: null };
}

/**
 * Validate hex color code
 */
export function validateColor(color) {
  if (!color || typeof color !== 'string') {
    return { valid: false, sanitized: '#FF6B35', error: 'Color is required' };
  }

  const trimmed = color.trim();

  // Check if valid hex color
  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  if (!hexRegex.test(trimmed)) {
    return { valid: false, sanitized: '#FF6B35', error: 'Invalid color format' };
  }

  return { valid: true, sanitized: trimmed.toUpperCase(), error: null };
}

/**
 * Sanitize organization name
 */
export function sanitizeOrganizationName(name, maxLength = 200) {
  if (!name || typeof name !== 'string') return '';

  // Remove HTML tags
  let cleaned = name.replace(/<[^>]*>/g, '');

  // Remove special characters that could be used for injection
  cleaned = cleaned.replace(/[<>\"\']/g, '');

  // Trim whitespace
  cleaned = cleaned.trim();

  // Limit length
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }

  return cleaned;
}

/**
 * Validate file upload (size and type)
 */
export function validateFile(file, options = {}) {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  } = options;

  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only images are allowed.' };
  }

  // Check file extension matches MIME type (basic check)
  const extension = file.name.split('.').pop().toLowerCase();
  const validExtensions = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp']
  };

  const expectedExtensions = validExtensions[file.type];
  if (expectedExtensions && !expectedExtensions.includes(extension)) {
    return { valid: false, error: 'File extension does not match file type' };
  }

  return { valid: true, error: null };
}

/**
 * Validate event date/time
 */
export function validateDateTime(dateTime) {
  if (!dateTime) {
    return { valid: false, error: 'Date and time are required' };
  }

  const date = new Date(dateTime);

  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  // Check if date is too far in the past (more than 1 day)
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  if (date < oneDayAgo) {
    return { valid: false, error: 'Date cannot be more than 1 day in the past' };
  }

  // Check if date is too far in the future (more than 2 years)
  const twoYearsFromNow = new Date();
  twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);

  if (date > twoYearsFromNow) {
    return { valid: false, error: 'Date cannot be more than 2 years in the future' };
  }

  return { valid: true, error: null };
}

/**
 * Rate limiting check (client-side)
 * Note: This is a client-side check only. Server-side rate limiting is still required.
 */
export function checkRateLimit(key, limit = 10, windowMs = 60000) {
  const storageKey = `rateLimit_${key}`;
  const now = Date.now();

  let attempts = [];
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      attempts = JSON.parse(stored);
    }
  } catch (e) {
    console.error('Rate limit storage error:', e);
  }

  // Remove old attempts outside the window
  attempts = attempts.filter(timestamp => now - timestamp < windowMs);

  if (attempts.length >= limit) {
    const oldestAttempt = Math.min(...attempts);
    const retryAfter = Math.ceil((windowMs - (now - oldestAttempt)) / 1000);
    return {
      allowed: false,
      retryAfter,
      error: `Too many requests. Please try again in ${retryAfter} seconds.`
    };
  }

  // Add current attempt
  attempts.push(now);
  try {
    localStorage.setItem(storageKey, JSON.stringify(attempts));
  } catch (e) {
    console.error('Rate limit storage error:', e);
  }

  return { allowed: true, retryAfter: 0, error: null };
}

/**
 * Validate question text
 */
export function validateQuestion(text, maxLength = 1000) {
  if (!text || typeof text !== 'string') {
    return { valid: false, sanitized: '', error: 'Question is required' };
  }

  const sanitized = sanitizeText(text, maxLength);

  if (sanitized.length < 5) {
    return { valid: false, sanitized, error: 'Question must be at least 5 characters' };
  }

  if (sanitized.length > maxLength) {
    return { valid: false, sanitized, error: `Question cannot exceed ${maxLength} characters` };
  }

  // Check for spam patterns (basic check)
  const spamPatterns = [
    /(.)\1{10,}/,  // Repeated characters (more than 10)
    /^[A-Z\s!]+$/, // All caps (if longer than 50 chars)
  ];

  for (const pattern of spamPatterns) {
    if (pattern.test(sanitized)) {
      return { valid: false, sanitized, error: 'Question appears to be spam' };
    }
  }

  return { valid: true, sanitized, error: null };
}

/**
 * Sanitize response/answer text
 */
export function validateResponse(text, maxLength = 2000) {
  if (!text || typeof text !== 'string') {
    return { valid: false, sanitized: '', error: 'Response is required' };
  }

  const sanitized = sanitizeText(text, maxLength);

  if (sanitized.length < 1) {
    return { valid: false, sanitized, error: 'Response cannot be empty' };
  }

  if (sanitized.length > maxLength) {
    return { valid: false, sanitized, error: `Response cannot exceed ${maxLength} characters` };
  }

  return { valid: true, sanitized, error: null };
}

/**
 * Validate numeric input (for upvotes, counts, etc.)
 */
export function validateNumber(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const num = Number(value);

  if (isNaN(num)) {
    return { valid: false, value: min, error: 'Invalid number' };
  }

  if (num < min) {
    return { valid: false, value: min, error: `Value must be at least ${min}` };
  }

  if (num > max) {
    return { valid: false, value: max, error: `Value cannot exceed ${max}` };
  }

  return { valid: true, value: num, error: null };
}
