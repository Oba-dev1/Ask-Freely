import React from 'react';
import './QuestionItem.css';

function QuestionItem({ question, onToggleAnswered, onDelete }) {
  const displayTime = question.timestamp 
    ? new Date(question.timestamp).toLocaleString() 
    : 'Just now';

  return (
    <div className={`question-item ${question.answered ? 'answered' : ''}`}>
      <div className="question-header">
        <span className="question-author">{question.author}</span>
        <span className="question-time">{displayTime}</span>
      </div>
      <div className="question-text">{question.question}</div>
      <div className="question-actions">
        <button
          className="action-btn mark-answered"
          onClick={() => onToggleAnswered(question.id, question.answered)}
        >
          {question.answered ? 'Mark as Unanswered' : 'Mark as Answered'}
        </button>
        <button
          className="action-btn delete-btn"
          onClick={() => onDelete(question.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default QuestionItem;