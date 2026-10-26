import React from 'react';
import { StatusBadge } from '../US_Creator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

const IdeaHistoryPanel = ({
  ideas,
  selectedIdea,
  pollingIds,
  loading,
  error,
  onSelect,
  onRefresh,
  onNewIdea,
  hasProject,
}) => {
  const [viewIdea, setViewIdea] = React.useState(null);

  return (
<aside className="w-72 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col h-full">

  {/* Header */}
  <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
    <div>
      <h2 className="text-sm font-semibold text-gray-900 ">Idea History</h2>
      {hasProject && (
        <p className="text-xs text-gray-500 mt-0.5">
          {loading
            ? 'Loading...'
            : `${ideas.length} idea${ideas.length !== 1 ? 's' : ''}`}
        </p>
      )}
    </div>

    {hasProject && (
      <div className="flex items-center gap-1">
        <button
          onClick={onRefresh}
          disabled={loading}
          title="Refresh"
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-md transition"
        >
          ↻
        </button>
        <button
          onClick={onNewIdea}
          title="New Idea"
          className="w-8 h-8 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md transition border border-blue-200 text-lg leading-none"
        >
          +
        </button>
      </div>
    )}
  </div>

  {/* Body */}
  <div className="flex-1 overflow-y-auto py-2">

    {!hasProject && (
      <p className="px-4 py-8 text-center text-gray-400 text-xs">
        Select a project to view ideas
      </p>
    )}

    {hasProject && error && (
      <div className="px-4 py-4 text-center">
        <p className="text-red-500 text-xs mb-2">Failed to refresh ideas</p>
        <button
          onClick={onRefresh}
          className="text-blue-600 hover:text-blue-500 text-xs underline"
        >
          Try again
        </button>
      </div>
    )}

    {hasProject && loading && !error && (
      <div className="space-y-2 px-3 py-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse bg-gray-200 rounded-lg h-20"
          />
        ))}
      </div>
    )}

    {/* Ideas List */}
    {hasProject && !loading && !error && ideas.length > 0 && (
      <ul className="space-y-1 px-2">
        {[...ideas]
          .sort((a, b) => b.id - a.id)
          .map((idea) => {
            const isSelected = selectedIdea?.id === idea.id;
            const isPolling = pollingIds.has(idea.id);

            return (
              <li key={idea.id}>
                <button
                  onClick={() => onSelect(idea)}
                  className={`w-full text-left rounded-lg px-3 py-3 transition-all duration-150 border ${
                    isSelected
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-transparent hover:bg-gray-100'
                  }`}
                >
                  {/* Top Row */}
                  <div className="flex items-center justify-between mb-2">
                    <StatusBadge
                      status={isPolling ? 'inprogress' : idea.status}
                    />

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewIdea(idea);
                        }}
                        className="text-gray-400 hover:text-blue-600 transition"
                        title="View full input"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>

                      {idea.created_at && (
                        <span className="text-xs text-gray-500">
                          {fmt(idea.created_at)}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 font-mono">
                        #{idea.id}
                      </span>
                    </div>
                  </div>

                  {/* Short Text */}
                  <p
                    className={`text-xs leading-relaxed line-clamp-2 ${
                      isSelected
                        ? 'text-gray-800'
                        : 'text-gray-600'
                    }`}
                  >
                    {idea.input || idea.summary || 'No description'}
                  </p>

                  {/* Processing Indicator */}
                  {isPolling && isSelected && (
                    <div className="mt-2 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                        <span className="text-xs text-blue-600 animate-pulse">
                          AI agent working...
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-400 flex gap-2">
                        <span className="animate-pulse">Analyzing</span>
                        <span className="animate-pulse [animation-delay:0.3s]">Thinking</span>
                        <span className="animate-pulse [animation-delay:0.6s]">Generating</span>
                      </div>
                    </div>
                  )}
                </button>
              </li>
            );
          })}
      </ul>
    )}
  </div>

  {/* View Input Modal */}
{viewIdea && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-[1px]">
    
    <div className="bg-white w-[700px] max-h-[80vh] rounded-xl border border-gray-200 shadow-2xl flex flex-col">

      {/* Modal Header */}
<div className="flex items-center justify-between px-8 py-6 border-b border-slate-50 bg-white rounded-t-[24px]">
  <div className="flex flex-col">
    <h3 className="text-lg font-black text-slate-900 tracking-tight">
      Provided Content
    </h3>
    <div className="flex items-center gap-2 mt-0.5">
      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
      <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">
        Reference ID: #{viewIdea.id}
      </span>
    </div>
  </div>

  <button
    onClick={() => setViewIdea(null)}
    className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-200 border border-transparent hover:border-slate-100"
  >
    <span className="text-lg">✕</span>
  </button>
</div>

      {/* Modal Content */}
      <div className="p-5 overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
        {viewIdea.input || (
          <span className="text-gray-400 italic">No input available</span>
        )}
      </div>

    </div>
  </div>
)}
</aside>
  );
};

export default IdeaHistoryPanel;