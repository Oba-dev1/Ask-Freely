// src/Components/BrandedEventHeader.jsx
import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { database } from '../Firebase/config';

function BrandedEventHeader({ event }) {
  const [organizerLogo, setOrganizerLogo] = useState(null);
  const branding = event?.branding || {};
  // Check both root-level and nested branding object for flyer URL
  const flyerUrl = event?.flyerUrl || branding?.flyerUrl;
  const hasImage = !!flyerUrl;
  const brandColor = event?.brandColor || branding?.primaryColor || '#FF6B35';
  const orgName = branding?.organizationName || event?.organizerName || '';
  const tagline = branding?.tagline || event?.tagline || 'Ask Your Questions ✨';

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

  return (
    <div className="mb-10 md:mb-8 sm:mb-6 rounded-2xl sm:rounded-xl overflow-hidden bg-white/[0.03]">
      {/* Hero Image - flexible for banner or flyer */}
      {hasImage && (
        <div className="w-full max-h-[600px] md:max-h-[400px] sm:max-h-[280px] overflow-hidden bg-gradient-to-br from-primary/10 to-primary/[0.05] flex items-center justify-center">
          <img
            src={flyerUrl}
            alt={`${title} event`}
            className="w-full h-auto max-h-[600px] md:max-h-[400px] sm:max-h-[280px] object-contain object-center block"
          />
        </div>
      )}

      {/* Event Details Card */}
      <div className="bg-gradient-to-br from-primary/[0.15] to-orange-300/[0.12] border border-primary/25 rounded-b-2xl sm:rounded-b-xl p-8 md:p-6 sm:p-5 flex flex-col sm:flex-col gap-5 sm:gap-4 items-start backdrop-blur-[20px] shadow-[0_4px_16px_rgba(255,107,53,0.1)]">
        {/* Logo from organization account */}
        {organizerLogo && (
          <div className="flex-shrink-0">
            <img
              src={organizerLogo}
              alt={orgName || 'Organization logo'}
              className="w-16 h-16 md:w-14 md:h-14 sm:w-12 sm:h-12 object-contain rounded-xl bg-white/80 p-2.5 sm:p-2 border-2 border-primary/20"
            />
          </div>
        )}

        <div className="flex-1 min-w-0 w-full">
          {orgName && (
            <p className="m-0 mb-2 text-[0.85rem] sm:text-[0.8rem] font-bold text-amber-800 uppercase tracking-wide">
              {orgName}
            </p>
          )}
          <h1 className="m-0 mb-3 text-[1.75rem] md:text-[1.5rem] sm:text-[1.35rem] font-extrabold text-amber-950 leading-tight tracking-tight break-words">
            {title}
          </h1>
          {subtitle && (
            <p className="m-0 mb-3 text-[0.95rem] sm:text-[0.85rem] font-bold text-amber-950 inline-flex items-center gap-2 py-2 px-3.5 sm:py-1.5 sm:px-3 bg-white/[0.92] rounded-lg border border-primary/25 shadow-[0_2px_8px_rgba(255,107,53,0.15)] backdrop-blur-[10px]">
              <i className="far fa-calendar text-sm sm:text-[0.8rem]" style={{ color: brandColor }}></i>
              {subtitle}
            </p>
          )}
          {tagline && (
            <p className="m-0 text-[0.95rem] sm:text-[0.85rem] font-semibold text-amber-900 leading-relaxed">
              {tagline}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default BrandedEventHeader;
