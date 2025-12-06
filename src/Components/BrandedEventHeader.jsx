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
      {/* Hero Flyer Image - Eventbrite style */}
      {hasFlyer && (
        <div className="event-hero-image">
          <img src={branding.flyerUrl} alt="Event flyer" />
        </div>
      )}

      {/* Event Details Card */}
      <div className="event-details-card">
        {/* Logo and Organization */}
        {hasLogo && (
          <div className="event-logo-wrapper">
            <img src={branding.logoUrl} alt={orgName || 'Organization logo'} className="event-logo" />
          </div>
        )}

        <div className="event-details-content">
          {orgName && <p className="event-org-name">{orgName}</p>}
          <h1 className="event-title">{title}</h1>
          {subtitle && <p className="event-datetime">{subtitle}</p>}
          {tagline && <p className="event-tagline">{tagline}</p>}
        </div>
      </div>
    </div>
  );
}

export default BrandedEventHeader;
