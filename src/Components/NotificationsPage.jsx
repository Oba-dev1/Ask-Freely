// src/Components/NotificationsPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  NOTIFICATION_TYPES
} from '../services/notificationService';

function NotificationsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Subscribe to notifications
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToNotifications(currentUser.uid, (notifs) => {
      setNotifications(notifs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markNotificationAsRead(currentUser.uid, notification.id);
    }

    if (notification.link) {
      navigate(notification.link);
    }
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
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (loading) {
    return (
      <div className="px-6 py-4 lg:px-8 lg:py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-48"></div>
          <div className="h-12 bg-neutral-200 rounded"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-neutral-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 lg:px-8 lg:py-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-ink mb-1">
            Notifications
          </h1>
          <p className="text-neutral-600">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
          >
            <i className="fas fa-check-double"></i>
            Mark all as read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            <i className="fas fa-circle text-xs mr-1.5"></i>
            Unread
          </button>
          <button
            onClick={() => setFilter(NOTIFICATION_TYPES.ANNOUNCEMENT)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === NOTIFICATION_TYPES.ANNOUNCEMENT
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            <i className="fas fa-bullhorn mr-1.5"></i>
            Announcements
          </button>
          <button
            onClick={() => setFilter(NOTIFICATION_TYPES.QUESTION)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === NOTIFICATION_TYPES.QUESTION
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            <i className="fas fa-circle-question mr-1.5"></i>
            Questions
          </button>
          <button
            onClick={() => setFilter(NOTIFICATION_TYPES.ACCOUNT)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === NOTIFICATION_TYPES.ACCOUNT
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            <i className="fas fa-user-shield mr-1.5"></i>
            Account
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">
            <i className="fas fa-bell-slash text-5xl mb-4 text-neutral-300"></i>
            <p className="text-lg font-medium">No notifications</p>
            <p className="text-sm mt-1">
              {filter === 'all' ? "You're all caught up!" : `No ${filter} notifications found`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filteredNotifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full p-4 text-left hover:bg-neutral-50 transition-colors ${
                  !notification.read ? 'bg-primary/5' : ''
                }`}
              >
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                    <i className={`fas ${getNotificationIcon(notification.type)} text-lg`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`font-semibold ${!notification.read ? 'text-ink' : 'text-neutral-700'}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-neutral-600 mt-1">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <span className="w-3 h-3 bg-primary rounded-full flex-shrink-0 mt-1"></span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
                      <span>{formatTime(notification.createdAt)}</span>
                      {notification.fromAdmin && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                          <i className="fas fa-shield-halved"></i>
                          Admin
                        </span>
                      )}
                      {notification.link && (
                        <span className="text-primary">
                          <i className="fas fa-arrow-right"></i>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;
