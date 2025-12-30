// src/Components/OrganizerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '../Firebase/config';
import { useAuth } from '../context/AuthContext';

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
      <div className="min-h-screen bg-white">
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="logo">
              <span className="logo-icon"><i className="fas fa-comments"></i></span>
              <span className="logo-text">Ask Freely</span>
            </Link>
          </div>
        </nav>
        <div className="text-center py-16 px-8 text-neutral-500 text-xl">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
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

      <div className="max-w-[1400px] mx-auto pt-32 px-8 pb-16 md:px-8 sm:px-4 sm:pt-24 sm:pb-12">
        {/* Welcome Banner */}
        <div className="bg-primary/5 border border-black/10 px-10 py-8 rounded-[20px] mb-12 flex justify-between items-center flex-col md:flex-row gap-5 md:gap-0 md:items-center">
          <div className="flex items-center gap-6 flex-col md:flex-row md:items-center w-full md:w-auto">
            {userProfile?.logoUrl && (
              <div className="flex items-center justify-center">
                <img
                  src={userProfile.logoUrl}
                  alt={userProfile.organizationName}
                  className="w-20 h-20 rounded-xl object-cover border-2 border-black/10 shadow-[0_2px_8px_rgba(0,0,0,0.1)] md:w-20 md:h-20 sm:w-[60px] sm:h-[60px]"
                />
              </div>
            )}
            <div>
              <h2 className="text-black text-[2rem] mb-2 font-bold md:text-[2rem] sm:text-[1.4rem]">
                Welcome back, {userProfile?.organizationName || 'Organizer'}!
              </h2>
              <p className="text-neutral-500 text-base sm:text-[0.9rem]">
                Manage your Q&amp;A sessions and track engagement
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-7 py-3.5 bg-white border-2 border-black/10 text-neutral-900 rounded-[10px] font-semibold cursor-pointer transition-all font-sans flex items-center gap-2 hover:bg-neutral-100 hover:border-black/20 hover:-translate-y-px hover:text-black w-full md:w-auto justify-center md:justify-start"
          >
            Logout
          </button>
        </div>

        {/* Action Section */}
        <div className="mb-12 flex justify-between items-center flex-col md:flex-row gap-5 md:gap-0">
          <div className="flex items-center gap-4 flex-wrap justify-start">
            <h2 className="text-black text-[1.8rem] m-0 font-bold sm:text-[1.5rem]">My Events</h2>
            <span className="bg-primary/10 border border-primary/30 text-primary px-3.5 py-1.5 rounded-[20px] text-[0.9rem] font-semibold sm:text-[0.8rem] sm:px-2.5 sm:py-1">
              {events.length} {events.length === 1 ? 'Event' : 'Events'}
            </span>
          </div>
          <button
            onClick={handleCreateEvent}
            className="bg-primary text-white border-none px-8 py-4 rounded-xl text-base font-bold cursor-pointer transition-all font-sans flex items-center gap-3 shadow-[0_2px_8px_rgba(255,107,53,0.2)] hover:bg-orange-600 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(255,107,53,0.3)] w-full md:w-auto justify-center md:justify-start"
          >
            Create New Event
          </button>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6 lg:grid-cols-2 md:grid-cols-1 sm:gap-5">
          {events.length === 0 ? (
            <div className="col-span-full bg-primary/[0.03] border-2 border-dashed border-primary/20 rounded-[20px] py-20 px-12 text-center sm:py-12 sm:px-6">
              <div className="text-[4rem] mb-6 opacity-30">
                <i className="fa-solid fa-calendar-days"></i>
              </div>
              <h3 className="text-black text-[1.8em] mb-4 font-bold sm:text-[1.4em]">No events yet</h3>
              <p className="text-neutral-500 text-[1.1em] mb-8 leading-relaxed max-w-[500px] mx-auto sm:text-base">
                Create your first event to start collecting questions from your audience and manage Q&amp;A sessions like a pro.
              </p>
              <button
                onClick={handleCreateEvent}
                className="bg-primary text-white border-none px-10 py-4 rounded-xl text-[1.1rem] font-semibold cursor-pointer transition-all font-sans inline-flex items-center gap-3 shadow-[0_4px_12px_rgba(255,107,53,0.2)] hover:bg-orange-600 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(255,107,53,0.3)]"
              >
                Create Your First Event
              </button>
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="bg-white border border-black/[0.08] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all relative overflow-hidden flex flex-col group hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_8px_24px_rgba(255,107,53,0.12)] sm:rounded-xl"
              >
                {/* Top accent bar on hover */}
                <div className="absolute top-0 left-0 w-full h-1 bg-primary opacity-0 transition-opacity group-hover:opacity-100"></div>

                {/* Event Flyer Image */}
                {event.branding?.flyerUrl && (
                  <div className="w-full h-[200px] relative overflow-hidden bg-black/[0.02] sm:h-[160px]">
                    <img
                      src={event.branding.flyerUrl}
                      alt={event.title}
                      className="w-full h-full object-cover block transition-transform group-hover:scale-105"
                    />
                    <span
                      className={`absolute top-4 right-4 px-4 py-2 rounded-[20px] text-[0.85rem] font-bold uppercase tracking-wide backdrop-blur-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.15)] ${
                        event.status === 'published'
                          ? 'bg-emerald-500/90 text-white border border-emerald-500'
                          : 'bg-neutral-400/90 text-white border border-neutral-400'
                      }`}
                    >
                      {event.status === 'published' ? 'Active' : event.status === 'draft' ? 'Draft' : event.status}
                    </span>
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col sm:p-5">
                  <div className="flex justify-between items-start mb-4 gap-4 flex-col md:flex-row md:gap-3">
                    <div className="flex-1 flex items-start gap-4">
                      <div>
                        <h3 className="text-black text-[1.2rem] m-0 mb-2 leading-tight font-bold sm:text-[1.1rem]">
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-2 text-neutral-500 text-[0.9rem] mt-2 flex-wrap sm:text-[0.85rem]">
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
                      <span
                        className={`px-3.5 py-1.5 rounded-[20px] text-[0.8em] font-semibold whitespace-nowrap flex items-center gap-1.5 self-start md:self-auto ${
                          event.status === 'published'
                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-600'
                            : 'bg-black/5 border border-black/10 text-neutral-500'
                        }`}
                      >
                        {event.status === 'published' ? 'Active' : event.status === 'draft' ? 'Draft' : event.status}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 my-4 p-3.5 bg-primary/[0.03] border border-primary/[0.08] rounded-xl sm:gap-2 sm:p-3">
                    <div className="flex flex-col items-center p-1.5">
                      <span className="text-[1.75em] font-bold text-primary font-['Space_Grotesk','Poppins',sans-serif] leading-none sm:text-[1.5em]">
                        {event.questionCount || 0}
                      </span>
                      <span className="text-[0.7em] text-neutral-500 uppercase tracking-wide mt-1.5 font-semibold sm:text-[0.65em]">
                        Questions
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-1.5">
                      <span className="text-[1.75em] font-bold text-primary font-['Space_Grotesk','Poppins',sans-serif] leading-none sm:text-[1.5em]">
                        {event.strategicQuestions?.length || 0}
                      </span>
                      <span className="text-[0.7em] text-neutral-500 uppercase tracking-wide mt-1.5 font-semibold sm:text-[0.65em]">
                        Strategic
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleViewEvent(event.id)}
                      className="flex-1 bg-primary/[0.08] border border-primary/20 text-primary px-6 py-3.5 rounded-[10px] font-semibold cursor-pointer transition-all font-sans flex items-center justify-center gap-2 hover:bg-primary/15 hover:border-primary/40 hover:-translate-y-0.5 sm:px-5 sm:py-3 sm:text-[0.9rem]"
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
