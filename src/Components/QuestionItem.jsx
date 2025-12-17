import React from 'react';
import './QuestionItem.css';

function QuestionItem({ question, onToggleAnswered, onDelete }) {
  const displayTime = question.timestamp 
    ? new Date(question.timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Just now';

  // Determine question source badge
  const getSourceBadge = () => {
    const source = question.source || 'audience';
    
    const badges = {
      organizer: { icon: 'fas fa-star', label: 'STRATEGIC' },
      mc: { icon: 'fas fa-microphone', label: 'MC' },
      audience: { icon: 'fas fa-users', label: 'AUDIENCE' }
    };

    const badge = badges[source] || badges.audience;

    return (
      <span className={`source-badge ${source}`}>
        <i className={badge.icon}></i>
        {badge.label}
      </span>
    );
  };

  // Get priority badge if it exists
  const getPriorityBadge = () => {
    if (!question.priority) return null;
    
    const icons = {
      high: 'fas fa-exclamation-circle',
      medium: 'fas fa-minus-circle',
      low: 'fas fa-check-circle'
    };

    return (
      <span className={`priority-badge ${question.priority.toLowerCase()}`}>
        <i className={icons[question.priority.toLowerCase()]}></i>
        {question.priority.toUpperCase()}
      </span>
    );
  };

  return (
    <div className={`question-item ${question.answered ? 'answered' : ''} source-${question.source || 'audience'}`}>
      <div className="question-header">
        <div className="question-meta">
          {getSourceBadge()}
          {getPriorityBadge()}
          <span className="question-author">
            <i className="far fa-user"></i>
            {question.author}
          </span>
        </div>
        <span className="question-time">
          <i className="far fa-clock"></i>
          {displayTime}
        </span>
      </div>
      
      {question.notes && question.source === 'organizer' && (
        <div className="question-notes">
          <i className="fas fa-lightbulb"></i>
          <span>{question.notes}</span>
        </div>
      )}
      
      <div className="question-text">{question.question}</div>
      
      {question.category && (
        <div className="question-category">
          <i className="fas fa-tag"></i>
          {question.category}
        </div>
      )}
      
      <div className="question-actions">
        <button
          className="action-btn mark-answered"
          onClick={() => onToggleAnswered(question.id, question.answered)}
        >
          <i className={question.answered ? 'fas fa-undo' : 'fas fa-check'}></i>
          {question.answered ? 'Mark as Pending' : 'Mark as Answered'}
        </button>
        {onDelete && (
          <button
            className="action-btn delete-btn"
            onClick={() => onDelete(question.id)}
          >
            <i className="fas fa-trash-alt"></i>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

export default QuestionItem;