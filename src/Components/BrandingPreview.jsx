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
    <div className="bg-white border border-black/[0.08] rounded-xl md:rounded-[18px] p-4 md:p-7 my-4 mb-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-6 mb-6 pb-4 md:pb-5 border-b border-black/[0.06]">
        <div className="flex-1 min-w-0">
          <h3 className="m-0 mb-1 text-base md:text-[1.15rem] text-neutral-800 font-bold flex items-center gap-2.5">
            <i className="fas fa-eye text-primary text-sm md:text-[1.05rem]"></i> Participant View
          </h3>
          <p className="m-0 text-neutral-500 text-xs md:text-[0.875rem]">Live preview of your branded event page</p>
        </div>
        <div className="flex-shrink-0 bg-primary/[0.06] border border-primary/20 text-primary py-[0.45rem] md:py-2 px-2.5 md:px-3.5 rounded-lg text-[0.7rem] md:text-[0.8rem] font-mono font-semibold overflow-hidden text-ellipsis whitespace-nowrap max-w-full self-start">
          askfreely.com/p/{event?.slug || 'your-event'}
        </div>
      </div>

      {/* Preview Content */}
      <div className="grid gap-4">
        {/* Event Card */}
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl md:rounded-[14px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
          <div className="p-5 md:p-6 grid gap-4 md:gap-5">
            {hasLogo && (
              <div className="flex justify-center">
                <img
                  src={hasLogo}
                  alt="Logo"
                  className="w-[60px] h-[60px] md:w-[72px] md:h-[72px] object-contain rounded-xl bg-white/95 p-2.5 md:p-3 shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                  style={{ border: `2px solid ${brandColor}` }}
                />
              </div>
            )}

            <div className="text-center text-white">
              <h4 className="m-0 mb-3 text-lg md:text-[1.35rem] font-bold text-white leading-tight break-words">
                {event?.title || 'Your Event Title'}
              </h4>
              {event?.date && (
                <p
                  className="m-0 mb-2 text-sm md:text-[0.9rem] font-semibold flex items-center justify-center gap-2"
                  style={{ color: brandColor }}
                >
                  <i className="far fa-calendar text-xs md:text-[0.85rem]"></i>
                  {event.date}{event?.time ? ` • ${event.time}` : ''}
                </p>
              )}
              {organizationName && (
                <p className="m-0 mb-2.5 text-[0.75rem] md:text-[0.8rem] font-semibold text-white/80 uppercase tracking-wide flex items-center justify-center gap-2 break-words">
                  <i className="fas fa-building text-[0.7rem] md:text-[0.75rem] opacity-70"></i>
                  {organizationName}
                </p>
              )}
              {tagline && (
                <p className="m-0 text-sm md:text-[0.9rem] text-white/75 italic leading-relaxed break-words">{tagline}</p>
              )}
            </div>

            {hasFlyer && (
              <div className="flex justify-center">
                <img
                  src={hasFlyer}
                  alt="Event flyer"
                  className="w-full max-w-[200px] md:max-w-[240px] h-auto aspect-[2/3] object-cover rounded-xl border-2 border-white/15 shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-black/10 rounded-xl md:rounded-[14px] p-5 md:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div className="text-base md:text-[1.05rem] font-bold text-neutral-800 mb-3.5 md:mb-4">Submit Your Question</div>
          <div className="grid gap-3.5">
            <div className="h-[42px] md:h-[46px] bg-neutral-100 border-[1.5px] border-black/[0.12] rounded-[10px] py-3 md:py-3.5 px-3.5 md:px-4 flex items-center transition-all">
              <div className="text-neutral-400 text-sm md:text-[0.9rem] select-none">Your name (optional)</div>
            </div>
            <div className="min-h-[90px] md:min-h-[100px] bg-neutral-100 border-[1.5px] border-black/[0.12] rounded-[10px] py-3 md:py-3.5 px-3.5 md:px-4 flex items-start transition-all">
              <div className="text-neutral-400 text-sm md:text-[0.9rem] select-none">What would you like to ask?</div>
            </div>
            <button
              className="w-full h-11 md:h-12 text-white border-none rounded-[10px] text-sm md:text-[0.95rem] font-semibold flex items-center justify-center gap-2.5 cursor-pointer transition-all shadow-[0_4px_12px_rgba(255,107,53,0.25)] hover:-translate-y-px hover:shadow-[0_6px_16px_rgba(255,107,53,0.35)]"
              style={{ background: brandColor }}
            >
              <i className="fas fa-paper-plane text-xs md:text-[0.9rem]"></i>
              Submit Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BrandingPreview;
