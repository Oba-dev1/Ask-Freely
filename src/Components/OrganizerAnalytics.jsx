// src/Components/OrganizerAnalytics.jsx
import React, { useEffect, useState, useMemo } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../Firebase/config";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./OrganizerAnalytics.css";

function OrganizerAnalytics() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [allQuestions, setAllQuestions] = useState({});
  const [loading, setLoading] = useState(true);

  // Load events and all their questions
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const eventsRef = ref(database, 'events');
    const unsubscribeEvents = onValue(
      eventsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const userEvents = Object.keys(data)
            .filter((key) => data[key]?.organizerId === currentUser.uid)
            .map((key) => ({ id: key, ...data[key] }))
            .sort((a, b) => {
              const dateA = new Date(a.createdAt || a.date || 0);
              const dateB = new Date(b.createdAt || b.date || 0);
              return dateB - dateA;
            });
          setEvents(userEvents);
        } else {
          setEvents([]);
        }
      },
      (error) => {
        console.error("Error loading events:", error);
        setEvents([]);
      }
    );

    // Load all questions for analytics
    const questionsRef = ref(database, 'questions');
    const unsubscribeQuestions = onValue(
      questionsRef,
      (snapshot) => {
        const data = snapshot.val();
        setAllQuestions(data || {});
        setLoading(false);
      },
      (error) => {
        console.error("Error loading questions:", error);
        setAllQuestions({});
        setLoading(false);
      }
    );

    return () => {
      unsubscribeEvents();
      unsubscribeQuestions();
    };
  }, [currentUser]);

  // Compute aggregate statistics
  const stats = useMemo(() => {
    let totalEvents = 0;
    let activeEvents = 0;
    let draftEvents = 0;
    let archivedEvents = 0;
    let totalQuestions = 0;
    let totalAnswered = 0;
    let totalAnonymous = 0;
    let totalAudience = 0;
    let totalOrganizer = 0;

    events.forEach(event => {
      totalEvents++;

      if (event.status === 'published') activeEvents++;
      else if (event.status === 'draft') draftEvents++;
      else if (event.status === 'archived') archivedEvents++;

      const eventQuestions = allQuestions[event.id] || {};
      const questions = Object.values(eventQuestions).filter(q => !q.deleted);

      totalQuestions += questions.length;
      totalAnswered += questions.filter(q => q.answered).length;
      totalAnonymous += questions.filter(q => q.source === 'anonymous').length;
      totalAudience += questions.filter(q => q.source === 'audience').length;
      totalOrganizer += questions.filter(q => q.source === 'organizer').length;
    });

    const answerRate = totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0;
    const avgQuestionsPerEvent = totalEvents > 0 ? totalQuestions / totalEvents : 0;
    const anonymousRate = totalQuestions > 0 ? (totalAnonymous / totalQuestions) * 100 : 0;

    return {
      totalEvents,
      activeEvents,
      draftEvents,
      archivedEvents,
      totalQuestions,
      totalAnswered,
      totalUnanswered: totalQuestions - totalAnswered,
      totalAnonymous,
      totalAudience,
      totalOrganizer,
      answerRate,
      avgQuestionsPerEvent,
      anonymousRate
    };
  }, [events, allQuestions]);

  // Compute per-event analytics
  const eventAnalytics = useMemo(() => {
    return events.map(event => {
      const eventQuestions = allQuestions[event.id] || {};
      const questions = Object.values(eventQuestions).filter(q => !q.deleted);

      const totalQuestions = questions.length;
      const answered = questions.filter(q => q.answered).length;
      const anonymous = questions.filter(q => q.source === 'anonymous').length;
      const audience = questions.filter(q => q.source === 'audience').length;
      const organizer = questions.filter(q => q.source === 'organizer').length;

      const answerRate = totalQuestions > 0 ? (answered / totalQuestions) * 100 : 0;
      const anonymousRate = totalQuestions > 0 ? (anonymous / totalQuestions) * 100 : 0;

      return {
        ...event,
        totalQuestions,
        answered,
        unanswered: totalQuestions - answered,
        anonymous,
        audience,
        organizer,
        answerRate,
        anonymousRate
      };
    });
  }, [events, allQuestions]);

  // Top performing events (by question count)
  const topEvents = useMemo(() => {
    return [...eventAnalytics]
      .sort((a, b) => b.totalQuestions - a.totalQuestions)
      .slice(0, 5);
  }, [eventAnalytics]);

  if (loading) {
    return (
      <div className="analytics-view">
        <div className="analytics-loading">
          <div className="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="analytics-view">
        <div className="analytics-empty">
          <i className="fas fa-chart-bar"></i>
          <h2>No Analytics Yet</h2>
          <p>Create your first event to start seeing analytics</p>
          <button className="btn btn-primary" onClick={() => navigate('/organizer/events/all')}>
            <i className="fas fa-plus"></i> Create Event
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-view">
      {/* Page Header */}
      <header className="analytics-header">
        <div>
          <h1 className="analytics-title">Analytics Overview</h1>
          <p className="analytics-subtitle">Performance metrics across all your events</p>
        </div>
      </header>

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        {/* Total Events */}
        <div className="metric-card">
          <div className="metric-icon metric-icon-primary">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div className="metric-content">
            <p className="metric-label">Total Events</p>
            <h2 className="metric-value">{stats.totalEvents}</h2>
            <p className="metric-detail">
              <span className="metric-badge badge-success">{stats.activeEvents} Active</span>
              <span className="metric-badge badge-warning">{stats.draftEvents} Drafts</span>
              {stats.archivedEvents > 0 && (
                <span className="metric-badge badge-muted">{stats.archivedEvents} Archived</span>
              )}
            </p>
          </div>
        </div>

        {/* Total Questions */}
        <div className="metric-card">
          <div className="metric-icon metric-icon-info">
            <i className="fas fa-question-circle"></i>
          </div>
          <div className="metric-content">
            <p className="metric-label">Total Questions</p>
            <h2 className="metric-value">{stats.totalQuestions}</h2>
            <p className="metric-detail">
              {stats.avgQuestionsPerEvent.toFixed(1)} avg per event
            </p>
          </div>
        </div>

        {/* Answer Rate */}
        <div className="metric-card">
          <div className="metric-icon metric-icon-success">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="metric-content">
            <p className="metric-label">Answer Rate</p>
            <h2 className="metric-value">{stats.answerRate.toFixed(1)}%</h2>
            <p className="metric-detail">
              {stats.totalAnswered} of {stats.totalQuestions} answered
            </p>
          </div>
        </div>

        {/* Anonymous Rate */}
        <div className="metric-card">
          <div className="metric-icon metric-icon-purple">
            <i className="fas fa-user-secret"></i>
          </div>
          <div className="metric-content">
            <p className="metric-label">Anonymous Questions</p>
            <h2 className="metric-value">{stats.anonymousRate.toFixed(1)}%</h2>
            <p className="metric-detail">
              {stats.totalAnonymous} of {stats.totalQuestions} questions
            </p>
          </div>
        </div>
      </div>

      {/* Question Sources Breakdown */}
      <div className="analytics-section">
        <h3 className="section-title">
          <i className="fas fa-users"></i> Question Sources
        </h3>
        <div className="source-breakdown">
          <div className="source-item">
            <div className="source-bar">
              <div
                className="source-fill source-fill-organizer"
                style={{ width: `${stats.totalQuestions > 0 ? (stats.totalOrganizer / stats.totalQuestions) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="source-info">
              <span className="source-label">
                <i className="fas fa-star"></i> Strategic (Organizer)
              </span>
              <span className="source-count">{stats.totalOrganizer}</span>
            </div>
          </div>
          <div className="source-item">
            <div className="source-bar">
              <div
                className="source-fill source-fill-audience"
                style={{ width: `${stats.totalQuestions > 0 ? (stats.totalAudience / stats.totalQuestions) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="source-info">
              <span className="source-label">
                <i className="fas fa-users"></i> Audience
              </span>
              <span className="source-count">{stats.totalAudience}</span>
            </div>
          </div>
          <div className="source-item">
            <div className="source-bar">
              <div
                className="source-fill source-fill-anonymous"
                style={{ width: `${stats.totalQuestions > 0 ? (stats.totalAnonymous / stats.totalQuestions) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="source-info">
              <span className="source-label">
                <i className="fas fa-user-secret"></i> Anonymous
              </span>
              <span className="source-count">{stats.totalAnonymous}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Events */}
      {topEvents.length > 0 && (
        <div className="analytics-section">
          <h3 className="section-title">
            <i className="fas fa-trophy"></i> Top Performing Events
          </h3>
          <div className="top-events-grid">
            {topEvents.map((event, index) => (
              <div
                key={event.id}
                className="event-card-analytics"
                onClick={() => navigate(`/organizer/event/${event.id}`)}
              >
                <div className="event-rank">#{index + 1}</div>
                <div className="event-info">
                  <h4 className="event-title-analytics">{event.title}</h4>
                  <span className={`event-status-badge-small status-${event.status}`}>
                    {event.status}
                  </span>
                </div>
                <div className="event-metrics-small">
                  <div className="event-metric-item">
                    <i className="fas fa-question-circle"></i>
                    <span>{event.totalQuestions} Questions</span>
                  </div>
                  <div className="event-metric-item">
                    <i className="fas fa-check-circle"></i>
                    <span>{event.answerRate.toFixed(0)}% Answered</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Events Table */}
      <div className="analytics-section">
        <h3 className="section-title">
          <i className="fas fa-list"></i> All Events Performance
        </h3>
        <div className="events-table-container">
          <table className="events-table-analytics">
            <thead>
              <tr>
                <th>Event</th>
                <th>Status</th>
                <th>Date</th>
                <th className="text-center">Questions</th>
                <th className="text-center">Answered</th>
                <th className="text-center">Answer Rate</th>
                <th className="text-center">Anonymous</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {eventAnalytics.map(event => (
                <tr key={event.id} onClick={() => navigate(`/organizer/event/${event.id}`)} className="clickable-row">
                  <td>
                    <div className="event-title-cell">
                      <span className="event-title-text">{event.title}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge-analytics status-${event.status}`}>
                      {event.status === 'published' ? 'Active' : event.status}
                    </span>
                  </td>
                  <td className="date-cell">
                    {event.date ? new Date(event.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'TBA'}
                  </td>
                  <td className="text-center metric-cell">
                    <strong>{event.totalQuestions}</strong>
                  </td>
                  <td className="text-center metric-cell">
                    <span className="answered-count">{event.answered}</span>
                    <span className="unanswered-count">/ {event.totalQuestions}</span>
                  </td>
                  <td className="text-center">
                    <div className="progress-cell">
                      <div className="progress-bar-mini">
                        <div
                          className="progress-fill"
                          style={{ width: `${event.answerRate}%` }}
                        ></div>
                      </div>
                      <span className="progress-label">{event.answerRate.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="text-center metric-cell">
                    {event.anonymous}
                  </td>
                  <td className="action-cell">
                    <button className="btn-view-details">
                      <i className="fas fa-arrow-right"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default OrganizerAnalytics;
