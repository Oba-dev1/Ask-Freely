// src/hooks/useRecaptcha.js
import { useEffect, useCallback } from 'react';

/**
 * Custom hook for Google reCAPTCHA v3 integration
 * @param {string} siteKey - reCAPTCHA site key
 * @returns {object} - Object containing executeRecaptcha function
 */
const useRecaptcha = (siteKey) => {
  useEffect(() => {
    // Check if reCAPTCHA script is already loaded
    if (window.grecaptcha) {
      return;
    }

    // Load reCAPTCHA script dynamically
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('✅ reCAPTCHA loaded successfully');
    };

    script.onerror = () => {
      console.error('❌ Failed to load reCAPTCHA');
    };

    document.head.appendChild(script);

    // Cleanup function
    return () => {
      // Remove script if component unmounts
      const scriptElement = document.querySelector(`script[src*="recaptcha"]`);
      if (scriptElement) {
        scriptElement.remove();
      }
    };
  }, [siteKey]);

  /**
   * Execute reCAPTCHA and get token
   * @param {string} action - Action name for reCAPTCHA (e.g., 'signup', 'login', 'submit')
   * @returns {Promise<string|null>} - reCAPTCHA token or null if failed
   */
  const executeRecaptcha = useCallback(async (action) => {
    if (!window.grecaptcha) {
      console.warn('⚠️ reCAPTCHA not loaded yet');
      return null;
    }

    try {
      // Wait for reCAPTCHA to be ready
      await new Promise((resolve) => {
        window.grecaptcha.ready(resolve);
      });

      // Execute reCAPTCHA and get token
      const token = await window.grecaptcha.execute(siteKey, { action });

      console.log(`✅ reCAPTCHA token generated for action: ${action}`);
      return token;
    } catch (error) {
      console.error('❌ reCAPTCHA execution failed:', error);
      return null;
    }
  }, [siteKey]);

  return { executeRecaptcha };
};

export default useRecaptcha;
