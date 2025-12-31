// src/Components/DashboardOverview.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ref, onValue, get } from 'firebase/database';
import { database } from '../Firebase/config';
import { useAuth } from '../context/AuthContext';
import CreateEventModal from './CreateEventModal';

function DashboardOverview() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    draftEvents: 0,
    totalQuestions: 0,
    answeredQuestions: 0,
    pendingQuestions: 0,
    totalEngagement: 0,
    recentActivity: []
  });

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Function to fetch questions for a specific event
  const fetchEventQuestions = useCallback(async (eventId) => {
    try {
      const questionsRef = ref(database, `questions/${eventId}`);
      const snapshot = await get(questionsRef);
      if (snapshot.exists()) {
        const questionsData = snapshot.val();
        const questionsArray = Object.values(questionsData);
        const total = questionsArray.length;
        const answered = questionsArray.filter(q => q.answered === true || q.status === 'answered').length;
        return { total, answered };
      }
      return { total: 0, answered: 0 };
    } catch (error) {
      console.error(`Error fetching questions for event ${eventId}:`, error);
      return { total: 0, answered: 0 };
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const eventsRef = ref(database, 'events');
    const unsubscribeEvents = onValue(
      eventsRef,
      async (snapshot) => {
        const data = snapshot.val();

        if (data) {
          const userEvents = Object.keys(data)
            .filter((key) => data[key]?.organizerId === currentUser.uid)
            .map((key) => ({ id: key, ...data[key] }));

          const totalEvents = userEvents.length;
          const activeEvents = userEvents.filter(e => e.status === 'published').length;
          const draftEvents = userEvents.filter(e => e.status === 'draft').length;

          // Fetch questions for all user events
          let totalQuestions = 0;
          let answeredQuestions = 0;
          const recentActivity = [];

          // Fetch questions for each event in parallel
          const questionPromises = userEvents.map(async (event) => {
            const { total, answered } = await fetchEventQuestions(event.id);
            return { eventId: event.id, total, answered };
          });

          const questionsResults = await Promise.all(questionPromises);

          // Create a map of event questions for easy lookup
          const eventQuestionsMap = {};
          questionsResults.forEach(result => {
            eventQuestionsMap[result.eventId] = result;
            totalQuestions += result.total;
            answeredQuestions += result.answered;
          });

          // Update events with question counts for display
          const eventsWithQuestions = userEvents.map(event => ({
            ...event,
            questionCount: eventQuestionsMap[event.id]?.total || 0,
            answeredCount: eventQuestionsMap[event.id]?.answered || 0
          }));

          setEvents(eventsWithQuestions);

          // Build recent activity
          eventsWithQuestions.forEach(event => {
            recentActivity.push({
              type: 'event',
              title: event.title,
              date: event.date || new Date().toISOString(),
              status: event.status,
              id: event.id
            });
          });

          recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date));

          const pendingQuestions = totalQuestions - answeredQuestions;
          const totalEngagement = totalQuestions > 0
            ? Math.round((answeredQuestions / totalQuestions) * 100)
            : 0;

          setStats({
            totalEvents,
            activeEvents,
            draftEvents,
            totalQuestions,
            answeredQuestions,
            pendingQuestions,
            totalEngagement,
            recentActivity: recentActivity.slice(0, 5)
          });
        } else {
          setEvents([]);
          setStats({
            totalEvents: 0,
            activeEvents: 0,
            draftEvents: 0,
            totalQuestions: 0,
            answeredQuestions: 0,
            pendingQuestions: 0,
            totalEngagement: 0,
            recentActivity: []
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching events:', error);
        setLoading(false);
        setEvents([]);
        setStats({
          totalEvents: 0,
          activeEvents: 0,
          draftEvents: 0,
          totalQuestions: 0,
          answeredQuestions: 0,
          pendingQuestions: 0,
          totalEngagement: 0,
          recentActivity: []
        });
      }
    );

    return () => unsubscribeEvents();
  }, [currentUser, fetchEventQuestions]);

  const getRecentEvents = () => {
    return events
      .sort((a, b) => {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return dateB - dateA;
      })
      .slice(0, 3);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  const getEventDisplayDate = (event) => {
    if (!event) return 'N/A';
    if (event.date) {
      const dateStr = formatDate(event.date);
      return event.time ? `${dateStr} • ${event.time}` : dateStr;
    }
    return 'Date TBA';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-10 h-10 border-4 border-neutral-200 border-t-primary rounded-full animate-spin"></div>
        <p className="text-neutral-500 text-sm">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-ink mb-1 tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-neutral-500">Track engagement, monitor activity, and manage all your events in one place</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Events */}
        <div className="bg-white rounded-xl p-5 flex items-center gap-4 shadow-soft border border-black/[0.04] hover:-translate-y-0.5 hover:shadow-medium hover:border-primary/10 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xl flex-shrink-0">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div className="flex-1">
            <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-1">Total Events</p>
            <h3 className="text-2xl font-bold text-ink leading-none mb-1.5">{stats.totalEvents}</h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-600">{stats.activeEvents} Active</span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-600">{stats.draftEvents} Drafts</span>
            </div>
          </div>
        </div>

        {/* Total Questions */}
        <div className="bg-white rounded-xl p-5 flex items-center gap-4 shadow-soft border border-black/[0.04] hover:-translate-y-0.5 hover:shadow-medium hover:border-primary/10 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-xl flex-shrink-0">
            <i className="fas fa-question-circle"></i>
          </div>
          <div className="flex-1">
            <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-1">Total Questions</p>
            <h3 className="text-2xl font-bold text-ink leading-none mb-1.5">{stats.totalQuestions}</h3>
            <p className="text-xs text-neutral-500">Across all events</p>
          </div>
        </div>

        {/* Answered Questions */}
        <div className="bg-white rounded-xl p-5 flex items-center gap-4 shadow-soft border border-black/[0.04] hover:-translate-y-0.5 hover:shadow-medium hover:border-primary/10 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-xl flex-shrink-0">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="flex-1">
            <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-1">Answered</p>
            <h3 className="text-2xl font-bold text-ink leading-none mb-1.5">{stats.answeredQuestions}</h3>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-600">{stats.pendingQuestions} Pending</span>
            </div>
          </div>
        </div>

        {/* Engagement Rate */}
        <div className="bg-white rounded-xl p-5 flex items-center gap-4 shadow-soft border border-black/[0.04] hover:-translate-y-0.5 hover:shadow-medium hover:border-primary/10 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white text-xl flex-shrink-0">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="flex-1">
            <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-1">Engagement Rate</p>
            <h3 className="text-2xl font-bold text-ink leading-none mb-1.5">{stats.totalEngagement}%</h3>
            <p className="text-xs text-neutral-500">Questions answered</p>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Recent Events */}
        <div className="bg-white rounded-xl shadow-soft border border-black/[0.04] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 bg-gradient-to-b from-white to-neutral-50">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <i className="fas fa-clock text-primary text-lg"></i> Recent Events
            </h2>
            <Link
              to="/organizer/events/all"
              className="text-sm text-primary font-semibold flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-primary/10 hover:gap-2 transition-all"
            >
              View All <i className="fas fa-arrow-right text-xs"></i>
            </Link>
          </div>
          <div className="p-5">
            {getRecentEvents().length > 0 ? (
              <div className="flex flex-col gap-3">
                {getRecentEvents().map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-xl cursor-pointer hover:bg-white hover:border-primary hover:shadow-soft hover:translate-x-1 transition-all"
                    onClick={() => navigate(`/organizer/event/${event.id}`)}
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white text-lg">
                      {event.flyerUrl ? (
                        <img src={event.flyerUrl} alt={event.title} className="w-full h-full object-cover" />
                      ) : (
                        <i className="fas fa-calendar"></i>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-ink mb-1 line-clamp-1">{event.title}</h4>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          event.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {event.status === 'published' ? 'Active' : event.status === 'draft' ? 'Draft' : event.status}
                        </span>
                        <span className="text-xs text-neutral-500">{getEventDisplayDate(event)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-neutral-500">
                        <span className="flex items-center gap-1">
                          <i className="fas fa-question text-[10px]"></i> {event.questionCount || 0} questions
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="fas fa-check text-[10px]"></i> {event.answeredCount || 0} answered
                        </span>
                      </div>
                    </div>
                    <div className="text-neutral-400 text-sm">
                      <i className="fas fa-chevron-right"></i>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <i className="fas fa-calendar-plus text-4xl text-neutral-300 mb-3"></i>
                <p className="text-neutral-500 text-sm mb-4">No events yet</p>
                <button
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border-[1.5px] border-neutral-200 text-neutral-700 rounded-lg text-sm font-semibold hover:bg-neutral-50 hover:border-neutral-300 hover:-translate-y-0.5 hover:shadow-soft transition-all"
                  onClick={() => setIsModalOpen(true)}
                >
                  Create Your First Event
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-soft border border-black/[0.04] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 bg-gradient-to-b from-white to-neutral-50">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <i className="fas fa-bolt text-primary text-lg"></i> Quick Actions
            </h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-3">
              <button
                className="flex flex-col items-center gap-3 p-5 bg-white border-[1.5px] border-neutral-200 rounded-xl cursor-pointer hover:border-primary hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(255,107,53,0.15)] transition-all group"
                onClick={() => setIsModalOpen(true)}
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white text-lg shadow-md">
                  <i className="fas fa-plus"></i>
                </div>
                <span className="text-sm font-semibold text-ink">Create Event</span>
              </button>

              <button
                className="flex flex-col items-center gap-3 p-5 bg-white border-[1.5px] border-neutral-200 rounded-xl cursor-pointer hover:border-primary hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(255,107,53,0.15)] transition-all group"
                onClick={() => navigate('/organizer/events/all')}
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-lg shadow-md">
                  <i className="fas fa-list"></i>
                </div>
                <span className="text-sm font-semibold text-ink">View All Events</span>
              </button>

              <button
                className="flex flex-col items-center gap-3 p-5 bg-white border-[1.5px] border-neutral-200 rounded-xl cursor-pointer hover:border-primary hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(255,107,53,0.15)] transition-all group"
                onClick={() => navigate('/organizer/analytics')}
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-lg shadow-md">
                  <i className="fas fa-chart-bar"></i>
                </div>
                <span className="text-sm font-semibold text-ink">View Analytics</span>
              </button>

              <button
                className="flex flex-col items-center gap-3 p-5 bg-white border-[1.5px] border-neutral-200 rounded-xl cursor-pointer hover:border-primary hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(255,107,53,0.15)] transition-all group"
                onClick={() => navigate('/organizer/settings')}
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-neutral-500 to-neutral-700 flex items-center justify-center text-white text-lg shadow-md">
                  <i className="fas fa-cog"></i>
                </div>
                <span className="text-sm font-semibold text-ink">Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      {stats.recentActivity.length > 0 && (
        <div className="bg-white rounded-xl shadow-soft border border-black/[0.04] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 bg-gradient-to-b from-white to-neutral-50">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <i className="fas fa-history text-primary text-lg"></i> Recent Activity
            </h2>
          </div>
          <div className="p-5">
            <div className="flex flex-col gap-3">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    activity.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink mb-0.5">{activity.title}</p>
                    <p className="text-xs text-neutral-500">{formatDate(activity.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      <CreateEventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

export default DashboardOverview;
