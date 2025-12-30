// src/Components/ParticipantProgramView.jsx
import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../Firebase/config';

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
    <div className="bg-white border border-black/[0.08] rounded-2xl p-8 lg:p-7 md:p-6 sm:p-5 mb-10 md:mb-8 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4 md:flex-col md:items-start">
        <h3 className="m-0 text-[1.4rem] lg:text-[1.3rem] md:text-[1.2rem] text-neutral-800 font-bold flex items-center gap-3">
          <i className="fas fa-calendar-day text-primary text-[1.3rem]"></i> Event Program
        </h3>
        <div className="flex items-center gap-6 sm:flex-col sm:items-start sm:gap-2 md:w-full md:justify-between">
          <span className="flex items-center gap-2 text-[0.9rem] text-neutral-600 font-semibold">
            <i className="fas fa-clock text-primary text-[0.85rem]"></i> {getTotalDuration()} minutes
          </span>
          <span className="flex items-center gap-2 text-[0.9rem] text-neutral-600 font-semibold">
            {getCompletedCount()} / {programItems.length} completed
          </span>
        </div>
      </div>

      {/* Current/Next Item Highlight */}
      {currentItem && (
        <div className="bg-primary/10 border-2 border-primary/25 rounded-[14px] p-6 md:p-5 mb-8 relative overflow-hidden before:content-[''] before:absolute before:-top-1/2 before:-right-[10%] before:w-[300px] before:h-[300px] before:bg-primary/[0.04] before:rounded-full before:pointer-events-none">
          <div className="inline-flex items-center py-1.5 px-4 bg-primary rounded-[20px] text-white text-[0.75rem] font-bold uppercase tracking-wide mb-4">
            {currentItem.status === 'in_progress' ? 'Now' : 'Up Next'}
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3 flex-wrap md:flex-col md:items-start">
              <span className="text-[1.8rem] md:text-[1.5rem]">{getTypeIcon(currentItem.type)}</span>
              <h4 className="m-0 text-[1.3rem] lg:text-[1.2rem] md:text-[1.1rem] text-neutral-800 font-bold flex-1 min-w-0">{currentItem.title}</h4>
              <span className="flex items-center gap-1.5 py-1.5 px-3.5 bg-black/[0.05] border border-black/[0.12] rounded-[20px] text-neutral-800 text-[0.9rem] font-semibold whitespace-nowrap md:self-start">
                <i className="fas fa-clock text-[0.85rem]"></i> {currentItem.duration} min
              </span>
            </div>
            {currentItem.description && (
              <p className="m-0 text-neutral-600 text-[0.95rem] leading-relaxed">{currentItem.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Program Schedule */}
      <div className="mt-8">
        <h4 className="m-0 mb-5 text-[1.1rem] text-neutral-800 font-semibold pb-3 border-b border-black/[0.08]">Full Schedule</h4>
        <div className="flex flex-col gap-0">
          {programItems.map((item, index) => (
            <div
              key={item.id}
              className={`grid grid-cols-[40px_1fr] md:grid-cols-[32px_1fr] gap-4 md:gap-3 py-4 border-b border-black/[0.05] last:border-b-0 transition-all hover:bg-primary/[0.02] hover:-mx-3 hover:px-3 hover:rounded-lg ${item.status === 'in_progress' ? 'bg-primary/[0.05] -mx-3 px-3 rounded-lg border-b-primary/15' : ''} ${item.status === 'completed' ? 'opacity-60' : ''}`}
            >
              <div className="flex flex-col items-center pt-1">
                <div className={`w-9 h-9 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-[0.9rem] md:text-[0.85rem] flex-shrink-0 ${item.status === 'completed' ? 'bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-600' : 'bg-primary text-white'} ${item.status === 'in_progress' ? 'shadow-[0_0_0_4px_rgba(255,107,53,0.15)] animate-pulse' : ''}`}>
                  {item.status === 'completed' ? (
                    <i className="fas fa-check"></i>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                {index < programItems.length - 1 && <div className="flex-1 w-0.5 bg-black/10 mt-2 min-h-[20px]"></div>}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-4 mb-2 flex-wrap md:flex-col md:items-start">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-[1.3rem] md:text-[1.1rem] flex-shrink-0">{getTypeIcon(item.type)}</span>
                    <span className="text-base md:text-[0.95rem] font-semibold text-neutral-800">{item.title}</span>
                    {item.status === 'in_progress' && (
                      <span className="py-0.5 px-2.5 bg-red-500 rounded-xl text-white text-[0.65rem] font-bold uppercase tracking-wide animate-pulse">LIVE</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0 md:w-full md:justify-between">
                    <span className="py-1 px-3 bg-primary/10 border border-primary/25 rounded-xl text-primary text-[0.75rem] md:text-[0.7rem] font-semibold uppercase tracking-wide">{getTypeLabel(item.type)}</span>
                    <span className="flex items-center gap-1.5 text-neutral-500 text-[0.85rem] font-medium whitespace-nowrap">
                      <i className="fas fa-clock text-[0.8rem]"></i> {item.duration}m
                    </span>
                  </div>
                </div>

                {item.description && (
                  <p className="m-0 text-neutral-500 text-[0.9rem] leading-relaxed">{item.description}</p>
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
