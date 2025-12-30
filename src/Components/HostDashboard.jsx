// src/Components/HostDashboard.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ref, onValue, update, get } from 'firebase/database';
import { database } from '../Firebase/config';
import QuestionItem from './QuestionItem';
import MCProgramView from './MCProgramView';
import OfflineBanner from './OfflineBanner';
import {
  generateAnalytics,
} from '../utils/exportutils';

const EMPTY_ANALYTICS = {
  summary: {
    total: 0,
    answered: 0,
    unanswered: 0,
    anonymous: 0,
    percentAnswered: 0,
    percentAnonymous: 0,
  },
  timeline: {
    firstQuestion: 'N/A',
    lastQuestion: 'N/A',
    duration: 'N/A',
  },
  topAuthors: [],
};

function fmtPct(n) {
  if (n == null || isNaN(n)) return '0%';
  return `${Math.round(n)}%`;
}

function compactTimeLabel(first, last) {
  // Expect ISO strings or 'N/A'
  if (!first || !last || first === 'N/A' || last === 'N/A') return null;
  try {
    const t1 = new Date(first);
    const t2 = new Date(last);
    const toHHMM = (d) =>
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `Started ${toHHMM(t1)} • Last ${toHHMM(t2)}`;
  } catch {
    return null;
  }
}

export default function HostDashboard() {
  const { eventId } = useParams();

  const [event, setEvent] = useState(null);
  const [organizerProfile, setOrganizerProfile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [analytics, setAnalytics] = useState(EMPTY_ANALYTICS);
  const [notification, setNotification] = useState(null);

  const questionsPath = useMemo(
    () => (eventId ? `questions/${eventId}` : 'questions'),
    [eventId]
  );

  // Load event details
  useEffect(() => {
    if (!eventId) return;

    const eventRef = ref(database, `events/${eventId}`);
    const unsubscribe = onValue(eventRef, async (snap) => {
      const data = snap.val();
      if (data) {
        setEvent(data);

        // Load organizer profile if organizerId exists
        if (data.organizerId) {
          try {
            const userRef = ref(database, `users/${data.organizerId}`);
            const userSnap = await get(userRef);
            if (userSnap.exists()) {
              setOrganizerProfile(userSnap.val());
            }
          } catch (error) {
            console.error('Error loading organizer profile:', error);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [eventId]);

  useEffect(() => {
    const questionsRef = ref(database, questionsPath);
    const unsubscribe = onValue(
      questionsRef,
      (snap) => {
        const data = snap.val();
        if (data) {
          const list = Object.keys(data).map((id) => ({ id, ...data[id] }));
          setQuestions(list);
          setAnalytics(generateAnalytics(list) || EMPTY_ANALYTICS);
        } else {
          setQuestions([]);
          setAnalytics(EMPTY_ANALYTICS);
        }
        setIsConnected(true);
        setLastUpdate(new Date());
      },
      (err) => {
        console.error('Error loading questions:', err);
        setIsConnected(false);
      }
    );
    return () => unsubscribe();
  }, [questionsPath]);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const toggleAnswered = useCallback(
    async (id, currentStatus) => {
      try {
        const qRef = ref(
          database,
          eventId ? `questions/${eventId}/${id}` : `questions/${id}`
        );
        await update(qRef, { answered: !currentStatus });
        showNotification(
          currentStatus ? 'Question marked as unanswered' : 'Question marked as answered',
          'success'
        );
      } catch (err) {
        console.error('Error updating question:', err);
        showNotification('Failed to update question. Please try again.', 'error');
      }
    },
    [eventId, showNotification]
  );

  const filteredQuestions = useMemo(() => {
    let list = questions;
    switch (filter) {
      case 'answered':
        list = questions.filter((q) => q.answered);
        break;
      case 'unanswered':
        list = questions.filter((q) => !q.answered);
        break;
      case 'organizer':
        list = questions.filter((q) => q.source === 'organizer');
        break;
      case 'audience':
        list = questions.filter((q) => q.source === 'audience');
        break;
      default:
        list = questions;
    }
    return [...list].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [questions, filter]);

  const durationNote = compactTimeLabel(
    analytics.timeline?.firstQuestion,
    analytics.timeline?.lastQuestion
  );

  return (
    <div className="min-h-screen bg-white">
      <OfflineBanner />
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="logo">
            <span className="logo-icon"><i className="fas fa-comments"></i></span>
            <span className="logo-text">Ask Freely</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto pt-[clamp(5rem,6vw,8rem)] px-[clamp(1rem,3vw,2rem)] pb-16 md:pt-[5.5rem] md:px-4 md:pb-12">
        {/* Event Branding Header */}
        {event && event.branding && (organizerProfile?.logoUrl || event.branding.organizationName) && (
          <div className="bg-white border border-black/[0.08] rounded-2xl p-6 px-8 mt-6 mb-10 flex items-center gap-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] md:p-5 md:px-6 md:gap-5 sm:flex-col sm:items-start sm:p-4 sm:px-5">
            {organizerProfile?.logoUrl && (
              <img
                src={organizerProfile.logoUrl}
                alt="Organization logo"
                className="w-[70px] h-[70px] object-contain rounded-xl bg-primary/5 p-3 border-2 border-primary/30 flex-shrink-0 md:w-[60px] md:h-[60px] sm:w-[50px] sm:h-[50px]"
              />
            )}
            <div className="flex-1 min-w-0">
              {event.branding.organizationName && (
                <p className="m-0 mb-2 text-[0.85rem] font-bold text-neutral-500 uppercase tracking-wide md:text-[0.8rem] sm:text-[0.75rem]">
                  {event.branding.organizationName}
                </p>
              )}
              <h2 className="m-0 mb-1.5 text-[1.4rem] font-bold text-neutral-900 leading-tight md:text-[1.2rem] sm:text-[1.1rem]">
                {event.title || 'Event'}
              </h2>
              {event.date && (
                <p className="m-0 text-[0.95rem] text-neutral-500 font-medium md:text-[0.9rem]">
                  {event.date}{event.time ? ` • ${event.time}` : ''}
                </p>
              )}
            </div>
          </div>
        )}

        <header className="mb-8">
          <h1 className="text-[clamp(1.5rem,2.5vw,2.5rem)] text-neutral-900 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 m-0 font-bold">
            <span>Host Dashboard</span>
            {eventId ? (
              <span className="inline-flex items-center px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-primary/10 text-primary border border-primary/20 max-w-full overflow-hidden">
                <span className="truncate">Event: {eventId}</span>
              </span>
            ) : null}
          </h1>
          <p className="text-neutral-500 mt-2">Manage questions in real-time</p>
        </header>

        {/* Program View */}
        {eventId && event && (
          <MCProgramView eventId={eventId} eventTitle={event.title || 'Event'} />
        )}

        <div className="bg-white border border-black/[0.08] rounded-[20px] p-[clamp(1.25rem,3vw,2.5rem)] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-[1fr_auto] items-center gap-4 mb-8 pb-5 border-b border-black/[0.08] md:grid-cols-1">
            <h2 className="text-[clamp(1.25rem,2.5vw,1.8rem)] text-neutral-900 flex items-center gap-3 m-0 font-bold">
              Submitted Questions
            </h2>
            <div className="flex items-center gap-4 flex-wrap justify-end md:justify-start">
              <div className="bg-primary/10 border border-primary/25 text-primary px-5 py-2.5 rounded-[20px] font-semibold inline-flex items-center gap-2">
                <span className="text-[1.1em] font-['Poppins',sans-serif]">{questions.length}</span> questions
              </div>
            </div>
          </div>

          {/* Analytics — Cards */}
          <section className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-[clamp(0.75rem,2vw,1.5rem)] mb-12 lg:grid-cols-2 md:grid-cols-1">
            {/* Answered */}
            <div className="bg-white border border-black/[0.08] rounded-2xl p-[clamp(1rem,2.5vw,1.75rem)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all relative overflow-hidden group hover:bg-primary/[0.02] hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,107,53,0.12)]">
              <div className="absolute inset-x-0 top-0 h-[3px] bg-primary opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="flex justify-between items-center gap-3 mb-4">
                <span className="text-neutral-500 text-sm font-semibold uppercase tracking-wide flex-1">Answered</span>
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-xl flex-shrink-0 bg-emerald-500/10 text-emerald-500">
                  <i className="fas fa-check-circle" aria-hidden="true"></i>
                </div>
              </div>
              <div className="text-[clamp(1.75rem,3.2vw,2.5rem)] font-bold text-neutral-900 font-['Poppins',sans-serif] leading-none mb-1">
                {analytics.summary?.answered ?? 0}
              </div>
              <div className="text-neutral-500 text-sm min-h-[1.35rem]">
                <span className="text-emerald-500 font-semibold">
                  {fmtPct(analytics.summary?.percentAnswered)}
                </span>{' '}
                of total
              </div>
            </div>

            {/* Unanswered */}
            <div className="bg-white border border-black/[0.08] rounded-2xl p-[clamp(1rem,2.5vw,1.75rem)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all relative overflow-hidden group hover:bg-primary/[0.02] hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,107,53,0.12)]">
              <div className="absolute inset-x-0 top-0 h-[3px] bg-primary opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="flex justify-between items-center gap-3 mb-4">
                <span className="text-neutral-500 text-sm font-semibold uppercase tracking-wide flex-1">Unanswered</span>
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-xl flex-shrink-0 bg-amber-500/10 text-amber-500">
                  <i className="fas fa-question-circle" aria-hidden="true"></i>
                </div>
              </div>
              <div className="text-[clamp(1.75rem,3.2vw,2.5rem)] font-bold text-neutral-900 font-['Poppins',sans-serif] leading-none mb-1">
                {analytics.summary?.unanswered ?? 0}
              </div>
              <div className="text-neutral-500 text-sm min-h-[1.35rem]">
                <span className="text-neutral-500">Remaining in queue</span>
              </div>
            </div>

            {/* Anonymous */}
            <div className="bg-white border border-black/[0.08] rounded-2xl p-[clamp(1rem,2.5vw,1.75rem)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all relative overflow-hidden group hover:bg-primary/[0.02] hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,107,53,0.12)]">
              <div className="absolute inset-x-0 top-0 h-[3px] bg-primary opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="flex justify-between items-center gap-3 mb-4">
                <span className="text-neutral-500 text-sm font-semibold uppercase tracking-wide flex-1">Anonymous</span>
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-xl flex-shrink-0 bg-blue-500/10 text-blue-500">
                  <i className="fas fa-user-secret" aria-hidden="true"></i>
                </div>
              </div>
              <div className="text-[clamp(1.75rem,3.2vw,2.5rem)] font-bold text-neutral-900 font-['Poppins',sans-serif] leading-none mb-1">
                {analytics.summary?.anonymous ?? 0}
              </div>
              <div className="text-neutral-500 text-sm min-h-[1.35rem]">
                <span className="text-emerald-500 font-semibold">
                  {fmtPct(analytics.summary?.percentAnonymous)}
                </span>{' '}
                of submissions
              </div>
            </div>

            {/* Session Duration */}
            <div className="bg-white border border-black/[0.08] rounded-2xl p-[clamp(1rem,2.5vw,1.75rem)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all relative overflow-hidden group hover:bg-primary/[0.02] hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,107,53,0.12)]">
              <div className="absolute inset-x-0 top-0 h-[3px] bg-primary opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="flex justify-between items-center gap-3 mb-4">
                <span className="text-neutral-500 text-sm font-semibold uppercase tracking-wide flex-1">Session Duration</span>
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-xl flex-shrink-0 bg-primary/10 text-primary">
                  <i className="fas fa-clock" aria-hidden="true"></i>
                </div>
              </div>
              <div className="text-[2rem] font-bold text-neutral-900 font-['Poppins',sans-serif] leading-none mb-1">
                {analytics.timeline?.duration || 'N/A'}
              </div>
              {durationNote && (
                <div className="text-neutral-500 text-sm min-h-[1.35rem]">{durationNote}</div>
              )}
            </div>
          </section>

          {/* Filters */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <button
              className={`px-4 py-2.5 border rounded-[10px] cursor-pointer font-semibold transition-all font-sans inline-flex items-center gap-2 text-[0.95rem] ${
                filter === 'all'
                  ? 'bg-primary text-white border-transparent shadow-[0_4px_15px_rgba(255,107,53,0.25)]'
                  : 'border-black/10 bg-black/[0.02] text-neutral-600 hover:bg-primary/[0.08] hover:border-primary/20 hover:text-neutral-900'
              }`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`px-4 py-2.5 border rounded-[10px] cursor-pointer font-semibold transition-all font-sans inline-flex items-center gap-2 text-[0.95rem] ${
                filter === 'organizer'
                  ? 'bg-primary text-white border-transparent shadow-[0_4px_15px_rgba(255,107,53,0.25)]'
                  : 'border-black/10 bg-black/[0.02] text-neutral-600 hover:bg-primary/[0.08] hover:border-primary/20 hover:text-neutral-900'
              }`}
              onClick={() => setFilter('organizer')}
            >
              <i className="fas fa-star" /> Strategic
            </button>
            <button
              className={`px-4 py-2.5 border rounded-[10px] cursor-pointer font-semibold transition-all font-sans inline-flex items-center gap-2 text-[0.95rem] ${
                filter === 'audience'
                  ? 'bg-primary text-white border-transparent shadow-[0_4px_15px_rgba(255,107,53,0.25)]'
                  : 'border-black/10 bg-black/[0.02] text-neutral-600 hover:bg-primary/[0.08] hover:border-primary/20 hover:text-neutral-900'
              }`}
              onClick={() => setFilter('audience')}
            >
              <i className="fas fa-users" /> Audience
            </button>
            <button
              className={`px-4 py-2.5 border rounded-[10px] cursor-pointer font-semibold transition-all font-sans inline-flex items-center gap-2 text-[0.95rem] ${
                filter === 'answered'
                  ? 'bg-primary text-white border-transparent shadow-[0_4px_15px_rgba(255,107,53,0.25)]'
                  : 'border-black/10 bg-black/[0.02] text-neutral-600 hover:bg-primary/[0.08] hover:border-primary/20 hover:text-neutral-900'
              }`}
              onClick={() => setFilter('answered')}
            >
              Answered
            </button>
            <button
              className={`px-4 py-2.5 border rounded-[10px] cursor-pointer font-semibold transition-all font-sans inline-flex items-center gap-2 text-[0.95rem] ${
                filter === 'unanswered'
                  ? 'bg-primary text-white border-transparent shadow-[0_4px_15px_rgba(255,107,53,0.25)]'
                  : 'border-black/10 bg-black/[0.02] text-neutral-600 hover:bg-primary/[0.08] hover:border-primary/20 hover:text-neutral-900'
              }`}
              onClick={() => setFilter('unanswered')}
            >
              Unanswered
            </button>
          </div>

          {/* Status */}
          <div className="grid grid-cols-[1fr_auto] gap-4 items-center mb-8 p-4 px-5 bg-primary/[0.02] border border-black/5 rounded-xl md:grid-cols-1 md:items-start">
            <div className="flex items-center">
              <span
                className={`text-[0.95em] font-semibold inline-flex items-center gap-2 ${
                  isConnected ? 'text-emerald-500' : 'text-red-500'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full animate-pulse ${
                    isConnected ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-red-500'
                  }`}
                />
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <span className="text-[0.9em] text-neutral-500 inline-flex items-center gap-2 justify-self-end md:justify-self-start">
              <i className="far fa-clock" /> Last updated:{' '}
              {lastUpdate.toLocaleTimeString()}
            </span>
          </div>

          {/* Questions */}
          <div className="grid gap-4">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-12 px-6 text-neutral-500">
                <i className="far fa-inbox text-5xl mb-4 opacity-25 block" />
                <p>No questions to display.</p>
              </div>
            ) : (
              filteredQuestions.map((q) => (
                <QuestionItem
                  key={q.id}
                  question={q}
                  onToggleAnswered={toggleAnswered}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-5 right-5 bg-white p-4 px-6 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center gap-3 z-[1000] animate-slideInRight max-w-[400px] ${
            notification.type === 'success' ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-red-500'
          }`}
        >
          <i
            className={`fas ${
              notification.type === 'success' ? 'fa-check-circle text-emerald-500' : 'fa-exclamation-circle text-red-500'
            } text-xl`}
          ></i>
          <span className="text-neutral-900 font-medium">{notification.message}</span>
        </div>
      )}
    </div>
  );
}
