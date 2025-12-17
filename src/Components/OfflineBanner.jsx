// Offline detection banner component
import React from 'react';
import useNetworkStatus from '../hooks/useNetworkStatus';
import './OfflineBanner.css';

function OfflineBanner() {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="offline-banner" role="alert" aria-live="assertive">
      <div className="offline-banner-content">
        <i className="fas fa-wifi-slash"></i>
        <span className="offline-banner-text">
          You're offline. Some features may not work until your connection is restored.
        </span>
      </div>
    </div>
  );
}

export default OfflineBanner;
