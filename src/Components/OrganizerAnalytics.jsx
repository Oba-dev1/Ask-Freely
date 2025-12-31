// src/Components/OrganizerAnalytics.jsx
import React, { useEffect, useState, useMemo } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../Firebase/config";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function OrganizerAnalytics() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [allQuestions, setAllQuestions] = useState({});
  const [loading, setLoading] = useState(true);

  // Load events first
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
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error loading events:", error);
        setEvents([]);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeEvents();
    };
  }, [currentUser]);

  // Load questions for each event individually (respects Firebase rules)
  useEffect(() => {
    if (events.length === 0) {
      setAllQuestions({});
      setLoading(false);
      return;
    }

    const unsubscribers = [];
    const questionsData = {};

    events.forEach((event, index) => {
      const questionsRef = ref(database, `questions/${event.id}`);
      const unsubscribe = onValue(
        questionsRef,
        (snapshot) => {
          const data = snapshot.val();
          questionsData[event.id] = data || {};
          setAllQuestions({ ...questionsData });

          // Set loading to false after all events have been processed
          if (index === events.length - 1) {
            setLoading(false);
          }
        },
        (error) => {
          console.error(`Error loading questions for event ${event.id}:`, error);
          questionsData[event.id] = {};
          setAllQuestions({ ...questionsData });

          if (index === events.length - 1) {
            setLoading(false);
          }
        }
      );
      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [events]);

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
      <div className="animate-fade-in pb-6 md:pb-12 max-w-full overflow-x-hidden w-full">
        <div className="flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px] gap-4 md:gap-6 px-4">
          <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-neutral-200 border-t-primary rounded-full animate-spin"></div>
          <p className="text-neutral-500 text-sm md:text-base">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="animate-fade-in pb-6 md:pb-12 max-w-full overflow-x-hidden w-full">
        <div className="flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px] gap-4 md:gap-6 px-4 text-center">
          <i className="fas fa-chart-bar text-5xl md:text-7xl text-neutral-200"></i>
          <h2 className="text-xl md:text-2xl font-bold text-neutral-700 m-0">No Analytics Yet</h2>
          <p className="text-neutral-500 text-sm md:text-base m-0">Create your first event to start seeing analytics</p>
          <button
            className="inline-flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-[10px] text-xs md:text-sm font-semibold cursor-pointer transition-all bg-gradient-to-br from-primary to-orange-500 text-white shadow-[0_2px_8px_rgba(255,107,53,0.2)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(255,107,53,0.3)]"
            onClick={() => navigate('/organizer/events/all')}
          >
            <i className="fas fa-plus"></i> Create Event
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-6 md:pb-12 max-w-full overflow-x-hidden w-full">
      {/* Page Header */}
      <header className="mb-6 md:mb-10">
        <h1 className="text-2xl md:text-4xl font-bold text-neutral-900 mb-1.5 tracking-tight">Analytics Overview</h1>
        <p className="text-sm md:text-base text-neutral-500">Performance metrics across all your events</p>
      </header>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3 md:gap-6 mb-6 md:mb-10 max-w-full">
        {/* Total Events */}
        <div className="bg-white border border-black/[0.06] rounded-xl md:rounded-2xl p-4 md:p-7 flex items-start gap-3 md:gap-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:shadow-medium hover:-translate-y-0.5 overflow-hidden">
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl flex items-center justify-center text-xl md:text-3xl flex-shrink-0 bg-gradient-to-br from-primary/15 to-primary/[0.08] text-primary">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs md:text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-1 md:mb-2">Total Events</p>
            <h2 className="text-2xl md:text-4xl font-bold text-neutral-900 mb-1 md:mb-2 leading-none">{stats.totalEvents}</h2>
            <p className="text-xs md:text-sm text-neutral-500 flex flex-wrap gap-1 md:gap-2">
              <span className="inline-flex items-center px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md font-semibold text-[10px] md:text-xs bg-emerald-500/10 text-emerald-700">{stats.activeEvents} Active</span>
              <span className="inline-flex items-center px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md font-semibold text-[10px] md:text-xs bg-amber-500/10 text-amber-700">{stats.draftEvents} Drafts</span>
              {stats.archivedEvents > 0 && (
                <span className="inline-flex items-center px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md font-semibold text-[10px] md:text-xs bg-neutral-500/10 text-neutral-600">{stats.archivedEvents} Archived</span>
              )}
            </p>
          </div>
        </div>

        {/* Total Questions */}
        <div className="bg-white border border-black/[0.06] rounded-xl md:rounded-2xl p-4 md:p-7 flex items-start gap-3 md:gap-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:shadow-medium hover:-translate-y-0.5 overflow-hidden">
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl flex items-center justify-center text-xl md:text-3xl flex-shrink-0 bg-gradient-to-br from-blue-500/15 to-blue-500/[0.08] text-blue-500">
            <i className="fas fa-question-circle"></i>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs md:text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-1 md:mb-2">Total Questions</p>
            <h2 className="text-2xl md:text-4xl font-bold text-neutral-900 mb-1 md:mb-2 leading-none">{stats.totalQuestions}</h2>
            <p className="text-xs md:text-sm text-neutral-500">{stats.avgQuestionsPerEvent.toFixed(1)} avg per event</p>
          </div>
        </div>

        {/* Answer Rate */}
        <div className="bg-white border border-black/[0.06] rounded-xl md:rounded-2xl p-4 md:p-7 flex items-start gap-3 md:gap-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:shadow-medium hover:-translate-y-0.5 overflow-hidden">
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl flex items-center justify-center text-xl md:text-3xl flex-shrink-0 bg-gradient-to-br from-emerald-500/15 to-emerald-500/[0.08] text-emerald-500">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs md:text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-1 md:mb-2">Answer Rate</p>
            <h2 className="text-2xl md:text-4xl font-bold text-neutral-900 mb-1 md:mb-2 leading-none">{stats.answerRate.toFixed(1)}%</h2>
            <p className="text-xs md:text-sm text-neutral-500">{stats.totalAnswered} of {stats.totalQuestions} answered</p>
          </div>
        </div>

        {/* Anonymous Rate */}
        <div className="bg-white border border-black/[0.06] rounded-xl md:rounded-2xl p-4 md:p-7 flex items-start gap-3 md:gap-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:shadow-medium hover:-translate-y-0.5 overflow-hidden">
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl flex items-center justify-center text-xl md:text-3xl flex-shrink-0 bg-gradient-to-br from-violet-500/15 to-violet-500/[0.08] text-violet-500">
            <i className="fas fa-user-secret"></i>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs md:text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-1 md:mb-2 truncate">Anonymous Questions</p>
            <h2 className="text-2xl md:text-4xl font-bold text-neutral-900 mb-1 md:mb-2 leading-none">{stats.anonymousRate.toFixed(1)}%</h2>
            <p className="text-xs md:text-sm text-neutral-500">{stats.totalAnonymous} of {stats.totalQuestions} questions</p>
          </div>
        </div>
      </div>

      {/* Question Sources Breakdown */}
      <div className="bg-white border border-black/[0.06] rounded-xl md:rounded-2xl p-4 md:p-8 mb-4 md:mb-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col max-w-full overflow-hidden">
        <h3 className="text-base md:text-xl font-bold text-neutral-900 mb-4 md:mb-6 flex items-center gap-2 md:gap-2.5">
          <i className="fas fa-users text-primary text-sm md:text-base"></i> Question Sources
        </h3>
        <div className="flex flex-col gap-3 md:gap-5">
          <div className="flex flex-col gap-1.5 md:gap-2.5">
            <div className="h-6 md:h-8 bg-neutral-100 rounded-lg overflow-hidden relative">
              <div
                className="h-full rounded-lg transition-all duration-500 bg-gradient-to-r from-primary to-orange-500"
                style={{ width: `${stats.totalQuestions > 0 ? (stats.totalOrganizer / stats.totalQuestions) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-neutral-700 text-xs md:text-sm flex items-center gap-1.5 md:gap-2">
                <i className="fas fa-star w-4 md:w-5 text-center text-sm md:text-base"></i> <span className="md:hidden">Strategic</span><span className="hidden md:inline">Strategic (Organizer)</span>
              </span>
              <span className="font-bold text-base md:text-lg text-neutral-900">{stats.totalOrganizer}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 md:gap-2.5">
            <div className="h-6 md:h-8 bg-neutral-100 rounded-lg overflow-hidden relative">
              <div
                className="h-full rounded-lg transition-all duration-500 bg-gradient-to-r from-blue-500 to-blue-600"
                style={{ width: `${stats.totalQuestions > 0 ? (stats.totalAudience / stats.totalQuestions) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-neutral-700 text-xs md:text-sm flex items-center gap-1.5 md:gap-2">
                <i className="fas fa-users w-4 md:w-5 text-center text-sm md:text-base"></i> Audience
              </span>
              <span className="font-bold text-base md:text-lg text-neutral-900">{stats.totalAudience}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 md:gap-2.5">
            <div className="h-6 md:h-8 bg-neutral-100 rounded-lg overflow-hidden relative">
              <div
                className="h-full rounded-lg transition-all duration-500 bg-gradient-to-r from-violet-500 to-purple-600"
                style={{ width: `${stats.totalQuestions > 0 ? (stats.totalAnonymous / stats.totalQuestions) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-neutral-700 text-xs md:text-sm flex items-center gap-1.5 md:gap-2">
                <i className="fas fa-user-secret w-4 md:w-5 text-center text-sm md:text-base"></i> Anonymous
              </span>
              <span className="font-bold text-base md:text-lg text-neutral-900">{stats.totalAnonymous}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Events */}
      {topEvents.length > 0 && (
        <div className="bg-white border border-black/[0.06] rounded-xl md:rounded-2xl p-4 md:p-8 mb-4 md:mb-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col max-w-full overflow-hidden">
          <h3 className="text-base md:text-xl font-bold text-neutral-900 mb-4 md:mb-6 flex items-center gap-2 md:gap-2.5">
            <i className="fas fa-trophy text-primary text-sm md:text-base"></i> Top Performing Events
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3 md:gap-5">
            {topEvents.map((event, index) => (
              <div
                key={event.id}
                className="bg-gradient-to-br from-neutral-50 to-white border border-black/[0.06] rounded-lg md:rounded-xl p-3 md:p-6 cursor-pointer transition-all relative hover:shadow-medium hover:-translate-y-0.5 hover:border-primary/30 overflow-hidden"
                onClick={() => navigate(`/organizer/event/${event.id}`)}
              >
                <div className="absolute top-2 md:top-4 right-2 md:right-4 w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-primary to-orange-500 rounded-full flex items-center justify-center font-bold text-xs md:text-sm text-white">
                  #{index + 1}
                </div>
                <div className="mb-2 md:mb-4 pr-8 md:pr-10">
                  <h4 className="text-sm md:text-lg font-bold text-neutral-900 mb-1 md:mb-2 leading-tight break-words">{event.title}</h4>
                  <span
                    className={`inline-block px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md text-[10px] md:text-xs font-semibold capitalize ${
                      event.status === 'published'
                        ? 'bg-emerald-500/10 text-emerald-700'
                        : event.status === 'draft'
                        ? 'bg-amber-500/10 text-amber-700'
                        : 'bg-neutral-500/10 text-neutral-600'
                    }`}
                  >
                    {event.status}
                  </span>
                </div>
                <div className="flex flex-col gap-1 md:gap-2">
                  <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-neutral-500">
                    <i className="fas fa-question-circle text-primary w-3 md:w-4"></i>
                    <span>{event.totalQuestions} Questions</span>
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-neutral-500">
                    <i className="fas fa-check-circle text-primary w-3 md:w-4"></i>
                    <span>{event.answerRate.toFixed(0)}% Answered</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Events Table */}
      <div className="bg-white border border-black/[0.06] rounded-xl md:rounded-2xl p-4 md:p-8 mb-4 md:mb-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col max-w-full overflow-hidden">
        <h3 className="text-base md:text-xl font-bold text-neutral-900 mb-4 md:mb-6 flex items-center gap-2 md:gap-2.5">
          <i className="fas fa-list text-primary text-sm md:text-base"></i> All Events Performance
        </h3>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto rounded-lg">
          <table className="w-full border-collapse text-sm min-w-[600px]">
            <thead className="bg-gradient-to-br from-neutral-50 to-neutral-100 border-b-2 border-neutral-200">
              <tr>
                <th className="p-4 text-left font-bold text-neutral-700 text-xs uppercase tracking-wider">Event</th>
                <th className="p-4 text-left font-bold text-neutral-700 text-xs uppercase tracking-wider">Status</th>
                <th className="p-4 text-left font-bold text-neutral-700 text-xs uppercase tracking-wider">Date</th>
                <th className="p-4 text-center font-bold text-neutral-700 text-xs uppercase tracking-wider">Questions</th>
                <th className="p-4 text-center font-bold text-neutral-700 text-xs uppercase tracking-wider">Answered</th>
                <th className="p-4 text-center font-bold text-neutral-700 text-xs uppercase tracking-wider">Answer Rate</th>
                <th className="p-4 text-center font-bold text-neutral-700 text-xs uppercase tracking-wider">Anonymous</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {eventAnalytics.map(event => (
                <tr
                  key={event.id}
                  onClick={() => navigate(`/organizer/event/${event.id}`)}
                  className="border-b border-neutral-100 cursor-pointer transition-all hover:bg-gradient-to-r hover:from-primary/[0.03] hover:to-primary/[0.01]"
                >
                  <td className="p-5 text-neutral-700">
                    <div className="max-w-[300px]">
                      <span className="font-semibold text-neutral-900 block">{event.title}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <span
                      className={`inline-block px-3 py-1.5 rounded-md text-xs font-semibold capitalize ${
                        event.status === 'published'
                          ? 'bg-emerald-500/10 text-emerald-700'
                          : event.status === 'draft'
                          ? 'bg-amber-500/10 text-amber-700'
                          : 'bg-neutral-500/10 text-neutral-600'
                      }`}
                    >
                      {event.status === 'published' ? 'Active' : event.status}
                    </span>
                  </td>
                  <td className="p-5 text-neutral-500 text-sm">
                    {event.date ? new Date(event.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'TBA'}
                  </td>
                  <td className="p-5 text-center font-semibold text-neutral-900">
                    <strong>{event.totalQuestions}</strong>
                  </td>
                  <td className="p-5 text-center font-semibold">
                    <span className="text-emerald-500 font-bold">{event.answered}</span>
                    <span className="text-neutral-400 font-medium ml-0.5">/ {event.totalQuestions}</span>
                  </td>
                  <td className="p-5 text-center">
                    <div className="flex items-center gap-3 justify-center">
                      <div className="w-20 h-2 bg-neutral-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded transition-all"
                          style={{ width: `${event.answerRate}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-sm text-neutral-700 min-w-[42px]">{event.answerRate.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="p-5 text-center font-semibold text-neutral-900">
                    {event.anonymous}
                  </td>
                  <td className="p-5 text-right">
                    <button className="bg-gradient-to-br from-primary/[0.08] to-primary/[0.04] border border-primary/20 text-primary w-9 h-9 rounded-lg inline-flex items-center justify-center cursor-pointer transition-all hover:bg-primary hover:text-white hover:translate-x-0.5">
                      <i className="fas fa-arrow-right"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col gap-3">
          {eventAnalytics.map(event => (
            <div
              key={event.id}
              onClick={() => navigate(`/organizer/event/${event.id}`)}
              className="bg-gradient-to-br from-neutral-50 to-white border border-black/[0.06] rounded-lg p-3 cursor-pointer transition-all hover:shadow-md hover:border-primary/30 overflow-hidden"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm font-bold text-neutral-900 leading-tight break-words flex-1 min-w-0">{event.title}</h4>
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize flex-shrink-0 ${
                    event.status === 'published'
                      ? 'bg-emerald-500/10 text-emerald-700'
                      : event.status === 'draft'
                      ? 'bg-amber-500/10 text-amber-700'
                      : 'bg-neutral-500/10 text-neutral-600'
                  }`}
                >
                  {event.status === 'published' ? 'Active' : event.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="text-center">
                  <p className="text-[10px] text-neutral-500 uppercase mb-0.5">Questions</p>
                  <p className="text-sm font-bold text-neutral-900">{event.totalQuestions}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-neutral-500 uppercase mb-0.5">Answered</p>
                  <p className="text-sm font-bold">
                    <span className="text-emerald-500">{event.answered}</span>
                    <span className="text-neutral-400">/{event.totalQuestions}</span>
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-neutral-500 uppercase mb-0.5">Anonymous</p>
                  <p className="text-sm font-bold text-neutral-900">{event.anonymous}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-neutral-100 rounded overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded transition-all"
                    style={{ width: `${event.answerRate}%` }}
                  ></div>
                </div>
                <span className="text-xs font-bold text-neutral-700">{event.answerRate.toFixed(0)}%</span>
                <i className="fas fa-chevron-right text-primary text-xs"></i>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OrganizerAnalytics;
