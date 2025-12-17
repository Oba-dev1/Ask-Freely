// src/Components/BrandedEventHeader.jsx
import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { database } from '../Firebase/config';
import './BrandedEventHeader.css';

function BrandedEventHeader({ event }) {
  const [organizerLogo, setOrganizerLogo] = useState(null);
  const branding = event?.branding || {};
  const hasImage = branding?.flyerUrl;
  const brandColor = branding?.primaryColor || '#FF6B35';
  const orgName = branding?.organizationName || event?.organizerName || '';
  const tagline = branding?.tagline || 'Ask Your Questions ✨';

  const title = event?.title || 'Event Q&A';
  const subtitle = event?.date
    ? `${event.date}${event?.time ? ` • ${event.time}` : ''}`
    : '';

  // Fetch organizer's logo from their user profile
  useEffect(() => {
    const fetchOrganizerLogo = async () => {
      if (!event?.organizerId) return;

      try {
        const userRef = ref(database, `users/${event.organizerId}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          const userData = snapshot.val();
          setOrganizerLogo(userData.logoUrl || null);
        }
      } catch (error) {
        console.error('Error fetching organizer logo:', error);
      }
    };

    fetchOrganizerLogo();
  }, [event?.organizerId]);

  // Create CSS custom properties for dynamic brand color
  const brandStyles = {
    '--brand-color': brandColor,
    '--brand-color-light': `${brandColor}20`,
    '--brand-color-glow': `${brandColor}40`
  };

  return (
    <div className="branded-header" style={brandStyles}>
      {/* Hero Image - flexible for banner or flyer */}
      {hasImage && (
        <div className="event-hero-image">
          <img src={branding.flyerUrl} alt={`${title} event`} />
        </div>
      )}

      {/* Event Details Card */}
      <div className="event-details-card">
        {/* Logo from organization account */}
        {organizerLogo && (
          <div className="event-logo-wrapper">
            <img src={organizerLogo} alt={orgName || 'Organization logo'} className="event-logo" />
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
