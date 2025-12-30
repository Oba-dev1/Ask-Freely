// src/Components/CreateEvent.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ref, push, set, get } from 'firebase/database';
import { database } from '../Firebase/config'; // keep folder casing consistent with your project
import { useAuth } from '../context/AuthContext';

function CreateEvent() {
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    slug: ''
  });
  const [strategicQuestions, setStrategicQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    text: '',
    priority: 'medium',
    category: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleEventChange = (e) => {
    const { name, value } = e.target;
    setEventData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate slug from title
    if (name === 'title') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setEventData(prev => ({ ...prev, slug }));
    }
  };

  const handleQuestionChange = (e) => {
    const { name, value } = e.target;
    setCurrentQuestion(prev => ({ ...prev, [name]: value }));
  };

  const addStrategicQuestion = () => {
    if (!currentQuestion.text.trim()) {
      return setError('Question text is required');
    }
    setStrategicQuestions(prev => [...prev, { ...currentQuestion, id: Date.now() }]);
    setCurrentQuestion({ text: '', priority: 'medium', category: '', notes: '' });
    setError('');
  };

  const removeQuestion = (id) => {
    setStrategicQuestions(prev => prev.filter(q => q.id !== id));
  };

  /**
   * Create event helper
   * mode: 'draft' | 'publish'
   *  - draft  => status: 'draft',  acceptingQuestions: false
   *  - publish => status: 'active', acceptingQuestions: true
   */
  const createEvent = async (mode) => {
    if (!currentUser?.uid) {
      setError('You must be logged in to create an event.');
      return;
    }
    if (!eventData.title || !eventData.date) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const organizerName =
        (userProfile?.organizationName || '').trim() ||
        currentUser.email ||
        'Organizer';

      // Clean slug (from input or title), ensure not empty
      let slug =
        (eventData.slug || eventData.title)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || `event-${Date.now()}`;

      // Ensure slug uniqueness — if exists, append a short suffix
      const slugRef = ref(database, `slugs/${slug}`);
      const slugSnap = await get(slugRef);
      if (slugSnap.exists()) {
        slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
      }

      // Decide status + acceptingQuestions based on mode
      const status = mode === 'publish' ? 'active' : 'draft';
      const acceptingQuestions = mode === 'publish';

      // Create event
      const eventsRef = ref(database, 'events');
      const newEventRef = push(eventsRef);

      const eventPayload = {
        title: eventData.title,
        description: eventData.description || '',
        date: eventData.date,
        time: eventData.time || '',
        slug,
        organizerId: currentUser.uid,
        organizerName,
        status,                 // 'active' | 'draft'
        acceptingQuestions,     // true if publish, false if draft
        createdAt: new Date().toISOString(),
        questionCount: 0,
        strategicQuestions: strategicQuestions.map(q => ({
          text: q.text,
          priority: q.priority,
          category: q.category,
          notes: q.notes,
          source: 'organizer',
          author: organizerName,
          timestamp: new Date().toISOString(),
          answered: false
        }))
      };

      await set(newEventRef, eventPayload);

      // Write slug maps for participant link resolution
      // slugs/{slug} -> eventId
      await set(ref(database, `slugs/${slug}`), newEventRef.key);
      // eventSlugs/{eventId} -> slug
      await set(ref(database, `eventSlugs/${newEventRef.key}`), slug);

      // Seed strategic questions into questions/{eventId}
      if (strategicQuestions.length > 0) {
        const questionsRef = ref(database, `questions/${newEventRef.key}`);
        for (const q of strategicQuestions) {
          const qRef = push(questionsRef);
          await set(qRef, {
            question: q.text,
            source: 'organizer',
            author: organizerName,
            priority: q.priority,
            category: q.category,
            notes: q.notes,
            answered: false,
            timestamp: new Date().toISOString(),
            createdAt: Date.now()
          });
        }
      }

      navigate(`/organizer/event/${newEventRef.key}/setup`);
    } catch (err) {
      console.error(err);
      setError('Failed to create event: ' + (err?.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Default submit keeps previous behavior (Publish)
    await createEvent('publish');
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="logo">
            <span className="logo-icon"><i className="fas fa-comments"></i></span>
            <span className="logo-text">Ask Freely</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-[1000px] mx-auto px-0 animate-fadeIn">
        <div className="mb-8">
          <button
            onClick={() => navigate('/organizer/dashboard')}
            className="bg-white text-neutral-500 border-[1.5px] border-neutral-200 py-2.5 px-4.5 rounded-[10px] font-semibold text-[0.875rem] cursor-pointer transition-all inline-flex items-center gap-2 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-900 hover:-translate-x-0.5"
          >
            ← Back to Dashboard
          </button>
        </div>

        <header className="mb-10 pb-6 border-b border-neutral-200">
          <h1 className="m-0 mb-2 text-[2rem] font-bold tracking-tight text-neutral-900">Create New Event</h1>
          <p className="m-0 text-neutral-500 text-base">Set up your Q&amp;A session</p>
        </header>

        <div className="bg-white border border-black/[0.04] rounded-2xl p-10 md:p-8 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-600 py-3.5 px-4 rounded-xl mb-6 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Event Details */}
            <div className="mb-10 pb-8 border-b border-neutral-200 last:border-b-0 last:mb-0 last:pb-0">
              <h2 className="text-neutral-900 text-lg font-bold m-0 mb-3 tracking-tight">Event Details</h2>

              <div className="mb-5">
                <label htmlFor="title" className="block font-semibold mb-2 text-neutral-900 text-[0.875rem]">Event Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={eventData.title}
                  onChange={handleEventChange}
                  required
                  placeholder="e.g., Beyond the Vibes Singles Programme"
                  className="w-full py-3 px-4 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] transition-all placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
                />
              </div>

              <div className="mb-5">
                <label htmlFor="description" className="block font-semibold mb-2 text-neutral-900 text-[0.875rem]">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={eventData.description}
                  onChange={handleEventChange}
                  rows="3"
                  placeholder="Brief description of your event"
                  className="w-full py-3 px-4 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] transition-all min-h-[120px] resize-y leading-relaxed placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-1 gap-5">
                <div className="mb-5">
                  <label htmlFor="date" className="block font-semibold mb-2 text-neutral-900 text-[0.875rem]">Date *</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={eventData.date}
                    onChange={handleEventChange}
                    required
                    className="w-full py-3 px-4 pr-10 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] transition-all cursor-pointer focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
                  />
                </div>

                <div className="mb-5">
                  <label htmlFor="time" className="block font-semibold mb-2 text-neutral-900 text-[0.875rem]">Time</label>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    value={eventData.time}
                    onChange={handleEventChange}
                    className="w-full py-3 px-4 pr-10 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] transition-all cursor-pointer focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
                  />
                </div>
              </div>

              <div className="mb-5">
                <label htmlFor="slug" className="block font-semibold mb-2 text-neutral-900 text-[0.875rem]">Event URL Slug</label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={eventData.slug}
                  onChange={handleEventChange}
                  placeholder="auto-generated-from-title"
                  className="w-full py-3 px-4 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] transition-all placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
                />
                <small className="block mt-2 text-neutral-500 text-[0.8125rem] leading-relaxed">
                  Participant link will be: {window.location.origin}/p/{eventData.slug || 'your-slug'}
                </small>
              </div>
            </div>

            {/* Strategic Questions */}
            <div className="mb-10 pb-8 border-b border-neutral-200 last:border-b-0 last:mb-0 last:pb-0">
              <h2 className="text-neutral-900 text-lg font-bold m-0 mb-3 tracking-tight">Strategic Questions (Optional)</h2>
              <p className="text-neutral-500 mb-6 leading-relaxed text-[0.9375rem]">
                Pre-load questions to guide the discussion and ensure key topics are covered.
              </p>

              <div className="bg-neutral-50 border-[1.5px] border-neutral-200 p-6 rounded-xl mb-6">
                <div className="mb-5">
                  <label htmlFor="questionText" className="block font-semibold mb-2 text-neutral-900 text-[0.875rem]">Question</label>
                  <textarea
                    id="questionText"
                    name="text"
                    value={currentQuestion.text}
                    onChange={handleQuestionChange}
                    rows="3"
                    placeholder="Type your strategic question here..."
                    className="w-full py-3 px-4 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] transition-all min-h-[120px] resize-y leading-relaxed placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-1 gap-5">
                  <div className="mb-5">
                    <label htmlFor="priority" className="block font-semibold mb-2 text-neutral-900 text-[0.875rem]">Priority</label>
                    <select
                      id="priority"
                      name="priority"
                      value={currentQuestion.priority}
                      onChange={handleQuestionChange}
                      className="w-full py-3 px-4 pr-10 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg_xmlns=%27http://www.w3.org/2000/svg%27_width=%2712%27_height=%2712%27_viewBox=%270_0_12_12%27%3E%3Cpath_fill=%27%234F46E5%27_d=%27M6_9L1_4h10z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_14px_center] focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div className="mb-5">
                    <label htmlFor="category" className="block font-semibold mb-2 text-neutral-900 text-[0.875rem]">Category</label>
                    <input
                      type="text"
                      id="category"
                      name="category"
                      value={currentQuestion.category}
                      onChange={handleQuestionChange}
                      placeholder="e.g., Relationships"
                      className="w-full py-3 px-4 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] transition-all placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
                    />
                  </div>
                </div>

                <div className="mb-5">
                  <label htmlFor="notes" className="block font-semibold mb-2 text-neutral-900 text-[0.875rem]">Notes for MC (Optional)</label>
                  <input
                    type="text"
                    id="notes"
                    name="notes"
                    value={currentQuestion.notes}
                    onChange={handleQuestionChange}
                    placeholder="e.g., Use this to transition to panel discussion"
                    className="w-full py-3 px-4 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] transition-all placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
                  />
                </div>

                <button
                  type="button"
                  onClick={addStrategicQuestion}
                  className="inline-flex items-center justify-center gap-2 font-semibold rounded-[10px] cursor-pointer py-2.5 px-4.5 text-[0.875rem] transition-all whitespace-nowrap border-[1.5px] border-primary text-primary bg-white hover:bg-primary/[0.05] hover:-translate-y-px focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(255,107,53,0.2)]"
                >
                  <i className="fas fa-plus-circle"></i> Add Question
                </button>
              </div>

              {strategicQuestions.length > 0 && (
                <div className="bg-neutral-50 border-[1.5px] border-neutral-200 p-6 rounded-xl">
                  <h3 className="text-neutral-900 text-base font-bold m-0 mb-5 tracking-tight">Added Questions ({strategicQuestions.length})</h3>
                  {strategicQuestions.map((q, index) => (
                    <div
                      key={q.id}
                      className="bg-white rounded-xl mb-4 last:mb-0 border border-black/[0.04] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-all relative overflow-hidden group hover:shadow-[0_8px_16px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:border-primary/20 before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-gradient-to-r before:from-transparent before:via-primary/30 before:to-transparent before:opacity-0 before:transition-opacity hover:before:opacity-100"
                    >
                      <div className="flex flex-row items-center justify-start gap-2.5 py-4 px-5 sm:p-4 bg-primary/[0.02] border-b border-black/[0.05] flex-wrap sm:flex-wrap">
                        <span className="bg-gradient-to-br from-primary to-orange-400 text-white py-1.5 px-3 sm:py-1 sm:px-2.5 rounded-lg text-[0.8rem] sm:text-[0.7rem] font-extrabold tracking-wide whitespace-nowrap flex-shrink-0 shadow-[0_2px_8px_rgba(255,107,53,0.25)] min-w-[42px] sm:min-w-[38px] text-center inline-flex items-center justify-center">
                          Q{index + 1}
                        </span>
                        <span className={`py-1.5 px-3.5 sm:py-1 sm:px-2.5 rounded-lg text-[0.7rem] sm:text-[0.65rem] font-extrabold uppercase tracking-wide whitespace-nowrap flex-shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.08)] inline-flex items-center justify-center ${
                          q.priority === 'high' ? 'bg-gradient-to-br from-red-100 to-red-200 border-[1.5px] border-red-300 text-red-700' :
                          q.priority === 'medium' ? 'bg-gradient-to-br from-amber-100 to-amber-200 border-[1.5px] border-amber-300 text-amber-700' :
                          'bg-gradient-to-br from-emerald-100 to-emerald-200 border-[1.5px] border-emerald-300 text-emerald-700'
                        }`}>{q.priority.toUpperCase()}</span>
                        {q.category && (
                          <span className="bg-gradient-to-br from-blue-100 to-blue-200 border-[1.5px] border-blue-300 text-blue-800 py-1.5 px-3.5 sm:py-1 sm:px-2.5 rounded-lg text-[0.72rem] sm:text-[0.65rem] font-bold whitespace-nowrap flex-shrink-0 inline-flex items-center gap-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                            <span className="text-[0.9em]">🏷️</span>{q.category}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeQuestion(q.id)}
                          className="ml-auto bg-white/90 text-red-600 border-[1.5px] border-red-500/30 w-[34px] h-[34px] sm:w-[30px] sm:h-[30px] flex items-center justify-center rounded-lg cursor-pointer font-bold text-lg sm:text-base transition-all flex-shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:bg-red-600 hover:border-red-600 hover:text-white hover:rotate-90 hover:scale-110 hover:shadow-[0_4px_12px_rgba(220,38,38,0.3)]"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-neutral-800 leading-relaxed m-0 text-[1.05rem] sm:text-[0.95rem] font-medium py-4.5 px-5 sm:p-4">{q.text}</p>
                      {q.notes && (
                        <p className="text-amber-900 text-[0.9rem] sm:text-[0.85rem] bg-gradient-to-br from-amber-100 to-amber-200 border-t border-amber-500/20 py-4 px-5 sm:py-3.5 sm:px-4 m-0 flex items-center gap-2.5 leading-relaxed">
                          <span className="flex-shrink-0 text-xl drop-shadow-sm">💡</span>{q.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions: Save Draft / Publish */}
            <div className="flex gap-3 justify-between items-center mt-6.5 sm:flex-col-reverse sm:items-stretch sm:gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/organizer/dashboard')}
                className="inline-flex items-center justify-center gap-2 font-semibold rounded-[10px] cursor-pointer py-2.5 px-4.5 text-[0.875rem] transition-all whitespace-nowrap border-[1.5px] border-neutral-200 text-neutral-500 bg-white sm:w-full hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(255,107,53,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                Cancel
              </button>

              <div className="flex gap-3 sm:grid sm:grid-cols-2 sm:gap-2.5">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 font-semibold rounded-[10px] cursor-pointer py-2.5 px-4.5 text-[0.875rem] transition-all whitespace-nowrap border-[1.5px] border-primary text-primary bg-white sm:w-full hover:bg-primary/[0.05] hover:-translate-y-px focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(255,107,53,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                  onClick={() => createEvent('draft')}
                  title="Save without publishing. Participants can't submit yet."
                >
                  {loading ? 'Saving…' : 'Save as Draft'}
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 font-semibold rounded-[10px] cursor-pointer py-2.5 px-4.5 text-[0.875rem] transition-all whitespace-nowrap border-[1.5px] border-primary text-white bg-gradient-to-br from-primary to-orange-500 shadow-[0_2px_8px_rgba(255,107,53,0.2)] sm:w-full hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(255,107,53,0.3)] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(255,107,53,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                  title="Publish now and start accepting questions."
                >
                  {loading ? 'Publishing…' : 'Publish'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateEvent;
