import React, { useState } from 'react';

/*
✨ LIGHT THEME REFINEMENT
- Pure white and slate-50 backgrounds
- Sky Blue (sky-500) primary accents
- Deep slate (slate-900) for headers, soft slate (slate-500) for secondary text
- Crisp borders and refined shadows
*/

const UserStoryAccordion = ({ feature, onPublish, selectedProjectId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('stories');

  const stories = feature.userstory || [];
  const approach = feature.approach || [];
  const featureName = feature.core_feature || `Feature #${feature.id}`;

  return (
    <div className={`rounded-2xl border transition-all duration-300 ${
      isOpen ? 'border-sky-200 bg-white shadow-xl shadow-sky-100/50' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
    }`}>
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center px-6 py-5 text-left transition"
      >
        <div className="flex gap-4 items-center">
          <span className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-90 text-sky-500' : ''}`}>
            <ChevronRight size={16} />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">{featureName}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {stories.length} Stories · {approach.length} Approaches
            </p>
          </div>
        </div>

        {feature.published && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
            Published
          </span>
        )}
      </button>

      {isOpen && (
        <div className="border-t border-slate-100">
          {/* Tabs */}
          <div className="flex gap-1 px-6 pt-5">
            <TabButton active={activeTab === 'stories'} onClick={() => setActiveTab('stories')}>
              Stories ({stories.length})
            </TabButton>
            {approach.length > 0 && (
              <TabButton active={activeTab === 'approach'} onClick={() => setActiveTab('approach')}>
                Approach ({approach.length})
              </TabButton>
            )}
          </div>

          <div className="px-6 py-5 space-y-5">
            {activeTab === 'approach' && (
              <div className="space-y-2">
                {approach.map((step, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-xs text-sky-600 font-bold">{idx + 1}.</span>
                    <p className="text-sm text-slate-700 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'stories' && (
              <div className="space-y-3">
                {stories.map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    onPublish={onPublish}
                    selectedProjectId={selectedProjectId}
                    isFeaturePublished={feature.published}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const StoryCard = ({ story, onPublish, selectedProjectId, isFeaturePublished }) => {
  const [open, setOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async (e) => {
    e.stopPropagation();
    if (publishing || story.published) return;

    setPublishing(true);
    try {
      await onPublish(story.id);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className={`border rounded-xl transition-all ${
      open ? 'border-sky-100 bg-sky-50/20' : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'
    }`}>
      <div className="flex justify-between items-center px-4 py-3.5">
        <button onClick={() => setOpen(!open)} className="flex gap-3 items-center text-left flex-1">
          <span className={`text-slate-300 transition-transform ${open ? 'rotate-90 text-sky-400' : ''}`}>
             <ChevronRight size={14} />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">{story.summary}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Story #{story.id}</p>
          </div>
        </button>

        {!isFeaturePublished && !story.published && (
          <button
            onClick={handlePublish}
            disabled={!selectedProjectId || publishing}
            className="text-xs font-bold px-4 py-1.5 rounded-lg bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-30 transition-all shadow-md shadow-sky-100"
          >
            {publishing ? '...' : 'Publish'}
          </button>
        )}

        {(isFeaturePublished || story.published) && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
            DONE
          </span>
        )}
      </div>

      {open && (
        <div className="px-5 pb-5 border-t border-slate-50 space-y-5 pt-4">
          {story.prerequesites?.length > 0 && (
            <Section label="Prerequisites">
              <ul className="space-y-1.5">
                {story.prerequesites.map((p, i) => (
                  <li key={i} className="text-sm text-slate-600 flex gap-2">
                    <span className="text-sky-300">•</span> {p}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {story.actions?.length > 0 && (
            <Section label="User Actions">
              <ol className="space-y-2">
                {story.actions.map((a, i) => (
                  <li key={i} className="text-sm text-slate-600 flex gap-3">
                    <span className="font-bold text-sky-500/50">{i + 1}</span> {a}
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {story.acceptance_criteria?.length > 0 && (
            <Section label="Acceptance Criteria">
              <ul className="space-y-2 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                {story.acceptance_criteria.map((c, i) => (
                  <li key={i} className="text-sm text-slate-700 flex gap-3">
                    <span className="text-emerald-500 font-bold">✓</span> {c}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      )}
    </div>
  );
};

// --- Helper Components ---

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`text-xs font-bold px-4 py-2 rounded-full transition-all ${
      active ? 'bg-sky-500 text-white shadow-lg shadow-sky-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
    }`}
  >
    {children}
  </button>
);

const Section = ({ label, children }) => (
  <div>
    <p className="text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">{label}</p>
    {children}
  </div>
);

// Simple SVG icon placeholder (or use lucide-react)
const ChevronRight = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);

export default UserStoryAccordion;