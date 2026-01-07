// src/services/questionService.js
// Service for submitting questions through the secure Netlify function
// With fallback to direct Firebase for reliability

import { ref, push, get, update } from 'firebase/database';
import { database } from '../Firebase/config';

/**
 * Generate a simple browser fingerprint for rate limiting
 * This is NOT for tracking users, only for rate limit enforcement
 */
function generateFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
    const canvasData = canvas.toDataURL();

    const screenData = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const timezoneOffset = new Date().getTimezoneOffset();
    const language = navigator.language || 'unknown';
    const platform = navigator.platform || 'unknown';

    // Create a simple hash
    const combined = `${canvasData}|${screenData}|${timezoneOffset}|${language}|${platform}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(36);
  } catch (e) {
    console.error('Fingerprint generation failed:', e);
    return 'unknown';
  }
}

/**
 * Submit a question through the secure Netlify function
 * @param {Object} params - Question parameters
 * @param {string} params.eventId - The event ID
 * @param {string} params.question - The question text
 * @param {string} params.author - The author name (optional)
 * @param {boolean} params.anonymous - Whether the question is anonymous
 * @returns {Promise<{success: boolean, message?: string, error?: string, questionId?: string}>}
 */
export async function submitQuestion({ eventId, question, author, anonymous }) {
  // Determine the API endpoint
  // In development, use relative path (Netlify Dev handles this)
  // In production, it's also relative to the site
  const apiUrl = '/.netlify/functions/submit-question';

  const fingerprint = generateFingerprint();

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Fingerprint': fingerprint,
      },
      body: JSON.stringify({
        eventId,
        question,
        author: anonymous ? 'Anonymous' : (author || 'Anonymous'),
        anonymous: !!anonymous,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle rate limiting
      if (response.status === 429) {
        return {
          success: false,
          error: data.error || 'Too many requests. Please try again later.',
          retryAfter: data.retryAfter || 60,
          rateLimited: true,
        };
      }

      return {
        success: false,
        error: data.error || 'Failed to submit question',
      };
    }

    return {
      success: true,
      message: data.message || 'Question submitted successfully',
      questionId: data.questionId,
    };
  } catch (error) {
    console.error('Question submission error:', error);

    // Fallback to direct Firebase submission if Netlify function fails
    console.log('Attempting fallback to direct Firebase submission...');
    return submitQuestionDirectly({ eventId, question, author, anonymous });
  }
}

/**
 * Fallback: Submit question directly to Firebase
 * Used when Netlify function is unavailable
 * Note: This has less protection than the server-side rate limiting
 */
async function submitQuestionDirectly({ eventId, question, author, anonymous }) {
  try {
    // Verify event exists first
    const eventRef = ref(database, `events/${eventId}`);
    const eventSnapshot = await get(eventRef);
    const eventData = eventSnapshot.val();

    if (!eventData) {
      return {
        success: false,
        error: 'Event not found',
      };
    }

    // Check if event is accepting questions
    const validStatuses = ['published', 'unlisted', 'active'];
    if (!validStatuses.includes(eventData.status)) {
      return {
        success: false,
        error: 'This event is not currently active',
      };
    }

    if (eventData.enableQuestionSubmission === false || eventData.acceptingQuestions === false) {
      return {
        success: false,
        error: 'This event is not accepting questions',
      };
    }

    // Create the question
    const questionsRef = ref(database, `questions/${eventId}`);
    const newQuestionRef = push(questionsRef);

    const questionData = {
      question: question,
      author: anonymous ? 'Anonymous' : (author || 'Anonymous'),
      source: anonymous ? 'anonymous' : 'audience',
      timestamp: new Date().toISOString(),
      createdAt: Date.now(),
      answered: false,
      status: eventData.requireApproval ? 'pending' : 'approved',
    };

    await update(newQuestionRef, questionData);

    // Update question count on event
    const currentCount = eventData.questionCount || 0;
    await update(eventRef, { questionCount: currentCount + 1 });

    return {
      success: true,
      message: 'Question submitted successfully',
      questionId: newQuestionRef.key,
    };
  } catch (error) {
    console.error('Direct Firebase submission error:', error);
    return {
      success: false,
      error: 'Unable to submit question. Please check your connection and try again.',
    };
  }
}

/**
 * Check if the Netlify function is available
 * Useful for graceful degradation
 */
export async function checkApiHealth() {
  try {
    const response = await fetch('/.netlify/functions/submit-question', {
      method: 'OPTIONS',
    });
    return response.ok || response.status === 204;
  } catch {
    return false;
  }
}
