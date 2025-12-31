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
      case 'segment': return <i className="fas fa-clipboard-list text-primary"></i>;
      case 'qa': return <i className="fas fa-question-circle text-blue-500"></i>;
      case 'break': return <i className="fas fa-mug-hot text-amber-500"></i>;
      case 'performance': return <i className="fas fa-microphone text-purple-500"></i>;
      default: return <i className="fas fa-thumbtack text-neutral-400"></i>;
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
    return programItems.reduce((total, item) => total + (parseInt(item.duration, 10) || 0), 0);
  };

  const getCompletedCount = () => {
    return programItems.filter(item => item.status === 'completed').length;
  };

  if (programItems.length === 0) {
    return null; // Don't show anything if there's no program
  }

  return (
    <div className="bg-white border border-black/[0.08] rounded-2xl sm:rounded-xl p-8 lg:p-7 md:p-6 sm:p-4 mb-10 md:mb-8 sm:mb-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="flex flex-col gap-3 mb-6 sm:mb-5">
        <h3 className="m-0 text-[1.3rem] md:text-[1.2rem] sm:text-[1.1rem] text-neutral-800 font-bold flex items-center gap-2.5">
          <i className="fas fa-calendar-day text-primary text-[1.1rem] sm:text-base"></i> Event Program
        </h3>
        <div className="flex items-center gap-4 sm:gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 text-[0.85rem] sm:text-[0.8rem] text-neutral-600 font-semibold">
            <i className="fas fa-clock text-primary text-[0.75rem]"></i> {getTotalDuration()}m total
          </span>
          <span className="flex items-center gap-1.5 text-[0.85rem] sm:text-[0.8rem] text-neutral-600 font-semibold">
            <i className="fas fa-check-circle text-emerald-500 text-[0.75rem]"></i> {getCompletedCount()}/{programItems.length} done
          </span>
        </div>
      </div>

      {/* Current/Next Item Highlight */}
      {currentItem && (
        <div className="bg-primary/10 border-2 border-primary/25 rounded-xl sm:rounded-lg p-5 sm:p-4 mb-6 sm:mb-5 relative overflow-hidden">
          <div className="inline-flex items-center py-1 px-3 sm:py-0.5 sm:px-2.5 bg-primary rounded-full text-white text-[0.7rem] sm:text-[0.65rem] font-bold uppercase tracking-wide mb-3 sm:mb-2">
            {currentItem.status === 'in_progress' ? 'Now' : 'Up Next'}
          </div>
          <div className="relative z-10">
            <div className="flex items-start gap-2.5 mb-2">
              <span className="text-xl sm:text-lg flex-shrink-0">{getTypeIcon(currentItem.type)}</span>
              <h4 className="m-0 text-[1.1rem] sm:text-base text-neutral-800 font-bold leading-snug flex-1 min-w-0 break-words">{currentItem.title}</h4>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 py-1 px-2.5 sm:py-0.5 sm:px-2 bg-black/[0.05] border border-black/[0.1] rounded-full text-neutral-700 text-[0.8rem] sm:text-[0.75rem] font-semibold">
                <i className="fas fa-clock text-[0.7rem]"></i> {parseInt(currentItem.duration, 10) || 0}m
              </span>
            </div>
            {currentItem.description && (
              <p className="m-0 text-neutral-600 text-[0.9rem] sm:text-[0.85rem] leading-relaxed">{currentItem.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Program Schedule */}
      <div className="mt-6 sm:mt-5">
        <h4 className="m-0 mb-4 sm:mb-3 text-[1rem] sm:text-[0.95rem] text-neutral-800 font-semibold pb-2.5 border-b border-black/[0.08]">Full Schedule</h4>
        <div className="flex flex-col gap-0">
          {programItems.map((item, index) => (
            <div
              key={item.id}
              className={`grid grid-cols-[32px_1fr] sm:grid-cols-[28px_1fr] gap-3 sm:gap-2.5 py-3.5 sm:py-3 border-b border-black/[0.05] last:border-b-0 ${item.status === 'in_progress' ? 'bg-primary/[0.05] -mx-4 px-4 sm:-mx-3 sm:px-3 rounded-lg' : ''} ${item.status === 'completed' ? 'opacity-60' : ''}`}
            >
              <div className="flex flex-col items-center pt-0.5">
                <div className={`w-7 h-7 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold text-[0.8rem] sm:text-[0.75rem] flex-shrink-0 ${item.status === 'completed' ? 'bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-600' : 'bg-primary text-white'} ${item.status === 'in_progress' ? 'shadow-[0_0_0_3px_rgba(255,107,53,0.15)] animate-pulse' : ''}`}>
                  {item.status === 'completed' ? (
                    <i className="fas fa-check text-[0.6rem]"></i>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                {index < programItems.length - 1 && <div className="flex-1 w-0.5 bg-black/10 mt-1.5 min-h-[16px]"></div>}
              </div>

              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-start gap-2 mb-1.5">
                  <span className="text-base sm:text-[0.9rem] flex-shrink-0">{getTypeIcon(item.type)}</span>
                  <span className="text-[0.95rem] sm:text-[0.875rem] font-semibold text-neutral-800 leading-snug flex-1 min-w-0 break-words">{item.title}</span>
                  {item.status === 'in_progress' && (
                    <span className="py-0.5 px-2 bg-red-500 rounded-lg text-white text-[0.6rem] font-bold uppercase tracking-wide animate-pulse flex-shrink-0">LIVE</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="py-0.5 px-2 bg-primary/10 border border-primary/20 rounded-lg text-primary text-[0.7rem] sm:text-[0.65rem] font-semibold uppercase">{getTypeLabel(item.type)}</span>
                  <span className="flex items-center gap-1 text-neutral-500 text-[0.8rem] sm:text-[0.75rem] font-medium">
                    <i className="fas fa-clock text-[0.65rem]"></i> {parseInt(item.duration, 10) || 0}m
                  </span>
                </div>

                {item.description && (
                  <p className="m-0 mt-2 text-neutral-500 text-[0.85rem] sm:text-[0.8rem] leading-relaxed">{item.description}</p>
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
