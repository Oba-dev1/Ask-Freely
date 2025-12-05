// src/Components/ParticipantProgramView.jsx
import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../Firebase/config';
import './ParticipantProgramView.css';

function ParticipantProgramView({ eventId }) {
  const [programItems, setProgramItems] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);

  useEffect(() => {
    if (!eventId) return;

    const programRef = ref(database, `programs/${eventId}`);
    const unsubscribe = onValue(programRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const items = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .sort((a, b) => a.order - b.order);
        setProgramItems(items);

        // Find the current in-progress item or next pending item
        const inProgress = items.find(item => item.status === 'in_progress');
        const nextPending = items.find(item => item.status === 'pending');
        setCurrentItem(inProgress || nextPending || null);
      } else {
        setProgramItems([]);
      }
    });

    return () => unsubscribe();
  }, [eventId]);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'segment': return '📋';
      case 'qa': return '❓';
      case 'break': return '☕';
      case 'performance': return '🎤';
      default: return '📌';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'segment': return 'Segment';
      case 'qa': return 'Q&A Session';
      case 'break': return 'Break';
      case 'performance': return 'Performance';
      default: return 'Other';
    }
  };

  const getTotalDuration = () => {
    return programItems.reduce((total, item) => total + (item.duration || 0), 0);
  };

  const getCompletedCount = () => {
    return programItems.filter(item => item.status === 'completed').length;
  };

  if (programItems.length === 0) {
    return null; // Don't show anything if there's no program
  }

  return (
    <div className="participant-program">
      <div className="participant-program-header">
        <h3>
          <i className="fas fa-calendar-day"></i> Event Program
        </h3>
        <div className="program-meta">
          <span className="program-duration">
            <i className="fas fa-clock"></i> {getTotalDuration()} minutes
          </span>
          <span className="program-progress">
            {getCompletedCount()} / {programItems.length} completed
          </span>
        </div>
      </div>

      {/* Current/Next Item Highlight */}
      {currentItem && (
        <div className="current-highlight">
          <div className="current-badge">
            {currentItem.status === 'in_progress' ? 'Now' : 'Up Next'}
          </div>
          <div className="current-item-content">
            <div className="current-item-header">
              <span className="current-item-icon">{getTypeIcon(currentItem.type)}</span>
              <h4>{currentItem.title}</h4>
              <span className="current-item-duration">
                <i className="fas fa-clock"></i> {currentItem.duration} min
              </span>
            </div>
            {currentItem.description && (
              <p className="current-item-description">{currentItem.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Program Schedule */}
      <div className="program-schedule">
        <h4 className="schedule-heading">Full Schedule</h4>
        <div className="schedule-list">
          {programItems.map((item, index) => (
            <div
              key={item.id}
              className={`schedule-item ${item.status === 'in_progress' ? 'active' : ''} ${item.status === 'completed' ? 'completed' : ''}`}
            >
              <div className="schedule-item-marker">
                <div className="marker-dot">
                  {item.status === 'completed' ? (
                    <i className="fas fa-check"></i>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                {index < programItems.length - 1 && <div className="marker-line"></div>}
              </div>

              <div className="schedule-item-content">
                <div className="schedule-item-header">
                  <div className="schedule-item-title">
                    <span className="schedule-item-icon">{getTypeIcon(item.type)}</span>
                    <span className="schedule-item-name">{item.title}</span>
                    {item.status === 'in_progress' && (
                      <span className="live-indicator">LIVE</span>
                    )}
                  </div>
                  <div className="schedule-item-meta">
                    <span className="item-type">{getTypeLabel(item.type)}</span>
                    <span className="item-duration">
                      <i className="fas fa-clock"></i> {item.duration}m
                    </span>
                  </div>
                </div>

                {item.description && (
                  <p className="schedule-item-description">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ParticipantProgramView;
