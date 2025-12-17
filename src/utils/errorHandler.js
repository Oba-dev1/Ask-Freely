// Error handling utilities for user-friendly messages

/**
 * Convert Firebase error codes to user-friendly messages
 */
export function getFriendlyErrorMessage(error) {
  // Handle Firebase Auth errors
  const authErrors = {
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network connection issue. Please check your internet and try again.',
    'auth/popup-closed-by-user': 'Sign-in cancelled. Please try again.',
    'auth/unauthorized-domain': 'This domain is not authorized for sign-in.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/requires-recent-login': 'Please log out and log back in to perform this action.',
  };

  // Handle Firebase Storage errors
  const storageErrors = {
    'storage/unauthorized': 'You do not have permission to upload this file.',
    'storage/canceled': 'Upload was cancelled.',
    'storage/unknown': 'An error occurred during upload. Please try again.',
    'storage/object-not-found': 'File not found.',
    'storage/quota-exceeded': 'Storage quota exceeded. Please contact support.',
    'storage/unauthenticated': 'Please log in to upload files.',
    'storage/retry-limit-exceeded': 'Upload failed after multiple attempts. Please try again later.',
  };

  // Handle Firebase Database errors
  const databaseErrors = {
    'permission-denied': 'You do not have permission to access this data.',
    'unavailable': 'Service temporarily unavailable. Please try again.',
    'network-error': 'Network connection issue. Please check your internet.',
  };

  // Extract error code
  const errorCode = error?.code || '';
  const errorMessage = error?.message || '';

  // Check for Firebase errors first
  if (authErrors[errorCode]) return authErrors[errorCode];
  if (storageErrors[errorCode]) return storageErrors[errorCode];
  if (databaseErrors[errorCode]) return databaseErrors[errorCode];

  // Check for network errors
  if (errorMessage.toLowerCase().includes('network') ||
      errorMessage.toLowerCase().includes('offline')) {
    return 'Network connection issue. Please check your internet and try again.';
  }

  // Check for timeout errors
  if (errorMessage.toLowerCase().includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  // Default message
  return 'Something went wrong. Please try again.';
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} initialDelay - Initial delay in ms (defaults to 1000)
 * @returns {Promise} Result of the function or throws final error
 */
export async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on auth errors or permission errors
      if (error?.code?.startsWith('auth/') &&
          !error.code.includes('network') &&
          !error.code.includes('timeout')) {
        throw error;
      }

      if (error?.code === 'permission-denied') {
        throw error;
      }

      // If we've exhausted retries, throw the error
      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate backoff delay: exponential with jitter
      const delay = initialDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms`);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Check if user is online
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Wait for network to be online
 * @param {number} timeout - Maximum time to wait in ms
 * @returns {Promise<boolean>} True if online, false if timeout
 */
export function waitForOnline(timeout = 30000) {
  return new Promise((resolve) => {
    if (navigator.onLine) {
      resolve(true);
      return;
    }

    const timeoutId = setTimeout(() => {
      window.removeEventListener('online', onlineHandler);
      resolve(false);
    }, timeout);

    const onlineHandler = () => {
      clearTimeout(timeoutId);
      window.removeEventListener('online', onlineHandler);
      resolve(true);
    };

    window.addEventListener('online', onlineHandler);
  });
}
