import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup, faRefresh, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useSuite } from '../../../Hooks/Suite/Suite';
import { generateExecutionHTML, transformReportData } from '../../../items/suiteHelper/htmlHelper';

import { POLL_INTERVAL_MS } from './constants';
import { getSuiteId, extractSuiteList, formatDate } from './utils';
import CreateSuiteModal from './CreateSuiteModal';
import ExecutionModal from './modals/ExecutionModal';
import SuiteDetailModal from './modals/SuiteDetailModal';
import SuiteCard from './components/SuiteCard';

const Suite = ({ projectId, User }) => {
  const [suites, setSuites] = useState([]);
  const [totalSuites, setTotalSuites] = useState(0);

  // Only true on the very first load (empty state) — never on refresh.
  const [initialLoading, setInitialLoading] = useState(true);
  // True on manual refresh / background reloads. Grid stays mounted.
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [executingId, setExecutingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSuite, setSelectedSuite] = useState(null);

  // Card/grid data — always screenshot_mode='none', cheap, polled.
  const [suiteReports, setSuiteReports] = useState({});

  // Modal has its own report + loading + error, decoupled from suiteReports
  // so a poll tick (mode='none') can never clobber the modal's mode='failed' data.
  const [detailSuite, setDetailSuite] = useState(null);
  const [detailReport, setDetailReport] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const pollTimer = useRef(null);
  const detailAbortRef = useRef(null);
  const detailRequestIdRef = useRef(0);

  const { getSuiteList, executeSuite, getSuiteReportJson, createSuite } = useSuite();

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  // Lightweight poll: card tiles only need status, never screenshots.
  const refreshReports = useCallback(
    async (suiteIds) => {
      const results = await Promise.all(
        suiteIds.map(async (id) => {
          try {
            return [id, await getSuiteReportJson(id, 'none')];
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
    const isFirstLoad = suites.length === 0;
    if (isFirstLoad) setInitialLoading(true);
    setRefreshing(true);
    setError(null);
    try {
      const response = await getSuiteList(projectId);
      const { list, total } = extractSuiteList(response);
      setSuites(list);
      setTotalSuites(total);
      if (list.length) await refreshReports(list.map(getSuiteId));
    } catch (err) {
      setError(err.message || 'Failed to fetch suites');
      if (isFirstLoad) {
        setSuites([]);
        setTotalSuites(0);
      }
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [projectId, getSuiteList, refreshReports, suites.length]);

  useEffect(() => {
    if (!projectId) {
      setError('Project ID is missing');
      setInitialLoading(false);
      return;
    }
    fetchSuites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Keep polling in sync with whichever suites are currently RUNNING.
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

  // Cancel any in-flight modal fetch on unmount.
  useEffect(() => () => detailAbortRef.current?.abort(), []);

  const isSuiteExecuting = (suiteId) => {
    const status = suiteReports[suiteId]?.suite_execution?.status;
    return status === 'RUNNING' || status === 'PENDING';
  };

  const handleExecuteSuite = async (suiteId, maxParallel) => {
    if (executingId === suiteId || isSuiteExecuting(suiteId)) return;

    setExecutingId(suiteId);
    try {
      await executeSuite(suiteId, maxParallel);
      await refreshReports([suiteId]);
    } catch (err) {
      console.error('Failed to execute suite:', err);
      alert('Failed to execute suite: ' + err.message);
    } finally {
      setExecutingId(null);
    }
  };

  const handleDownloadReport = async (suite) => {
    const suiteId = getSuiteId(suite);
    setDownloadingId(suiteId);
    try {
      const report = await getSuiteReportJson(suiteId, 'all');
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

  // Modal fetch: mode='failed', own loading/error, abortable, stale-response guarded.
  const handleCardClick = useCallback(
    async (suite) => {
      const suiteId = getSuiteId(suite);

      // Show cached 'none'-mode data instantly (status/summary) while the
      // richer 'failed'-mode payload loads — modal opens with no blank flash.
      setDetailSuite(suite);
      setDetailReport(suiteReports[suiteId] ?? null);
      setDetailError(null);
      setDetailLoading(true);

      detailAbortRef.current?.abort();
      const controller = new AbortController();
      detailAbortRef.current = controller;
      const requestId = ++detailRequestIdRef.current;

      try {
        const report = await getSuiteReportJson(suiteId, 'failed', controller.signal);
        // Ignore if a newer modal request has since been fired (or modal closed).
        if (requestId !== detailRequestIdRef.current) return;
        setDetailReport(report);
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (requestId !== detailRequestIdRef.current) return;
        setDetailError(err.message || 'Failed to load suite detail');
      } finally {
        if (requestId === detailRequestIdRef.current) setDetailLoading(false);
      }
    },
    [suiteReports, getSuiteReportJson]
  );

  const handleCloseDetail = useCallback(() => {
    detailAbortRef.current?.abort();
    detailRequestIdRef.current++; // invalidate any in-flight response
    setDetailSuite(null);
    setDetailReport(null);
    setDetailError(null);
    setDetailLoading(false);
  }, []);

  const lastUpdated = useMemo(() => {
    if (!suites.length) return 'N/A';
    return formatDate(
      [...suites].sort(
        (a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0)
      )[0]?.updated_at
    );
  }, [suites]);

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
                disabled={refreshing}
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-50"
                title="Refresh"
              >
                <FontAwesomeIcon icon={faRefresh} className={`text-sm ${refreshing ? 'animate-spin' : ''}`} />
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
          {initialLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="mt-3 text-sm text-gray-600 font-medium">Loading suites...</p>
            </div>
          )}

          {!initialLoading && error && suites.length === 0 && (
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

          {/* Non-blocking error banner when a refresh fails but we still have stale data to show */}
          {!initialLoading && error && suites.length > 0 && (
            <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 flex items-center justify-between">
              <span>Couldn't refresh: {error}</span>
              <button onClick={fetchSuites} className="font-medium underline">
                Retry
              </button>
            </div>
          )}

          {!initialLoading &&
            (suites.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {suites.map((suite) => {
                  const suiteId = getSuiteId(suite);
                  const report = suiteReports[suiteId];
                  const executing = isSuiteExecuting(suiteId);
                  const executeLoading = executingId === suiteId;
                  const downloading = downloadingId === suiteId;

                  return (
                    <SuiteCard
                      key={suiteId}
                      suite={suite}
                      report={report}
                      onExecute={(s) => setSelectedSuite(s)}
                      onDownload={handleDownloadReport}
                      executing={executing}
                      executeLoading={executeLoading}
                      downloading={downloading}
                      onCardClick={() => handleCardClick(suite)}
                    />
                  );
                })}
              </div>
            ) : (
              !error && (
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
            ))}
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
        onClose={handleCloseDetail}
        suite={detailSuite}
        report={detailReport}
        loading={detailLoading}
        error={detailError}
        onDownload={handleDownloadReport}
        downloading={detailSuite ? downloadingId === getSuiteId(detailSuite) : false}
      />
    </>
  );
};

export default Suite;