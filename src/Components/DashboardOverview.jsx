// src/Components/DashboardOverview.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '../Firebase/config';
import { useAuth } from '../context/AuthContext';
import './DashboardOverview.css';

function DashboardOverview() {
  const [events, setEvents] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    draftEvents: 0,
    totalQuestions: 0,
    answeredQuestions: 0,
    pendingQuestions: 0,
    totalEngagement: 0,
    recentActivity: []
  });

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

    // Load all user's events
    const eventsRef = ref(database, 'events');
    const unsubscribeEvents = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userEvents = Object.keys(data)
          .filter((key) => data[key]?.organizerId === currentUser.uid)
          .map((key) => ({ id: key, ...data[key] }));

        setEvents(userEvents);
        calculateStats(userEvents);
      } else {
        setEvents([]);
        setStats({
          totalEvents: 0,
          activeEvents: 0,
          draftEvents: 0,
          totalQuestions: 0,
          answeredQuestions: 0,
          pendingQuestions: 0,
          totalEngagement: 0,
          recentActivity: []
        });
      }
      setLoading(false);
    });

    return () => unsubscribeEvents();
  }, [currentUser]);

  const calculateStats = (userEvents) => {
    const totalEvents = userEvents.length;
    const activeEvents = userEvents.filter(e => e.status === 'published').length;
    const draftEvents = userEvents.filter(e => e.status === 'draft').length;

    let totalQuestions = 0;
    let answeredQuestions = 0;
    let pendingQuestions = 0;
    const recentActivity = [];

    userEvents.forEach(event => {
      const eventQuestions = event.questionCount || 0;
      const eventAnswered = event.answeredCount || 0;

      totalQuestions += eventQuestions;
      answeredQuestions += eventAnswered;
      pendingQuestions += (eventQuestions - eventAnswered);

      // Add to recent activity
      if (event.updatedAt || event.createdAt) {
        recentActivity.push({
          type: 'event',
          title: event.title,
          date: event.updatedAt || event.createdAt,
          status: event.status,
          id: event.id
        });
      }
    });

    // Sort recent activity by date
    recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalEngagement = totalQuestions > 0
      ? Math.round((answeredQuestions / totalQuestions) * 100)
      : 0;

    setStats({
      totalEvents,
      activeEvents,
      draftEvents,
      totalQuestions,
      answeredQuestions,
      pendingQuestions,
      totalEngagement,
      recentActivity: recentActivity.slice(0, 5) // Top 5 recent
    });
  };

  const getRecentEvents = () => {
    return events
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 3);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="overview-loading">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-overview">
      {/* Page Header */}
      <div className="overview-header">
        <div>
          <h1 className="overview-title">Overview</h1>
          <p className="overview-subtitle">Welcome back! Here's what's happening with your events</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/organizer/create-event')}>
          <i className="fas fa-plus"></i> Create Event
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {/* Total Events */}
        <div className="stat-card stat-card-blue">
          <div className="stat-icon">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Events</p>
            <h3 className="stat-value">{stats.totalEvents}</h3>
            <p className="stat-detail">
              <span className="stat-badge stat-badge-success">{stats.activeEvents} Active</span>
              <span className="stat-badge stat-badge-warning">{stats.draftEvents} Drafts</span>
            </p>
          </div>
        </div>

        {/* Total Questions */}
        <div className="stat-card stat-card-purple">
          <div className="stat-icon">
            <i className="fas fa-question-circle"></i>
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Questions</p>
            <h3 className="stat-value">{stats.totalQuestions}</h3>
            <p className="stat-detail">
              Across all events
            </p>
          </div>
        </div>

        {/* Answered Questions */}
        <div className="stat-card stat-card-green">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <p className="stat-label">Answered</p>
            <h3 className="stat-value">{stats.answeredQuestions}</h3>
            <p className="stat-detail">
              <span className="stat-badge stat-badge-warning">{stats.pendingQuestions} Pending</span>
            </p>
          </div>
        </div>

        {/* Engagement Rate */}
        <div className="stat-card stat-card-orange">
          <div className="stat-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="stat-content">
            <p className="stat-label">Engagement Rate</p>
            <h3 className="stat-value">{stats.totalEngagement}%</h3>
            <p className="stat-detail">
              Questions answered
            </p>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="overview-content-grid">
        {/* Recent Events */}
        <div className="overview-card">
          <div className="card-header">
            <h2 className="card-title">
              <i className="fas fa-clock"></i> Recent Events
            </h2>
            <Link to="/organizer/events/all" className="card-link">
              View All <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
          <div className="card-body">
            {getRecentEvents().length > 0 ? (
              <div className="event-list">
                {getRecentEvents().map((event) => (
                  <div
                    key={event.id}
                    className="event-item"
                    onClick={() => navigate(`/organizer/event/${event.id}`)}
                  >
                    <div className="event-item-icon">
                      {event.flyerUrl ? (
                        <img src={event.flyerUrl} alt={event.title} />
                      ) : (
                        <i className="fas fa-calendar"></i>
                      )}
                    </div>
                    <div className="event-item-content">
                      <h4 className="event-item-title">{event.title}</h4>
                      <p className="event-item-meta">
                        <span className={`status-badge status-${event.status}`}>
                          {event.status === 'published' ? 'Active' : 'Draft'}
                        </span>
                        <span className="event-item-date">{formatDate(event.dateTime)}</span>
                      </p>
                      <p className="event-item-stats">
                        <span><i className="fas fa-question"></i> {event.questionCount || 0} questions</span>
                        <span><i className="fas fa-check"></i> {event.answeredCount || 0} answered</span>
                      </p>
                    </div>
                    <div className="event-item-arrow">
                      <i className="fas fa-chevron-right"></i>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <i className="fas fa-calendar-plus"></i>
                <p>No events yet</p>
                <button className="btn btn-secondary" onClick={() => navigate('/organizer/create-event')}>
                  Create Your First Event
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="overview-card">
          <div className="card-header">
            <h2 className="card-title">
              <i className="fas fa-bolt"></i> Quick Actions
            </h2>
          </div>
          <div className="card-body">
            <div className="quick-actions-grid">
              <button
                className="quick-action-btn"
                onClick={() => navigate('/organizer/create-event')}
              >
                <div className="quick-action-icon quick-action-icon-primary">
                  <i className="fas fa-plus"></i>
                </div>
                <span>Create Event</span>
              </button>

              <button
                className="quick-action-btn"
                onClick={() => navigate('/organizer/events/all')}
              >
                <div className="quick-action-icon quick-action-icon-blue">
                  <i className="fas fa-list"></i>
                </div>
                <span>View All Events</span>
              </button>

              <button
                className="quick-action-btn"
                onClick={() => navigate('/organizer/analytics')}
              >
                <div className="quick-action-icon quick-action-icon-purple">
                  <i className="fas fa-chart-bar"></i>
                </div>
                <span>View Analytics</span>
              </button>

              <button
                className="quick-action-btn"
                onClick={() => navigate('/organizer/settings')}
              >
                <div className="quick-action-icon quick-action-icon-gray">
                  <i className="fas fa-cog"></i>
                </div>
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed (if time permits) */}
      {stats.recentActivity.length > 0 && (
        <div className="overview-card overview-card-full">
          <div className="card-header">
            <h2 className="card-title">
              <i className="fas fa-history"></i> Recent Activity
            </h2>
          </div>
          <div className="card-body">
            <div className="activity-feed">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className={`activity-dot activity-dot-${activity.status}`}></div>
                  <div className="activity-content">
                    <p className="activity-title">{activity.title}</p>
                    <p className="activity-meta">{formatDate(activity.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardOverview;
