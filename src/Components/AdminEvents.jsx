// src/Components/AdminEvents.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { ref, get, update, remove, push } from 'firebase/database';
import { database } from '../Firebase/config';
import { useAuth } from '../context/AuthContext';

function AdminEvents() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Fetch all events and users
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch events
        const eventsRef = ref(database, 'events');
        const eventsSnapshot = await get(eventsRef);
        if (eventsSnapshot.exists()) {
          const eventsData = eventsSnapshot.val();
          const eventsArray = Object.entries(eventsData).map(([id, data]) => ({
            id,
            ...data,
          }));
          setEvents(eventsArray);
        }

        // Fetch users for organizer info
        const usersRef = ref(database, 'users');
        const usersSnapshot = await get(usersRef);
        if (usersSnapshot.exists()) {
          setUsers(usersSnapshot.val());
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Log admin action
  const logAdminAction = async (action, targetId, details) => {
    try {
      const logRef = ref(database, 'adminActivityLog');
      await push(logRef, {
        action,
        adminId: currentUser.uid,
        adminEmail: currentUser.email,
        targetType: 'event',
        targetId,
        details,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  };

  // Filter and search events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Search filter
      const matchesSearch =
        searchTerm === '' ||
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.organizationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.slug?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      let matchesStatus = true;
      if (statusFilter !== 'all') {
        matchesStatus = event.status === statusFilter;
      }

      return matchesSearch && matchesStatus;
    });
  }, [events, searchTerm, statusFilter]);

  // Handle select all
  const handleSelectAll = () => {
    if (selectedEvents.length === filteredEvents.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(filteredEvents.map((e) => e.id));
    }
  };

  // Handle single select
  const handleSelectEvent = (eventId) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    );
  };

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Update event status
  const updateEventStatus = async (eventId, newStatus) => {
    setActionLoading(true);
    try {
      const eventRef = ref(database, `events/${eventId}`);
      await update(eventRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, status: newStatus } : e))
      );

      await logAdminAction(
        `change_event_status_${newStatus}`,
        eventId,
        `Changed event status to ${newStatus}`
      );

      showToast(`Event ${newStatus === 'published' ? 'published' : newStatus === 'archived' ? 'archived' : 'updated'} successfully`);
    } catch (error) {
      console.error('Error updating event status:', error);
      showToast('Failed to update event', 'error');
    }
    setActionLoading(false);
  };

  // Delete event
  const deleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This will also delete all associated questions. This action cannot be undone.')) {
      return;
    }

    setActionLoading(true);
    try {
      const eventToDelete = events.find((e) => e.id === eventId);

      // Delete event
      const eventRef = ref(database, `events/${eventId}`);
      await remove(eventRef);

      // Delete associated questions
      const questionsRef = ref(database, `questions/${eventId}`);
      await remove(questionsRef);

      // Delete slug mapping
      if (eventToDelete?.slug) {
        const slugRef = ref(database, `slugs/${eventToDelete.slug}`);
        await remove(slugRef);
      }

      // Update local state
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      setSelectedEvents((prev) => prev.filter((id) => id !== eventId));

      await logAdminAction(
        'delete_event',
        eventId,
        `Deleted event: ${eventToDelete?.title || 'Unknown'}`
      );

      showToast('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      showToast('Failed to delete event', 'error');
    }
    setActionLoading(false);
  };

  // Bulk archive events
  const bulkArchiveEvents = async () => {
    if (selectedEvents.length === 0) return;
    if (!window.confirm(`Are you sure you want to archive ${selectedEvents.length} event(s)?`)) {
      return;
    }

    setActionLoading(true);
    try {
      for (const eventId of selectedEvents) {
        const eventRef = ref(database, `events/${eventId}`);
        await update(eventRef, {
          status: 'archived',
          archivedAt: new Date().toISOString()
        });
      }

      // Update local state
      setEvents((prev) =>
        prev.map((e) =>
          selectedEvents.includes(e.id) ? { ...e, status: 'archived' } : e
        )
      );

      await logAdminAction(
        'bulk_archive_events',
        selectedEvents.join(','),
        `Bulk archived ${selectedEvents.length} events`
      );

      showToast(`${selectedEvents.length} event(s) archived`);
      setSelectedEvents([]);
    } catch (error) {
      console.error('Error bulk archiving events:', error);
      showToast('Failed to archive events', 'error');
    }
    setActionLoading(false);
  };

  // Bulk delete events
  const bulkDeleteEvents = async () => {
    if (selectedEvents.length === 0) return;
    if (!window.confirm(`Are you sure you want to DELETE ${selectedEvents.length} event(s)? This will also delete all associated questions. This cannot be undone!`)) {
      return;
    }

    setActionLoading(true);
    try {
      for (const eventId of selectedEvents) {
        const event = events.find((e) => e.id === eventId);

        // Delete event
        const eventRef = ref(database, `events/${eventId}`);
        await remove(eventRef);

        // Delete associated questions
        const questionsRef = ref(database, `questions/${eventId}`);
        await remove(questionsRef);

        // Delete slug mapping
        if (event?.slug) {
          const slugRef = ref(database, `slugs/${event.slug}`);
          await remove(slugRef);
        }
      }

      // Update local state
      setEvents((prev) => prev.filter((e) => !selectedEvents.includes(e.id)));

      await logAdminAction(
        'bulk_delete_events',
        selectedEvents.join(','),
        `Bulk deleted ${selectedEvents.length} events`
      );

      showToast(`${selectedEvents.length} event(s) deleted`);
      setSelectedEvents([]);
    } catch (error) {
      console.error('Error bulk deleting events:', error);
      showToast('Failed to delete events', 'error');
    }
    setActionLoading(false);
  };

  // Get organizer info
  const getOrganizerInfo = (organizerId) => {
    const user = users[organizerId];
    return user || { email: 'Unknown', organizationName: 'Unknown' };
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
          Event Management
        </h1>
        <p className="text-neutral-600">
          View and manage all events on the platform
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
              placeholder="Search by title, organization, or slug..."
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
            <option value="all">All Events</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="unlisted">Unlisted</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedEvents.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-200 flex flex-wrap items-center gap-3">
            <span className="text-sm text-neutral-600">
              {selectedEvents.length} selected
            </span>
            <button
              onClick={bulkArchiveEvents}
              disabled={actionLoading}
              className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors disabled:opacity-50"
            >
              <i className="fas fa-archive mr-1.5"></i>
              Archive Selected
            </button>
            <button
              onClick={bulkDeleteEvents}
              disabled={actionLoading}
              className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
            >
              <i className="fas fa-trash mr-1.5"></i>
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedEvents([])}
              className="px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedEvents.length === filteredEvents.length && filteredEvents.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                  Event
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                  Organizer
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                    No events found
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => {
                  const organizer = getOrganizerInfo(event.organizerId);
                  return (
                    <tr
                      key={event.id}
                      className={`hover:bg-neutral-50 transition-colors ${
                        selectedEvents.includes(event.id) ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedEvents.includes(event.id)}
                          onChange={() => handleSelectEvent(event.id)}
                          className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-calendar text-purple-500"></i>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-ink text-sm truncate max-w-[200px]">
                              {event.title || 'Untitled'}
                            </p>
                            <p className="text-xs text-neutral-500">
                              /{event.slug || 'no-slug'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm text-neutral-700 truncate max-w-[150px]">
                            {organizer.organizationName || '-'}
                          </p>
                          <p className="text-xs text-neutral-500 truncate max-w-[150px]">
                            {organizer.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            event.status === 'published'
                              ? 'bg-green-100 text-green-700'
                              : event.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-700'
                              : event.status === 'archived'
                              ? 'bg-neutral-100 text-neutral-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              event.status === 'published'
                                ? 'bg-green-500'
                                : event.status === 'draft'
                                ? 'bg-yellow-500'
                                : event.status === 'archived'
                                ? 'bg-neutral-500'
                                : 'bg-blue-500'
                            }`}
                          ></span>
                          {event.status || 'draft'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {event.createdAt
                          ? new Date(event.createdAt).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {/* Status Actions */}
                          {event.status !== 'published' && (
                            <button
                              onClick={() => updateEventStatus(event.id, 'published')}
                              disabled={actionLoading}
                              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                              title="Publish event"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                          )}
                          {event.status === 'published' && (
                            <button
                              onClick={() => updateEventStatus(event.id, 'draft')}
                              disabled={actionLoading}
                              className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50"
                              title="Unpublish event"
                            >
                              <i className="fas fa-eye-slash"></i>
                            </button>
                          )}
                          {event.status !== 'archived' && (
                            <button
                              onClick={() => updateEventStatus(event.id, 'archived')}
                              disabled={actionLoading}
                              className="p-2 bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50"
                              title="Archive event"
                            >
                              <i className="fas fa-archive"></i>
                            </button>
                          )}
                          <button
                            onClick={() => deleteEvent(event.id)}
                            disabled={actionLoading}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                            title="Delete event"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Info */}
        <div className="px-4 py-3 border-t border-neutral-200 bg-neutral-50 text-sm text-neutral-600">
          Showing {filteredEvents.length} of {events.length} events
        </div>
      </div>
    </div>
  );
}

export default AdminEvents;
