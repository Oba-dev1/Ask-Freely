// src/Components/EventsArchivedView.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '../Firebase/config';
import { useAuth } from '../context/AuthContext';
import './EventsView.css';

function EventsArchivedView() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const eventsRef = ref(database, 'events');
    const unsubscribe = onValue(
      eventsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const archivedEvents = Object.keys(data)
            .filter((key) => data[key]?.organizerId === currentUser.uid && data[key]?.status === 'archived')
            .map((key) => ({ id: key, ...data[key] }))
            .sort((a, b) => {
              const dateA = new Date(a.archivedAt || a.createdAt || 0);
              const dateB = new Date(b.archivedAt || b.createdAt || 0);
              return dateB - dateA; // Most recently archived first
            });
          setEvents(archivedEvents);
        } else {
          setEvents([]);
        }
        setLoading(false);
      },
      (error) => {
        // Handle Firebase errors gracefully
        setLoading(false);
        setEvents([]);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const getEventDisplayDate = (event) => {
    if (!event) return 'N/A';
    if (event.date) {
      try {
        const date = new Date(event.date);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return event.time ? `${dateStr} • ${event.time}` : dateStr;
      } catch (e) {
        return event.date;
      }
    }
    return 'Date TBA';
  };

  const getArchivedDate = (event) => {
    if (!event.archivedAt) return null;
    try {
      const date = new Date(event.archivedAt);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="events-view">
        <div className="events-loading">
          <div className="spinner"></div>
          <p>Loading archived events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="events-view">
      {/* Page Header */}
      <div className="events-header">
        <div>
          <h1 className="events-title">Archived Events</h1>
          <p className="events-subtitle">Events you've archived - restore them anytime</p>
        </div>
        <div className="events-header-actions">
          <div className="view-mode-toggle">
            <button
              className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <i className="fas fa-th"></i>
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <i className="fas fa-list"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Events Grid/List */}
      {events.length > 0 ? (
        <div className={`events-container events-${viewMode}`}>
          {events.map((event) => (
            <div
              key={event.id}
              className="event-card"
              onClick={() => navigate(`/organizer/event/${event.id}`)}
            >
              {event.flyerUrl && (
                <div className="event-card-image">
                  <img src={event.flyerUrl} alt={event.title} />
                </div>
              )}
              <div className="event-card-content">
                <div className="event-card-header">
                  <h3 className="event-card-title">{event.title}</h3>
                  <span className="event-status-badge status-archived">
                    <i className="fas fa-archive"></i> Archived
                  </span>
                </div>
                <p className="event-card-date">
                  <i className="far fa-calendar"></i> {getEventDisplayDate(event)}
                </p>
                {getArchivedDate(event) && (
                  <p className="event-card-archived">
                    <i className="fas fa-box"></i> Archived on {getArchivedDate(event)}
                  </p>
                )}
                <div className="event-card-stats">
                  <div className="stat-item">
                    <i className="fas fa-question-circle"></i>
                    <span>{event.questionCount || 0} Questions</span>
                  </div>
                  <div className="stat-item">
                    <i className="fas fa-check-circle"></i>
                    <span>{event.answeredCount || 0} Answered</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="events-empty">
          <i className="fas fa-archive"></i>
          <h3>No Archived Events</h3>
          <p>Events you archive will appear here</p>
          <button className="btn btn-secondary" onClick={() => navigate('/organizer/events/all')}>
            <i className="fas fa-list"></i> View All Events
          </button>
        </div>
      )}
    </div>
  );
}

export default EventsArchivedView;
