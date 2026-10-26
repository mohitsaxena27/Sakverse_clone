import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useUserStoryFlow } from '../api';
import InputForm from './components/InputForm';
import Loader from './components/Loader';
import Modal from './components/Modal';
import UserStoryAccordion from './components/UserStoryAccordion';
import IdeaHistoryPanel from './components/IdeaHistoryPanel';

/* ─── UI Primitives ─────────────────────────────────────────────────────── */
export const Card = ({ children }) => (
  <div className="bg-sky-100/20 text-black border border-white/5 rounded-2xl p-6 shadow-lg">{children}</div>
);

const EmptyState = ({ title, description, action }) => (
  <div className="flex flex-col items-center justify-center h-full text-center">
    <h2 className="text-2xl font-semibold text-gray-200 mb-2">{title}</h2>
    {description && <p className="text-gray-500 text-sm">{description}</p>}
    {action}
  </div>
);

export const StatusBadge = ({ status }) => {
  const map = {
    Completed: {
      dot: 'bg-emerald-400',
      pill: 'bg-emerald-500/10 text-emerald-400',
      label: 'Completed',
    },
    inprogress: {
      dot: 'bg-cyan-400 animate-ping',
      pill: 'bg-cyan-500/10 text-black border border-cyan-500/20',
      label: 'AI Processing',
      agent: true,
    },
  };

  const { dot, pill, label, agent } =
    map[status] ?? {
      dot: 'bg-gray-400',
      pill: 'bg-gray-500/10 text-gray-400',
      label: 'Pending',
    };

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <span className={agent ? 'animate-pulse' : ''}>
        {agent ? '🤖 ' : ''}
        {label}
      </span>
      {agent && (
        <span className="flex gap-0.5 ml-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </span>
      )}
    </span>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
const POLL_INTERVAL = 15_000;

const UserStoryFlow = ({ selectedProjectId }) => {
  const { uploadBA, fetchUserStoryById, publishUserStory, getProcessedIdea, downloadFeature, downloadFeatureDoc, loading } = useUserStoryFlow();
  const [downloadingFeature, setDownloadingFeature] = useState(false);
  const [downloadingFeatureDoc, setDownloadingFeatureDoc] = useState(false);
const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [ideasLoading, setIdeasLoading] = useState(false);

  const [ideasError, setIdeasError] = useState(null);       // ✅ NEW
  const [publishError, setPublishError] = useState(null);   // ✅ NEW

  const [selectedIdea, setSelectedIdea] = useState(null);
  const [selectedIdeaDetails, setSelectedIdeaDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);

  const pollingRef = useRef(null);

  const clearPoll = () => { clearTimeout(pollingRef.current); setPollingActive(false); };

  const updateIdeaStatus = (id, status) =>
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, status } : i));

  const fetchIdeaDetails = useCallback(async (ideaId) => {
    setDetailLoading(true);
    setPublishError(null);
    try {
      const data = await fetchUserStoryById(ideaId);
      if (data) { setSelectedIdeaDetails(data); updateIdeaStatus(ideaId, 'Completed'); }
    } catch { setPublishError('Failed to load idea details. Please try again.'); }
    finally { setDetailLoading(false); }
  }, [fetchUserStoryById]);

  const startPolling = useCallback((ideaId) => {
    clearTimeout(pollingRef.current);
    setPollingActive(true);
    const poll = async () => {
      try {
        const data = await fetchUserStoryById(ideaId);
        if (data?.executive_summary) {
          clearPoll();
          setSelectedIdeaDetails(data);
          setDetailLoading(false);
          updateIdeaStatus(ideaId, 'Completed');
        } else {
          pollingRef.current = setTimeout(poll, POLL_INTERVAL);
        }
      } catch {
        clearPoll();
        setIdeasError('Failed to check idea status. Please refresh manually.');
      }
    };
    poll();
  }, [fetchUserStoryById]);

  const fetchIdeas = useCallback(async (isUserTriggered = false) => {
    setIdeasLoading(true);
    setIdeasError(null);
    try {
      const { data } = await getProcessedIdea(selectedProjectId);
      const list = data?.ideas ?? [];
      setIdeas(list);
      if (selectedIdea) {
        const updated = list.find(i => i.id === selectedIdea.id);
        if (updated?.status === 'inprogress' && !pollingActive) startPolling(selectedIdea.id);
        else if (updated?.status === 'Completed') { clearPoll(); fetchIdeaDetails(selectedIdea.id); }
      }
    } catch {
      if (isUserTriggered) setIdeasError('Failed to load ideas. Please try again.');
    }
    finally { setIdeasLoading(false); }
  }, [selectedProjectId, selectedIdea, pollingActive, getProcessedIdea, startPolling, fetchIdeaDetails]);

  useEffect(() => { return () => clearTimeout(pollingRef.current); }, []);

  useEffect(() => {
    if (!selectedProjectId) { setIdeas([]); setSelectedIdea(null); setSelectedIdeaDetails(null); clearPoll(); return; }
    fetchIdeas();
  }, [selectedProjectId]);

  const handleSelectIdea = async (idea) => {
    clearPoll();
    setSelectedIdea(idea); setSelectedIdeaDetails(null); setShowInput(false);
    if (idea.status === 'Completed') await fetchIdeaDetails(idea.id);
    else if (idea.status === 'inprogress') { setDetailLoading(true); startPolling(idea.id); }
  };

  const handleSubmit = async (text, files) => {
    setPublishError(null);
    try {
      const { request_id } = await uploadBA(text, files, selectedProjectId);
      const newIdea = { id: request_id, input: text, status: 'inprogress' };
      setIdeas(prev => [newIdea, ...prev]);
      setSelectedIdea(newIdea); setSelectedIdeaDetails(null);
      setDetailLoading(true); setShowInput(false);
      startPolling(request_id);
    } catch { setPublishError('Failed to create idea. Please try again.'); }
  };

  const handlePublish = async (storyId) => {
    try {
      await publishUserStory(storyId, selectedProjectId);
      if (selectedIdea) await fetchIdeaDetails(selectedIdea.id);
    } catch {
      setPublishError('Failed to publish story. Please try again.');
    }
  };

  const handleNewIdea = () => { clearPoll(); setShowInput(true); setSelectedIdea(null); setSelectedIdeaDetails(null); };

  const isLoadingIdea = selectedIdea && pollingActive && !selectedIdeaDetails;
  const showPanel = ideas.length > 0;

  const errorMessage = ideasError || publishError; // ✅ combined (NO UI change)

  const handleDownloadMD = () => {
    if (!selectedIdeaDetails?.business_objectives) return;

    const content = `# Business Objectives\n\n${selectedIdeaDetails.business_objectives}`;

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `business_objectives_${selectedIdea?.id || "file"}.md`;
    a.click();

    URL.revokeObjectURL(url);


  };


const handleDownloadFeature = async () => {
  if (!selectedIdeaDetails) {
    console.error('No user story details available');
    return;
  }

  setDownloadingFeature(true);
  try {
    // Pass the exact response from fetchUserStoryById as is
    await downloadFeature(selectedIdeaDetails);
  } catch (err) {
    console.error('Download failed:', err);
    setPublishError('Failed to download user story. Please try again.');
  } finally {
    setDownloadingFeature(false);
  }
};

const handleDownloadFeatureDoc = async () => {
  if (!selectedIdeaDetails) {
    console.error('No user story details available');
    return;
  }

  setDownloadingFeatureDoc(true);  // ← CHANGE THIS
  try {
    await downloadFeatureDoc(selectedIdeaDetails);
  } catch (err) {
    console.error('Download failed:', err);
    setPublishError('Failed to download user story as Word document. Please try again.');
  } finally {
    setDownloadingFeatureDoc(false);  // ← CHANGE THIS
  }
};

  const handleDownloadHTML = () => {
    const raw = selectedIdeaDetails?.business_objectives || "";

    // ✅ Normalize messy AI text
    const normalize = (text) => {
      return text
        .replace(/\r/g, "")
        .replace(/([a-z])\n([a-z])/gi, "$1 $2") // fix broken words
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    };

    // ✅ Markdown → HTML (clean + safe)
    const mdToHtml = (md) => {
      let text = normalize(md);

      // headings
      text = text
        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-emerald-400 mt-6">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-emerald-400 mt-8">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-emerald-400 mt-10 border-b border-gray-700 pb-2">$1</h1>');

      // bold
      text = text.replace(/\*\*(.*?)\*\*/gim, '<strong class="text-blue-300">$1</strong>');

      // code blocks
      text = text.replace(/```([\s\S]*?)```/gim, (_, code) => {
        return `
        <div class="bg-gray-950 border border-gray-800 rounded-lg p-4 overflow-x-auto mt-4">
          <pre class="text-sm text-cyan-300 whitespace-pre-wrap"><code>${code.trim()}</code></pre>
        </div>
      `;
      });

      // inline code
      text = text.replace(/`(.*?)`/gim, '<code class="bg-gray-800 px-1 py-0.5 rounded text-sm text-pink-300">$1</code>');

      // tables
      text = text.replace(
        /\|(.+)\|\n\|([-\s|:]+)\|\n((\|.*\|\n?)*)/gim,
        (match) => {
          try {
            const rows = match.trim().split("\n");
            const headers = rows[0].split("|").filter(Boolean);
            const body = rows.slice(2);

            const headerHtml = headers
              .map((h) => `<th class="border border-gray-700 px-3 py-2 bg-gray-800 text-blue-300">${h.trim()}</th>`)
              .join("");

            const bodyHtml = body
              .map((row) => {
                const cols = row.split("|").filter(Boolean);
                return `<tr class="even:bg-gray-900">${cols
                  .map((c) => `<td class="border border-gray-700 px-3 py-2">${c.trim()}</td>`)
                  .join("")}</tr>`;
              })
              .join("");

            return `
            <div class="overflow-x-auto mt-4">
              <table class="min-w-full text-sm border border-gray-700 rounded-lg overflow-hidden">
                <thead><tr>${headerHtml}</tr></thead>
                <tbody>${bodyHtml}</tbody>
              </table>
            </div>
          `;
          } catch {
            return match;
          }
        }
      );

      // lists (grouped properly)
      text = text.replace(/(?:^\* .+\n?)+/gim, (block) => {
        const items = block
          .trim()
          .split("\n")
          .map((line) => `<li class="ml-4 list-disc">${line.replace(/^\* /, "")}</li>`)
          .join("");

        return `<ul class="mt-3 space-y-1">${items}</ul>`;
      });

      // paragraphs
      text = text
        .split("\n\n")
        .map((block) => {
          if (
            block.startsWith("<h") ||
            block.startsWith("<ul") ||
            block.startsWith("<div") ||
            block.includes("<table")
          ) {
            return block;
          }
          return `<p class="text-gray-300 leading-relaxed mt-3">${block}</p>`;
        })
        .join("");

      return text;
    };

    const htmlContent = mdToHtml(raw);

    // ✅ Tailwind-based HTML template
    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Business Objectives Report</title>

  <!-- ✅ Tailwind CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
</head>

<body class="bg-gray-950 text-gray-200 p-8">

  <div class="max-w-5xl mx-auto">

    <h1 class="text-3xl font-bold text-black mb-6">
      📊 Business Objectives Report
    </h1>

    <div class="bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-xl">
      ${htmlContent}
    </div>

    <div class="text-center text-xs text-gray-500 mt-10">
      Generated by AI Automation System
    </div>

  </div>

</body>
</html>
  `;

    // ✅ Download
    const blob = new Blob([htmlTemplate], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "business_objectives.html";
    a.click();

    URL.revokeObjectURL(url);
  };

  // Close dropdown when clicking outside
useEffect(() => {
  const handleClickOutside = (event) => {
    if (showDownloadDropdown && !event.target.closest('.download-dropdown')) {
      setShowDownloadDropdown(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [showDownloadDropdown]);

  const [isExpanded, setIsExpanded] = useState(false);

return (
    <div className="flex h-full bg-gray-100 text-gray-200">

      {/* ── Sidebar: only rendered once ideas exist ── */}
      {showPanel && (
        <div className="border-r border-white/5 bg-[#0f172a]/50">
          <IdeaHistoryPanel
            ideas={ideas}
            selectedIdea={selectedIdea}
            loading={ideasLoading}
            error={ideasError}   // ✅ FIX
            pollingIds={pollingActive && selectedIdea ? new Set([selectedIdea.id]) : new Set()}
            onSelect={handleSelectIdea}
            onRefresh={() => fetchIdeas(true)}
            onNewIdea={handleNewIdea}
            hasProject={!!selectedProjectId}
          />
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-y-auto ">

        {/* No project selected */}
        {!selectedProjectId &&
          <div className="h-full w-full flex flex-col items-center justify-center bg-sky-900 px-6 text-center animate-in fade-in duration-700">

            {/* Decorative Visual Element */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-slate-200/50 blur-3xl rounded-full scale-150" />
              <div className="relative w-20 h-20 bg-white border border-slate-200 shadow-xl shadow-slate-200/50 rounded-[2rem] flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>

            {/* Main Text Area */}
            <div className="max-w-md">
              <h2 className="text-4xl font-black text-slate-100  mb-4">
                Select Project
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-10">
                Select a project from the global navigator to initialize the AI Agent and access your requirement history.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              <div className="p-4 bg-white border border-slate-200/60 rounded-2xl flex items-center gap-4 group hover:border-slate-400 transition-colors">
                <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">01</span>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">Generate Feature</span>
              </div>
              <div className="p-4 bg-white border border-slate-200/60 rounded-2xl flex items-center gap-4 group hover:border-slate-400 transition-colors">
                <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">02</span>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">Publish Userstory</span>
              </div>
            </div>

            {/* Status Footer */}
            <div className="mt-12 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">System Ready</span>
            </div>

          </div>
        }

        {/* Fresh account / no stories yet — full-width hero */}
        {selectedProjectId && !selectedIdea && !showInput && (
          <div className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden bg-white px-4 py-24 text-center">
            {/* --- AI BACKDROP VISUALIZATIONS --- */}
            {/* 1. Large, extremely subtle structural background glow */}
            <div className="absolute top-1/2 left-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-50 blur-[150px] opacity-70" />

            {/* 2. Stylized AI Connection Nodes (Static Backdrop) */}
            <svg
              className="absolute inset-0 h-full w-full opacity-[0.04]"
              width="100%"
              height="100%"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="dotPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.5" className="fill-blue-800" />
                </pattern>
              </defs>

              {/* Subtle grid of nodes */}
              <rect width="100%" height="100%" fill="url(#dotPattern)" />

              {/* Connection Lines (Simulating an AI neural network) */}
              <g stroke="#1d4ed8" strokeWidth="0.5" fill="none">
                {/* Top Left Cluster */}
                <path d="M 100,100 L 250,150 L 200,300 Z" opacity="0.4" />
                <path d="M 50,200 L 100,100" opacity="0.3" />

                {/* Center Cluster (behind main text) */}
                <path d="M 400,200 L 600,150 M 600,150 L 550,350 M 550,350 L 400,200" opacity="0.6" />
                <path d="M 450,250 C 500,200 550,300 600,250" opacity="0.5" strokeDasharray="4 4" />

                {/* Bottom Right Cluster */}
                <path d="M 800,400 L 950,450 L 900,600 L 750,550 Z" opacity="0.3" />
                <path d="M 950,450 L 1050,400" opacity="0.2" />
              </g>
            </svg>
            {/* --- END BACKDROP --- */}


            {/* Main Content (Relative to ensure it sits above the backdrop) */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              {/* Icon Container */}
              <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50/50 p-5 shadow-inner">
                <span className="text-5xl">🤖</span>
              </div>

              {/* Title */}
              <h1 className="mb-5 max-w-4xl text-5xl font-extrabold tracking-tighter text-gray-950 md:text-6xl">
                AI User Story Agent
              </h1>

              {/* Description */}
              <p className="mb-10 max-w-2xl text-lg leading-relaxed text-gray-600 md:text-xl">
                Transform business requirements into structured, test-ready user stories
                using an intelligent AI agent pipeline.
              </p>

              {/* Action Button */}
              <button
                onClick={handleNewIdea}
                className="group relative flex items-center gap-3 overflow-hidden rounded-xl bg-gray-950 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:bg-gray-800 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 active:scale-[0.98]"
              >
                {/* Subtle button glare effect */}
                <span className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>

                <span className="text-xl transition-transform group-hover:scale-110">🚀</span>
                Generate New Story
              </button>

              {/* Process Tags */}
              <div className="mt-16 flex flex-wrap items-center justify-center gap-3 md:gap-4">
                {['Analyze Requirements', 'Structure Narrative', 'Generate Acceptance Criteria'].map((text, i) => (
                  <div key={i} className="flex items-center gap-3 md:gap-4">
                    <span className="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50">
                      {text}
                    </span>
                    {i < 2 && (
                      <div className="hidden h-px w-6 bg-gray-200 sm:block" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input form - Professional White Theme Update */}
        {showInput && (
          <div className="w-full max-w-3xl mx-auto animate-in fade-in slide-in-from-top-4 duration-500 pt-10">
            {/* Heading outside the form for a clean "Page Header" look */}
            <div className="mb-6 ml-1">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                New User Story
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Fill in the details below to generate structured AI requirements.
              </p>
            </div>

            {/* The updated InputForm handles the card-like styling internally */}
            <InputForm
              onSubmit={handleSubmit}
              loading={loading}
              visible={showInput}
              setVisible={setShowInput}
            />
          </div>
        )}

        {/* AI processing loader */}
        {/* AI processing loader - Clean White Theme Update */}
        {isLoadingIdea && (
          <div className="w-full h-full flex items-center justify-center min-h-[400px]">
            <div className="relative w-full max-w-2xl">
              {/* Updated Glow: Sky Blue instead of Cyan, much softer opacity */}
              <div className="absolute inset-0 bg-sky-500/5 blur-3xl rounded-full h-full" />

              <Loader
                message="AI Agent is thinking..."
                submessage="Analyzing requirements • Building logic • Generating structured output"
              />
            </div>
          </div>
        )}

        {/* Results */}
        {selectedIdeaDetails && (
          <div className="space-y-8 p-12">
            {/* Add Download Button for Full Story at the Top */}
   
     <Card>
  <div className="flex justify-between items-start mb-4">
    <h3 className="text-lg font-semibold underline text-black uppercase tracking-wide">
      Executive Summary
    </h3>

   <div className="relative download-dropdown">
  <button
    onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-md"
  >
    Download
    <svg className={`w-4 h-4 transition-transform ${showDownloadDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </button>
  
  {showDownloadDropdown && (
    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
      <button
        onClick={() => {
          handleDownloadFeature();
          setShowDownloadDropdown(false);
        }}
        disabled={downloadingFeature}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-md disabled:bg-gray-100 disabled:text-gray-400"
      >
        {downloadingFeature ? "Downloading..." : "📊 Excel File"}
      </button>
      <button
        onClick={() => {
          handleDownloadFeatureDoc();
          setShowDownloadDropdown(false);
        }}
        disabled={downloadingFeatureDoc}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-md disabled:bg-gray-100 disabled:text-gray-400 border-t"
      >
        {downloadingFeatureDoc ? "Downloading..." : "📄 Word File"}
      </button>
    </div>
  )}
</div>
    </div>
  

  <p className="text-gray-900 leading-relaxed">
    {selectedIdeaDetails.executive_summary}
  </p>
</Card>
            <div className="border-2 border-green-300 rounded-2xl shadow-lg bg-sky-100/50">
              {/* Header */}
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg underline font-semibold text-gray-900 uppercase tracking-wide">
                    Requirement Analysis Document
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {/* Download Button */}
                  {isExpanded && (
                    <button
                      onClick={handleDownloadHTML}
                      className="text-sm px-3 py-1 rounded-md bg-gray-900 hover:bg-gray-800 text-white border border-gray-300 flex items-center gap-1"
                    >
                      Download HTML
                    </button>
                  )}
                  

                  {/* Toggle Button */}
                  <button
                    onClick={() => setIsExpanded((prev) => !prev)}
                    className="text-sm px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 flex items-center gap-1"
                  >
                    {isExpanded ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Content */}
              <div
                className={`transition-all duration-300 overflow-hidden px-4 border border-gray-200 ${isExpanded ? "max-h-[500px] p-4" : "max-h-0"
                  } overflow-y-auto pr-2`}
              >
                <div className="bg-gray-100 border border-gray-200 rounded-2xl p-4 shadow-inner ">
                  <pre className="text-gray-800 leading-loose whitespace-pre-wrap font-mono text-sm p-10">
                    {selectedIdeaDetails.business_objectives}
                  </pre>
                </div>
              </div>
            </div>
            <Card>
              <h3 className="text-lg underline font-semibold text-black mb-4 uppercase tracking-wide">Features & User Stories</h3>
              <div className="space-y-4">
                {selectedIdeaDetails.feature_breackdown?.map(feature => (
                  <UserStoryAccordion key={feature.id} feature={feature} onPublish={handlePublish} selectedProjectId={selectedProjectId} />
                ))}
              </div>
            </Card>
          </div>
        )}


        {/* Error banner — only for real failures (not initial 404) */}
        {errorMessage && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm">{errorMessage}</p>
            <button onClick={() => fetchIdeas(true)} className="mt-2 text-red-400 text-xs underline underline-offset-2">
              Try again
            </button>
          </div>
        )}
      </div>

      {showModal && <Modal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default UserStoryFlow;