import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLayerGroup,
  faHashtag,
  faFolder,
  faTimes,
  faDownload,
  faSpinner,
  faSearch,
  faClock,
  faListCheck,
} from '@fortawesome/free-solid-svg-icons';
import { getStyle } from '../constants';
import { STATUS_STYLES, EXEC_STATUS_STYLES } from '../constants';
import { getSuiteId, formatDate, formatDuration } from '../utils';
import { DonutChart, Lightbox } from '../components/Lightbox';
import TestCaseAccordion from '../components/TestCaseAccordion';

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
                  {/* <div className="flex items-center justify-center">
                    <DonutChart
                      passed={report.summary.passed}
                      failed={report.summary.failed}
                      skipped={report.summary.skipped}
                    />
                  </div> */}
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

export default SuiteDetailModal;