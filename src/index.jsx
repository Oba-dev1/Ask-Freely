import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from "@sentry/react";
import './index.css';
import App from './App';

// Initialize Sentry for error monitoring
Sentry.init({
  dsn: "https://525520214bf4eb9400cb63eca725cbbc@o4510544537321473.ingest.us.sentry.io/4510544886562816",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  // Performance Monitoring
  tracesSampleRate: 0.1, // Capture 10% of transactions for performance monitoring (free tier friendly)
  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions will be recorded
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors will be recorded
  // Environment
  environment: process.env.REACT_APP_ENV || 'production',
  // Send default PII (IP addresses, user info)
  sendDefaultPii: true,
  // Ignore common errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    // Random plugins/extensions
    'Can\'t find variable: ZiteReader',
    'jigsaw is not defined',
    'ComboSearch is not defined',
    // Facebook blocked
    'fb_xd_fragment',
    // Network errors that are expected
    'NetworkError',
    'Network request failed',
  ],
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);