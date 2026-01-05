// src/Components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { database } from '../Firebase/config';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalQuestions: 0,
    activeEvents: 0,
    newUsersToday: 0,
    newEventsToday: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all users
        const usersRef = ref(database, 'users');
        const usersSnapshot = await get(usersRef);
        const usersData = usersSnapshot.exists() ? usersSnapshot.val() : {};
        const usersArray = Object.entries(usersData).map(([id, data]) => ({
          id,
          ...data,
        }));

        // Fetch all events
        const eventsRef = ref(database, 'events');
        const eventsSnapshot = await get(eventsRef);
        const eventsData = eventsSnapshot.exists() ? eventsSnapshot.val() : {};
        const eventsArray = Object.entries(eventsData).map(([id, data]) => ({
          id,
          ...data,
        }));

        // Fetch all questions
        const questionsRef = ref(database, 'questions');
        const questionsSnapshot = await get(questionsRef);
        const questionsData = questionsSnapshot.exists() ? questionsSnapshot.val() : {};

        // Count questions
        let totalQuestions = 0;
        Object.values(questionsData).forEach((eventQuestions) => {
          totalQuestions += Object.keys(eventQuestions || {}).length;
        });

        // Calculate today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Count new users today
        const newUsersToday = usersArray.filter((user) => {
          if (!user.createdAt) return false;
          return new Date(user.createdAt) >= today;
        }).length;

        // Count new events today
        const newEventsToday = eventsArray.filter((event) => {
          if (!event.createdAt) return false;
          return new Date(event.createdAt) >= today;
        }).length;

        // Active events (published status)
        const activeEvents = eventsArray.filter(
          (event) => event.status === 'published'
        ).length;

        setStats({
          totalUsers: usersArray.length,
          totalEvents: eventsArray.length,
          totalQuestions,
          activeEvents,
          newUsersToday,
          newEventsToday,
        });

        // Get recent users (last 5)
        const sortedUsers = usersArray
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .slice(0, 5);
        setRecentUsers(sortedUsers);

        // Get recent events (last 5)
        const sortedEvents = eventsArray
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .slice(0, 5);
        setRecentEvents(sortedEvents);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-48"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-neutral-200 rounded-xl"></div>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="h-64 bg-neutral-200 rounded-xl"></div>
            <div className="h-64 bg-neutral-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: 'fa-users',
      color: 'bg-blue-500',
      subtext: `+${stats.newUsersToday} today`,
    },
    {
      label: 'Total Events',
      value: stats.totalEvents,
      icon: 'fa-calendar',
      color: 'bg-purple-500',
      subtext: `+${stats.newEventsToday} today`,
    },
    {
      label: 'Active Events',
      value: stats.activeEvents,
      icon: 'fa-bolt',
      color: 'bg-green-500',
      subtext: 'Currently live',
    },
    {
      label: 'Total Questions',
      value: stats.totalQuestions,
      icon: 'fa-circle-question',
      color: 'bg-orange-500',
      subtext: 'All time',
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-ink mb-2">
          Admin Dashboard
        </h1>
        <p className="text-neutral-600">
          Platform overview and statistics for Ask Freely
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-5 border border-neutral-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}
              >
                <i className={`fas ${stat.icon} text-white`}></i>
              </div>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-ink mb-1">
              {stat.value.toLocaleString()}
            </p>
            <p className="text-neutral-600 text-sm font-medium">{stat.label}</p>
            <p className="text-xs text-neutral-400 mt-1">{stat.subtext}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="font-bold text-ink flex items-center gap-2">
              <i className="fas fa-user-plus text-blue-500"></i>
              Recent Signups
            </h2>
            <a
              href="/admin/users"
              className="text-sm text-primary hover:underline"
            >
              View all
            </a>
          </div>
          <div className="divide-y divide-neutral-100">
            {recentUsers.length === 0 ? (
              <p className="p-5 text-neutral-500 text-center">No users yet</p>
            ) : (
              recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
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
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink text-sm truncate">
                        {user.organizationName || 'No organization'}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          user.superAdmin
                            ? 'bg-red-100 text-red-700'
                            : user.profileCompleted
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {user.superAdmin
                          ? 'Admin'
                          : user.profileCompleted
                          ? 'Active'
                          : 'Pending'}
                      </span>
                      <p className="text-xs text-neutral-400 mt-1">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="font-bold text-ink flex items-center gap-2">
              <i className="fas fa-calendar-plus text-purple-500"></i>
              Recent Events
            </h2>
            <a
              href="/admin/events"
              className="text-sm text-primary hover:underline"
            >
              View all
            </a>
          </div>
          <div className="divide-y divide-neutral-100">
            {recentEvents.length === 0 ? (
              <p className="p-5 text-neutral-500 text-center">No events yet</p>
            ) : (
              recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-calendar text-purple-500"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink text-sm truncate">
                        {event.title || 'Untitled Event'}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        {event.organizationName || 'No organization'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          event.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : event.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-700'
                            : event.status === 'archived'
                            ? 'bg-neutral-100 text-neutral-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {event.status || 'draft'}
                      </span>
                      <p className="text-xs text-neutral-400 mt-1">
                        {event.createdAt
                          ? new Date(event.createdAt).toLocaleDateString()
                          : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
