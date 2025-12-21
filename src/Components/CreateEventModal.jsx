// src/Components/CreateEventModal.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, push, set, get } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, storage } from '../Firebase/config';
import { useAuth } from '../context/AuthContext';
import './CreateEventModal.css';

function CreateEventModal({ isOpen, onClose }) {
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    slug: ''
  });
  const [brandingData, setBrandingData] = useState({
    flyerUrl: '',
    flyerFile: null,
    tagline: ''
  });
  const [programItems, setProgramItems] = useState([]);
  const [currentProgram, setCurrentProgram] = useState({
    title: '',
    duration: '',
    description: ''
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
  const [step, setStep] = useState(1); // 1: Event Details, 2: Strategic Questions, 3: Branding, 4: Program
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdEventId, setCreatedEventId] = useState(null);

  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEventData({
        title: '',
        description: '',
        date: '',
        time: '',
        slug: ''
      });
      setBrandingData({
        flyerUrl: '',
        flyerFile: null,
        tagline: ''
      });
      setProgramItems([]);
      setCurrentProgram({
        title: '',
        duration: '',
        description: ''
      });
      setStrategicQuestions([]);
      setCurrentQuestion({
        text: '',
        priority: 'medium',
        category: '',
        notes: ''
      });
      setError('');
      setStep(1);
      setShowSuccess(false);
      setCreatedEventId(null);
    }
  }, [isOpen]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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

  const handleBrandingChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === 'file' && files && files[0]) {
      const file = files[0];

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        setError('Image file size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file');
        return;
      }

      setBrandingData(prev => ({ ...prev, flyerFile: file }));
      setError('');
    } else {
      setBrandingData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleProgramChange = (e) => {
    const { name, value } = e.target;
    setCurrentProgram(prev => ({ ...prev, [name]: value }));
  };

  const addProgramItem = () => {
    if (!currentProgram.title.trim()) {
      return setError('Program title is required');
    }
    setProgramItems(prev => [...prev, { ...currentProgram, id: Date.now(), order: prev.length }]);
    setCurrentProgram({ title: '', duration: '', description: '' });
    setError('');
  };

  const removeProgramItem = (id) => {
    setProgramItems(prev => prev.filter(p => p.id !== id));
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

  const handleNextStep = () => {
    if (step === 1) {
      if (!eventData.title || !eventData.date) {
        setError('Please fill in all required fields');
        return;
      }
    }
    setError('');
    setStep(prev => prev + 1);
  };

  const handleBackStep = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  /**
   * Create event helper
   * mode: 'draft' | 'publish'
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

      // Clean slug
      let slug =
        (eventData.slug || eventData.title)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || `event-${Date.now()}`;

      // Ensure slug uniqueness
      const slugRef = ref(database, `slugs/${slug}`);
      const slugSnap = await get(slugRef);
      if (slugSnap.exists()) {
        slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
      }

      // Upload flyer image if provided
      let flyerUrl = brandingData.flyerUrl;
      if (brandingData.flyerFile) {
        try {
          const timestamp = Date.now();
          const fileName = `event-flyers/${currentUser.uid}/${timestamp}_${brandingData.flyerFile.name}`;
          const fileRef = storageRef(storage, fileName);
          await uploadBytes(fileRef, brandingData.flyerFile);
          flyerUrl = await getDownloadURL(fileRef);
        } catch (uploadError) {
          console.error('Error uploading flyer:', uploadError);
          setError('Failed to upload event flyer. Please try again.');
          setLoading(false);
          return;
        }
      }

      // Decide status based on mode - use security rules compliant values
      const status = mode === 'publish' ? 'published' : 'draft';
      const enableQuestionSubmission = mode === 'publish';

      // Create event
      const eventsRef = ref(database, 'events');
      const newEventRef = push(eventsRef);

      // Combine date and time for dateTime field
      const dateTime = eventData.date + (eventData.time ? `T${eventData.time}` : '');

      const eventPayload = {
        title: eventData.title,
        description: eventData.description || '',
        dateTime: dateTime,
        slug,
        organizerId: currentUser.uid,
        organizerName: organizerName,
        status,
        enableQuestionSubmission,
        requireApproval: false,
        allowAnonymous: true,
        createdAt: new Date().toISOString(),
        // Branding data (optional)
        ...(flyerUrl && { flyerUrl }),
        ...(brandingData.tagline && { tagline: brandingData.tagline })
      };

      await set(newEventRef, eventPayload);

      // Write slug maps
      await set(ref(database, `slugs/${slug}`), newEventRef.key);
      await set(ref(database, `eventSlugs/${newEventRef.key}`), slug);

      // Seed strategic questions
      if (strategicQuestions.length > 0) {
        const questionsRef = ref(database, `questions/${newEventRef.key}`);
        for (const q of strategicQuestions) {
          const qRef = push(questionsRef);
          await set(qRef, {
            questionText: q.text,
            authorName: organizerName,
            status: 'approved',
            createdAt: new Date().toISOString(),
            upvotes: 0
          });
        }
      }

      // Save program items
      if (programItems.length > 0) {
        const programsRef = ref(database, `programs/${newEventRef.key}`);
        for (const item of programItems) {
          const pRef = push(programsRef);
          await set(pRef, {
            title: item.title,
            duration: item.duration || '',
            description: item.description || '',
            order: item.order
          });
        }
      }

      // Show success state
      setCreatedEventId(newEventRef.key);
      setShowSuccess(true);

      // Wait 1.5 seconds, then navigate to event management
      setTimeout(() => {
        onClose();
        navigate(`/organizer/event/${newEventRef.key}`);
      }, 1500);
    } catch (err) {
      console.error(err);
      setError('Failed to create event: ' + (err?.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Success State
  if (showSuccess) {
    return (
      <div className="modal-overlay">
        <div className="modal-container modal-success">
          <div className="success-animation">
            <div className="success-checkmark">
              <i className="fas fa-check"></i>
            </div>
            <h2 className="success-title">Event Created Successfully!</h2>
            <p className="success-message">
              Redirecting you to {createdEventId ? 'complete your event setup' : 'your event'}...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Create New Event</h2>
            <p className="modal-subtitle">
              {step === 1 && 'Event Details'}
              {step === 2 && 'Strategic Questions (Optional)'}
              {step === 3 && 'Branding & Design'}
              {step === 4 && 'Event Program'}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal" disabled={loading}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="modal-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <div className="progress-circle">1</div>
            <span className="progress-label">Details</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <div className="progress-circle">2</div>
            <span className="progress-label">Questions</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <div className="progress-circle">3</div>
            <span className="progress-label">Branding</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 4 ? 'active' : ''}`}>
            <div className="progress-circle">4</div>
            <span className="progress-label">Program</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {error && <div className="modal-error">{error}</div>}

          {/* Step 1: Event Details */}
          {step === 1 && (
            <div className="modal-step">
              <div className="form-group">
                <label htmlFor="modal-title">Event Title *</label>
                <input
                  type="text"
                  id="modal-title"
                  name="title"
                  value={eventData.title}
                  onChange={handleEventChange}
                  required
                  placeholder="e.g., Beyond the Vibes Singles Programme"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="modal-description">Description</label>
                <textarea
                  id="modal-description"
                  name="description"
                  value={eventData.description}
                  onChange={handleEventChange}
                  rows="3"
                  placeholder="Brief description of your event"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="modal-date">Date *</label>
                  <input
                    type="date"
                    id="modal-date"
                    name="date"
                    value={eventData.date}
                    onChange={handleEventChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="modal-time">Time</label>
                  <input
                    type="time"
                    id="modal-time"
                    name="time"
                    value={eventData.time}
                    onChange={handleEventChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="modal-slug">Event URL Slug</label>
                <input
                  type="text"
                  id="modal-slug"
                  name="slug"
                  value={eventData.slug}
                  onChange={handleEventChange}
                  placeholder="auto-generated-from-title"
                />
                <small className="form-hint">
                  Participant link: {window.location.origin}/p/{eventData.slug || 'your-slug'}
                </small>
              </div>
            </div>
          )}

          {/* Step 2: Strategic Questions */}
          {step === 2 && (
            <div className="modal-step">
              <p className="step-description">
                Pre-load questions to guide the discussion and ensure key topics are covered.
              </p>

              <div className="question-builder">
                <div className="form-group">
                  <label htmlFor="modal-question-text">Question</label>
                  <textarea
                    id="modal-question-text"
                    name="text"
                    value={currentQuestion.text}
                    onChange={handleQuestionChange}
                    rows="3"
                    placeholder="Type your strategic question here..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="modal-priority">Priority</label>
                    <select
                      id="modal-priority"
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
                    <label htmlFor="modal-category">Category</label>
                    <input
                      type="text"
                      id="modal-category"
                      name="category"
                      value={currentQuestion.category}
                      onChange={handleQuestionChange}
                      placeholder="e.g., Relationships"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="modal-notes">Notes for MC (Optional)</label>
                  <input
                    type="text"
                    id="modal-notes"
                    name="notes"
                    value={currentQuestion.notes}
                    onChange={handleQuestionChange}
                    placeholder="e.g., Use this to transition to panel discussion"
                  />
                </div>

                <button
                  type="button"
                  onClick={addStrategicQuestion}
                  className="btn-add-question"
                >
                  <i className="fas fa-plus-circle"></i> Add Question
                </button>
              </div>

              {strategicQuestions.length > 0 && (
                <div className="questions-list">
                  <h3 className="questions-list-title">Added Questions ({strategicQuestions.length})</h3>
                  {strategicQuestions.map((q, index) => (
                    <div key={q.id} className="question-item">
                      <div className="question-item-header">
                        <span className="question-number">Q{index + 1}</span>
                        <span className={`priority-badge priority-${q.priority}`}>
                          {q.priority.toUpperCase()}
                        </span>
                        {q.category && <span className="category-badge">{q.category}</span>}
                        <button
                          type="button"
                          onClick={() => removeQuestion(q.id)}
                          className="btn-remove-question"
                          aria-label="Remove question"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                      <p className="question-text">{q.text}</p>
                      {q.notes && <p className="question-notes"><i className="fas fa-sticky-note"></i> {q.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Branding */}
          {step === 3 && (
            <div className="modal-step">
              <p className="step-description">
                Add visual elements to make your event page stand out and reflect your brand identity.
              </p>

              <div className="form-group">
                <label htmlFor="modal-flyer-upload">Event Flyer Image</label>
                <input
                  type="file"
                  id="modal-flyer-upload"
                  name="flyerFile"
                  accept="image/*"
                  onChange={handleBrandingChange}
                />
                <small className="form-hint">
                  <i className="fas fa-info-circle"></i> Recommended: 1200x630px (1.91:1 aspect ratio) for best display across devices. Max file size: 5MB
                </small>
                {brandingData.flyerFile && (
                  <div className="file-preview">
                    <i className="fas fa-check-circle"></i>
                    <span>{brandingData.flyerFile.name}</span>
                    <span className="file-size">({(brandingData.flyerFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="modal-tagline">Event Tagline</label>
                <input
                  type="text"
                  id="modal-tagline"
                  name="tagline"
                  value={brandingData.tagline}
                  onChange={handleBrandingChange}
                  placeholder="e.g., Where meaningful connections begin"
                  maxLength="300"
                />
                <small className="form-hint">
                  A catchy tagline that appears on your event page (max 300 characters)
                </small>
              </div>
            </div>
          )}

          {/* Step 4: Event Program */}
          {step === 4 && (
            <div className="modal-step">
              <p className="step-description">
                Define the schedule and flow of your event. Add program items to help attendees know what to expect.
              </p>

              <div className="question-builder">
                <div className="form-group">
                  <label htmlFor="modal-program-title">Program Item Title</label>
                  <input
                    type="text"
                    id="modal-program-title"
                    name="title"
                    value={currentProgram.title}
                    onChange={handleProgramChange}
                    placeholder="e.g., Opening Remarks"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="modal-program-duration">Duration</label>
                  <input
                    type="text"
                    id="modal-program-duration"
                    name="duration"
                    value={currentProgram.duration}
                    onChange={handleProgramChange}
                    placeholder="e.g., 10 mins"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="modal-program-description">Description (Optional)</label>
                  <textarea
                    id="modal-program-description"
                    name="description"
                    value={currentProgram.description}
                    onChange={handleProgramChange}
                    rows="2"
                    placeholder="Brief description of this program item"
                  />
                </div>

                <button
                  type="button"
                  onClick={addProgramItem}
                  className="btn-add-question"
                >
                  <i className="fas fa-plus-circle"></i> Add Program Item
                </button>
              </div>

              {programItems.length > 0 && (
                <div className="questions-list">
                  <h3 className="questions-list-title">Program Schedule ({programItems.length} items)</h3>
                  {programItems.map((item, index) => (
                    <div key={item.id} className="question-item">
                      <div className="question-item-header">
                        <span className="question-number">{index + 1}</span>
                        {item.duration && <span className="category-badge">{item.duration}</span>}
                        <button
                          type="button"
                          onClick={() => removeProgramItem(item.id)}
                          className="btn-remove-question"
                          aria-label="Remove program item"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                      <p className="question-text">{item.title}</p>
                      {item.description && <p className="question-notes"><i className="fas fa-align-left"></i> {item.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="btn-modal btn-modal-cancel"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="btn-modal btn-modal-primary"
                disabled={loading}
              >
                Next: Add Questions <i className="fas fa-arrow-right"></i>
              </button>
            </>
          ) : step < 4 ? (
            <>
              <button
                type="button"
                onClick={handleBackStep}
                className="btn-modal btn-modal-secondary"
                disabled={loading}
              >
                <i className="fas fa-arrow-left"></i> Back
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="btn-modal btn-modal-primary"
                disabled={loading}
              >
                {step === 2 && 'Next: Branding'}
                {step === 3 && 'Next: Program'}
                <i className="fas fa-arrow-right"></i>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleBackStep}
                className="btn-modal btn-modal-secondary"
                disabled={loading}
              >
                <i className="fas fa-arrow-left"></i> Back
              </button>
              <div className="modal-actions-right">
                <button
                  type="button"
                  onClick={() => createEvent('draft')}
                  className="btn-modal btn-modal-secondary"
                  disabled={loading}
                  title="Save without publishing"
                >
                  {loading ? 'Saving...' : 'Save as Draft'}
                </button>
                <button
                  type="button"
                  onClick={() => createEvent('publish')}
                  className="btn-modal btn-modal-primary"
                  disabled={loading}
                  title="Publish now and start accepting questions"
                >
                  {loading ? 'Publishing...' : 'Publish Event'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateEventModal;
