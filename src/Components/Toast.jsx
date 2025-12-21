// src/Components/Toast.jsx
import React, { useEffect, useState } from 'react';
import './design-system.css';

function Toast({ message, title = 'Success', duration = 3000, onClose, type = 'success' }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        if (onClose) onClose();
      }, 300); // Match exit animation duration
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: 'fa-check',
    error: 'fa-times',
    info: 'fa-info',
    warning: 'fa-exclamation'
  };

  const colors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6',
    warning: '#f59e0b'
  };

  return (
    <div className={`success-toast ${isExiting ? 'exit' : ''}`}>
      <div className="success-toast-icon" style={{ background: colors[type] }}>
        <i className={`fas ${icons[type]}`}></i>
      </div>
      <div className="success-toast-content">
        <p className="success-toast-title">{title}</p>
        {message && <p className="success-toast-message">{message}</p>}
      </div>
    </div>
  );
}

export default Toast;
