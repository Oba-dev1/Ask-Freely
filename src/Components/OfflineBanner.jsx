// Offline detection banner component
import React from 'react';
import useNetworkStatus from '../hooks/useNetworkStatus';

function OfflineBanner() {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 bg-red-500 text-white z-[9999] shadow-[0_2px_8px_rgba(0,0,0,0.15)] animate-slideDown"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center justify-center gap-3 md:gap-2 py-3.5 px-6 md:py-3 md:px-4 max-w-[1400px] mx-auto">
        <i className="fas fa-wifi-slash text-lg md:text-base flex-shrink-0"></i>
        <span className="font-semibold text-[0.9375rem] md:text-[0.875rem] text-center">
          You're offline. Some features may not work until your connection is restored.
        </span>
      </div>
    </div>
  );
}

export default OfflineBanner;
