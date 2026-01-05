// src/Components/AdminActivity.jsx
import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { database } from '../Firebase/config';

function AdminActivity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const activityRef = ref(database, 'adminActivityLog');
        const snapshot = await get(activityRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          const activitiesArray = Object.entries(data)
            .map(([id, activity]) => ({
              id,
              ...activity,
            }))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

          setActivities(activitiesArray);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching activities:', error);
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Filter activities
  const filteredActivities = activities.filter((activity) => {
    if (filter === 'all') return true;
    return activity.targetType === filter;
  });

  // Get action icon and color
  const getActionStyle = (action) => {
    if (action.includes('delete')) {
      return { icon: 'fa-trash', color: 'text-red-500', bg: 'bg-red-100' };
    }
    if (action.includes('disable') || action.includes('archive')) {
      return { icon: 'fa-ban', color: 'text-yellow-500', bg: 'bg-yellow-100' };
    }
    if (action.includes('enable') || action.includes('publish')) {
      return { icon: 'fa-check', color: 'text-green-500', bg: 'bg-green-100' };
    }
    if (action.includes('bulk')) {
      return { icon: 'fa-layer-group', color: 'text-purple-500', bg: 'bg-purple-100' };
    }
    return { icon: 'fa-pen', color: 'text-blue-500', bg: 'bg-blue-100' };
  };

  // Format action text
  const formatAction = (action) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Format time ago
  const timeAgo = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
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
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-ink mb-2">
          Activity Log
        </h1>
        <p className="text-neutral-600">
          Track all admin actions on the platform
        </p>
      </div>

      {/* Filter */}
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
            All Activity
          </button>
          <button
            onClick={() => setFilter('user')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'user'
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            <i className="fas fa-user mr-1.5"></i>
            Users
          </button>
          <button
            onClick={() => setFilter('event')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'event'
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            <i className="fas fa-calendar mr-1.5"></i>
            Events
          </button>
          <button
            onClick={() => setFilter('question')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'question'
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            <i className="fas fa-circle-question mr-1.5"></i>
            Questions
          </button>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        {filteredActivities.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            <i className="fas fa-clock-rotate-left text-4xl mb-4 text-neutral-300"></i>
            <p>No activity recorded yet</p>
            <p className="text-sm mt-1">Admin actions will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filteredActivities.map((activity) => {
              const style = getActionStyle(activity.action);
              return (
                <div
                  key={activity.id}
                  className="p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Action Icon */}
                    <div
                      className={`w-10 h-10 ${style.bg} rounded-lg flex items-center justify-center flex-shrink-0`}
                    >
                      <i className={`fas ${style.icon} ${style.color}`}></i>
                    </div>

                    {/* Activity Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-ink text-sm">
                            {formatAction(activity.action)}
                          </p>
                          <p className="text-sm text-neutral-600 mt-0.5">
                            {activity.details}
                          </p>
                        </div>
                        <span className="text-xs text-neutral-400 whitespace-nowrap">
                          {timeAgo(activity.timestamp)}
                        </span>
                      </div>

                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-neutral-500">
                        <span className="inline-flex items-center gap-1">
                          <i className="fas fa-user"></i>
                          {activity.adminEmail}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                            activity.targetType === 'user'
                              ? 'bg-blue-100 text-blue-700'
                              : activity.targetType === 'event'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          <i
                            className={`fas ${
                              activity.targetType === 'user'
                                ? 'fa-user'
                                : activity.targetType === 'event'
                                ? 'fa-calendar'
                                : 'fa-circle-question'
                            }`}
                          ></i>
                          {activity.targetType}
                        </span>
                        <span className="text-neutral-400">
                          ID: {activity.targetId?.slice(0, 20)}...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-neutral-200 bg-neutral-50 text-sm text-neutral-600">
          Showing {filteredActivities.length} of {activities.length} activities
        </div>
      </div>
    </div>
  );
}

export default AdminActivity;
