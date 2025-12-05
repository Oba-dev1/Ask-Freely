// src/Components/MCProgramView.jsx
import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../Firebase/config';
import './MCProgramView.css';

function MCProgramView({ eventId, eventTitle }) {
  const [programItems, setProgramItems] = useState([]);
  const [currentItemId, setCurrentItemId] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);

  // Load program items
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

        // Auto-set current item to first in_progress or pending
        if (!currentItemId) {
          const active = items.find(item => item.status === 'in_progress');
          const pending = items.find(item => item.status === 'pending');
          if (active) setCurrentItemId(active.id);
          else if (pending) setCurrentItemId(pending.id);
        }
      } else {
        setProgramItems([]);
      }
    });

    return () => unsubscribe();
  }, [eventId, currentItemId]);

  const updateItemStatus = async (itemId, status) => {
    try {
      await update(ref(database, `programs/${eventId}/${itemId}`), {
        status,
        ...(status === 'in_progress' && { startedAt: new Date().toISOString() }),
        ...(status === 'completed' && { completedAt: new Date().toISOString() })
      });

      // If marking as completed, move to next item
      if (status === 'completed') {
        const currentIndex = programItems.findIndex(item => item.id === itemId);
        const nextItem = programItems[currentIndex + 1];
        if (nextItem && nextItem.status === 'pending') {
          setCurrentItemId(nextItem.id);
        }
      }
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'segment': return '📋';
      case 'qa': return '❓';
      case 'break': return '☕';
      case 'performance': return '🎤';
      default: return '📌';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'in_progress': return 'status-active';
      case 'completed': return 'status-completed';
      default: return '';
    }
  };

  const getCompletedCount = () => {
    return programItems.filter(item => item.status === 'completed').length;
  };

  const getTotalDuration = () => {
    return programItems.reduce((total, item) => total + (item.duration || 0), 0);
  };

  const getRemainingDuration = () => {
    return programItems
      .filter(item => item.status !== 'completed')
      .reduce((total, item) => total + (item.duration || 0), 0);
  };

  const filteredItems = showCompleted
    ? programItems
    : programItems.filter(item => item.status !== 'completed');

  const currentItem = programItems.find(item => item.id === currentItemId);

  return (
    <div className="mc-program-view">
      <div className="mc-header">
        <div>
          <h3>Event Program</h3>
          <p className="mc-subtitle">{eventTitle}</p>
        </div>
        <div className="mc-stats">
          <span className="mc-stat">
            <i className="fas fa-check-circle"></i> {getCompletedCount()}/{programItems.length}
          </span>
          <span className="mc-stat">
            <i className="fas fa-clock"></i> {getRemainingDuration()} mins left
          </span>
        </div>
      </div>

      {programItems.length === 0 ? (
        <div className="mc-empty-state">
          <div className="empty-icon">📋</div>
          <p>No program created yet</p>
        </div>
      ) : (
        <>
          {/* Current Item Card */}
          {currentItem && currentItem.status !== 'completed' && (
            <div className="current-item-card">
              <div className="current-badge">Current Item</div>
              <div className="current-content">
                <div className="current-header">
                  <span className="current-icon">{getTypeIcon(currentItem.type)}</span>
                  <h4>{currentItem.title}</h4>
                </div>

                {currentItem.description && (
                  <p className="current-description">{currentItem.description}</p>
                )}

                {currentItem.notes && (
                  <div className="current-notes">
                    <i className="fas fa-lightbulb"></i>
                    <strong>Note:</strong> {currentItem.notes}
                  </div>
                )}

                <div className="current-meta">
                  <span className="current-duration">
                    <i className="fas fa-clock"></i> {currentItem.duration} minutes
                  </span>
                </div>

                <div className="current-actions">
                  {currentItem.status === 'pending' && (
                    <button
                      onClick={() => updateItemStatus(currentItem.id, 'in_progress')}
                      className="mc-btn mc-btn-start"
                    >
                      <i className="fas fa-play"></i> Start This Item
                    </button>
                  )}
                  {currentItem.status === 'in_progress' && (
                    <button
                      onClick={() => updateItemStatus(currentItem.id, 'completed')}
                      className="mc-btn mc-btn-complete"
                    >
                      <i className="fas fa-check"></i> Mark as Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Filter Toggle */}
          <div className="mc-filter-bar">
            <h4>Program Timeline</h4>
            <label className="toggle-completed">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
              />
              <span>Show completed items</span>
            </label>
          </div>

          {/* Program Timeline */}
          <div className="mc-timeline">
            {filteredItems.map((item, index) => {
              const isActive = item.id === currentItemId;
              const isCurrent = item.status === 'in_progress';

              return (
                <div
                  key={item.id}
                  className={`timeline-item ${isActive ? 'timeline-active' : ''} ${item.status === 'completed' ? 'timeline-completed' : ''}`}
                  onClick={() => setCurrentItemId(item.id)}
                >
                  <div className="timeline-marker">
                    <span className="marker-number">{item.order + 1}</span>
                  </div>

                  <div className="timeline-content">
                    <div className="timeline-header">
                      <div className="timeline-title-section">
                        <span className="timeline-icon">{getTypeIcon(item.type)}</span>
                        <h5>{item.title}</h5>
                        {isCurrent && <span className="live-badge">LIVE</span>}
                      </div>
                      <div className="timeline-meta">
                        <span className="timeline-duration">
                          <i className="fas fa-clock"></i> {item.duration}m
                        </span>
                        <span className={`status-badge ${getStatusBadgeClass(item.status)}`}>
                          {item.status === 'pending' && 'Upcoming'}
                          {item.status === 'in_progress' && 'In Progress'}
                          {item.status === 'completed' && 'Completed'}
                        </span>
                      </div>
                    </div>

                    {item.description && (
                      <p className="timeline-description">{item.description}</p>
                    )}

                    {item.notes && (
                      <div className="timeline-notes">
                        <i className="fas fa-sticky-note"></i> {item.notes}
                      </div>
                    )}

                    {/* Quick Actions */}
                    {item.status !== 'completed' && (
                      <div className="timeline-actions">
                        {item.status === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateItemStatus(item.id, 'in_progress');
                            }}
                            className="btn-timeline-action"
                          >
                            <i className="fas fa-play"></i> Start
                          </button>
                        )}
                        {item.status === 'in_progress' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateItemStatus(item.id, 'completed');
                            }}
                            className="btn-timeline-action btn-complete"
                          >
                            <i className="fas fa-check"></i> Complete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="mc-progress">
            <div className="progress-label">
              Overall Progress: {getCompletedCount()} of {programItems.length} items completed
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${(getCompletedCount() / programItems.length) * 100}%`
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default MCProgramView;
