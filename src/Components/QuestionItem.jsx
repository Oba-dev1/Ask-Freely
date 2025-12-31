import React from 'react';

function QuestionItem({ question, onToggleAnswered, onDelete }) {
  const displayTime = question.timestamp
    ? new Date(question.timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Just now';

  const source = question.source || 'audience';

  // Determine question source badge
  const getSourceBadge = () => {
    const badges = {
      organizer: { icon: 'fas fa-star', label: 'STRATEGIC', classes: 'bg-amber-500/[0.12] border-amber-500/25 text-amber-600' },
      mc: { icon: 'fas fa-microphone', label: 'MC', classes: 'bg-blue-500/[0.12] border-blue-500/25 text-blue-600' },
      audience: { icon: 'fas fa-users', label: 'AUDIENCE', classes: 'bg-primary/[0.12] border-primary/25 text-primary' }
    };

    const badge = badges[source] || badges.audience;

    return (
      <span className={`py-1 md:py-1.5 px-2.5 md:px-3.5 rounded-[20px] text-[0.65em] md:text-[0.75em] font-bold uppercase tracking-wide flex items-center gap-1 md:gap-1.5 border flex-shrink-0 ${badge.classes}`}>
        <i className={badge.icon}></i>
        <span className="hidden md:inline">{badge.label}</span>
      </span>
    );
  };

  // Get priority badge if it exists
  const getPriorityBadge = () => {
    if (!question.priority) return null;

    const priorityConfig = {
      high: { icon: 'fas fa-exclamation-circle', classes: 'bg-red-500/[0.12] border-red-500/25 text-red-600' },
      medium: { icon: 'fas fa-minus-circle', classes: 'bg-amber-500/[0.12] border-amber-500/25 text-amber-600' },
      low: { icon: 'fas fa-check-circle', classes: 'bg-emerald-500/[0.12] border-emerald-500/25 text-emerald-600' }
    };

    const config = priorityConfig[question.priority.toLowerCase()];

    return (
      <span className={`py-1 md:py-1.5 px-2.5 md:px-3.5 rounded-[20px] text-[0.6em] md:text-[0.7em] font-bold tracking-wide flex items-center gap-1 md:gap-1.5 border flex-shrink-0 ${config.classes}`}>
        <i className={config.icon}></i>
        <span className="hidden md:inline">{question.priority.toUpperCase()}</span>
      </span>
    );
  };

  // Source-specific left border color
  const sourceBorderColor = {
    organizer: 'before:bg-amber-500',
    mc: 'before:bg-blue-500',
    audience: 'before:bg-primary'
  };

  return (
    <div className={`
      bg-white border border-black/[0.08] rounded-xl md:rounded-2xl p-4 md:p-6 transition-all relative overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)] min-w-0
      before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:opacity-0 before:transition-opacity
      hover:bg-primary/[0.02] hover:border-primary/20 hover:translate-x-1 hover:shadow-[0_8px_24px_rgba(255,107,53,0.08)] hover:before:opacity-100
      ${sourceBorderColor[source] || 'before:bg-primary'}
      ${question.answered ? 'opacity-60 bg-emerald-500/[0.03] before:bg-emerald-500 before:opacity-100' : ''}
    `}>
      <div className="flex flex-col md:flex-row justify-between items-start mb-3 md:mb-4 gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-3 flex-wrap flex-1 min-w-0 w-full md:w-auto">
          {getSourceBadge()}
          {getPriorityBadge()}
          <span className="font-semibold text-neutral-800 text-xs md:text-[0.95em] flex items-center gap-1 md:gap-1.5 truncate max-w-[120px] md:max-w-none">
            <i className="far fa-user flex-shrink-0"></i>
            <span className="truncate">{question.author}</span>
          </span>
        </div>
        <span className="text-[0.75em] md:text-[0.85em] text-neutral-500 whitespace-nowrap flex items-center gap-1 md:gap-1.5 flex-shrink-0">
          <i className="far fa-clock"></i>
          {displayTime}
        </span>
      </div>

      {question.notes && question.source === 'organizer' && (
        <div className="bg-amber-500/[0.08] border border-amber-500/20 border-l-[3px] border-l-amber-500 py-2.5 md:py-3.5 px-3 md:px-4 mb-3 md:mb-4 rounded-lg text-xs md:text-[0.9em] text-amber-800 flex items-start gap-2 md:gap-3">
          <i className="fas fa-lightbulb text-amber-500 mt-0.5 flex-shrink-0"></i>
          <span className="break-words min-w-0">{question.notes}</span>
        </div>
      )}

      <div className="text-neutral-800 leading-relaxed mb-3 md:mb-5 text-sm md:text-[1.05em] break-words">{question.question}</div>

      {question.category && (
        <div className="inline-flex items-center gap-1 md:gap-1.5 bg-blue-500/10 border border-blue-500/25 text-blue-600 py-1 md:py-1.5 px-2.5 md:px-3.5 rounded-[20px] text-[0.75em] md:text-[0.85em] mb-3 md:mb-5 font-semibold">
          <i className="fas fa-tag"></i>
          {question.category}
        </div>
      )}

      <div className="flex gap-2 md:gap-3 flex-wrap w-full">
        <button
          className={`
            py-2 md:py-3 px-3 md:px-6 border-none rounded-lg md:rounded-[10px] text-xs md:text-[0.9em] font-semibold cursor-pointer transition-all font-sans flex items-center gap-1.5 md:gap-2 flex-1 justify-center min-w-0
            ${question.answered
              ? 'bg-black/[0.03] border border-black/[0.12] text-neutral-500 hover:bg-black/[0.05] hover:text-neutral-600'
              : 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 hover:bg-emerald-500/[0.18] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(16,185,129,0.2)]'
            }
          `}
          onClick={() => onToggleAnswered(question.id, question.answered)}
        >
          <i className={question.answered ? 'fas fa-undo' : 'fas fa-check'}></i>
          <span className="hidden md:inline">{question.answered ? 'Mark as Pending' : 'Mark as Answered'}</span>
          <span className="md:hidden">{question.answered ? 'Pending' : 'Answered'}</span>
        </button>
        {onDelete && (
          <button
            className="py-2 md:py-3 px-3 md:px-6 border-none rounded-lg md:rounded-[10px] text-xs md:text-[0.9em] font-semibold cursor-pointer transition-all font-sans flex items-center gap-1.5 md:gap-2 bg-red-500/10 border border-red-500/25 text-red-600 hover:bg-red-500/[0.18] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(239,68,68,0.2)] flex-1 justify-center min-w-0"
            onClick={() => onDelete(question.id)}
          >
            <i className="fas fa-trash-alt"></i>
            <span className="hidden md:inline">Delete</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default QuestionItem;