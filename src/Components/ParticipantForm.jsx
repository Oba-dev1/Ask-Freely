import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ref, push, serverTimestamp } from 'firebase/database';
import {database} from '../Firebase/config';
import './ParticipantForm.css';

function ParticipantForm() {
  const [formData, setFormData] = useState({
    name: '',
    question: '',
    anonymous: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [questionsRef, setQuestionsRef] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: 'info', text: 'Submitting your question.' });

    try {
        console.log("DATABASE REF:::", questionsRef);
      
      
      const newQuestion = {
        author: formData.anonymous || !formData.name.trim() ? 'Anonymous' : formData.name.trim(),
        question: formData.question.trim(),
        timestamp: new Date().toISOString(),
        answered: false,
        createdAt: serverTimestamp()
      };
      console.log("NEW QUESTION::: ", newQuestion);
      

      const response = await push(questionsRef, newQuestion);
        console.log("RESPONSE:::", response);

      setMessage({ type: 'success', text: '✓ Question submitted successfully!' });
      setFormData({ name: '', question: '', anonymous: false });

      setTimeout(() => setMessage({ type: '', text: '' }), 3000);

    } catch (error) {
      console.error('Error submitting question:', error);
      setMessage({ type: 'error', text: '✗ Error submitting question. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  
    useEffect(() => {
      const questionsRef = ref(database, 'questions');
      setQuestionsRef(questionsRef);
    }, []);

  return (
    <div className="container">
      <Link to="/" className="back-button">← Back to Home</Link>
      
      <header className="header">
        <h1>Beyond the Vibes</h1>
        <p className="subtitle">Singles Programme • October 28, 2025</p>
        <p className="tagline">Ask Your Questions ✨</p>
      </header>

      <div className="form-card">
        <p className="intro-text">
          Got questions about friendships, relationships, boundaries, or marriage? 
          Submit them here and our panel will address them during the session! 🔥
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Your Name (Optional)</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Leave blank to remain anonymous"
              autoComplete="off"
              disabled={formData.anonymous}
            />
          </div>

          <div className="form-group">
            <label htmlFor="question">Your Question *</label>
            <textarea
              id="question"
              name="question"
              value={formData.question}
              onChange={handleChange}
              rows="5"
              placeholder="Type your question here..."
              required
            />
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="anonymous"
              name="anonymous"
              checked={formData.anonymous}
              onChange={handleChange}
            />
            <label htmlFor="anonymous">Submit anonymously</label>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Question'}
          </button>
        </form>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}

export default ParticipantForm;