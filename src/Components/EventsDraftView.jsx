// src/Components/EventsDraftView.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '../Firebase/config';
import { useAuth } from '../context/AuthContext';
import CreateEventModal from './CreateEventModal';

function EventsDraftView() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
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
          const draftEvents = Object.keys(data)
            .filter((key) => data[key]?.organizerId === currentUser.uid && data[key]?.status === 'draft')
            .map((key) => ({ id: key, ...data[key] }))
            .sort((a, b) => {
              const dateA = new Date(a.date || 0);
              const dateB = new Date(b.date || 0);
              return dateB - dateA;
            });
          setEvents(draftEvents);
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

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-5">
          <div className="w-10 h-10 border-4 border-neutral-200 border-t-primary rounded-full animate-spin"></div>
          <p className="text-neutral-500">Loading draft events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-10 gap-6 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-1.5 tracking-tight">Draft Events</h1>
          <p className="text-base text-neutral-500">Events that are not yet published</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white border-[1.5px] border-neutral-200 rounded-[10px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <button
              className={`px-4 py-2.5 border-none cursor-pointer transition-all text-base ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-br from-primary to-orange-500 text-white shadow-[0_2px_8px_rgba(255,107,53,0.25)]'
                  : 'bg-transparent text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <i className="fas fa-th"></i>
            </button>
            <button
              className={`px-4 py-2.5 border-none border-l border-neutral-200 cursor-pointer transition-all text-base ${
                viewMode === 'list'
                  ? 'bg-gradient-to-br from-primary to-orange-500 text-white shadow-[0_2px_8px_rgba(255,107,53,0.25)]'
                  : 'bg-transparent text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
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
        <div
          className={`animate-fade-in ${
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6'
              : 'flex flex-col gap-4'
          }`}
        >
          {events.map((event) => (
            <div
              key={event.id}
              className={`bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] cursor-pointer transition-all border border-black/[0.04] relative hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(0,0,0,0.08),0_4px_8px_rgba(0,0,0,0.04)] hover:border-primary/20 group ${
                viewMode === 'list' ? 'flex flex-col md:flex-row' : ''
              }`}
              onClick={() => navigate(`/organizer/event/${event.id}`)}
            >
              {/* Top accent line on hover */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-[1]"></div>

              {event.flyerUrl && (
                <div
                  className={`overflow-hidden bg-gradient-to-br from-primary to-orange-500 ${
                    viewMode === 'list' ? 'w-full md:w-[200px] h-[200px] md:h-auto md:min-h-[160px] flex-shrink-0' : 'w-full h-[200px]'
                  }`}
                >
                  <img src={event.flyerUrl} alt={event.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className={`p-7 ${viewMode === 'list' ? 'flex-1 flex flex-col' : ''}`}>
                <div className="flex items-start justify-between gap-4 mb-4 flex-col md:flex-row">
                  <h3 className="text-lg font-bold text-neutral-900 flex-1 line-clamp-2 tracking-tight leading-snug">
                    {event.title}
                  </h3>
                  <span className="px-3.5 py-2 rounded-[10px] text-xs font-bold whitespace-nowrap flex items-center gap-1.5 uppercase tracking-wide shadow-[0_2px_4px_rgba(0,0,0,0.05)] bg-gradient-to-br from-amber-500/15 to-amber-600/10 text-orange-700 border border-amber-500/20">
                    <i className="fas fa-circle text-[8px] text-amber-500"></i> Draft
                  </span>
                </div>
                <p className="flex items-center gap-2.5 text-sm text-neutral-500 mb-5 font-medium">
                  <i className="far fa-calendar text-primary text-base"></i> {getEventDisplayDate(event)}
                </p>
                <div className={`flex items-center gap-7 pt-5 border-t border-neutral-200 flex-col md:flex-row md:items-center ${viewMode === 'list' ? 'mt-auto' : ''}`}>
                  <div className="flex items-center gap-2 text-sm text-neutral-500 font-semibold">
                    <i className="fas fa-question-circle text-neutral-400 text-base"></i>
                    <span>{event.questionCount || 0} Questions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-500 font-semibold">
                    <i className="fas fa-check-circle text-neutral-400 text-base"></i>
                    <span>{event.answeredCount || 0} Answered</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border border-black/[0.04]">
          <i className="fas fa-file-alt text-6xl text-neutral-300 mb-5 opacity-60"></i>
          <h3 className="text-xl font-bold text-neutral-900 mb-2 tracking-tight">No Draft Events</h3>
          <p className="text-base text-neutral-500 mb-7 max-w-[400px]">All your events are published</p>
          <button
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-sm font-semibold cursor-pointer transition-all bg-white text-neutral-700 border-[1.5px] border-neutral-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:bg-neutral-50 hover:border-neutral-300 hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.08)]"
            onClick={() => navigate('/organizer/events/all')}
          >
            <i className="fas fa-list"></i> View All Events
          </button>
        </div>
      )}

      {/* Create Event Modal */}
      <CreateEventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

export default EventsDraftView;
