// ============================================
// RATE LIMITING UTILITY
// Protects against abuse and spam
// ============================================

import { ref, get, set } from 'firebase/database';
import { database } from '../Firebase/config';

/**
 * Rate limiter configuration
 */
const RATE_LIMITS = {
  // Question submissions per event
  questionSubmission: {
    maxRequests: 10,        // Max 10 questions
    windowMs: 60 * 60 * 1000 // Per hour
  },
  // Event creation
  eventCreation: {
    maxRequests: 5,          // Max 5 events
    windowMs: 24 * 60 * 60 * 1000 // Per day
  },
  // Login attempts
  loginAttempt: {
    maxRequests: 5,          // Max 5 attempts
    windowMs: 15 * 60 * 1000 // Per 15 minutes
  },
  // Password reset
  passwordReset: {
    maxRequests: 3,          // Max 3 resets
    windowMs: 60 * 60 * 1000 // Per hour
  },
  // File uploads
  fileUpload: {
    maxRequests: 20,         // Max 20 uploads
    windowMs: 60 * 60 * 1000 // Per hour
  }
};

/**
 * Check if action is rate limited (Firebase-based)
 * @param {string} userId - User ID
 * @param {string} action - Action type (e.g., 'questionSubmission')
 * @returns {Promise<{allowed: boolean, retryAfter: number, remaining: number}>}
 */
export async function checkRateLimit(userId, action) {
  if (!userId || !action) {
    throw new Error('User ID and action are required');
  }

  const config = RATE_LIMITS[action];
  if (!config) {
    console.warn(`No rate limit config for action: ${action}`);
    return { allowed: true, retryAfter: 0, remaining: config?.maxRequests || 0 };
  }

  const now = Date.now();
  const rateLimitRef = ref(database, `rateLimits/${userId}/${action}`);

  try {
    const snapshot = await get(rateLimitRef);
    let data = snapshot.val() || { count: 0, resetAt: now + config.windowMs };

    // Reset if window has passed
    if (now >= data.resetAt) {
      data = { count: 0, resetAt: now + config.windowMs };
    }

    // Check if limit exceeded
    if (data.count >= config.maxRequests) {
      const retryAfter = Math.ceil((data.resetAt - now) / 1000);
      return {
        allowed: false,
        retryAfter,
        remaining: 0,
        error: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
      };
    }

    return {
      allowed: true,
      retryAfter: 0,
      remaining: config.maxRequests - data.count - 1
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open - allow the request if rate limit check fails
    return { allowed: true, retryAfter: 0, remaining: config.maxRequests };
  }
}

/**
 * Increment rate limit counter
 * @param {string} userId - User ID
 * @param {string} action - Action type
 */
export async function incrementRateLimit(userId, action) {
  if (!userId || !action) return;

  const config = RATE_LIMITS[action];
  if (!config) return;

  const now = Date.now();
  const rateLimitRef = ref(database, `rateLimits/${userId}/${action}`);

  try {
    const snapshot = await get(rateLimitRef);
    let data = snapshot.val() || { count: 0, resetAt: now + config.windowMs };

    // Reset if window has passed
    if (now >= data.resetAt) {
      data = { count: 1, resetAt: now + config.windowMs };
    } else {
      data.count += 1;
    }

    await set(rateLimitRef, data);
  } catch (error) {
    console.error('Rate limit increment failed:', error);
  }
}

/**
 * Client-side rate limiter using localStorage (fallback)
 * Use this for quick checks before making Firebase calls
 */
export class ClientRateLimiter {
  constructor(key, maxRequests = 10, windowMs = 60000) {
    this.key = `rateLimit_${key}`;
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  check() {
    const now = Date.now();
    let attempts = this.getAttempts();

    // Remove old attempts outside the window
    attempts = attempts.filter(timestamp => now - timestamp < this.windowMs);

    if (attempts.length >= this.maxRequests) {
      const oldestAttempt = Math.min(...attempts);
      const retryAfter = Math.ceil((this.windowMs - (now - oldestAttempt)) / 1000);
      return {
        allowed: false,
        retryAfter,
        remaining: 0,
        error: `Too many requests. Please try again in ${retryAfter} seconds.`
      };
    }

    return {
      allowed: true,
      retryAfter: 0,
      remaining: this.maxRequests - attempts.length - 1
    };
  }

  increment() {
    const now = Date.now();
    let attempts = this.getAttempts();

    // Remove old attempts
    attempts = attempts.filter(timestamp => now - timestamp < this.windowMs);

    // Add current attempt
    attempts.push(now);

    try {
      localStorage.setItem(this.key, JSON.stringify(attempts));
    } catch (e) {
      console.error('Failed to store rate limit:', e);
    }
  }

  getAttempts() {
    try {
      const stored = localStorage.getItem(this.key);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to get rate limit:', e);
      return [];
    }
  }

  reset() {
    try {
      localStorage.removeItem(this.key);
    } catch (e) {
      console.error('Failed to reset rate limit:', e);
    }
  }
}

/**
 * Debounce function to prevent rapid repeated calls
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit execution frequency
 */
export function throttle(func, limit = 1000) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Create a rate-limited version of a function
 * @param {Function} fn - Function to rate limit
 * @param {string} key - Rate limit key
 * @param {number} maxRequests - Max requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Function} Rate-limited function
 */
export function withClientRateLimit(fn, key, maxRequests = 10, windowMs = 60000) {
  const rateLimiter = new ClientRateLimiter(key, maxRequests, windowMs);

  return async function rateLimitedFunction(...args) {
    const { allowed, error } = rateLimiter.check();

    if (!allowed) {
      throw new Error(error);
    }

    rateLimiter.increment();
    return await fn(...args);
  };
}

/**
 * Create a debounced version of a function
 */
export function withDebounce(fn, wait = 300) {
  return debounce(fn, wait);
}

/**
 * Create a throttled version of a function
 */
export function withThrottle(fn, limit = 1000) {
  return throttle(fn, limit);
}

/**
 * IP-based rate limiting (for server-side or Cloudflare Workers)
 * Note: This is pseudocode - requires server-side implementation
 */
export const IPRateLimiter = {
  // Example configuration for Cloudflare Workers or serverless functions
  config: {
    questionSubmission: {
      maxRequests: 20,
      windowMs: 60 * 60 * 1000 // 1 hour
    },
    loginAttempt: {
      maxRequests: 10,
      windowMs: 15 * 60 * 1000 // 15 minutes
    }
  },

  // Pseudocode for server-side implementation
  checkIP: async (ip, action) => {
    // This would be implemented in a serverless function or backend
    // Using KV storage (Cloudflare), Redis, or similar
    console.warn('IP-based rate limiting requires server-side implementation');
    return { allowed: true };
  }
};
