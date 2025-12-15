// src/Components/OrganizerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '../Firebase/config'; // ← lowercase folder
import { useAuth } from '../context/AuthContext';
import './Organizer.css';

function OrganizerDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, userProfile, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait until auth finishes
    if (authLoading) return;

    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Load all events, filter by organizerId === currentUser.uid
    const eventsRef = ref(database, 'events');
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userEvents = Object.keys(data)
          .filter((key) => data[key]?.organizerId === currentUser.uid)
          .map((key) => ({ id: key, ...data[key] }));
        setEvents(userEvents);
      } else {
        setEvents([]);
      }
      setLoading(false);
    }, () => setLoading(false));

    return () => unsubscribe();
  }, [authLoading, currentUser, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleCreateEvent = () => navigate('/organizer/create-event');
  const handleViewEvent = (eventId) => navigate(`/organizer/event/${eventId}`);

  if (authLoading || loading) {
    return (
      <div className="page-wrapper">
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="logo">
              <span className="logo-icon"><i className="fas fa-comments"></i></span>
              <span className="logo-text">Ask Freely</span>
            </Link>
          </div>
        </nav>
        <div className="loading-state">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="logo">
            <span className="logo-icon"><i className="fas fa-comments"></i></span>
            <span className="logo-text">Ask Freely</span>
          </Link>
          <button onClick={handleLogout} className="nav-link">
            Logout
          </button>
        </div>
      </nav>

      <div className="organizer-container">
        <div className="welcome-banner">
          <div className="welcome-banner-left">
            {userProfile?.logoUrl && (
              <div className="org-logo-display">
                <img src={userProfile.logoUrl} alt={userProfile.organizationName} className="org-logo-img-large" />
              </div>
            )}
            <div className="welcome-content">
              <h2>Welcome back, {userProfile?.organizationName || 'Organizer'}!</h2>
              <p>Manage your Q&amp;A sessions and track engagement</p>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>

        <div className="action-section">
          <div className="section-title-with-count">
            <h2>My Events</h2>
            <span className="event-count">
              {events.length} {events.length === 1 ? 'Event' : 'Events'}
            </span>
          </div>
          <button onClick={handleCreateEvent} className="btn-create-event">
            Create New Event
          </button>
        </div>

        <div className="events-grid">
          {events.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-state-icon"><i class="fa-solid fa-calendar-days"></i></div>
              <h3>No events yet</h3>
              <p>Create your first event to start collecting questions from your audience and manage Q&amp;A sessions like a pro.</p>
              <button onClick={handleCreateEvent} className="btn-get-started">
                Create Your First Event
              </button>
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="event-card">
                {/* Event Flyer Image */}
                {event.branding?.flyerUrl && (
                  <div className="event-card-image">
                    <img src={event.branding.flyerUrl} alt={event.title} />
                    <span className={`event-status-badge ${event.status}`}>
                      {event.status === 'active' ? 'Active' : 'Draft'}
                    </span>
                  </div>
                )}

                <div className="event-card-content">
                  <div className="event-header">
                    <div className="event-title-section">
                      <div>
                        <h3>{event.title}</h3>
                        <div className="event-meta">
                          <span>
                            {event.date
                              ? new Date(event.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Date TBA'}
                          </span>
                          {event.time && <span>• {event.time}</span>}
                        </div>
                      </div>
                    </div>
                    {!event.branding?.flyerUrl && (
                      <span className={`event-status ${event.status}`}>
                        {event.status === 'active' ? 'Active' : 'Draft'}
                      </span>
                    )}
                  </div>

                  <div className="event-stats">
                    <div className="stat">
                      <span className="stat-value">{event.questionCount || 0}</span>
                      <span className="stat-label">Questions</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{event.strategicQuestions?.length || 0}</span>
                      <span className="stat-label">Strategic</span>
                    </div>
                  </div>

                  <div className="event-actions">
                    <button
                      onClick={() => handleViewEvent(event.id)}
                      className="btn-manage-event"
                    >
                      Manage Event
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default OrganizerDashboard;
