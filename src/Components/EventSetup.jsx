// src/Components/EventSetup.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../Firebase/config';
import { useAuth } from '../context/AuthContext';
import EventBranding from './EventBranding';
import ProgramBuilder from './ProgramBuilder';

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
      <div className="min-h-screen bg-neutral-50">
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="logo">
              <span className="logo-icon"><i className="fas fa-comments"></i></span>
              <span className="logo-text">Ask Freely</span>
            </Link>
          </div>
        </nav>
        <div className="text-center py-16 px-8 text-neutral-500 text-lg">Loading event...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="logo">
            <span className="logo-icon"><i className="fas fa-comments"></i></span>
            <span className="logo-text">Ask Freely</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-[1200px] mx-auto pt-32 px-8 pb-16 lg:pt-28 lg:px-6 md:pt-28 md:px-4 sm:pt-24 sm:px-3">
        <div className="mb-12">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8 gap-0 md:flex-wrap md:gap-6">
            <div className="flex flex-col items-center gap-3 relative md:flex-1 md:min-w-[80px]">
              <div className="w-[50px] h-[50px] sm:w-11 sm:h-11 rounded-full bg-emerald-500 border-2 border-emerald-500 text-white flex items-center justify-center font-bold text-lg sm:text-base transition-all">
                <i className="fas fa-check"></i>
              </div>
              <span className="text-[0.9rem] sm:text-[0.8rem] xs:text-[0.75rem] text-neutral-500 font-semibold whitespace-nowrap md:text-center">Event Created</span>
            </div>
            <div className="h-0.5 w-[120px] lg:w-20 bg-black/10 mx-4 lg:mx-2 mb-8 md:hidden"></div>
            <div className="flex flex-col items-center gap-3 relative md:flex-1 md:min-w-[80px]">
              <div className="w-[50px] h-[50px] sm:w-11 sm:h-11 rounded-full bg-primary border-2 border-primary text-white flex items-center justify-center font-bold text-lg sm:text-base transition-all shadow-[0_4px_12px_rgba(255,107,53,0.3)]">
                2
              </div>
              <span className="text-[0.9rem] sm:text-[0.8rem] xs:text-[0.75rem] text-neutral-800 font-semibold whitespace-nowrap md:text-center">Customize & Build Program</span>
            </div>
            <div className="h-0.5 w-[120px] lg:w-20 bg-black/10 mx-4 lg:mx-2 mb-8 md:hidden"></div>
            <div className="flex flex-col items-center gap-3 relative md:flex-1 md:min-w-[80px]">
              <div className="w-[50px] h-[50px] sm:w-11 sm:h-11 rounded-full bg-black/[0.05] border-2 border-black/[0.12] text-neutral-500 flex items-center justify-center font-bold text-lg sm:text-base transition-all">
                3
              </div>
              <span className="text-[0.9rem] sm:text-[0.8rem] xs:text-[0.75rem] text-neutral-500 font-semibold whitespace-nowrap md:text-center">Manage Event</span>
            </div>
          </div>

          {/* Title Section */}
          <div className="text-center">
            <h1 className="m-0 mb-3 text-[2.25rem] md:text-[1.75rem] sm:text-[1.5rem] text-neutral-800 font-bold">Setup: {event.title}</h1>
            <p className="m-0 text-neutral-500 text-[1.05rem] md:text-[0.95rem] leading-relaxed max-w-[600px] mx-auto">
              Add your branding and build your event program. You can skip this and add it later.
            </p>
          </div>
        </div>

        <div className="bg-white border border-black/10 rounded-[20px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
          {/* Tabs */}
          <div className="flex md:flex-col border-b border-black/[0.08] bg-primary/[0.02]">
            <button
              className={`flex-1 py-5 px-6 md:p-4 sm:py-3.5 bg-transparent border-none text-neutral-500 text-base sm:text-[0.95rem] font-semibold cursor-pointer transition-all flex items-center justify-center gap-3 border-b-[3px] border-transparent md:border-b md:border-b-black/[0.05] md:border-l-[3px] md:border-l-transparent ${activeTab === 'branding' ? 'bg-primary/[0.08] text-neutral-800 border-b-primary md:border-b-black/[0.05] md:border-l-primary' : 'hover:bg-primary/[0.05] hover:text-neutral-600'}`}
              onClick={() => setActiveTab('branding')}
            >
              <i className="fas fa-palette text-lg sm:text-base"></i>
              <span>Branding</span>
            </button>
            <button
              className={`flex-1 py-5 px-6 md:p-4 sm:py-3.5 bg-transparent border-none text-neutral-500 text-base sm:text-[0.95rem] font-semibold cursor-pointer transition-all flex items-center justify-center gap-3 border-b-[3px] border-transparent md:border-b md:border-b-black/[0.05] md:border-l-[3px] md:border-l-transparent ${activeTab === 'program' ? 'bg-primary/[0.08] text-neutral-800 border-b-primary md:border-b-black/[0.05] md:border-l-primary' : 'hover:bg-primary/[0.05] hover:text-neutral-600'}`}
              onClick={() => setActiveTab('program')}
            >
              <i className="fas fa-list-check text-lg sm:text-base"></i>
              <span>Program</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-12 lg:p-10 md:p-8 sm:p-6 xs:p-4 min-h-[500px]">
            {activeTab === 'branding' && (
              <div className="animate-fadeIn">
                <EventBranding branding={branding} onChange={handleBrandingChange} />

                <div className="flex md:flex-col items-center md:items-stretch gap-4 mt-8 pt-8 border-t border-black/[0.08]">
                  <button
                    onClick={saveBranding}
                    className="inline-flex items-center justify-center gap-2 font-semibold rounded-[10px] cursor-pointer py-2.5 px-4.5 text-[0.875rem] transition-all whitespace-nowrap border-[1.5px] border-primary text-white bg-gradient-to-br from-primary to-orange-500 shadow-[0_2px_8px_rgba(255,107,53,0.2)] md:w-full hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(255,107,53,0.3)] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(255,107,53,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Branding'}
                  </button>
                  {saveMessage && (
                    <span className={`text-[0.95rem] font-semibold py-2 px-4 rounded-lg ${saveMessage.includes('success') ? 'text-emerald-600 bg-emerald-500/10 border border-emerald-500/25' : 'text-red-600 bg-red-500/10 border border-red-500/25'}`}>
                      {saveMessage}
                    </span>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'program' && (
              <div className="animate-fadeIn">
                <ProgramBuilder eventId={eventId} eventTitle={event.title} />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex md:flex-col-reverse justify-between items-center md:items-stretch gap-4 py-8 px-12 lg:px-10 md:p-6 sm:p-4 bg-primary/[0.02] border-t border-black/[0.08]">
            <button
              onClick={handleSkipSetup}
              className="inline-flex items-center justify-center gap-2 font-semibold rounded-[10px] cursor-pointer py-2.5 px-4.5 text-[0.875rem] transition-all whitespace-nowrap border-[1.5px] border-neutral-200 text-neutral-500 bg-white md:w-full hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(255,107,53,0.2)]"
            >
              Skip for Now
            </button>
            <button
              onClick={handleFinishSetup}
              className="inline-flex items-center justify-center gap-2 font-semibold rounded-[10px] cursor-pointer py-2.5 px-4.5 text-[0.875rem] transition-all whitespace-nowrap border-[1.5px] border-primary text-white bg-gradient-to-br from-primary to-orange-500 shadow-[0_2px_8px_rgba(255,107,53,0.2)] md:w-full hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(255,107,53,0.3)] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(255,107,53,0.2)]"
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
