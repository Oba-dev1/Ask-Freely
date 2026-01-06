// src/services/questionService.js
// Service for submitting questions through the secure Netlify function

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

    // If the Netlify function is unavailable, we could fall back to direct Firebase
    // But for security, we'll just return an error
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
