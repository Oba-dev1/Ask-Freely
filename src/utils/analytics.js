// src/utils/analytics.js
// Google Analytics 4 helper functions

/**
 * Track page views in Google Analytics
 * @param {string} path - The page path (e.g., '/login', '/organizer/dashboard')
 * @param {string} title - The page title
 */
export const trackPageView = (path, title) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
    });
  }
};

/**
 * Track custom events in Google Analytics
 * @param {string} action - The event action (e.g., 'signup', 'create_event')
 * @param {object} params - Additional event parameters
 */
export const trackEvent = (action, params = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, params);
  }
};

// Predefined event trackers for common actions

/**
 * Track user signup
 * @param {string} method - 'email' or 'google'
 */
export const trackSignup = (method) => {
  trackEvent('sign_up', {
    method: method,
  });
};

/**
 * Track user login
 * @param {string} method - 'email' or 'google'
 */
export const trackLogin = (method) => {
  trackEvent('login', {
    method: method,
  });
};

/**
 * Track event creation
 * @param {string} eventId - The created event ID
 * @param {string} eventType - Type of event
 */
export const trackEventCreation = (eventId, eventType = null) => {
  trackEvent('create_event', {
    event_id: eventId,
    event_type: eventType,
  });
};

/**
 * Track question submission
 * @param {string} eventId - The event ID
 * @param {boolean} anonymous - Whether the question was anonymous
 */
export const trackQuestionSubmit = (eventId, anonymous = false) => {
  trackEvent('submit_question', {
    event_id: eventId,
    anonymous: anonymous,
  });
};

/**
 * Track event publishing
 * @param {string} eventId - The event ID
 */
export const trackEventPublish = (eventId) => {
  trackEvent('publish_event', {
    event_id: eventId,
  });
};

/**
 * Track question answered
 * @param {string} eventId - The event ID
 * @param {string} questionId - The question ID
 */
export const trackQuestionAnswered = (eventId, questionId) => {
  trackEvent('answer_question', {
    event_id: eventId,
    question_id: questionId,
  });
};

/**
 * Track data export
 * @param {string} format - 'csv', 'json', or 'text'
 * @param {string} eventId - The event ID
 */
export const trackDataExport = (format, eventId) => {
  trackEvent('export_data', {
    format: format,
    event_id: eventId,
  });
};

/**
 * Track share event
 * @param {string} method - 'link_copy', 'email', etc.
 * @param {string} eventId - The event ID
 */
export const trackShare = (method, eventId) => {
  trackEvent('share', {
    method: method,
    content_type: 'event',
    event_id: eventId,
  });
};

/**
 * Track logo upload
 * @param {string} type - 'organization' or 'event'
 */
export const trackLogoUpload = (type) => {
  trackEvent('upload_logo', {
    content_type: type,
  });
};

/**
 * Track program item creation
 * @param {string} eventId - The event ID
 * @param {string} itemType - Type of program item
 */
export const trackProgramItemCreate = (eventId, itemType) => {
  trackEvent('create_program_item', {
    event_id: eventId,
    item_type: itemType,
  });
};

/**
 * Track search
 * @param {string} searchTerm - The search query
 */
export const trackSearch = (searchTerm) => {
  trackEvent('search', {
    search_term: searchTerm,
  });
};

/**
 * Track errors
 * @param {string} errorMessage - The error message
 * @param {string} errorLocation - Where the error occurred
 */
export const trackError = (errorMessage, errorLocation = null) => {
  trackEvent('exception', {
    description: errorMessage,
    fatal: false,
    location: errorLocation,
  });
};
