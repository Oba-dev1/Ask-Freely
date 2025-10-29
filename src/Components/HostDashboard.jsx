import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ref, onValue, update, remove } from 'firebase/database';
import { database } from '../Firebase/config';
import QuestionItem from './QuestionItem';
import { exportToCSV, exportToJSON, exportToText, generateAnalytics } from '../utils/exportutils';
import './HostDashboard.css';

function HostDashboard() {
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showExportMenu, setShowExportMenu] = useState(false);  // ← This line MUST be here
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const questionsRef = ref(database, 'questions');

    const unsubscribe = onValue(
      questionsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const questionsArray = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          setQuestions(questionsArray);
          // Generate analytics
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
  }, []);


  const toggleAnswered = async (id, currentStatus) => {
    try {
      const questionRef = ref(database, `questions/${id}`);
      await update(questionRef, { answered: !currentStatus });
    } catch (error) {
      console.error('Error updating question:', error);
      alert('Failed to update question. Please try again.');
    }
  };

  const deleteQuestion = async (id) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        const questionRef = ref(database, `questions/${id}`);
        await remove(questionRef);
      } catch (error) {
        console.error('Error deleting question:', error);
        alert('Failed to delete question. Please try again.');
      }
    }
  };

const getFilteredQuestions = () => {
    let filtered = questions;
    
    if (filter === 'answered') {
      filtered = questions.filter(q => q.answered);
    } else if (filter === 'unanswered') {
      filtered = questions.filter(q => !q.answered);
    }
    
    return filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  };

  const handleExport = (format) => {
    const allQuestions = questions.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    switch(format) {
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

  const filteredQuestions = getFilteredQuestions();

  return (
    <div className="container">
      <Link to="/" className="back-button">← Back to Home</Link>
      
      <header className="header">
        <h1>Host Dashboard</h1>
        <p className="subtitle">Beyond the Vibes Q&A</p>
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
                className="export-btn"
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                📥 Export
              </button>
              {showExportMenu && (
                <div className="export-menu">
                  <button onClick={() => handleExport('csv')}>
                    📊 Export as CSV
                  </button>
                  <button onClick={() => handleExport('json')}>
                    💾 Export as JSON
                  </button>
                  <button onClick={() => handleExport('txt')}>
                    📄 Export as Text
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {analytics && (
          <div className="analytics-card">
            <h3>Session Analytics</h3>
            <div className="analytics-grid">
              <div className="stat-item">
                <span className="stat-label">Answered</span>
                <span className="stat-value">{analytics.summary.answered} ({analytics.summary.percentAnswered}%)</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Unanswered</span>
                <span className="stat-value">{analytics.summary.unanswered}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Anonymous</span>
                <span className="stat-value">{analytics.summary.anonymous} ({analytics.summary.percentAnonymous}%)</span>
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
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
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

        <div className="status-section">
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
          </div>
          <span className="last-updated">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>

        <div className="questions-list">
          {filteredQuestions.length === 0 ? (
            <p className="empty-state">No questions to display.</p>
          ) : (
            filteredQuestions.map(question => (
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
  );
}

export default HostDashboard;