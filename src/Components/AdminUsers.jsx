// src/Components/AdminUsers.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { ref, get, update, remove, push } from 'firebase/database';
import { database } from '../Firebase/config';
import { useAuth } from '../context/AuthContext';
import { sendVerificationReminderEmail } from '../services/emailService';

function AdminUsers() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
          const usersData = snapshot.val();
          const usersArray = Object.entries(usersData).map(([id, data]) => ({
            id,
            ...data,
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

  // Log admin action
  const logAdminAction = async (action, targetId, details) => {
    try {
      const logRef = ref(database, 'adminActivityLog');
      await push(logRef, {
        action,
        adminId: currentUser.uid,
        adminEmail: currentUser.email,
        targetType: 'user',
        targetId,
        details,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  };

  // Filter and search users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search filter
      const matchesSearch =
        searchTerm === '' ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.organizationName?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      // Note: emailVerified in database is set for Google users,
      // for email/password users we check if they've completed profile as proxy
      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus = user.profileCompleted && !user.disabled;
      } else if (statusFilter === 'pending') {
        // Pending = verified but profile not completed (emailVerified true or Google user)
        matchesStatus = !user.profileCompleted && !user.disabled && user.emailVerified !== false;
      } else if (statusFilter === 'unverified') {
        // Unverified = emailVerified explicitly false (email/password users who haven't verified)
        matchesStatus = user.emailVerified === false;
      } else if (statusFilter === 'disabled') {
        matchesStatus = user.disabled;
      } else if (statusFilter === 'admin') {
        matchesStatus = user.superAdmin;
      }

      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, statusFilter]);

  // Handle select all
  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((u) => u.id));
    }
  };

  // Handle single select
  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Toggle user disabled status
  const toggleUserStatus = async (userId, currentDisabled) => {
    setActionLoading(true);
    try {
      const userRef = ref(database, `users/${userId}`);
      const newStatus = !currentDisabled;
      await update(userRef, { disabled: newStatus });

      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, disabled: newStatus } : u))
      );

      await logAdminAction(
        newStatus ? 'disable_user' : 'enable_user',
        userId,
        `User ${newStatus ? 'disabled' : 'enabled'}`
      );

      showToast(`User ${newStatus ? 'disabled' : 'enabled'} successfully`);
    } catch (error) {
      console.error('Error toggling user status:', error);
      showToast('Failed to update user status', 'error');
    }
    setActionLoading(false);
  };

  // Delete user
  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setActionLoading(true);
    try {
      const userToDelete = users.find((u) => u.id === userId);
      const userRef = ref(database, `users/${userId}`);
      await remove(userRef);

      // Update local state
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setSelectedUsers((prev) => prev.filter((id) => id !== userId));

      await logAdminAction(
        'delete_user',
        userId,
        `Deleted user: ${userToDelete?.email || 'Unknown'}`
      );

      showToast('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Failed to delete user', 'error');
    }
    setActionLoading(false);
  };

  // Bulk disable users
  const bulkDisableUsers = async () => {
    if (selectedUsers.length === 0) return;
    if (!window.confirm(`Are you sure you want to disable ${selectedUsers.length} user(s)?`)) {
      return;
    }

    setActionLoading(true);
    try {
      for (const userId of selectedUsers) {
        const userRef = ref(database, `users/${userId}`);
        await update(userRef, { disabled: true });
      }

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          selectedUsers.includes(u.id) ? { ...u, disabled: true } : u
        )
      );

      await logAdminAction(
        'bulk_disable_users',
        selectedUsers.join(','),
        `Bulk disabled ${selectedUsers.length} users`
      );

      showToast(`${selectedUsers.length} user(s) disabled`);
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error bulk disabling users:', error);
      showToast('Failed to disable users', 'error');
    }
    setActionLoading(false);
  };

  // Bulk delete users
  const bulkDeleteUsers = async () => {
    if (selectedUsers.length === 0) return;
    if (!window.confirm(`Are you sure you want to DELETE ${selectedUsers.length} user(s)? This cannot be undone!`)) {
      return;
    }

    setActionLoading(true);
    try {
      for (const userId of selectedUsers) {
        const userRef = ref(database, `users/${userId}`);
        await remove(userRef);
      }

      // Update local state
      setUsers((prev) => prev.filter((u) => !selectedUsers.includes(u.id)));

      await logAdminAction(
        'bulk_delete_users',
        selectedUsers.join(','),
        `Bulk deleted ${selectedUsers.length} users`
      );

      showToast(`${selectedUsers.length} user(s) deleted`);
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      showToast('Failed to delete users', 'error');
    }
    setActionLoading(false);
  };

  // Send verification reminder email to a single user
  const sendVerificationReminder = async (userId, userEmail) => {
    setActionLoading(true);
    try {
      await sendVerificationReminderEmail(userEmail);

      await logAdminAction(
        'send_verification_reminder',
        userId,
        `Sent verification reminder to ${userEmail}`
      );

      showToast(`Verification reminder queued for ${userEmail}`);
    } catch (error) {
      console.error('Error sending verification reminder:', error);
      showToast('Failed to send verification reminder', 'error');
    }
    setActionLoading(false);
  };

  // Bulk send verification reminders to selected unverified users
  const bulkSendVerificationReminders = async () => {
    const unverifiedSelected = users.filter(
      (u) => selectedUsers.includes(u.id) && u.emailVerified === false
    );

    if (unverifiedSelected.length === 0) {
      showToast('No unverified users selected', 'error');
      return;
    }

    if (!window.confirm(`Send verification reminders to ${unverifiedSelected.length} unverified user(s)?`)) {
      return;
    }

    setActionLoading(true);
    try {
      for (const user of unverifiedSelected) {
        await sendVerificationReminderEmail(user.email);
      }

      await logAdminAction(
        'bulk_send_verification_reminders',
        unverifiedSelected.map((u) => u.id).join(','),
        `Sent verification reminders to ${unverifiedSelected.length} users`
      );

      showToast(`Verification reminders queued for ${unverifiedSelected.length} user(s)`);
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error sending bulk verification reminders:', error);
      showToast('Failed to send verification reminders', 'error');
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-48"></div>
          <div className="h-12 bg-neutral-200 rounded"></div>
          <div className="h-96 bg-neutral-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
            toast.type === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-green-500 text-white'
          }`}
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
          User Management
        </h1>
        <p className="text-neutral-600">
          View and manage all registered users on the platform
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"></i>
            <input
              type="text"
              placeholder="Search by email or organization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 pr-8 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary appearance-none bg-white bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.75rem_center]"
          >
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="pending">Pending Setup</option>
            <option value="unverified">Unverified Email</option>
            <option value="disabled">Disabled</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-200 flex flex-wrap items-center gap-3">
            <span className="text-sm text-neutral-600">
              {selectedUsers.length} selected
            </span>
            <button
              onClick={bulkDisableUsers}
              disabled={actionLoading}
              className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors disabled:opacity-50"
            >
              <i className="fas fa-ban mr-1.5"></i>
              Disable Selected
            </button>
            <button
              onClick={bulkDeleteUsers}
              disabled={actionLoading}
              className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
            >
              <i className="fas fa-trash mr-1.5"></i>
              Delete Selected
            </button>
            <button
              onClick={bulkSendVerificationReminders}
              disabled={actionLoading}
              className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors disabled:opacity-50"
            >
              <i className="fas fa-envelope mr-1.5"></i>
              Send Verification Reminders
            </button>
            <button
              onClick={() => setSelectedUsers([])}
              className="px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                  User
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                  Organization
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                  Joined
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-neutral-50 transition-colors ${
                      selectedUsers.includes(user.id) ? 'bg-primary/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {user.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <i className="fas fa-user text-blue-500"></i>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-ink text-sm truncate max-w-[200px]">
                            {user.email}
                          </p>
                          <p className="text-xs text-neutral-500">
                            ID: {user.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-700">
                        {user.organizationName || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.superAdmin
                            ? 'bg-red-100 text-red-700'
                            : user.disabled
                            ? 'bg-neutral-100 text-neutral-700'
                            : user.emailVerified === false
                            ? 'bg-orange-100 text-orange-700'
                            : user.profileCompleted
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.superAdmin
                              ? 'bg-red-500'
                              : user.disabled
                              ? 'bg-neutral-500'
                              : user.emailVerified === false
                              ? 'bg-orange-500'
                              : user.profileCompleted
                              ? 'bg-green-500'
                              : 'bg-yellow-500'
                          }`}
                        ></span>
                        {user.superAdmin
                          ? 'Admin'
                          : user.disabled
                          ? 'Disabled'
                          : user.emailVerified === false
                          ? 'Unverified'
                          : user.profileCompleted
                          ? 'Active'
                          : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {/* Send verification reminder button - only for unverified users */}
                        {user.emailVerified === false && (
                          <button
                            onClick={() => sendVerificationReminder(user.id, user.email)}
                            disabled={actionLoading}
                            className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors disabled:opacity-50"
                            title="Send verification reminder"
                          >
                            <i className="fas fa-envelope"></i>
                          </button>
                        )}
                        <button
                          onClick={() => toggleUserStatus(user.id, user.disabled)}
                          disabled={actionLoading || user.superAdmin}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                            user.disabled
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                          }`}
                          title={user.disabled ? 'Enable user' : 'Disable user'}
                        >
                          <i className={`fas ${user.disabled ? 'fa-check' : 'fa-ban'}`}></i>
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          disabled={actionLoading || user.superAdmin}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                          title="Delete user"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Info */}
        <div className="px-4 py-3 border-t border-neutral-200 bg-neutral-50 text-sm text-neutral-600">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>
    </div>
  );
}

export default AdminUsers;
