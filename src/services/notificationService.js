// src/services/notificationService.js
import { ref, push, get, update, onValue } from 'firebase/database';
import { database } from '../Firebase/config';

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  ANNOUNCEMENT: 'announcement',  // Platform announcements from admin
  ACCOUNT: 'account',            // Account-related (warnings, status changes)
  EVENT: 'event',                // Event notifications (reminders, tips)
  QUESTION: 'question',          // New questions on events
  SYSTEM: 'system',              // System notifications
};

/**
 * Create a notification for a specific user
 */
export async function createNotification(userId, notification) {
  try {
    const notificationsRef = ref(database, `notifications/${userId}`);
    const newNotification = {
      type: notification.type || NOTIFICATION_TYPES.SYSTEM,
      title: notification.title,
      message: notification.message,
      read: false,
      createdAt: new Date().toISOString(),
      link: notification.link || '',
      fromAdmin: notification.fromAdmin || false,
      adminId: notification.adminId || '',
    };

    await push(notificationsRef, newNotification);
    return { success: true };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error };
  }
}

/**
 * Create notifications for multiple users (bulk)
 */
export async function createBulkNotifications(userIds, notification) {
  const results = [];
  for (const userId of userIds) {
    const result = await createNotification(userId, notification);
    results.push({ userId, ...result });
  }
  return results;
}

/**
 * Create notification for all users
 */
export async function createNotificationForAllUsers(notification, adminId) {
  try {
    // Get all users
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) {
      return { success: false, error: 'No users found' };
    }

    const users = snapshot.val();
    const userIds = Object.keys(users);

    const notificationWithAdmin = {
      ...notification,
      fromAdmin: true,
      adminId,
    };

    const results = await createBulkNotifications(userIds, notificationWithAdmin);
    const successCount = results.filter(r => r.success).length;

    return {
      success: true,
      totalUsers: userIds.length,
      successCount,
      failedCount: userIds.length - successCount
    };
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    return { success: false, error };
  }
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(userId, limit = 50) {
  try {
    const notificationsRef = ref(database, `notifications/${userId}`);
    const snapshot = await get(notificationsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const data = snapshot.val();
    const notifications = Object.entries(data)
      .map(([id, notification]) => ({
        id,
        ...notification,
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);

    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

/**
 * Subscribe to notifications for a user (real-time)
 */
export function subscribeToNotifications(userId, callback) {
  const notificationsRef = ref(database, `notifications/${userId}`);

  return onValue(notificationsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const data = snapshot.val();
    const notifications = Object.entries(data)
      .map(([id, notification]) => ({
        id,
        ...notification,
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    callback(notifications);
  });
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(userId, notificationId) {
  try {
    const notificationRef = ref(database, `notifications/${userId}/${notificationId}`);
    await update(notificationRef, { read: true });
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId) {
  try {
    const notificationsRef = ref(database, `notifications/${userId}`);
    const snapshot = await get(notificationsRef);

    if (!snapshot.exists()) {
      return { success: true };
    }

    const updates = {};
    const data = snapshot.val();

    Object.keys(data).forEach(notificationId => {
      updates[`${notificationId}/read`] = true;
    });

    await update(notificationsRef, updates);
    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error };
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId) {
  try {
    const notificationsRef = ref(database, `notifications/${userId}`);
    const snapshot = await get(notificationsRef);

    if (!snapshot.exists()) {
      return 0;
    }

    const data = snapshot.val();
    return Object.values(data).filter(n => !n.read).length;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

/**
 * Create notification when a new question is received
 */
export async function notifyNewQuestion(eventId, eventTitle, organizerId) {
  return createNotification(organizerId, {
    type: NOTIFICATION_TYPES.QUESTION,
    title: 'New Question Received',
    message: `Someone asked a question on "${eventTitle}"`,
    link: `/organizer/event/${eventId}`,
  });
}

/**
 * Create notification when admin takes action on user
 */
export async function notifyAdminAction(userId, action, details, adminId) {
  return createNotification(userId, {
    type: NOTIFICATION_TYPES.ACCOUNT,
    title: `Account ${action}`,
    message: details,
    fromAdmin: true,
    adminId,
  });
}
