// ============================================
// SECURITY UTILITIES
// CSRF protection, secure storage, and other security helpers
// ============================================

import { auth } from '../Firebase/config';

/**
 * Generate CSRF token
 */
export function generateCSRFToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store CSRF token securely
 */
export function storeCSRFToken() {
  const token = generateCSRFToken();
  sessionStorage.setItem('csrf_token', token);
  return token;
}

/**
 * Get CSRF token
 */
export function getCSRFToken() {
  let token = sessionStorage.getItem('csrf_token');
  if (!token) {
    token = storeCSRFToken();
  }
  return token;
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token) {
  const storedToken = sessionStorage.getItem('csrf_token');
  return token && storedToken && token === storedToken;
}

/**
 * Add CSRF token to request headers
 */
export function addCSRFHeader(headers = {}) {
  return {
    ...headers,
    'X-CSRF-Token': getCSRFToken()
  };
}

/**
 * Secure localStorage wrapper with encryption (basic)
 * Note: This is basic obfuscation, not true encryption
 * For sensitive data, store server-side only
 */
export const SecureStorage = {
  set(key, value) {
    try {
      const encoded = btoa(JSON.stringify(value));
      localStorage.setItem(key, encoded);
    } catch (e) {
      console.error('SecureStorage.set failed:', e);
    }
  },

  get(key) {
    try {
      const encoded = localStorage.getItem(key);
      if (!encoded) return null;
      return JSON.parse(atob(encoded));
    } catch (e) {
      console.error('SecureStorage.get failed:', e);
      return null;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('SecureStorage.remove failed:', e);
    }
  },

  clear() {
    try {
      localStorage.clear();
    } catch (e) {
      console.error('SecureStorage.clear failed:', e);
    }
  }
};

/**
 * Check if user is authenticated and has valid session
 */
export async function verifyAuthSession() {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { valid: false, error: 'No authenticated user' };
    }

    // Check if email is verified
    if (!currentUser.emailVerified && currentUser.providerData[0]?.providerId !== 'google.com') {
      return { valid: false, error: 'Email not verified' };
    }

    // Get fresh token to verify session is still valid
    await currentUser.getIdToken(true);

    return { valid: true, user: currentUser };
  } catch (error) {
    console.error('Session verification failed:', error);
    return { valid: false, error: error.message };
  }
}

/**
 * Secure password comparison (constant-time to prevent timing attacks)
 * Note: This is client-side only. Server-side should use proper hashing
 */
export function secureCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Generate secure random string
 */
export function generateSecureRandom(length = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash string using SHA-256 (for client-side hashing only)
 */
export async function hashString(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Detect if user is on secure connection
 */
export function isSecureContext() {
  return window.isSecureContext || window.location.protocol === 'https:';
}

/**
 * Warn user if not on secure connection
 */
export function checkSecureConnection() {
  if (!isSecureContext() && window.location.hostname !== 'localhost') {
    console.warn('⚠️ WARNING: You are not on a secure connection. Data may be intercepted.');
    return false;
  }
  return true;
}

/**
 * Sanitize object for logging (remove sensitive fields)
 */
export function sanitizeForLogging(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  const sensitiveFields = [
    'password',
    'token',
    'apiKey',
    'secret',
    'authorization',
    'cookie',
    'session'
  ];

  const sanitized = { ...obj };

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Detect potential XSS in user input
 */
export function detectXSS(input) {
  if (!input || typeof input !== 'string') return false;

  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /eval\(/gi,
    /expression\(/gi
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Check if request origin is allowed (CORS)
 */
export function isAllowedOrigin(origin) {
  const allowedOrigins = [
    window.location.origin,
    'https://askfreely.com',
    'https://www.askfreely.com',
    'http://localhost:3000',
    'http://localhost:5000'
  ];

  return allowedOrigins.includes(origin);
}

/**
 * Add security event listener to detect suspicious activity
 */
export function monitorSecurityEvents() {
  // Detect rapid form submissions
  let formSubmissions = [];
  document.addEventListener('submit', (e) => {
    const now = Date.now();
    formSubmissions.push(now);

    // Keep only submissions from last 10 seconds
    formSubmissions = formSubmissions.filter(time => now - time < 10000);

    // Alert if more than 5 submissions in 10 seconds
    if (formSubmissions.length > 5) {
      console.warn('⚠️ Security Alert: Rapid form submissions detected');
      e.preventDefault();
    }
  });

  // Detect potential clickjacking
  if (window.self !== window.top) {
    console.warn('⚠️ Security Alert: Page loaded in iframe - potential clickjacking');
  }

  // Detect developer tools (basic check)
  let devtoolsOpen = false;
  const threshold = 160;

  const checkDevTools = () => {
    if (window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold) {
      if (!devtoolsOpen) {
        devtoolsOpen = true;
        console.log('🔧 Developer tools detected');
      }
    } else {
      devtoolsOpen = false;
    }
  };

  setInterval(checkDevTools, 1000);
}

/**
 * Content Security Policy violation reporter
 */
export function setupCSPReporting() {
  document.addEventListener('securitypolicyviolation', (e) => {
    console.error('🚨 CSP Violation:', {
      blockedURI: e.blockedURI,
      violatedDirective: e.violatedDirective,
      originalPolicy: e.originalPolicy,
      sourceFile: e.sourceFile,
      lineNumber: e.lineNumber
    });

    // In production, send this to your logging service
    // sendToLoggingService({
    //   type: 'csp_violation',
    //   details: { ... }
    // });
  });
}

/**
 * Initialize all security features
 */
export function initializeSecurity() {
  // Check secure connection
  checkSecureConnection();

  // Initialize CSRF token
  storeCSRFToken();

  // Monitor security events
  monitorSecurityEvents();

  // Setup CSP reporting
  setupCSPReporting();

  // Add security meta tags if not present
  if (!document.querySelector('meta[http-equiv="X-UA-Compatible"]')) {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'X-UA-Compatible';
    meta.content = 'IE=edge';
    document.head.appendChild(meta);
  }

  console.log('✅ Security features initialized');
}

/**
 * Cleanup sensitive data on logout
 */
export function cleanupOnLogout() {
  // Clear sensitive data from storage
  const sensitiveKeys = ['csrf_token', 'session', 'temp_data'];
  sensitiveKeys.forEach(key => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });

  // Clear rate limits
  const rateLimitKeys = Object.keys(localStorage).filter(key => key.startsWith('rateLimit_'));
  rateLimitKeys.forEach(key => localStorage.removeItem(key));

  console.log('✅ Sensitive data cleaned up');
}
