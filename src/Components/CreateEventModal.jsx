// src/Components/CreateEventModal.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, push, set, get } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, storage } from '../Firebase/config';
import { useAuth } from '../context/AuthContext';

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
        date: eventData.date,
        time: eventData.time || '',
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
            question: q.text,
            author: organizerName,
            source: 'organizer',
            status: 'approved',
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            upvotes: 0,
            answered: false,
            ...(q.priority && { priority: q.priority }),
            ...(q.category && { category: q.category }),
            ...(q.notes && { notes: q.notes })
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-[4px] flex items-center justify-center z-[10000] p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15),0_8px_24px_rgba(0,0,0,0.1)] w-full max-w-[650px] flex items-center justify-center min-h-[400px] max-h-[500px] animate-slide-up overflow-hidden">
          <div className="flex flex-col items-center justify-center text-center py-12 px-8 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-6 shadow-[0_8px_24px_rgba(16,185,129,0.3)]">
              <i className="fas fa-check text-4xl text-white"></i>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-3 tracking-tight">Event Created Successfully!</h2>
            <p className="text-base text-neutral-500 leading-relaxed">
              Redirecting you to {createdEventId ? 'complete your event setup' : 'your event'}...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[4px] flex items-center justify-center z-[10000] p-0 md:p-4 animate-fadeIn" onClick={onClose}>
      <div
        className="bg-white rounded-none md:rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15),0_8px_24px_rgba(0,0,0,0.1)] w-full max-w-[650px] max-h-screen md:max-h-[90vh] h-full md:h-auto flex flex-col animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between px-4 md:px-8 pt-5 md:pt-8 pb-4 md:pb-6 border-b border-neutral-200 flex-shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-neutral-900 mb-1 tracking-tight">Create New Event</h2>
            <p className="text-sm text-neutral-500 font-medium">
              {step === 1 && 'Event Details'}
              {step === 2 && 'Strategic Questions (Optional)'}
              {step === 3 && 'Branding & Design'}
              {step === 4 && 'Event Program'}
            </p>
          </div>
          <button
            className="bg-transparent border-none w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer text-neutral-500 transition-all flex-shrink-0 ml-4 hover:bg-neutral-100 hover:text-neutral-900 hover:scale-105"
            onClick={onClose}
            aria-label="Close modal"
            disabled={loading}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center px-4 md:px-8 py-5 md:py-6 bg-neutral-50 border-b border-neutral-200 flex-shrink-0 overflow-hidden">
          <div className="flex items-center w-full max-w-md">
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= 1 ? 'bg-gradient-to-br from-primary to-orange-500 text-white shadow-[0_2px_8px_rgba(255,107,53,0.3)]' : 'bg-neutral-200 text-neutral-400'}`}>1</div>
              <span className={`text-xs font-semibold transition-colors ${step >= 1 ? 'text-primary' : 'text-neutral-400'}`}>Details</span>
            </div>
            <div className={`flex-1 h-0.5 mx-2 transition-colors ${step >= 2 ? 'bg-primary' : 'bg-neutral-200'}`}></div>
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= 2 ? 'bg-gradient-to-br from-primary to-orange-500 text-white shadow-[0_2px_8px_rgba(255,107,53,0.3)]' : 'bg-neutral-200 text-neutral-400'}`}>2</div>
              <span className={`text-xs font-semibold transition-colors ${step >= 2 ? 'text-primary' : 'text-neutral-400'}`}>Questions</span>
            </div>
            <div className={`flex-1 h-0.5 mx-2 transition-colors ${step >= 3 ? 'bg-primary' : 'bg-neutral-200'}`}></div>
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= 3 ? 'bg-gradient-to-br from-primary to-orange-500 text-white shadow-[0_2px_8px_rgba(255,107,53,0.3)]' : 'bg-neutral-200 text-neutral-400'}`}>3</div>
              <span className={`text-xs font-semibold transition-colors ${step >= 3 ? 'text-primary' : 'text-neutral-400'}`}>Branding</span>
            </div>
            <div className={`flex-1 h-0.5 mx-2 transition-colors ${step >= 4 ? 'bg-primary' : 'bg-neutral-200'}`}></div>
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= 4 ? 'bg-gradient-to-br from-primary to-orange-500 text-white shadow-[0_2px_8px_rgba(255,107,53,0.3)]' : 'bg-neutral-200 text-neutral-400'}`}>4</div>
              <span className={`text-xs font-semibold transition-colors ${step >= 4 ? 'text-primary' : 'text-neutral-400'}`}>Program</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-track-neutral-100 scrollbar-thumb-neutral-300">
          {error && (
            <div className="px-4 py-3.5 bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-[10px] text-red-800 text-sm mb-6 flex items-center gap-2">
              <span>⚠</span> {error}
            </div>
          )}

          {/* Step 1: Event Details */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="mb-6">
                <label htmlFor="modal-title" className="block text-sm font-semibold text-neutral-700 mb-2">Event Title *</label>
                <input
                  type="text"
                  id="modal-title"
                  name="title"
                  value={eventData.title}
                  onChange={handleEventChange}
                  required
                  placeholder="e.g., Beyond the Vibes Singles Programme"
                  autoFocus
                  className="w-full px-4 py-3 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] font-sans transition-all focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="modal-description" className="block text-sm font-semibold text-neutral-700 mb-2">Description</label>
                <textarea
                  id="modal-description"
                  name="description"
                  value={eventData.description}
                  onChange={handleEventChange}
                  rows="3"
                  placeholder="Brief description of your event"
                  className="w-full px-4 py-3 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] font-sans transition-all resize-y min-h-[80px] focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="modal-date" className="block text-sm font-semibold text-neutral-700 mb-2">Date *</label>
                  <input
                    type="date"
                    id="modal-date"
                    name="date"
                    value={eventData.date}
                    onChange={handleEventChange}
                    required
                    className="w-full px-4 py-3 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] font-sans transition-all focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
                  />
                </div>

                <div>
                  <label htmlFor="modal-time" className="block text-sm font-semibold text-neutral-700 mb-2">Time</label>
                  <input
                    type="time"
                    id="modal-time"
                    name="time"
                    value={eventData.time}
                    onChange={handleEventChange}
                    className="w-full px-4 py-3 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] font-sans transition-all focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="modal-slug" className="block text-sm font-semibold text-neutral-700 mb-2">Event URL Slug</label>
                <input
                  type="text"
                  id="modal-slug"
                  name="slug"
                  value={eventData.slug}
                  onChange={handleEventChange}
                  placeholder="auto-generated-from-title"
                  className="w-full px-4 py-3 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] font-sans transition-all focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
                />
                <small className="block text-[0.8125rem] text-neutral-500 mt-2 leading-relaxed">
                  Participant link: {window.location.origin}/p/{eventData.slug || 'your-slug'}
                </small>
              </div>
            </div>
          )}

          {/* Step 2: Strategic Questions */}
          {step === 2 && (
            <div className="animate-fade-in">
              <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
                Pre-load questions to guide the discussion and ensure key topics are covered.
              </p>

              <div className="bg-neutral-50 border-[1.5px] border-neutral-200 rounded-xl p-4 md:p-6 mb-6">
                <div className="mb-6">
                  <label htmlFor="modal-question-text" className="block text-sm font-semibold text-neutral-700 mb-2">Question</label>
                  <textarea
                    id="modal-question-text"
                    name="text"
                    value={currentQuestion.text}
                    onChange={handleQuestionChange}
                    rows="3"
                    placeholder="Type your strategic question here..."
                    className="w-full px-4 py-3 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] font-sans transition-all resize-y min-h-[80px] focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label htmlFor="modal-priority" className="block text-sm font-semibold text-neutral-700 mb-2">Priority</label>
                    <select
                      id="modal-priority"
                      name="priority"
                      value={currentQuestion.priority}
                      onChange={handleQuestionChange}
                      className="w-full px-4 py-3 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] font-sans transition-all focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="modal-category" className="block text-sm font-semibold text-neutral-700 mb-2">Category</label>
                    <input
                      type="text"
                      id="modal-category"
                      name="category"
                      value={currentQuestion.category}
                      onChange={handleQuestionChange}
                      placeholder="e.g., Relationships"
                      className="w-full px-4 py-3 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] font-sans transition-all focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label htmlFor="modal-notes" className="block text-sm font-semibold text-neutral-700 mb-2">Notes for MC (Optional)</label>
                  <input
                    type="text"
                    id="modal-notes"
                    name="notes"
                    value={currentQuestion.notes}
                    onChange={handleQuestionChange}
                    placeholder="e.g., Use this to transition to panel discussion"
                    className="w-full px-4 py-3 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] font-sans transition-all focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
                  />
                </div>

                <button
                  type="button"
                  onClick={addStrategicQuestion}
                  className="w-full px-4 py-3 bg-white border-[1.5px] border-neutral-200 rounded-[10px] text-neutral-700 text-sm font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 hover:bg-neutral-100 hover:border-neutral-300 hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                >
                  <i className="fas fa-plus-circle text-primary"></i> Add Question
                </button>
              </div>

              {strategicQuestions.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-neutral-700 mb-4 uppercase tracking-wider">Added Questions ({strategicQuestions.length})</h3>
                  {strategicQuestions.map((q, index) => (
                    <div key={q.id} className="bg-white border-[1.5px] border-neutral-200 rounded-xl p-4 mb-3 last:mb-0 transition-all hover:border-neutral-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">Q{index + 1}</span>
                        <span className={`text-[0.6875rem] font-bold px-2 py-1 rounded-md uppercase tracking-wide ${
                          q.priority === 'high' ? 'bg-red-500/10 text-red-800 border border-red-500/20' :
                          q.priority === 'medium' ? 'bg-amber-500/10 text-orange-700 border border-amber-500/20' :
                          'bg-blue-500/10 text-blue-800 border border-blue-500/20'
                        }`}>
                          {q.priority.toUpperCase()}
                        </span>
                        {q.category && <span className="text-[0.6875rem] font-semibold px-2 py-1 rounded-md bg-neutral-500/10 text-neutral-700 border border-neutral-500/20">{q.category}</span>}
                        <button
                          type="button"
                          onClick={() => removeQuestion(q.id)}
                          className="ml-auto bg-transparent border-none w-6 h-6 rounded-md flex items-center justify-center cursor-pointer text-neutral-400 transition-all hover:bg-red-100 hover:text-red-600"
                          aria-label="Remove question"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                      <p className="text-sm text-neutral-900 leading-relaxed">{q.text}</p>
                      {q.notes && (
                        <p className="text-[0.8125rem] text-neutral-500 mt-2 pt-2 border-t border-neutral-200 flex items-center gap-1.5 leading-relaxed">
                          <i className="fas fa-sticky-note text-amber-500 text-xs"></i> {q.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Branding */}
          {step === 3 && (
            <div className="animate-fade-in">
              <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
                Add visual elements to make your event page stand out and reflect your brand identity.
              </p>

              <div className="mb-6">
                <label htmlFor="modal-flyer-upload" className="block text-sm font-semibold text-neutral-700 mb-2">Event Flyer Image</label>
                <input
                  type="file"
                  id="modal-flyer-upload"
                  name="flyerFile"
                  accept="image/*"
                  onChange={handleBrandingChange}
                  className="w-full px-4 py-3 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] font-sans transition-all focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
                />
                <small className="block text-[0.8125rem] text-neutral-500 mt-2 leading-relaxed">
                  <i className="fas fa-info-circle"></i> Recommended: 1200x630px (1.91:1 aspect ratio) for best display across devices. Max file size: 5MB
                </small>
                {brandingData.flyerFile && (
                  <div className="mt-3 px-4 py-3.5 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2.5 text-sm text-green-800 animate-fadeIn">
                    <i className="fas fa-check-circle text-green-600 text-base flex-shrink-0"></i>
                    <span className="flex-1 font-medium break-words">{brandingData.flyerFile.name}</span>
                    <span className="text-green-700 font-normal whitespace-nowrap">({(brandingData.flyerFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="modal-tagline" className="block text-sm font-semibold text-neutral-700 mb-2">Event Tagline</label>
                <input
                  type="text"
                  id="modal-tagline"
                  name="tagline"
                  value={brandingData.tagline}
                  onChange={handleBrandingChange}
                  placeholder="e.g., Where meaningful connections begin"
                  maxLength="300"
                  className="w-full px-4 py-3 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] font-sans transition-all focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
                />
                <small className="block text-[0.8125rem] text-neutral-500 mt-2 leading-relaxed">
                  A catchy tagline that appears on your event page (max 300 characters)
                </small>
              </div>
            </div>
          )}

          {/* Step 4: Event Program */}
          {step === 4 && (
            <div className="animate-fade-in">
              <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
                Define the schedule and flow of your event. Add program items to help attendees know what to expect.
              </p>

              <div className="bg-neutral-50 border-[1.5px] border-neutral-200 rounded-xl p-4 md:p-6 mb-6">
                <div className="mb-6">
                  <label htmlFor="modal-program-title" className="block text-sm font-semibold text-neutral-700 mb-2">Program Item Title</label>
                  <input
                    type="text"
                    id="modal-program-title"
                    name="title"
                    value={currentProgram.title}
                    onChange={handleProgramChange}
                    placeholder="e.g., Opening Remarks"
                    className="w-full px-4 py-3 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] font-sans transition-all focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="modal-program-duration" className="block text-sm font-semibold text-neutral-700 mb-2">Duration</label>
                  <input
                    type="text"
                    id="modal-program-duration"
                    name="duration"
                    value={currentProgram.duration}
                    onChange={handleProgramChange}
                    placeholder="e.g., 10 mins"
                    className="w-full px-4 py-3 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] font-sans transition-all focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="modal-program-description" className="block text-sm font-semibold text-neutral-700 mb-2">Description (Optional)</label>
                  <textarea
                    id="modal-program-description"
                    name="description"
                    value={currentProgram.description}
                    onChange={handleProgramChange}
                    rows="2"
                    placeholder="Brief description of this program item"
                    className="w-full px-4 py-3 rounded-[10px] border-[1.5px] border-neutral-200 bg-white text-neutral-900 text-[0.9375rem] font-sans transition-all resize-y min-h-[80px] focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]"
                  />
                </div>

                <button
                  type="button"
                  onClick={addProgramItem}
                  className="w-full px-4 py-3 bg-white border-[1.5px] border-neutral-200 rounded-[10px] text-neutral-700 text-sm font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 hover:bg-neutral-100 hover:border-neutral-300 hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                >
                  <i className="fas fa-plus-circle text-primary"></i> Add Program Item
                </button>
              </div>

              {programItems.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-neutral-700 mb-4 uppercase tracking-wider">Program Schedule ({programItems.length} items)</h3>
                  {programItems.map((item, index) => (
                    <div key={item.id} className="bg-white border-[1.5px] border-neutral-200 rounded-xl p-4 mb-3 last:mb-0 transition-all hover:border-neutral-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">{index + 1}</span>
                        {item.duration && <span className="text-[0.6875rem] font-semibold px-2 py-1 rounded-md bg-neutral-500/10 text-neutral-700 border border-neutral-500/20">{item.duration}</span>}
                        <button
                          type="button"
                          onClick={() => removeProgramItem(item.id)}
                          className="ml-auto bg-transparent border-none w-6 h-6 rounded-md flex items-center justify-center cursor-pointer text-neutral-400 transition-all hover:bg-red-100 hover:text-red-600"
                          aria-label="Remove program item"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                      <p className="text-sm text-neutral-900 leading-relaxed">{item.title}</p>
                      {item.description && (
                        <p className="text-[0.8125rem] text-neutral-500 mt-2 pt-2 border-t border-neutral-200 flex items-center gap-1.5 leading-relaxed">
                          <i className="fas fa-align-left text-neutral-400 text-xs"></i> {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-3 px-4 md:px-8 py-5 md:py-6 border-t border-neutral-200 bg-neutral-50 flex-shrink-0">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="w-full md:w-auto px-5 py-3 rounded-[10px] text-sm font-semibold cursor-pointer transition-all border-[1.5px] border-neutral-200 bg-white text-neutral-500 flex items-center justify-center gap-2 whitespace-nowrap hover:bg-neutral-100 hover:border-neutral-300 hover:text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="w-full md:w-auto px-5 py-3 rounded-[10px] text-sm font-semibold cursor-pointer transition-all border-[1.5px] border-transparent bg-gradient-to-br from-primary to-orange-500 text-white shadow-[0_2px_8px_rgba(255,107,53,0.25)] flex items-center justify-center gap-2 whitespace-nowrap hover:from-orange-500 hover:to-orange-600 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(255,107,53,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="w-full md:w-auto px-5 py-3 rounded-[10px] text-sm font-semibold cursor-pointer transition-all border-[1.5px] border-neutral-200 bg-white text-neutral-700 flex items-center justify-center gap-2 whitespace-nowrap hover:bg-neutral-100 hover:border-neutral-300 hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                <i className="fas fa-arrow-left"></i> Back
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="w-full md:w-auto px-5 py-3 rounded-[10px] text-sm font-semibold cursor-pointer transition-all border-[1.5px] border-transparent bg-gradient-to-br from-primary to-orange-500 text-white shadow-[0_2px_8px_rgba(255,107,53,0.25)] flex items-center justify-center gap-2 whitespace-nowrap hover:from-orange-500 hover:to-orange-600 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(255,107,53,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="w-full md:w-auto px-5 py-3 rounded-[10px] text-sm font-semibold cursor-pointer transition-all border-[1.5px] border-neutral-200 bg-white text-neutral-700 flex items-center justify-center gap-2 whitespace-nowrap hover:bg-neutral-100 hover:border-neutral-300 hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                <i className="fas fa-arrow-left"></i> Back
              </button>
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => createEvent('draft')}
                  className="w-full md:w-auto px-5 py-3 rounded-[10px] text-sm font-semibold cursor-pointer transition-all border-[1.5px] border-neutral-200 bg-white text-neutral-700 flex items-center justify-center gap-2 whitespace-nowrap hover:bg-neutral-100 hover:border-neutral-300 hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                  title="Save without publishing"
                >
                  {loading ? 'Saving...' : 'Save as Draft'}
                </button>
                <button
                  type="button"
                  onClick={() => createEvent('publish')}
                  className="w-full md:w-auto px-5 py-3 rounded-[10px] text-sm font-semibold cursor-pointer transition-all border-[1.5px] border-transparent bg-gradient-to-br from-primary to-orange-500 text-white shadow-[0_2px_8px_rgba(255,107,53,0.25)] flex items-center justify-center gap-2 whitespace-nowrap hover:from-orange-500 hover:to-orange-600 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(255,107,53,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
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
