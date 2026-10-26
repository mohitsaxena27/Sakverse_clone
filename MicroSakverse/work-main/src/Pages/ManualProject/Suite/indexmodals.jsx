import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSuite } from '../../../Hooks/Suite/Suite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faRefresh,
  faLayerGroup,
  faHashtag,
  faFolder,
  faPlus,
  faTimes,
  faDownload,
  faSpinner,
  faChevronRight,
  faCode,
  faTriangleExclamation,
  faImage,
  faCopy,
  faCheck,
  faPen,
  faSearch,
  faArrowUpRightFromSquare,
  faClock,
  faListCheck,
} from '@fortawesome/free-solid-svg-icons';
import CreateSuiteModal from './CreateSuiteModal';
import { generateExecutionHTML, transformReportData } from '../../../items/suiteHelper/htmlHelper';

const POLL_INTERVAL_MS = 600000;

const STATUS_STYLES = {
  ACTIVE: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  INACTIVE: { badge: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
  PENDING: { badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
};

const EXEC_STATUS_STYLES = {
  RUNNING: { badge: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500 animate-pulse' },
  PARTIAL: { badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  COMPLETED: { badge: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  FAILED: { badge: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  PENDING: { badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500 animate-pulse' },
  NOT_EXECUTED: { badge: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
};

// Status styling for individual test case executions (testcase.status) and
// individual step results (step.status) — upper and lower case keys both
// covered since the API is inconsistent about casing between the two.
const CASE_STATUS_STYLES = {
  PASSED: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  FAILED: { badge: 'bg-red-50 text-red-700 border-red-200' },
  SKIPPED: { badge: 'bg-gray-50 text-gray-600 border-gray-200' },
  passed: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  failed: { badge: 'bg-red-50 text-red-700 border-red-200' },
  skipped: { badge: 'bg-gray-50 text-gray-500 border-gray-200' },
};

const ACTION_STYLES = {
  navigation: 'bg-blue-50 text-blue-700 border-blue-200',
  input: 'bg-purple-50 text-purple-700 border-purple-200',
  custom: 'bg-orange-50 text-orange-700 border-orange-200',
  screenshot: 'bg-teal-50 text-teal-700 border-teal-200',
};

const DEFAULT_STYLE = { badge: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' };
const getStyle = (map, key) => map[key] || DEFAULT_STYLE;
const getSuiteId = (suite) => suite.suite_id ?? suite.id;

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';

  const utcDateString =
    !dateString.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(dateString)
      ? `${dateString}Z`
      : dateString;

  const date = new Date(utcDateString);

  if (isNaN(date)) return dateString;

  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

const formatDuration = (start, end) => {
  if (!start || !end) return 'N/A';
  const ms = new Date(end) - new Date(start);
  if (isNaN(ms) || ms < 0) return 'N/A';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
};

const truncateMiddle = (str, keep = 8) => {
  if (!str || str.length <= keep * 2 + 3) return str || '';
  return `${str.slice(0, keep)}…${str.slice(-keep)}`;
};

// ---------------------------------------------------------------------------
// Screenshot helpers — steps can carry a raw base64 payload, a full data URI,
// or just a placeholder string like "Screenshot". We only try to render an
// <img> when the value actually looks like image data.
// ---------------------------------------------------------------------------
const looksLikeBase64Image = (str) => {
  if (!str || typeof str !== 'string') return false;
  if (str.startsWith('data:image')) return true;
  const cleaned = str.replace(/\s/g, '');
  return cleaned.length > 100 && /^[A-Za-z0-9+/]+=*$/.test(cleaned);
};

const toImageSrc = (str) => {
  if (!str) return null;
  if (str.startsWith('data:image')) return str;
  if (looksLikeBase64Image(str)) return `data:image/png;base64,${str.replace(/\s/g, '')}`;
  return null;
};

// Normalizes whichever shape the list API returns into a flat array + total
const extractSuiteList = (response) => {
  if (!response) return { list: [], total: 0 };
  if (Array.isArray(response)) return { list: response, total: response.length };
  const list = response.suites || response.data?.suites || [];
  const total = response.total_suites ?? response.data?.total_suites ?? list.length;
  return { list, total };
};

// ---------------------------------------------------------------------------
// Small shared building blocks
// ---------------------------------------------------------------------------

const CopyButton = ({ text, className = '' }) => {
  const [copied, setCopied] = useState(false);
  if (!text) return null;

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // clipboard unavailable — fail silently, this is a nice-to-have
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`text-gray-300 hover:text-indigo-600 transition-colors flex-shrink-0 ${className}`}
      title={copied ? 'Copied!' : 'Copy'}
    >
      <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="text-[10px]" />
    </button>
  );
};

const DonutChart = ({ passed = 0, failed = 0, skipped = 0, size = 132 }) => {
  const total = passed + failed + skipped || 1;
  const strokeWidth = 13;
  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const segments = [
    { value: passed, color: '#10b981' },
    { value: failed, color: '#ef4444' },
    { value: skipped, color: '#9ca3af' },
  ].filter((s) => s.value > 0);

  let offset = 0;
  const passRate = Math.round((passed / total) * 100);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth} />
        {segments.map((seg, i) => {
          const len = (seg.value / total) * circumference;
          const circle = (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${len} ${circumference - len}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return circle;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-gray-900">{passRate}%</span>
        <span className="text-[9px] text-gray-400 font-medium uppercase tracking-wide">Pass rate</span>
      </div>
    </div>
  );
};

const Lightbox = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-md flex items-center justify-center p-8"
      onClick={onClose}
    >
      <img
        src={src}
        alt="Step screenshot"
        className="max-w-full max-h-full rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <FontAwesomeIcon icon={faTimes} />
      </button>
    </div>
  );
};

const ScreenshotThumb = ({ screenshot, onOpen }) => {
  const src = toImageSrc(screenshot);
  if (!src) {
    return (
      <div
        className="w-14 h-10 rounded-md border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0"
        title="No image captured"
      >
        <FontAwesomeIcon icon={faImage} className="text-gray-300 text-xs" />
      </div>
    );
  }
  return (
    <button
      onClick={() => onOpen(src)}
      className="w-14 h-10 rounded-md border border-gray-200 overflow-hidden hover:ring-2 hover:ring-indigo-400 transition-all flex-shrink-0"
      title="View screenshot"
    >
      <img src={src} alt="Step screenshot" className="w-full h-full object-cover" />
    </button>
  );
};

// ---------------------------------------------------------------------------
// Step + test case rendering
// ---------------------------------------------------------------------------

const StepRow = ({ step, index, onOpenImage }) => {
  const [showCode, setShowCode] = useState(false);
  const hasLongTarget = !!step.target && step.target.length > 60;
  const hasError = step.log_error && step.log_error !== 'None';
  const actionStyle = ACTION_STYLES[step.action] || 'bg-gray-50 text-gray-700 border-gray-200';
  const statusStyle = getStyle(CASE_STATUS_STYLES, step.status);
  const isNavigationLink = step.action === 'navigation' && step.value;

  return (
    <div className="border border-gray-100 rounded-lg p-3 bg-white hover:border-gray-200 transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center flex-shrink-0 w-7 pt-0.5">
          <span className="text-[12px] font-mono text-gray-400">{index + 1}</span>
          <span
            className={`mt-1 w-2 h-2 rounded-full ${
              step.status === 'passed' ? 'bg-emerald-500' : step.status === 'failed' ? 'bg-red-500' : 'bg-gray-300'
            }`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="text-xs font-medium text-gray-800">{step.planned_intent}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${actionStyle}`}>
              {step.action}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${statusStyle.badge}`}>
              {step.status}
            </span>
          </div>

          {isNavigationLink ? (
            <a
              href={step.value}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 break-all"
            >
              {step.value}
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-[9px] flex-shrink-0" />
            </a>
          ) : (
            <>
              {step.target && !hasLongTarget && (
                <code className="inline-block mt-1.5 text-[11px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded break-all">
                  {step.target}
                </code>
              )}
              {step.value && (
                <div className="text-[11px] text-gray-500 mt-1 break-all">
                  <span className="text-gray-400">value: </span>
                  {step.value}
                </div>
              )}
              {hasLongTarget && (
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="mt-1.5 text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                >
                  <FontAwesomeIcon icon={faCode} className="text-[10px]" />
                  {showCode ? 'Hide code' : 'View code'}
                </button>
              )}
              {hasLongTarget && showCode && (
                <pre className="mt-1.5 text-[10px] leading-relaxed bg-gray-900 text-gray-100 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap max-h-56 overflow-y-auto">
                  {step.target}
                </pre>
              )}
            </>
          )}

          {hasError && (
            <div className="mt-2 bg-red-50 border border-red-100 rounded-lg p-2">
              <div className="flex items-center gap-1.5 text-red-700 text-[10px] font-semibold mb-0.5">
                <FontAwesomeIcon icon={faTriangleExclamation} />
                Error
              </div>
              <p className="text-[11px] text-red-600 break-all leading-snug">{step.log_error}</p>
            </div>
          )}

          <div className="text-[10px] text-gray-300 mt-1.5">{formatDate(step.created_at)}</div>
        </div>

        <ScreenshotThumb screenshot={step.screenshot} onOpen={onOpenImage} />
      </div>
    </div>
  );
};

const TestCaseAccordion = ({ testcase, defaultOpen, onOpenImage }) => {
  const [open, setOpen] = useState(defaultOpen);

  const stepsPassed = testcase.steps.filter((s) => s.status === 'passed').length;
  const stepsFailed = testcase.steps.filter((s) => s.status === 'failed').length;
  const statusStyle = getStyle(CASE_STATUS_STYLES, testcase.status);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <FontAwesomeIcon
            icon={faChevronRight}
            className={`text-gray-400 text-xs transition-transform flex-shrink-0 ${open ? 'rotate-90' : ''}`}
          />

          <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
<span className="text-[11px] font-mono text-gray-400 ">
  Execution ID:{' '}
  <span
    className={`${
      testcase.status?.toLowerCase() === 'failed'
        ? 'text-red-600'
        : testcase.status?.toLowerCase() === 'passed'
          ? 'text-green-600'
          : 'text-black'
    }`}
  >
    {testcase.execution_id}
  </span>
  {' | '}
  Row number:{' '}
  <span className="text-black">
    {testcase.data_row_id}
  </span>
</span>
  </div>
            <p className="text-[15px] font-medium text-gray-800 truncate">{testcase.execution_intent}</p>
   
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className="text-[10px] text-gray-400">
            <span className="text-emerald-600 font-semibold">{stepsPassed}</span> /{' '}
            <span className="text-red-600 font-semibold">{stepsFailed}</span> steps
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusStyle.badge}`}>
            {testcase.status}
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 bg-gray-50/60 p-3 space-y-2">
          {testcase.steps.map((step, i) => (
            <StepRow key={step.step_id ?? i} step={step} index={i} onOpenImage={onOpenImage} />
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Suite detail modal — the "one stop" view: sidebar (info + charts) on the
// left, searchable/filterable list of test case executions on the right.
// Built entirely from the report JSON already fetched for the suite tiles —
// no new endpoints required.
// ---------------------------------------------------------------------------

const SuiteDetailModal = ({ isOpen, onClose, suite, report, onDownload, downloading }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [lightboxSrc, setLightboxSrc] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setStatusFilter('ALL');
      setLightboxSrc(null);
    }
  }, [isOpen, suite]);

  const statusCounts = useMemo(() => {
    if (!report) return {};
    return report.testcases.reduce((acc, tc) => {
      acc[tc.status] = (acc[tc.status] || 0) + 1;
      return acc;
    }, {});
  }, [report]);

const filteredTestcases = useMemo(() => {
  if (!report) return [];

  const q = search.trim().toLowerCase();

  return report.testcases.filter((tc) => {
    const matchesStatus =
      statusFilter === 'ALL' || tc.status === statusFilter;

    const matchesSearch =
      !q ||
      tc.execution_intent?.toLowerCase().includes(q) ||
      tc.session_id?.toLowerCase().includes(q) ||
      String(tc.execution_id ?? '').toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });
}, [report, search, statusFilter]);

  if (!isOpen || !suite) return null;

  const execId = report?.suite_execution?.suite_execution_id || 'N/A';

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-2 md:inset-6 lg:inset-x-10 lg:inset-y-8 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-indigo-50 rounded-lg flex-shrink-0">
              <FontAwesomeIcon icon={faLayerGroup} className="text-indigo-600 text-sm" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-900 truncate">
                {suite.suite_name || suite.name || 'Unnamed Suite'}
              </h2>
              <p className="text-[11px] text-gray-400">
                Execution #{execId} · {formatDate(report?.suite_execution?.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {report && (
              <button
                onClick={() => onDownload(suite)}
                disabled={downloading}
                className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50 transition-colors"
              >
                <FontAwesomeIcon icon={downloading ? faSpinner : faDownload} className={downloading ? 'animate-spin' : ''} />
                {downloading ? 'Downloading...' : 'Download Report'}
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0" title="Close">
              <FontAwesomeIcon icon={faTimes} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 flex-col md:flex-row">
          {/* Left sidebar: suite info + charts */}
          <aside className="w-full md:w-80 lg:w-96 flex-shrink-0 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/60 overflow-y-auto p-4 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Suite</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStyle(STATUS_STYLES, suite.status).badge}`}>
                  {suite.status}
                </span>
              </div>
              <p className="text-sm font-bold text-gray-900">{suite.suite_name || suite.name}</p>
              {(suite.description || suite.desc) && (
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{suite.description || suite.desc}</p>
              )}
              <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-gray-400 font-mono">
                <FontAwesomeIcon icon={faHashtag} className="text-[9px]" />
                Suite ID {getSuiteId(suite)}
                {suite.project_id != null && (
                  <>
                    <span className="text-gray-200">|</span>
                    <FontAwesomeIcon icon={faFolder} className="text-[9px]" />
                    Project {suite.project_id}
                  </>
                )}
              </div>
            </div>

            {report && (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2.5">
                  <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Execution</h3>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Status</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStyle(EXEC_STATUS_STYLES, report.suite_execution.status).badge}`}>
                      {report.suite_execution.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Execution ID</span>
                    <span className="font-mono text-[10px] text-gray-600">
                      #{report.suite_execution.suite_execution_id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Report</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStyle(EXEC_STATUS_STYLES, report.suite_execution.report_status).badge}`}>
                      {report.suite_execution.report_status}
                    </span>
                  </div>
                  {/* <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Batch session</span>
                    <span className="flex items-center gap-1.5 font-mono text-[10px] text-gray-600">
                      {truncateMiddle(report.suite_execution.batch_session_id, 8)}
                      <CopyButton text={report.suite_execution.batch_session_id} />
                    </span>
                  </div> */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faClock} className="text-gray-300 text-[10px]" /> Started
                    </span>
                    <span className="text-gray-700">{formatDate(report.suite_execution.started_at)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faClock} className="text-gray-300 text-[10px]" /> Completed
                    </span>
                    <span className="text-gray-700">{formatDate(report.suite_execution.completed_at)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                    <span className="text-gray-500 font-medium">Duration</span>
                    <span className="font-semibold text-gray-800">
                      {formatDuration(report.suite_execution.started_at, report.suite_execution.completed_at)}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faListCheck} className="text-gray-300" /> Results
                  </h3>
                  <div className="flex items-center justify-center">
                    <DonutChart
                      passed={report.summary.passed}
                      failed={report.summary.failed}
                      skipped={report.summary.skipped}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="text-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto mb-1" />
                      <div className="text-sm font-bold text-gray-800">{report.summary.passed}</div>
                      <div className="text-[10px] text-gray-400">Passed</div>
                    </div>
                    <div className="text-center">
                      <div className="w-2 h-2 rounded-full bg-red-500 mx-auto mb-1" />
                      <div className="text-sm font-bold text-gray-800">{report.summary.failed}</div>
                      <div className="text-[10px] text-gray-400">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="w-2 h-2 rounded-full bg-gray-300 mx-auto mb-1" />
                      <div className="text-sm font-bold text-gray-800">{report.summary.skipped}</div>
                      <div className="text-[10px] text-gray-400">Skipped</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100 text-center">
                    <div>
                      <div className="text-sm font-bold text-gray-800">{report.summary.total_testcases}</div>
                      <div className="text-[10px] text-gray-400">Test Cases</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-800">{report.summary.total_steps}</div>
                      <div className="text-[10px] text-gray-400">Total Steps</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </aside>

          {/* Right: searchable/filterable list of test case executions */}
          <main className="flex-1 min-w-0 overflow-y-auto p-4">
            {!report ? (
              <div className="text-center py-16 text-sm text-gray-400">No execution report available yet.</div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sticky top-0 bg-white/95 backdrop-blur-sm pb-2 z-10">
                  <div className="relative flex-1">
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by Execution ID..."
                      className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['ALL', 'PASSED', 'FAILED', 'SKIPPED'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-2.5 py-1.5 rounded-full text-[11px] font-medium border transition-colors whitespace-nowrap ${
                          statusFilter === s
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                        {s !== 'ALL' ? ` (${statusCounts[s] || 0})` : ` (${report.testcases.length})`}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredTestcases.length === 0 ? (
                  <div className="text-center py-16 text-sm text-gray-400">No test case executions match your filters.</div>
                ) : (
                  <div className="space-y-2.5 pb-4">
                    {filteredTestcases.map((tc, idx) => (
                      <TestCaseAccordion
                        key={`${tc.session_id}-${idx}`}
                        testcase={tc}
                        defaultOpen={idx === 0 && filteredTestcases.length <= 5}
                        onOpenImage={setLightboxSrc}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Execute-suite modal (unchanged from the original)
// ---------------------------------------------------------------------------

const ExecutionModal = ({ isOpen, onClose, onExecute, suiteName, suiteId, loading }) => {
  const [maxParallel, setMaxParallel] = useState(1);
  if (!isOpen) return null;

  const handleSubmit = () => {
    onExecute(suiteId, maxParallel);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Execute Test Suite</h3>
              <p className="text-sm text-gray-500 mt-0.5">{suiteName || 'Suite'}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <FontAwesomeIcon icon={faTimes} className="text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Parallel Executions
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="1"
                  max="6"
                  step="1"
                  value={maxParallel}
                  onChange={(e) => setMaxParallel(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="w-12 h-12 flex items-center justify-center bg-indigo-50 rounded-lg border-2 border-indigo-200">
                  <span className="text-xl font-bold text-indigo-600">{maxParallel}</span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 (Min)</span>
                <span>6 (Max)</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                ⚡ {maxParallel} test(s) will run in parallel. Higher values may improve execution
                time but require more resources.
              </p>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Suite ID</span>
              <span className="font-mono">#{suiteId}</span>
            </div>
          </div>

          <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={loading ? faSpinner : faPlay} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Executing...' : 'Execute Suite'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Suite view
// ---------------------------------------------------------------------------

const Suite = ({ projectId, User }) => {
  const [suites, setSuites] = useState([]);
  const [totalSuites, setTotalSuites] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [executingId, setExecutingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSuite, setSelectedSuite] = useState(null);
  const [detailSuite, setDetailSuite] = useState(null);
  const [suiteReports, setSuiteReports] = useState({});

  const pollTimer = useRef(null);
  const { getSuiteList, executeSuite, getSuiteReportJson, createSuite } = useSuite();

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  // Fetch reports for a batch of suite ids and merge them into state
  const refreshReports = useCallback(
    async (suiteIds) => {
      const results = await Promise.all(
        suiteIds.map(async (id) => {
          try {
            return [id, await getSuiteReportJson(id)];
          } catch {
            return [id, null];
          }
        })
      );
      setSuiteReports((prev) => {
        const next = { ...prev };
        results.forEach(([id, data]) => {
          if (data) next[id] = data;
        });
        return next;
      });
    },
    [getSuiteReportJson]
  );

  const fetchSuites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getSuiteList(projectId);
      const { list, total } = extractSuiteList(response);
      setSuites(list);
      setTotalSuites(total);
      if (list.length) await refreshReports(list.map(getSuiteId));
    } catch (err) {
      setError(err.message || 'Failed to fetch suites');
      setSuites([]);
      setTotalSuites(0);
    } finally {
      setLoading(false);
    }
  }, [projectId, getSuiteList, refreshReports]);

  useEffect(() => {
    if (!projectId) {
      setError('Project ID is missing');
      setLoading(false);
      return;
    }
    fetchSuites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Keep polling in sync with whichever suites are currently RUNNING
  useEffect(() => {
    const runningIds = Object.entries(suiteReports)
      .filter(([, r]) => r.suite_execution?.status === 'RUNNING')
      .map(([id]) => Number(id));

    if (runningIds.length === 0) {
      stopPolling();
      return;
    }
    if (!pollTimer.current) {
      pollTimer.current = setInterval(() => refreshReports(runningIds), POLL_INTERVAL_MS);
    }
  }, [suiteReports, refreshReports, stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const runningCount = Object.values(suiteReports).filter(
    (r) => r.suite_execution?.status === 'RUNNING'
  ).length;
  const isPolling = runningCount > 0;

const isSuiteExecuting = (suiteId) => {
  const status = suiteReports[suiteId]?.suite_execution?.status;
  return status === 'RUNNING' || status === 'PENDING';
};

const handleExecuteSuite = async (suiteId, maxParallel) => {
  if (executingId === suiteId || isSuiteExecuting(suiteId)) {
    return;
  }

  // Lock immediately so user cannot click twice
  setExecutingId(suiteId);

  try {
    await executeSuite(suiteId, maxParallel);

    // Refresh report after API response
    await refreshReports([suiteId]);

    // IMPORTANT:
    // The API request is done, so remove the temporary click lock.
    // From this point onward, isSuiteExecuting() controls the button.
    setExecutingId(null);

  } catch (err) {
    console.error('Failed to execute suite:', err);

    alert('Failed to execute suite: ' + err.message);

    // Unlock if API failed
    setExecutingId(null);
  }
};
  const handleDownloadReport = async (suite) => {
    const suiteId = getSuiteId(suite);
    setDownloadingId(suiteId);
    try {
      const report = await getSuiteReportJson(suiteId);
      const htmlContent = generateExecutionHTML(transformReportData(report));
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const name = (suite.suite_name || suite.name || 'suite')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('_');

      const link = document.createElement('a');
      link.href = url;
      link.download = `${name}_ID${suiteId}_${dateStr}_${timeStr}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download report: ' + err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCreateSuite = async (payload) => {
    await createSuite(projectId, payload);
    await fetchSuites();
  };

  const lastUpdated = suites.length
    ? formatDate(
        [...suites].sort(
          (a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0)
        )[0]?.updated_at
      )
    : 'N/A';

  return (
    <>
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-indigo-50 rounded-lg">
                <FontAwesomeIcon icon={faLayerGroup} className="text-indigo-600 text-sm" />
              </div>
              <div className="flex items-center space-x-4">
                <h1 className="text-lg font-semibold text-gray-900">Test Suites</h1>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-gray-600">
                    Total: <span className="font-semibold text-gray-900">{totalSuites}</span>
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-600">
                    Last updated: <span className="font-medium text-gray-900">{lastUpdated}</span>
                  </span>
                 
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchSuites}
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                title="Refresh"
              >
                <FontAwesomeIcon icon={faRefresh} className="text-sm" />
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-1.5"
              >
                <FontAwesomeIcon icon={faPlus} className="text-xs" />
                <span>Create</span>
              </button>
            </div>
          </div>
        </div>

        <main className="px-4 py-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="mt-3 text-sm text-gray-600 font-medium">Loading suites...</p>
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="p-1.5 bg-red-100 rounded-lg">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-red-800 font-semibold text-sm">Error Loading Suites</h3>
                  <p className="text-red-600 text-xs mt-0.5">{error}</p>
                  <button
                    onClick={fetchSuites}
                    className="mt-2 px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && (
            suites.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {suites.map((suite) => {
                  const suiteId = getSuiteId(suite);
                  const report = suiteReports[suiteId];
                  const execStatus = report?.suite_execution?.status || 'NOT_EXECUTED';
                  const totalTestCases = report?.suite_execution?.total_testcases || 0;
                  const passed = report?.summary?.passed || 0;
                  const failed = report?.summary?.failed || 0;
const executing = isSuiteExecuting(suiteId);
const executeLoading = executingId === suiteId; 
                  const execStyle = getStyle(EXEC_STATUS_STYLES, execStatus);
                  const statusStyle = getStyle(STATUS_STYLES, suite.status);

                  return (
                    <div
                      key={suiteId}
                      onClick={() => report && setDetailSuite(suite)}
                      className={`group bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden ${
                        report ? 'cursor-pointer' : ''
                      }`}
                      title={report ? 'View suite details' : 'No report available yet'}
                    >
                      <div className="px-4 py-2.5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-start justify-between">
                          <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors flex-1 min-w-0">
                            {suite.suite_name || suite.name || 'Unnamed Suite'}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[12px] font-medium border ${execStyle.badge} flex items-center space-x-1 flex-shrink-0`}
                          >
                            <span className={`w-1 h-1 rounded-full ${execStyle.dot}`} />
                            <span>{execStatus}</span>
                          </span>
                        </div>
                        {(suite.description || suite.desc) && (
                          <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
                            {suite.description || suite.desc}
                          </p>
                        )}
                      </div>

                      <div className="px-4 py-2.5 space-y-1.5">
                        <div className="bg-gray-50 rounded-md p-2 space-y-1.5 border border-gray-100">
                          <span className="text-[12px] font-medium text-gray-500">Execution Status</span>
                          <div className="grid grid-cols-3 gap-1 text-center">
                            <div className="bg-white rounded px-1.5 py-1 border border-gray-100">
                              <div className="text-[9px] text-gray-400">Test Cases</div>
                              <div className="text-xs font-semibold text-gray-700">{totalTestCases}</div>
                            </div>
                            <div className="bg-white rounded px-1.5 py-1 border border-emerald-100">
                              <div className="text-[9px] text-emerald-500">Passed</div>
                              <div className="text-xs font-semibold text-emerald-600">{passed}</div>
                            </div>
                            <div className="bg-white rounded px-1.5 py-1 border border-red-100">
                              <div className="text-[9px] text-red-500">Failed</div>
                              <div className="text-xs font-semibold text-red-600">{failed}</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-gray-100">
    <button
  onClick={(e) => {
    e.stopPropagation();
    setSelectedSuite(suite);
  }}
  disabled={executing || executeLoading}
  className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
    executing || executeLoading
      ? 'bg-gray-400 text-white cursor-not-allowed'
      : 'bg-indigo-600 text-white hover:bg-indigo-700'
  }`}
  title={
    executing
      ? 'Suite is currently executing'
      : executeLoading
        ? 'Starting execution...'
        : 'Execute suite'
  }
>
  <FontAwesomeIcon
    icon={executing ? faSpinner : faPlay}
    className={`text-[10px] ${executing ? 'animate-spin' : ''}`}
  />

  <span>
    {executing ? 'Running...' : 'Execute'}
  </span>
</button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadReport(suite);
                            }}
                            disabled={downloadingId === suiteId || !report}
                            className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all duration-200 flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={!report ? 'No report available' : 'Download report'}
                          >
                            <FontAwesomeIcon
                              icon={downloadingId === suiteId ? faSpinner : faDownload}
                              className={`text-[10px] ${downloadingId === suiteId ? 'animate-spin' : ''}`}
                            />
                            <span>{downloadingId === suiteId ? 'Download...' : 'Report'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-200">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-50 rounded-full mb-3">
                  <FontAwesomeIcon icon={faLayerGroup} className="text-indigo-400 text-2xl" />
                </div>
                <h3 className="text-base font-semibold text-gray-700">No Test Suites</h3>
                <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                  Create your first test suite to get started.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Create Suite
                </button>
              </div>
            )
          )}
        </main>
      </div>

      <CreateSuiteModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projectId={projectId}
        onCreateSuite={handleCreateSuite}
        User={User}
      />

      <ExecutionModal
        isOpen={!!selectedSuite}
        onClose={() => setSelectedSuite(null)}
        onExecute={handleExecuteSuite}
        suiteName={selectedSuite?.suite_name || selectedSuite?.name}
        suiteId={selectedSuite ? getSuiteId(selectedSuite) : null}
        loading={selectedSuite ? executingId === getSuiteId(selectedSuite) : false}
      />

      <SuiteDetailModal
        isOpen={!!detailSuite}
        onClose={() => setDetailSuite(null)}
        suite={detailSuite}
        report={detailSuite ? suiteReports[getSuiteId(detailSuite)] : null}
        onDownload={handleDownloadReport}
        downloading={detailSuite ? downloadingId === getSuiteId(detailSuite) : false}
      />
    </>
  );
};

export default Suite;