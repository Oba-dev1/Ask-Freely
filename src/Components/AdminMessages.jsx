// src/Components/AdminMessages.jsx
import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { database } from '../Firebase/config';
import { useAuth } from '../context/AuthContext';
import {
  createNotification,
  createNotificationForAllUsers,
  NOTIFICATION_TYPES
} from '../services/notificationService';
import { sendAnnouncementEmail } from '../services/emailService';

function AdminMessages() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  // Form state
  const [messageType, setMessageType] = useState('announcement');
  const [recipientType, setRecipientType] = useState('all');
  const [selectedUser, setSelectedUser] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sendEmail, setSendEmail] = useState(false);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const usersArray = Object.entries(data).map(([id, userData]) => ({
            id,
            ...userData,
          }));
          setUsers(usersArray);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    if (recipientType === 'individual' && !selectedUser) {
      showToast('Please select a user', 'error');
      return;
    }

    setSending(true);

    try {
      const notification = {
        type: messageType,
        title: title.trim(),
        message: message.trim(),
        fromAdmin: true,
        adminId: currentUser.uid,
      };

      let result;

      if (recipientType === 'all') {
        // Send to all users
        result = await createNotificationForAllUsers(notification, currentUser.uid);

        if (result.success) {
          showToast(`Notification sent to ${result.successCount} users`);

          // Queue emails if enabled
          if (sendEmail) {
            for (const user of users) {
              if (user.email) {
                await sendAnnouncementEmail(user.email, title.trim(), message.trim());
              }
            }
          }
        }
      } else {
        // Send to individual user
        result = await createNotification(selectedUser, notification);

        if (result.success) {
          const user = users.find(u => u.id === selectedUser);
          showToast(`Notification sent to ${user?.email || 'user'}`);

          // Queue email if enabled
          if (sendEmail && user?.email) {
            await sendAnnouncementEmail(user.email, title.trim(), message.trim());
          }
        }
      }

      if (result.success) {
        // Reset form
        setTitle('');
        setMessage('');
        setSelectedUser('');
      } else {
        showToast('Failed to send notification', 'error');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      showToast('An error occurred', 'error');
    }

    setSending(false);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-48"></div>
          <div className="h-64 bg-neutral-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
            toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
          } text-white`}
        >
          <div className="flex items-center gap-2">
            <i className={`fas ${toast.type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}`}></i>
            {toast.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-ink mb-2">
          Send Message
        </h1>
        <p className="text-neutral-600">
          Send notifications and announcements to platform users
        </p>
      </div>

      {/* Message Form */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Message Type */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-2">
              Message Type
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: NOTIFICATION_TYPES.ANNOUNCEMENT, label: 'Announcement', icon: 'fa-bullhorn' },
                { value: NOTIFICATION_TYPES.ACCOUNT, label: 'Account Notice', icon: 'fa-user-shield' },
                { value: NOTIFICATION_TYPES.EVENT, label: 'Event Tips', icon: 'fa-calendar' },
                { value: NOTIFICATION_TYPES.SYSTEM, label: 'System', icon: 'fa-cog' },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setMessageType(type.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    messageType === type.value
                      ? 'bg-primary text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  <i className={`fas ${type.icon} mr-1.5`}></i>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recipients */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-2">
              Recipients
            </label>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="recipientType"
                  value="all"
                  checked={recipientType === 'all'}
                  onChange={(e) => setRecipientType(e.target.value)}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <span className="text-sm">All users ({users.length})</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="recipientType"
                  value="individual"
                  checked={recipientType === 'individual'}
                  onChange={(e) => setRecipientType(e.target.value)}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <span className="text-sm">Individual user</span>
              </label>
            </div>

            {recipientType === 'individual' && (
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select a user...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email} {user.organizationName ? `(${user.organizationName})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notification title..."
              className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              maxLength={200}
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
              rows={4}
              className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-neutral-500 mt-1 text-right">
              {message.length}/1000 characters
            </p>
          </div>

          {/* Email Option */}
          <div className="bg-neutral-50 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="w-4 h-4 text-primary focus:ring-primary mt-0.5"
              />
              <div>
                <span className="text-sm font-medium text-ink">Also send via email</span>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Users will receive this notification in their inbox as well
                </p>
              </div>
            </label>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
            <p className="text-sm text-neutral-500">
              {recipientType === 'all'
                ? `This will be sent to ${users.length} users`
                : selectedUser
                ? `Sending to ${users.find(u => u.id === selectedUser)?.email || 'selected user'}`
                : 'Select a recipient'}
            </p>
            <button
              type="submit"
              disabled={sending || !title.trim() || !message.trim()}
              className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Sending...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i>
                  Send Notification
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Info Card */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex gap-3">
          <i className="fas fa-info-circle text-blue-500 mt-0.5"></i>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">About Notifications</p>
            <ul className="space-y-1 text-blue-700">
              <li>• In-app notifications appear immediately in the user's bell icon</li>
              <li>• Email notifications are queued and sent asynchronously</li>
              <li>• Users can view all notifications in their Notifications page</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminMessages;
