// src/Components/NotificationBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  NOTIFICATION_TYPES
} from '../services/notificationService';

function NotificationBell() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  // Subscribe to notifications
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToNotifications(currentUser.uid, (notifs) => {
      setNotifications(notifs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const recentNotifications = notifications.slice(0, 5);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markNotificationAsRead(currentUser.uid, notification.id);
    }

    if (notification.link) {
      navigate(notification.link);
    }

    setIsOpen(false);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(currentUser.uid);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.ANNOUNCEMENT:
        return 'fa-bullhorn';
      case NOTIFICATION_TYPES.ACCOUNT:
        return 'fa-user-shield';
      case NOTIFICATION_TYPES.EVENT:
        return 'fa-calendar';
      case NOTIFICATION_TYPES.QUESTION:
        return 'fa-circle-question';
      default:
        return 'fa-bell';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.ANNOUNCEMENT:
        return 'text-blue-500 bg-blue-100';
      case NOTIFICATION_TYPES.ACCOUNT:
        return 'text-red-500 bg-red-100';
      case NOTIFICATION_TYPES.EVENT:
        return 'text-purple-500 bg-purple-100';
      case NOTIFICATION_TYPES.QUESTION:
        return 'text-primary bg-primary/10';
      default:
        return 'text-neutral-500 bg-neutral-100';
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (!currentUser) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-neutral-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <i className="fas fa-bell text-lg"></i>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-neutral-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
            <h3 className="font-semibold text-ink">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-neutral-500">
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Loading...
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">
                <i className="fas fa-bell-slash text-3xl mb-3 text-neutral-300"></i>
                <p>No notifications yet</p>
              </div>
            ) : (
              recentNotifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-0 ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                      <i className={`fas ${getNotificationIcon(notification.type)}`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium truncate ${!notification.read ? 'text-ink' : 'text-neutral-700'}`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5"></span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-600 line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-neutral-200 bg-neutral-50">
              <button
                onClick={() => {
                  navigate('/organizer/notifications');
                  setIsOpen(false);
                }}
                className="w-full text-center text-sm text-primary hover:underline font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
