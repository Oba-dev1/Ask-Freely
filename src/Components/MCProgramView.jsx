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
          .map((key) => ({
            id: key,
            ...data[key],
            // Default status to 'pending' if not set (for backwards compatibility)
            status: data[key].status || 'pending'
          }))
          .sort((a, b) => a.order - b.order);
        setProgramItems(items);

        // Auto-set current item to first in_progress or pending
        if (!currentItemId) {
          const active = items.find(item => item.status === 'in_progress');
          const pending = items.find(item => item.status === 'pending' || !item.status);
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
      const updatePath = `programs/${eventId}/${itemId}`;
      await update(ref(database, updatePath), {
        status,
        ...(status === 'in_progress' && { startedAt: new Date().toISOString() }),
        ...(status === 'completed' && { completedAt: new Date().toISOString() })
      });

      // If marking as completed, automatically start the next pending item
      if (status === 'completed') {
        const currentIndex = programItems.findIndex(item => item.id === itemId);
        const nextItem = programItems[currentIndex + 1];
        if (nextItem && nextItem.status === 'pending') {
          // Auto-start the next item
          await update(ref(database, `programs/${eventId}/${nextItem.id}`), {
            status: 'in_progress',
            startedAt: new Date().toISOString()
          });
          setCurrentItemId(nextItem.id);
        }
      }
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'segment': return <i className="fas fa-clipboard-list text-primary"></i>;
      case 'qa': return <i className="fas fa-question-circle text-blue-500"></i>;
      case 'break': return <i className="fas fa-mug-hot text-amber-500"></i>;
      case 'performance': return <i className="fas fa-microphone text-purple-500"></i>;
      default: return <i className="fas fa-thumbtack text-neutral-400"></i>;
    }
  };

  const getCompletedCount = () => {
    return programItems.filter(item => item.status === 'completed').length;
  };

  const getRemainingDuration = () => {
    return programItems
      .filter(item => item.status !== 'completed')
      .reduce((total, item) => total + (parseInt(item.duration, 10) || 0), 0);
  };

  const getTotalDuration = () => {
    return programItems.reduce((total, item) => total + (parseInt(item.duration, 10) || 0), 0);
  };

  // Check if program has started (any item is in_progress or completed)
  const isProgramStarted = () => {
    return programItems.some(item => item.status === 'in_progress' || item.status === 'completed');
  };

  // Check if program is complete (all items completed)
  const isProgramComplete = () => {
    return programItems.length > 0 && programItems.every(item => item.status === 'completed');
  };

  // Start the program by setting the first pending item to in_progress
  const startProgram = async () => {
    const firstPendingItem = programItems.find(item => item.status === 'pending');
    if (firstPendingItem) {
      try {
        await updateItemStatus(firstPendingItem.id, 'in_progress');
        setCurrentItemId(firstPendingItem.id);
      } catch (error) {
        console.error('Error starting program:', error);
      }
    }
  };

  const filteredItems = showCompleted
    ? programItems
    : programItems.filter(item => item.status !== 'completed');

  const currentItem = programItems.find(item => item.id === currentItemId);

  return (
    <div className="bg-white border border-black/10 rounded-[20px] p-10 lg:p-8 md:p-6 sm:p-4 mt-8 shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="flex flex-col gap-3 mb-8">
        <h3 className="m-0 text-[1.6rem] md:text-[1.4rem] sm:text-[1.2rem] text-neutral-800 font-bold text-center sm:text-left">Event Program</h3>
        <div className="flex gap-2 items-center flex-wrap justify-center sm:justify-start">
          <span className="inline-flex items-center gap-1.5 py-1.5 px-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-emerald-600 text-[0.8rem] sm:text-[0.75rem] font-semibold whitespace-nowrap">
            <i className="fas fa-check-circle text-[0.7rem]"></i> {getCompletedCount()}/{programItems.length}
          </span>
          <span className="inline-flex items-center gap-1.5 py-1.5 px-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-emerald-600 text-[0.8rem] sm:text-[0.75rem] font-semibold whitespace-nowrap">
            <i className="fas fa-clock text-[0.7rem]"></i> {getRemainingDuration()}m left
          </span>
        </div>
        {eventTitle && (
          <p className="m-0 text-neutral-500 text-[0.95rem] sm:text-[0.85rem] text-center sm:text-left">{eventTitle}</p>
        )}
      </div>

      {programItems.length === 0 ? (
        <div className="text-center py-12 px-4 text-neutral-500">
          <div className="text-[4rem] mb-4 opacity-30">📋</div>
          <p className="m-0 text-base text-neutral-500">No program created yet</p>
        </div>
      ) : (
        <>
          {/* Program Complete Hero - Shows when all items are completed */}
          {isProgramComplete() && (
            <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-2 border-emerald-500/25 rounded-2xl p-8 sm:p-5 mb-8 text-center">
              <div className="w-16 h-16 sm:w-14 sm:h-14 mx-auto mb-4 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <i className="fas fa-check-circle text-emerald-600 text-2xl sm:text-xl"></i>
              </div>
              <h4 className="m-0 mb-2 text-[1.4rem] sm:text-[1.2rem] text-neutral-800 font-bold">Program Complete!</h4>
              <p className="m-0 text-neutral-600 text-[0.95rem] sm:text-[0.9rem] max-w-sm mx-auto leading-relaxed px-2">
                All {programItems.length} items have been completed. Great job running the event!
              </p>
            </div>
          )}

          {/* Current Item Card - Shows when program is in progress */}
          {isProgramStarted() && !isProgramComplete() && currentItem && currentItem.status !== 'completed' && (
            <div className="bg-primary/[0.08] border-2 border-primary/25 rounded-2xl p-6 sm:p-5 mb-8">
              <div className="inline-flex items-center gap-2 py-1.5 px-3 bg-primary rounded-2xl text-white text-[0.7rem] sm:text-[0.65rem] font-bold uppercase tracking-wide mb-4">
                Current Item
              </div>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="text-[1.6rem] sm:text-[1.4rem] flex-shrink-0">{getTypeIcon(currentItem.type)}</span>
                <h4 className="m-0 text-[1.3rem] sm:text-[1.1rem] text-neutral-800 font-bold">{currentItem.title}</h4>
              </div>

              {currentItem.description && (
                <p className="m-0 mb-3 text-neutral-600 text-[0.95rem] sm:text-[0.9rem] leading-relaxed">{currentItem.description}</p>
              )}

              {currentItem.notes && (
                <div className="bg-amber-500/10 border border-amber-500/25 rounded-lg p-3 mb-4 text-amber-900 text-[0.9rem] sm:text-[0.85rem] flex items-start gap-2">
                  <i className="fas fa-lightbulb text-amber-500 mt-0.5 flex-shrink-0"></i>
                  <span><strong>Note:</strong> {currentItem.notes}</span>
                </div>
              )}

              <div className="mb-4">
                <span className="inline-flex items-center gap-2 py-1.5 px-3 bg-black/[0.05] border border-black/10 rounded-2xl text-neutral-700 text-[0.85rem] font-semibold">
                  <i className="fas fa-clock text-[0.8rem]"></i> {parseInt(currentItem.duration, 10) || 0} min
                </span>
              </div>

              <div className="flex gap-3 sm:flex-col">
                {currentItem.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => updateItemStatus(currentItem.id, 'in_progress')}
                    className="inline-flex items-center justify-center gap-2 py-3 px-6 sm:w-full rounded-lg text-[0.95rem] font-semibold cursor-pointer transition-all border-2 bg-emerald-500 border-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)] hover:bg-emerald-600 hover:border-emerald-600 hover:-translate-y-0.5"
                  >
                    <i className="fas fa-play"></i> Start This Item
                  </button>
                )}
                {currentItem.status === 'in_progress' && (
                  <button
                    type="button"
                    onClick={() => updateItemStatus(currentItem.id, 'completed')}
                    className="inline-flex items-center justify-center gap-2 py-3 px-6 sm:w-full rounded-lg text-[0.95rem] font-semibold cursor-pointer transition-all border-2 bg-primary border-primary text-white shadow-[0_4px_12px_rgba(255,107,53,0.25)] hover:bg-orange-600 hover:border-orange-600 hover:-translate-y-0.5"
                  >
                    <i className="fas fa-check"></i> Mark as Complete
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Filter Toggle */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-black/[0.08] sm:flex-col sm:items-start sm:gap-3">
            <h4 className="m-0 text-[1.2rem] sm:text-[1.1rem] text-neutral-800 font-semibold">Program Timeline</h4>
            <label className="flex items-center gap-2 text-neutral-600 text-[0.85rem] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="w-[18px] h-[18px] cursor-pointer"
              />
              <span>Show completed</span>
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
                  className={`grid grid-cols-[50px_1fr] md:grid-cols-1 gap-4 items-start bg-white border border-black/[0.08] rounded-xl p-5 sm:p-4 cursor-pointer transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:bg-primary/[0.02] hover:border-primary/20 hover:shadow-[0_4px_12px_rgba(255,107,53,0.08)] overflow-hidden ${isActive ? 'bg-primary/[0.05] border-primary/30' : ''} ${item.status === 'completed' ? 'opacity-60' : ''}`}
                  onClick={() => setCurrentItemId(item.id)}
                >
                  <div className="relative pt-1 md:hidden">
                    <span className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-[1.05rem] ${item.status === 'completed' ? 'bg-emerald-500/20 border-2 border-emerald-500/40' : 'bg-primary'}`}>
                      {item.order + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 overflow-hidden">
                    {/* Title row */}
                    <div className="flex items-start gap-2 mb-2 md:flex-wrap">
                      <span className={`hidden md:flex w-7 h-7 rounded-full items-center justify-center text-white font-bold text-[0.8rem] flex-shrink-0 ${item.status === 'completed' ? 'bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-600' : 'bg-primary'}`}>
                        {item.status === 'completed' ? <i className="fas fa-check text-[0.65rem]"></i> : item.order + 1}
                      </span>
                      <span className="text-lg flex-shrink-0">{getTypeIcon(item.type)}</span>
                      <h5 className="m-0 text-base sm:text-[0.9rem] text-neutral-800 font-semibold leading-snug flex-1 min-w-0 break-words">{item.title}</h5>
                      {isCurrent && (
                        <span className="py-0.5 px-2 bg-red-500 rounded-lg text-white text-[0.65rem] font-bold uppercase tracking-wide animate-pulse flex-shrink-0">LIVE</span>
                      )}
                    </div>
                    {/* Meta row */}
                    <div className="flex items-center gap-2 flex-wrap md:ml-0">
                      <span className="inline-flex items-center gap-1 text-neutral-500 text-[0.8rem] font-medium">
                        <i className="fas fa-clock text-[0.7rem]"></i> {parseInt(item.duration, 10) || 0}m
                      </span>
                      <span className={`py-0.5 px-2 rounded-lg text-[0.7rem] font-semibold uppercase tracking-wide ${
                        item.status === 'pending' ? 'bg-neutral-400/15 text-neutral-500' :
                        item.status === 'in_progress' ? 'bg-blue-500/15 text-blue-600' :
                        'bg-emerald-500/15 text-emerald-600'
                      }`}>
                        {item.status === 'pending' && 'Upcoming'}
                        {item.status === 'in_progress' && 'In Progress'}
                        {item.status === 'completed' && 'Completed'}
                      </span>
                    </div>

                    {item.description && (
                      <p className="m-0 mt-2 text-neutral-600 text-[0.9rem] leading-relaxed">{item.description}</p>
                    )}

                    {item.notes && (
                      <div className="bg-amber-500/10 border border-amber-500/25 rounded-lg p-3 text-amber-900 text-[0.85rem] flex items-start gap-2 mt-3">
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

          {/* Start Program Button - Shows below timeline when program hasn't started */}
          {!isProgramStarted() && (
            <div className="flex justify-center mb-8">
              <button
                type="button"
                onClick={startProgram}
                className="inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-xl text-base font-bold cursor-pointer transition-all border-2 bg-emerald-500 border-emerald-500 text-white shadow-[0_4px_16px_rgba(16,185,129,0.3)] hover:bg-emerald-600 hover:border-emerald-600 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(16,185,129,0.35)] active:translate-y-0"
              >
                <i className="fas fa-play text-sm"></i> Start Program
              </button>
            </div>
          )}

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
