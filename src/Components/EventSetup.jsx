// src/Components/EventSetup.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../Firebase/config';
import { useAuth } from '../context/AuthContext';
import EventBranding from './EventBranding';
import ProgramBuilder from './ProgramBuilder';
import './EventSetup.css';

function EventSetup() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [event, setEvent] = useState(null);
  const [branding, setBranding] = useState({
    logoUrl: '',
    flyerUrl: '',
    primaryColor: '#FF6B35',
    organizationName: '',
    tagline: ''
  });
  const [activeTab, setActiveTab] = useState('branding');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Load event data
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!eventId) return;

    const eventRef = ref(database, `events/${eventId}`);
    const unsubscribe = onValue(eventRef, (snap) => {
      const data = snap.val();
      if (!data) {
        navigate('/organizer/dashboard');
        return;
      }
      if (data.organizerId && data.organizerId !== currentUser.uid) {
        navigate('/organizer/dashboard');
        return;
      }
      setEvent(data);

      // Load existing branding if any
      if (data.branding) {
        setBranding(data.branding);
      }
    });

    return () => unsubscribe();
  }, [eventId, currentUser, navigate]);

  const handleBrandingChange = (newBranding) => {
    setBranding(newBranding);
  };

  const saveBranding = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      // Note: In a real app, you'd upload logoFile and flyerFile to storage first
      // For now, we're saving the base64 data URLs directly
      await update(ref(database, `events/${eventId}`), {
        branding: {
          logoUrl: branding.logoUrl || '',
          flyerUrl: branding.flyerUrl || '',
          primaryColor: branding.primaryColor || '#FF6B35',
          organizationName: branding.organizationName || '',
          tagline: branding.tagline || ''
        }
      });
      setSaveMessage('Branding saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving branding:', error);
      setSaveMessage('Failed to save branding. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleFinishSetup = () => {
    navigate(`/organizer/event/${eventId}`);
  };

  const handleSkipSetup = () => {
    navigate(`/organizer/event/${eventId}`);
  };

  if (!event) {
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
        <div className="loading-state">Loading event...</div>
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
        </div>
      </nav>

      <div className="setup-container">
        <div className="setup-header">
          <div className="setup-progress">
            <div className="progress-step completed">
              <div className="step-number">
                <i className="fas fa-check"></i>
              </div>
              <span className="step-label">Event Created</span>
            </div>
            <div className="progress-line"></div>
            <div className="progress-step active">
              <div className="step-number">2</div>
              <span className="step-label">Customize & Build Program</span>
            </div>
            <div className="progress-line"></div>
            <div className="progress-step">
              <div className="step-number">3</div>
              <span className="step-label">Manage Event</span>
            </div>
          </div>

          <div className="setup-title">
            <h1>Setup: {event.title}</h1>
            <p className="setup-subtitle">
              Add your branding and build your event program. You can skip this and add it later.
            </p>
          </div>
        </div>

        <div className="setup-card">
          {/* Tabs */}
          <div className="setup-tabs">
            <button
              className={`setup-tab ${activeTab === 'branding' ? 'active' : ''}`}
              onClick={() => setActiveTab('branding')}
            >
              <i className="fas fa-palette"></i>
              <span>Branding</span>
            </button>
            <button
              className={`setup-tab ${activeTab === 'program' ? 'active' : ''}`}
              onClick={() => setActiveTab('program')}
            >
              <i className="fas fa-list-check"></i>
              <span>Program</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="setup-content">
            {activeTab === 'branding' && (
              <div className="tab-panel fade-in">
                <EventBranding branding={branding} onChange={handleBrandingChange} />

                <div className="branding-actions">
                  <button
                    onClick={saveBranding}
                    className="event-btn event-btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Branding'}
                  </button>
                  {saveMessage && (
                    <span className={`save-message ${saveMessage.includes('success') ? 'success' : 'error'}`}>
                      {saveMessage}
                    </span>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'program' && (
              <div className="tab-panel fade-in">
                <ProgramBuilder eventId={eventId} eventTitle={event.title} />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="setup-footer">
            <button
              onClick={handleSkipSetup}
              className="event-btn event-btn-cancel"
            >
              Skip for Now
            </button>
            <button
              onClick={handleFinishSetup}
              className="event-btn event-btn-primary"
            >
              <i className="fas fa-check"></i> Finish Setup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventSetup;
