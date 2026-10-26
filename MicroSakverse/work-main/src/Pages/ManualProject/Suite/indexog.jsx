import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const DEFAULT_STYLE = { badge: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' };
const getStyle = (map, key) => map[key] || DEFAULT_STYLE;
const getSuiteId = (suite) => suite.suite_id ?? suite.id;

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date)) return dateString;
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Normalizes whichever shape the list API returns into a flat array + total
const extractSuiteList = (response) => {
  if (!response) return { list: [], total: 0 };
  if (Array.isArray(response)) return { list: response, total: response.length };
  const list = response.suites || response.data?.suites || [];
  const total = response.total_suites ?? response.data?.total_suites ?? list.length;
  return { list, total };
};

const ExecutionModal = ({ isOpen, onClose, onExecute, suiteName, suiteId, loading }) => {
  const [maxParallel, setMaxParallel] = useState(1);
  if (!isOpen) return null;

  const handleSubmit = () => {
    onExecute(suiteId, maxParallel);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
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

const Suite = ({ projectId, User }) => {
  const [suites, setSuites] = useState([]);
  const [totalSuites, setTotalSuites] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [executingId, setExecutingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSuite, setSelectedSuite] = useState(null);
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
    return status === 'RUNNING' || status === 'PENDING' || executingId === suiteId;
  };

  const handleExecuteSuite = async (suiteId, maxParallel) => {
    if (isSuiteExecuting(suiteId)) return;
    setExecutingId(suiteId);
    try {
      await executeSuite(suiteId, maxParallel);
      setTimeout(() => refreshReports([suiteId]), 2000);
    } catch (err) {
      alert('Failed to execute suite: ' + err.message);
    } finally {
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
                  {isPolling && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span className="text-blue-600 flex items-center space-x-1">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
                        <span className="text-xs font-medium">Polling ({runningCount} running)</span>
                      </span>
                    </>
                  )}
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
                  const execStyle = getStyle(EXEC_STATUS_STYLES, execStatus);
                  const statusStyle = getStyle(STATUS_STYLES, suite.status);

                  return (
                    <div
                      key={suiteId}
                      className="group bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden"
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
                        {/* <div className="grid grid-cols-2 gap-1 text-xs">
                          <div className="flex items-center space-x-1.5 text-gray-600">
                            <FontAwesomeIcon icon={faHashtag} className="text-gray-400 text-[10px]" />
                            <span className="font-mono text-[11px]">ID: {suiteId}</span>
                          </div>
                          <div className="flex items-center space-x-1.5 text-gray-600">
                            <FontAwesomeIcon icon={faFolder} className="text-gray-400 text-[10px]" />
                            <span className="font-mono text-[11px]">P: {suite.project_id}</span>
                          </div>
                        </div> */}

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
                            onClick={() => setSelectedSuite(suite)}
                            disabled={executing}
                            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                              executing ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                            title={executing ? 'Suite is currently executing' : 'Execute suite'}
                          >
                            <FontAwesomeIcon
                              icon={executing ? faSpinner : faPlay}
                              className={`text-[10px] ${executing ? 'animate-spin' : ''}`}
                            />
                            <span>{executing ? 'Running...' : 'Execute'}</span>
                          </button>
                          <button
                            onClick={() => handleDownloadReport(suite)}
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
    </>
  );
};

export default Suite;