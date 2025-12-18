// src/Components/BrandingPreview.jsx
import React from 'react';
import './BrandingPreview.css';

function BrandingPreview({ event }) {
  const branding = event?.branding || {};
  const hasLogo = branding?.logoUrl;
  const hasFlyer = branding?.flyerUrl;
  const hasBranding = hasLogo || hasFlyer || branding?.organizationName || branding?.tagline;

  if (!hasBranding) {
    return null; // Don't show if no branding
  }

  const brandColor = branding?.primaryColor || '#FF6B35';
  const brandStyles = {
    '--preview-brand-color': brandColor,
    '--preview-brand-color-light': `${brandColor}20`
  };

  return (
    <div className="branding-preview-section">
      <div className="preview-header-section">
        <div>
          <h3 className="preview-title">
            <i className="fas fa-eye"></i> Participant View
          </h3>
          <p className="preview-subtitle">Live preview of your branded event page</p>
        </div>
        <div className="preview-url-chip">
          askfreely.com/p/{event?.slug || 'your-event'}
        </div>
      </div>

      <div className="preview-content" style={brandStyles}>
        {/* Event Header Preview */}
        <div className="preview-event-card">
          <div className="preview-card-content">
            {hasLogo && (
              <div className="preview-logo-wrapper">
                <img src={branding.logoUrl} alt="Logo" className="preview-logo" />
              </div>
            )}

            <div className="preview-event-details">
              <h4 className="preview-event-title">{event?.title || 'Your Event Title'}</h4>
              {event?.date && (
                <p className="preview-event-meta">
                  <i className="far fa-calendar"></i>
                  {event.date}{event?.time ? ` • ${event.time}` : ''}
                </p>
              )}
              {branding.organizationName && (
                <p className="preview-org-badge">
                  <i className="fas fa-building"></i>
                  {branding.organizationName}
                </p>
              )}
              {branding.tagline && (
                <p className="preview-tagline">{branding.tagline}</p>
              )}
            </div>

            {hasFlyer && (
              <div className="preview-flyer-wrapper">
                <img src={branding.flyerUrl} alt="Event flyer" className="preview-flyer" />
              </div>
            )}
          </div>
        </div>

        {/* Question Form Preview */}
        <div className="preview-form-card">
          <div className="preview-form-label">Submit Your Question</div>
          <div className="preview-form-inputs">
            <div className="preview-input-field">
              <div className="preview-input-placeholder">Your name (optional)</div>
            </div>
            <div className="preview-textarea-field">
              <div className="preview-textarea-placeholder">What would you like to ask?</div>
            </div>
            <button className="preview-submit-btn" style={{ background: brandColor }}>
              <i className="fas fa-paper-plane"></i>
              Submit Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BrandingPreview;
