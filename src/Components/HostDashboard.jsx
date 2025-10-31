// src/Components/HostDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ref, onValue, update, remove } from 'firebase/database';
import { database } from '../firebase/config'; // keep this casing consistent with your project
import QuestionItem from './QuestionItem';
import { exportToCSV, exportToJSON, exportToText, generateAnalytics } from '../utils/exportutils'; // adjust if your file is exportUtils
import './HostDashboard.css';

function HostDashboard() {
  const { eventId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    // Support both: /host (legacy) and /host/:eventId (new)
    const questionsPath = eventId ? `questions/${eventId}` : 'questions';
    const questionsRef = ref(database, questionsPath);

    const unsubscribe = onValue(
      questionsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const questionsArray = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setQuestions(questionsArray);
          setAnalytics(generateAnalytics(questionsArray));
        } else {
          setQuestions([]);
          setAnalytics(null);
        }
        setIsConnected(true);
        setLastUpdate(new Date());
      },
      (error) => {
        console.error('Error loading questions:', error);
        setIsConnected(false);
      }
    );

    return () => unsubscribe();
  }, [eventId]);

  const toggleAnswered = async (id, currentStatus) => {
    try {
      const questionsPath = eventId ? `questions/${eventId}/${id}` : `questions/${id}`;
      const questionRef = ref(database, questionsPath);
      await update(questionRef, { answered: !currentStatus });
    } catch (error) {
      console.error('Error updating question:', error);
      alert('Failed to update question. Please try again.');
    }
  };

  const deleteQuestion = async (id) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        const questionsPath = eventId ? `questions/${eventId}/${id}` : `questions/${id}`;
        const questionRef = ref(database, questionsPath);
        await remove(questionRef);
      } catch (error) {
        console.error('Error deleting question:', error);
        alert('Failed to delete question. Please try again.');
      }
    }
  };

  // Immutable, memoized filtering + sorting
  const filteredQuestions = useMemo(() => {
    let base = questions;
    if (filter === 'answered') base = questions.filter((q) => q.answered);
    else if (filter === 'unanswered') base = questions.filter((q) => !q.answered);
    else if (filter === 'organizer') base = questions.filter((q) => q.source === 'organizer');
    else if (filter === 'audience') base = questions.filter((q) => q.source === 'audience');

    return [...base].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [questions, filter]);

  const handleExport = (format) => {
    const allQuestions = [...questions].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    switch (format) {
      case 'csv':
        exportToCSV(allQuestions);
        break;
      case 'json':
        exportToJSON(allQuestions);
        break;
      case 'txt':
        exportToText(allQuestions);
        break;
      default:
        break;
    }
    setShowExportMenu(false);
  };

  return (
    <div className="page-wrapper">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="logo">
            <span className="logo-icon">💬</span>
            <span className="logo-text">Ask Freely</span>
          </Link>
        </div>
      </nav>

      <div className="container host-container">
        <header className="page-header">
          <h1>Host Dashboard</h1>
          <p className="page-subtitle">
            {eventId ? `Event: ${eventId}` : 'Manage questions in real-time'}
          </p>
        </header>

        <div className="dashboard-card">
          <div className="dashboard-header">
            <h2>Submitted Questions</h2>
            <div className="header-actions">
              <div className="stats">
                <span>{questions.length}</span> questions
              </div>
              <div className="export-dropdown">
                <button
                  type="button"
                  className="export-btn"
                  onClick={() => setShowExportMenu((v) => !v)}
                >
                  📥 Export
                </button>
                {showExportMenu && (
                  <div className="export-menu">
                    <button type="button" onClick={() => handleExport('csv')}>
                      📊 Export as CSV
                    </button>
                    <button type="button" onClick={() => handleExport('json')}>
                      💾 Export as JSON
                    </button>
                    <button type="button" onClick={() => handleExport('txt')}>
                      📄 Export as Text
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {analytics && (
            <div className="analytics-card">
              <h3>📈 Session Analytics</h3>
              <div className="analytics-grid">
                <div className="stat-item">
                  <span className="stat-label">Answered</span>
                  <span className="stat-value">
                    {analytics.summary.answered} ({analytics.summary.percentAnswered}%)
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Unanswered</span>
                  <span className="stat-value">{analytics.summary.unanswered}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Anonymous</span>
                  <span className="stat-value">
                    {analytics.summary.anonymous} ({analytics.summary.percentAnonymous}%)
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Duration</span>
                  <span className="stat-value">{analytics.timeline.duration}</span>
                </div>
              </div>
            </div>
          )}

          <div className="filter-controls">
            <button
              type="button"
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`filter-btn ${filter === 'organizer' ? 'active' : ''}`}
              onClick={() => setFilter('organizer')}
            >
              ⭐ Strategic
            </button>
            <button
              type="button"
              className={`filter-btn ${filter === 'audience' ? 'active' : ''}`}
              onClick={() => setFilter('audience')}
            >
              👥 Audience
            </button>
            <button
              type="button"
              className={`filter-btn ${filter === 'answered' ? 'active' : ''}`}
              onClick={() => setFilter('answered')}
            >
              Answered
            </button>
            <button
              type="button"
              className={`filter-btn ${filter === 'unanswered' ? 'active' : ''}`}
              onClick={() => setFilter('unanswered')}
            >
              Unanswered
            </button>
          </div>

          <div className="status-section">
            <div className="connection-status">
              <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </span>
            </div>
            <span className="last-updated">
              Last updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : '—'}
            </span>
          </div>

          <div className="questions-list">
            {filteredQuestions.length === 0 ? (
              <p className="empty-state">No questions to display.</p>
            ) : (
              filteredQuestions.map((question) => (
                <QuestionItem
                  key={question.id}
                  question={question}
                  onToggleAnswered={toggleAnswered}
                  onDelete={deleteQuestion}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HostDashboard;
