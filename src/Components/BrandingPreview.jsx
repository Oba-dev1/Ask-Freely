// src/Components/BrandingPreview.jsx
import React from 'react';

function BrandingPreview({ event }) {
  // Support both nested branding object and root-level fields
  const branding = event?.branding || event || {};
  const hasLogo = event?.logoUrl || branding?.logoUrl;
  const hasFlyer = event?.flyerUrl || branding?.flyerUrl;
  const organizationName = event?.organizerName || branding?.organizationName;
  const tagline = event?.tagline || branding?.tagline;
  const hasBranding = hasLogo || hasFlyer || organizationName || tagline;

  if (!hasBranding) {
    return null; // Don't show if no branding
  }

  const brandColor = event?.brandColor || branding?.primaryColor || '#FF6B35';

  return (
    <div className="bg-white border border-black/[0.08] rounded-[18px] p-7 md:p-4 my-4 mb-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      {/* Header Section */}
      <div className="flex justify-between items-start gap-6 md:flex-col md:gap-4 mb-6 pb-5 md:pb-4 border-b border-black/[0.06]">
        <div className="flex-1 min-w-0">
          <h3 className="m-0 mb-1 text-[1.15rem] md:text-[1.05rem] text-neutral-800 font-bold flex items-center gap-2.5">
            <i className="fas fa-eye text-primary text-[1.05rem]"></i> Participant View
          </h3>
          <p className="m-0 text-neutral-500 text-[0.875rem] md:text-[0.8rem]">Live preview of your branded event page</p>
        </div>
        <div className="flex-shrink-0 bg-primary/[0.06] border border-primary/20 text-primary py-2 px-3.5 md:py-[0.45rem] md:px-2.5 rounded-lg text-[0.8rem] md:text-[0.7rem] font-mono font-semibold overflow-hidden text-ellipsis whitespace-nowrap max-w-full md:self-start">
          askfreely.com/p/{event?.slug || 'your-event'}
        </div>
      </div>

      {/* Preview Content */}
      <div className="grid gap-4">
        {/* Event Card */}
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-[14px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
          <div className="p-6 md:p-5 grid gap-5 md:gap-4">
            {hasLogo && (
              <div className="flex justify-center">
                <img
                  src={hasLogo}
                  alt="Logo"
                  className="w-[72px] h-[72px] md:w-[60px] md:h-[60px] object-contain rounded-xl bg-white/95 p-3 md:p-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                  style={{ border: `2px solid ${brandColor}` }}
                />
              </div>
            )}

            <div className="text-center text-white">
              <h4 className="m-0 mb-3 text-[1.35rem] md:text-[1.15rem] font-bold text-white leading-tight">
                {event?.title || 'Your Event Title'}
              </h4>
              {event?.date && (
                <p
                  className="m-0 mb-2 text-[0.9rem] md:text-[0.85rem] font-semibold flex items-center justify-center gap-2"
                  style={{ color: brandColor }}
                >
                  <i className="far fa-calendar text-[0.85rem]"></i>
                  {event.date}{event?.time ? ` • ${event.time}` : ''}
                </p>
              )}
              {organizationName && (
                <p className="m-0 mb-2.5 text-[0.8rem] md:text-[0.75rem] font-semibold text-white/80 uppercase tracking-wide flex items-center justify-center gap-2">
                  <i className="fas fa-building text-[0.75rem] opacity-70"></i>
                  {organizationName}
                </p>
              )}
              {tagline && (
                <p className="m-0 text-[0.9rem] md:text-[0.85rem] text-white/75 italic leading-relaxed">{tagline}</p>
              )}
            </div>

            {hasFlyer && (
              <div className="flex justify-center">
                <img
                  src={hasFlyer}
                  alt="Event flyer"
                  className="w-full max-w-[240px] md:max-w-[200px] h-auto aspect-[2/3] object-cover rounded-xl border-2 border-white/15 shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-black/10 rounded-[14px] p-6 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div className="text-[1.05rem] md:text-[0.95rem] font-bold text-neutral-800 mb-4 md:mb-3.5">Submit Your Question</div>
          <div className="grid gap-3.5">
            <div className="h-[46px] md:h-[42px] bg-neutral-100 border-[1.5px] border-black/[0.12] rounded-[10px] py-3.5 px-4 md:py-3 md:px-3.5 flex items-center transition-all">
              <div className="text-neutral-400 text-[0.9rem] md:text-[0.85rem] select-none">Your name (optional)</div>
            </div>
            <div className="min-h-[100px] md:min-h-[90px] bg-neutral-100 border-[1.5px] border-black/[0.12] rounded-[10px] py-3.5 px-4 md:py-3 md:px-3.5 flex items-start transition-all">
              <div className="text-neutral-400 text-[0.9rem] md:text-[0.85rem] select-none">What would you like to ask?</div>
            </div>
            <button
              className="w-full h-12 md:h-11 text-white border-none rounded-[10px] text-[0.95rem] md:text-[0.9rem] font-semibold flex items-center justify-center gap-2.5 cursor-pointer transition-all shadow-[0_4px_12px_rgba(255,107,53,0.25)] hover:-translate-y-px hover:shadow-[0_6px_16px_rgba(255,107,53,0.35)]"
              style={{ background: brandColor }}
            >
              <i className="fas fa-paper-plane text-[0.9rem]"></i>
              Submit Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BrandingPreview;
