// src/Components/MCProgramView.jsx
import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../Firebase/config';

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

  // Commented out unused function - may be needed later for statistics
  // const getTotalDuration = () => {
  //   return programItems.reduce((total, item) => total + (item.duration || 0), 0);
  // };

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
    <div className="bg-white border border-black/10 rounded-[20px] p-10 lg:p-8 md:p-6 mt-8 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <div className="flex justify-between items-start mb-8 flex-wrap gap-4 lg:flex-col lg:items-start">
        <div>
          <h3 className="m-0 mb-2 text-[1.6rem] md:text-[1.4rem] text-neutral-800 font-bold">Event Program</h3>
          <p className="m-0 text-neutral-500 text-[0.95rem]">{eventTitle}</p>
        </div>
        <div className="flex gap-4 items-center md:w-full md:justify-between">
          <span className="inline-flex items-center gap-2 py-2 px-4 bg-emerald-500/10 border border-emerald-500/25 rounded-[20px] text-emerald-600 text-[0.9rem] md:text-[0.85rem] font-semibold">
            <i className="fas fa-check-circle text-[0.85rem]"></i> {getCompletedCount()}/{programItems.length}
          </span>
          <span className="inline-flex items-center gap-2 py-2 px-4 bg-emerald-500/10 border border-emerald-500/25 rounded-[20px] text-emerald-600 text-[0.9rem] md:text-[0.85rem] font-semibold">
            <i className="fas fa-clock text-[0.85rem]"></i> {getRemainingDuration()} mins left
          </span>
        </div>
      </div>

      {programItems.length === 0 ? (
        <div className="text-center py-12 px-4 text-neutral-500">
          <div className="text-[4rem] mb-4 opacity-30">📋</div>
          <p className="m-0 text-base text-neutral-500">No program created yet</p>
        </div>
      ) : (
        <>
          {/* Current Item Card */}
          {currentItem && currentItem.status !== 'completed' && (
            <div className="bg-primary/[0.08] border-2 border-primary/25 rounded-2xl p-8 lg:p-6 md:p-5 mb-8 relative overflow-hidden before:content-[''] before:absolute before:-top-1/2 before:-right-[10%] before:w-[300px] before:h-[300px] before:bg-primary/[0.05] before:rounded-full before:pointer-events-none">
              <div className="inline-flex items-center gap-2 py-1.5 px-4 bg-primary rounded-[20px] text-white text-[0.75rem] font-bold uppercase tracking-wide mb-5">
                Current Item
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[2rem] md:text-[1.6rem] flex-shrink-0">{getTypeIcon(currentItem.type)}</span>
                  <h4 className="m-0 text-[1.5rem] lg:text-[1.3rem] md:text-[1.2rem] text-neutral-800 font-bold">{currentItem.title}</h4>
                </div>

                {currentItem.description && (
                  <p className="m-0 mb-4 text-neutral-600 text-base leading-relaxed">{currentItem.description}</p>
                )}

                {currentItem.notes && (
                  <div className="bg-amber-500/[0.12] border border-amber-500/30 rounded-[10px] p-4 mb-5 text-amber-900 text-[0.95rem] flex items-start gap-3">
                    <i className="fas fa-lightbulb text-amber-500 text-lg mt-0.5 flex-shrink-0"></i>
                    <span><strong className="text-amber-950">Note:</strong> {currentItem.notes}</span>
                  </div>
                )}

                <div className="mb-6">
                  <span className="inline-flex items-center gap-2 py-2 px-4 bg-black/[0.05] border border-black/[0.12] rounded-[20px] text-neutral-800 text-[0.95rem] font-semibold">
                    <i className="fas fa-clock text-[0.9rem]"></i> {currentItem.duration} minutes
                  </span>
                </div>

                <div className="flex gap-4 md:flex-col">
                  {currentItem.status === 'pending' && (
                    <button
                      onClick={() => updateItemStatus(currentItem.id, 'in_progress')}
                      className="inline-flex items-center justify-center gap-2 py-3.5 px-7 rounded-[10px] text-base font-semibold cursor-pointer transition-all border-2 bg-emerald-500 border-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)] md:w-full hover:bg-emerald-600 hover:border-emerald-600 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(16,185,129,0.3)]"
                    >
                      <i className="fas fa-play"></i> Start This Item
                    </button>
                  )}
                  {currentItem.status === 'in_progress' && (
                    <button
                      onClick={() => updateItemStatus(currentItem.id, 'completed')}
                      className="inline-flex items-center justify-center gap-2 py-3.5 px-7 rounded-[10px] text-base font-semibold cursor-pointer transition-all border-2 bg-primary border-primary text-white shadow-[0_4px_12px_rgba(255,107,53,0.25)] md:w-full hover:bg-orange-600 hover:border-orange-600 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(255,107,53,0.3)]"
                    >
                      <i className="fas fa-check"></i> Mark as Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Filter Toggle */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-black/[0.08] md:flex-col md:items-start md:gap-3">
            <h4 className="m-0 text-[1.2rem] text-neutral-800 font-semibold">Program Timeline</h4>
            <label className="flex items-center gap-2 text-neutral-600 text-[0.9rem] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="w-[18px] h-[18px] cursor-pointer"
              />
              <span>Show completed items</span>
            </label>
          </div>

          {/* Program Timeline */}
          <div className="flex flex-col gap-4 mb-8">
            {filteredItems.map((item) => {
              const isActive = item.id === currentItemId;
              const isCurrent = item.status === 'in_progress';

              return (
                <div
                  key={item.id}
                  className={`grid grid-cols-[50px_1fr] md:grid-cols-1 gap-4 items-start bg-white border border-black/[0.08] rounded-xl p-5 cursor-pointer transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:bg-primary/[0.02] hover:border-primary/20 hover:shadow-[0_4px_12px_rgba(255,107,53,0.08)] ${isActive ? 'bg-primary/[0.05] border-primary/30' : ''} ${item.status === 'completed' ? 'opacity-60' : ''}`}
                  onClick={() => setCurrentItemId(item.id)}
                >
                  <div className="relative pt-1">
                    <span className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-[1.05rem] ${item.status === 'completed' ? 'bg-emerald-500/20 border-2 border-emerald-500/40' : 'bg-primary'}`}>
                      {item.order + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-3 gap-4 flex-wrap md:flex-col md:items-start">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-[1.4rem] md:text-[1.2rem] flex-shrink-0">{getTypeIcon(item.type)}</span>
                        <h5 className="m-0 text-[1.1rem] md:text-base text-neutral-800 font-semibold break-words">{item.title}</h5>
                        {isCurrent && (
                          <span className="py-1 px-3 bg-red-500 rounded-xl text-white text-[0.7rem] font-bold uppercase tracking-wide animate-pulse">LIVE</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 md:w-full md:justify-between">
                        <span className="inline-flex items-center gap-1.5 text-neutral-500 text-[0.9rem] font-medium">
                          <i className="fas fa-clock text-[0.85rem]"></i> {item.duration}m
                        </span>
                        <span className={`py-1 px-3 rounded-xl text-[0.75rem] font-semibold uppercase tracking-wide ${
                          item.status === 'pending' ? 'bg-neutral-400/15 border border-neutral-400/25 text-neutral-500' :
                          item.status === 'in_progress' ? 'bg-blue-500/15 border border-blue-500/30 text-blue-600' :
                          'bg-emerald-500/15 border border-emerald-500/25 text-emerald-600'
                        }`}>
                          {item.status === 'pending' && 'Upcoming'}
                          {item.status === 'in_progress' && 'In Progress'}
                          {item.status === 'completed' && 'Completed'}
                        </span>
                      </div>
                    </div>

                    {item.description && (
                      <p className="m-0 mb-3 text-neutral-600 text-[0.95rem] leading-relaxed">{item.description}</p>
                    )}

                    {item.notes && (
                      <div className="bg-amber-500/10 border border-amber-500/25 rounded-lg p-3 text-amber-900 text-[0.9rem] flex items-start gap-2 mb-3">
                        <i className="fas fa-sticky-note text-amber-500 mt-0.5 flex-shrink-0"></i> {item.notes}
                      </div>
                    )}

                    {/* Quick Actions */}
                    {item.status !== 'completed' && (
                      <div className="flex gap-3 mt-3 sm:flex-col">
                        {item.status === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateItemStatus(item.id, 'in_progress');
                            }}
                            className="inline-flex items-center gap-1.5 py-2 px-4 bg-primary/[0.08] border border-primary/25 rounded-lg text-primary text-[0.85rem] font-semibold cursor-pointer transition-all sm:w-full sm:justify-center hover:bg-primary/15 hover:border-primary/40 hover:text-orange-600"
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
                            className="inline-flex items-center gap-1.5 py-2 px-4 bg-emerald-500/[0.08] border border-emerald-500/25 rounded-lg text-emerald-600 text-[0.85rem] font-semibold cursor-pointer transition-all sm:w-full sm:justify-center hover:bg-emerald-500/15 hover:border-emerald-500/40 hover:text-emerald-700"
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
          <div className="bg-primary/[0.02] border border-black/[0.08] rounded-xl p-6">
            <div className="text-neutral-600 text-[0.9rem] font-semibold mb-3">
              Overall Progress: {getCompletedCount()} of {programItems.length} items completed
            </div>
            <div className="w-full h-3 bg-black/[0.05] rounded-md overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-md transition-all duration-500"
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
