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

  const brandColor = branding?.primaryColor || '#667eea';
  const brandStyles = {
    '--preview-brand-color': brandColor,
    '--preview-brand-color-light': `${brandColor}20`
  };

  return (
    <div className="branding-preview-section">
      <h3 className="preview-title">
        <i className="fas fa-eye"></i> Participant View Preview
      </h3>
      <p className="preview-subtitle">This is how participants will see your event</p>

      <div className="preview-mockup" style={brandStyles}>
        <div className="mockup-browser">
          <div className="browser-bar">
            <div className="browser-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className="browser-url">askfreely.com/p/{event?.slug || 'your-event'}</div>
          </div>

          <div className="browser-content">
            {/* Miniature version of branded header */}
            <div className="preview-header" style={brandStyles}>
              {hasLogo && (
                <div className="preview-logo-section">
                  <img src={branding.logoUrl} alt="Logo" className="preview-logo" />
                  {branding.organizationName && (
                    <p className="preview-org-name">{branding.organizationName}</p>
                  )}
                </div>
              )}

              <div className="preview-event-info">
                <h4 className="preview-event-title">{event?.title || 'Your Event Title'}</h4>
                {event?.date && (
                  <p className="preview-event-date">
                    {event.date}{event?.time ? ` • ${event.time}` : ''}
                  </p>
                )}
                {branding.tagline && (
                  <p className="preview-tagline">{branding.tagline}</p>
                )}
              </div>

              {hasFlyer && (
                <div className="preview-flyer-thumb">
                  <img src={branding.flyerUrl} alt="Event flyer" />
                </div>
              )}
            </div>

            <div className="preview-form-mockup">
              <div className="mockup-input"></div>
              <div className="mockup-textarea"></div>
              <div className="mockup-button" style={{ background: brandColor }}>
                Submit Question
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BrandingPreview;
