// src/Components/CreateEvent.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ref, push, set, get } from 'firebase/database';
import { database } from '../Firebase/config'; // keep folder casing consistent with your project
import { useAuth } from '../context/AuthContext';
import './CreateEvent.css';

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

      navigate(`/organizer/event/${newEventRef.key}`);
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
    <div className="page-wrapper">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="logo">
            <span className="logo-icon"><i className="fas fa-comments"></i></span>
            <span className="logo-text">Ask Freely</span>
          </Link>
        </div>
      </nav>

      <div className="create-event-container">
        <div className="create-event-header">
          <button onClick={() => navigate('/organizer/dashboard')} className="back-btn-simple">
            ← Back to Dashboard
          </button>
        </div>

        <header className="page-header">
          <h1>Create New Event</h1>
          <p className="page-subtitle">Set up your Q&amp;A session</p>
        </header>

        <div className="create-event-card">
          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Event Details */}
            <div className="form-section">
              <h2>Event Details</h2>

              <div className="form-group">
                <label htmlFor="title">Event Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={eventData.title}
                  onChange={handleEventChange}
                  required
                  placeholder="e.g., Beyond the Vibes Singles Programme"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={eventData.description}
                  onChange={handleEventChange}
                  rows="3"
                  placeholder="Brief description of your event"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Date *</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={eventData.date}
                    onChange={handleEventChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="time">Time</label>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    value={eventData.time}
                    onChange={handleEventChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="slug">Event URL Slug</label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={eventData.slug}
                  onChange={handleEventChange}
                  placeholder="auto-generated-from-title"
                />
                <small>
                  Participant link will be: {window.location.origin}/p/{eventData.slug || 'your-slug'}
                </small>
              </div>
            </div>

            {/* Strategic Questions */}
            <div className="form-section">
              <h2>Strategic Questions (Optional)</h2>
              <p className="section-description">
                Pre-load questions to guide the discussion and ensure key topics are covered.
              </p>

              <div className="question-builder">
                <div className="form-group">
                  <label htmlFor="questionText">Question</label>
                  <textarea
                    id="questionText"
                    name="text"
                    value={currentQuestion.text}
                    onChange={handleQuestionChange}
                    rows="3"
                    placeholder="Type your strategic question here..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="priority">Priority</label>
                    <select
                      id="priority"
                      name="priority"
                      value={currentQuestion.priority}
                      onChange={handleQuestionChange}
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <input
                      type="text"
                      id="category"
                      name="category"
                      value={currentQuestion.category}
                      onChange={handleQuestionChange}
                      placeholder="e.g., Relationships"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Notes for MC (Optional)</label>
                  <input
                    type="text"
                    id="notes"
                    name="notes"
                    value={currentQuestion.notes}
                    onChange={handleQuestionChange}
                    placeholder="e.g., Use this to transition to panel discussion"
                  />
                </div>

                <button
                  type="button"
                  onClick={addStrategicQuestion}
                  className="event-btn event-btn-add"
                >
                  <i className="fas fa-plus-circle"></i> Add Question
                </button>
              </div>

              {strategicQuestions.length > 0 && (
                <div className="questions-preview">
                  <h3>Added Questions ({strategicQuestions.length})</h3>
                  {strategicQuestions.map((q, index) => (
                    <div key={q.id} className="preview-question">
                      <div className="preview-header">
                        <span className="question-number">Q{index + 1}</span>
                        <span className={`priority-tag ${q.priority}`}>{q.priority}</span>
                        {q.category && <span className="category-tag">{q.category}</span>}
                        <button
                          type="button"
                          onClick={() => removeQuestion(q.id)}
                          className="remove-btn"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="preview-text">{q.text}</p>
                      {q.notes && <p className="preview-notes">📝 {q.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions: Save Draft / Publish */}
            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/organizer/dashboard')}
                className="event-btn event-btn-cancel"
                disabled={loading}
              >
                Cancel
              </button>

              <div className="split-actions">
                <button
                  type="button"
                  className="event-btn event-btn-secondary"
                  disabled={loading}
                  onClick={() => createEvent('draft')}
                  title="Save without publishing. Participants can't submit yet."
                >
                  {loading ? 'Saving…' : 'Save as Draft'}
                </button>

                <button
                  type="submit"
                  className="event-btn event-btn-primary"
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
