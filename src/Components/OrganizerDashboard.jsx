import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '../Firebase/config';
import { useAuth } from '../context/AuthContext';
import './Organizer.css';

function OrganizerDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, userProfile, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('OrganizerDashboard mounted, currentUser:', currentUser, 'authLoading:', authLoading);
    
    // Wait for auth to finish loading
    if (authLoading) {
      console.log('Auth still loading, waiting...');
      return;
    }
    
    if (!currentUser) {
      console.log('No user after auth loaded, redirecting to login...');
      navigate('/login');
      return;
    }

    console.log('User authenticated, loading events...');

    // Load user's events
    const eventsRef = ref(database, `events`);
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      console.log('Events data loaded:', data);
      
      if (data) {
        // Filter events created by this user
        const userEvents = Object.keys(data)
          .filter(key => {
            console.log('Checking event:', key, 'organizerId:', data[key].organizerId, 'currentUserId:', currentUser.uid);
            return data[key].organizerId === currentUser.uid;
          })
          .map(key => ({
            id: key,
            ...data[key]
          }));
        console.log('User events:', userEvents);
        setEvents(userEvents);
      } else {
        console.log('No events found');
        setEvents([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="container">
        <div className="loading-state">Loading...</div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleCreateEvent = () => {
    navigate('/organizer/create-event');
  };

  const handleViewEvent = (eventId) => {
    navigate(`/organizer/event/${eventId}`);
  };

  return (
    <div className="container">
      <div className="dashboard-nav">
        <div className="nav-left">
          <h2>Welcome, {userProfile?.organizationName || 'Organizer'}!</h2>
        </div>
        <div className="nav-right">
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <header className="header">
        <h1>My Events</h1>
        <p className="subtitle">Manage your Q&A sessions</p>
      </header>

      <div className="dashboard-content">
        <div className="action-section">
          <button onClick={handleCreateEvent} className="btn btn-primary btn-large">
            ➕ Create New Event
          </button>
        </div>

        <div className="events-grid">
          {events.length === 0 ? (
            <div className="empty-state-card">
              <h3>No events yet</h3>
              <p>Create your first event to start collecting questions from your audience.</p>
              <button onClick={handleCreateEvent} className="btn btn-secondary">
                Get Started
              </button>
            </div>
          ) : (
            events.map(event => (
              <div key={event.id} className="event-card">
                <div className="event-header">
                  <h3>{event.title}</h3>
                  <span className={`event-status ${event.status}`}>
                    {event.status === 'active' ? '🟢 Active' : '⚪ Draft'}
                  </span>
                </div>
                <p className="event-date">{new Date(event.date).toLocaleDateString()}</p>
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
                    className="btn btn-secondary"
                  >
                    Manage Event
                  </button>
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