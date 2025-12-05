// src/Components/HostDashboard.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ref, onValue, update, remove } from 'firebase/database';
import { database } from '../Firebase/config'; // keep your actual casing
import QuestionItem from './QuestionItem';
import MCProgramView from './MCProgramView';
import {
  exportToCSV,
  exportToJSON,
  exportToText,
  generateAnalytics,
} from '../utils/exportutils'; // <-- ensure this matches your file name
import './HostDashboard.css';

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
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [analytics, setAnalytics] = useState(EMPTY_ANALYTICS);

  const questionsPath = useMemo(
    () => (eventId ? `questions/${eventId}` : 'questions'),
    [eventId]
  );

  // Load event details
  useEffect(() => {
    if (!eventId) return;

    const eventRef = ref(database, `events/${eventId}`);
    const unsubscribe = onValue(eventRef, (snap) => {
      const data = snap.val();
      if (data) {
        setEvent(data);
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

  const toggleAnswered = useCallback(
    async (id, currentStatus) => {
      try {
        const qRef = ref(
          database,
          eventId ? `questions/${eventId}/${id}` : `questions/${id}`
        );
        await update(qRef, { answered: !currentStatus });
      } catch (err) {
        console.error('Error updating question:', err);
        alert('Failed to update question. Please try again.');
      }
    },
    [eventId]
  );

  const deleteQuestion = useCallback(
    async (id) => {
      if (!window.confirm('Are you sure you want to delete this question?')) return;
      try {
        const qRef = ref(
          database,
          eventId ? `questions/${eventId}/${id}` : `questions/${id}`
        );
        await remove(qRef);
      } catch (err) {
        console.error('Error deleting question:', err);
        alert('Failed to delete question. Please try again.');
      }
    },
    [eventId]
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

  const handleExport = useCallback(
    (format) => {
      const all = [...questions].sort(
        (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
      );
      if (format === 'csv') exportToCSV(all);
      else if (format === 'json') exportToJSON(all);
      else if (format === 'txt') exportToText(all);
      setShowExportMenu(false);
    },
    [questions]
  );

  const durationNote = compactTimeLabel(
    analytics.timeline?.firstQuestion,
    analytics.timeline?.lastQuestion
  );

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
          <h1>
            Host Dashboard{' '}
            {eventId ? <span className="pill">Event: {eventId}</span> : null}
          </h1>
          <p className="page-subtitle">Manage questions in real-time</p>
        </header>

        {/* Program View */}
        {eventId && event && (
          <MCProgramView eventId={eventId} eventTitle={event.title || 'Event'} />
        )}

        <div className="dashboard-card">
          <div className="dashboard-header">
            <h2>Submitted Questions</h2>
            <div className="header-actions">
              <div className="stats">
                <span>{questions.length}</span> questions
              </div>
              <div className="export-dropdown">
                <button
                  className="export-btn"
                  onClick={() => setShowExportMenu((v) => !v)}
                >
                  <i className="fas fa-download" aria-hidden="true" />
                  Export
                </button>
                {showExportMenu && (
                  <div className="export-menu">
                    <button onClick={() => handleExport('csv')}>
                      <i className="fas fa-file-csv" aria-hidden="true" />
                      Export as CSV
                    </button>
                    <button onClick={() => handleExport('json')}>
                      <i className="fas fa-code" aria-hidden="true" />
                      Export as JSON
                    </button>
                    <button onClick={() => handleExport('txt')}>
                      <i className="fas fa-file-lines" aria-hidden="true" />
                      Export as Text
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Analytics — Cards */}
          <section className="analytics-section">
            {/* Answered */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <span className="analytics-card-title">Answered</span>
                <div className="analytics-icon success">
                  <i className="fas fa-check-circle" aria-hidden="true"></i>
                </div>
              </div>
              <div className="analytics-value">
                {analytics.summary?.answered ?? 0}
              </div>
              <div className="analytics-detail">
                <span className="analytics-percentage">
                  {fmtPct(analytics.summary?.percentAnswered)}
                </span>{' '}
                of total
              </div>
            </div>

            {/* Unanswered */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <span className="analytics-card-title">Unanswered</span>
                <div className="analytics-icon warning">
                  <i className="fas fa-question-circle" aria-hidden="true"></i>
                </div>
              </div>
              <div className="analytics-value">
                {analytics.summary?.unanswered ?? 0}
              </div>
              <div className="analytics-detail">Remaining in queue</div>
            </div>

            {/* Anonymous */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <span className="analytics-card-title">Anonymous</span>
                <div className="analytics-icon info">
                  <i className="fas fa-user-secret" aria-hidden="true"></i>
                </div>
              </div>
              <div className="analytics-value">
                {analytics.summary?.anonymous ?? 0}
              </div>
              <div className="analytics-detail">
                <span className="analytics-percentage">
                  {fmtPct(analytics.summary?.percentAnonymous)}
                </span>{' '}
                of submissions
              </div>
            </div>

            {/* Session Duration */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <span className="analytics-card-title">Session Duration</span>
                <div className="analytics-icon primary">
                  <i className="fas fa-clock" aria-hidden="true"></i>
                </div>
              </div>
              <div className="analytics-value" style={{ fontSize: '2rem' }}>
                {analytics.timeline?.duration || 'N/A'}
              </div>
              {durationNote && (
                <div className="analytics-detail">{durationNote}</div>
              )}
            </div>
          </section>

          {/* Filters */}
          <div className="filter-controls">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === 'organizer' ? 'active' : ''}`}
              onClick={() => setFilter('organizer')}
            >
              <i className="fas fa-star" /> Strategic
            </button>
            <button
              className={`filter-btn ${filter === 'audience' ? 'active' : ''}`}
              onClick={() => setFilter('audience')}
            >
              <i className="fas fa-users" /> Audience
            </button>
            <button
              className={`filter-btn ${filter === 'answered' ? 'active' : ''}`}
              onClick={() => setFilter('answered')}
            >
              Answered
            </button>
            <button
              className={`filter-btn ${filter === 'unanswered' ? 'active' : ''}`}
              onClick={() => setFilter('unanswered')}
            >
              Unanswered
            </button>
          </div>

          {/* Status */}
          <div className="status-section">
            <div className="connection-status">
              <span
                className={`status-indicator ${
                  isConnected ? 'connected' : 'disconnected'
                }`}
              >
                <span className="status-dot" />
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <span className="last-updated">
              <i className="far fa-clock" /> Last updated:{' '}
              {lastUpdate.toLocaleTimeString()}
            </span>
          </div>

          {/* Questions */}
          <div className="questions-list">
            {filteredQuestions.length === 0 ? (
              <div className="empty-state">
                <i className="far fa-inbox" />
                <p>No questions to display.</p>
              </div>
            ) : (
              filteredQuestions.map((q) => (
                <QuestionItem
                  key={q.id}
                  question={q}
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
