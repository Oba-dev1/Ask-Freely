// src/Components/BrandedEventHeader.jsx
import React from 'react';
import './BrandedEventHeader.css';

function BrandedEventHeader({ event }) {
  const branding = event?.branding || {};
  const hasLogo = branding?.logoUrl;
  const hasFlyer = branding?.flyerUrl;
  const brandColor = branding?.primaryColor || '#667eea';
  const orgName = branding?.organizationName || '';
  const tagline = branding?.tagline || 'Ask Your Questions ✨';

  const title = event?.title || 'Event Q&A';
  const subtitle = event?.date
    ? `${event.date}${event?.time ? ` • ${event.time}` : ''}`
    : '';

  // Create CSS custom properties for dynamic brand color
  const brandStyles = {
    '--brand-color': brandColor,
    '--brand-color-light': `${brandColor}20`,
    '--brand-color-glow': `${brandColor}40`
  };

  return (
    <div className="branded-header" style={brandStyles}>
      {/* Background Flyer (if exists) */}
      {hasFlyer && (
        <div className="branded-header-bg">
          <img src={branding.flyerUrl} alt="Event flyer" />
          <div className="branded-header-overlay"></div>
        </div>
      )}

      <div className="branded-header-content">
        {/* Logo and Organization */}
        {hasLogo && (
          <div className="branded-logo-section">
            <img src={branding.logoUrl} alt={orgName || 'Organization logo'} className="branded-logo" />
            {orgName && <p className="org-name">{orgName}</p>}
          </div>
        )}

        {/* Event Info */}
        <div className="branded-event-info">
          <h1 className="branded-title">{title}</h1>
          {subtitle && <p className="branded-subtitle">{subtitle}</p>}
          {tagline && <p className="branded-tagline">{tagline}</p>}
        </div>
      </div>
    </div>
  );
}

export default BrandedEventHeader;
