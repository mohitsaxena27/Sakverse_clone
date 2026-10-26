import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faSpinner, faDownload } from '@fortawesome/free-solid-svg-icons';
import { getStyle } from '../constants';
import { EXEC_STATUS_STYLES, STATUS_STYLES } from '../constants';
import { getSuiteId } from '../utils';

const SuiteCard = ({
  suite,
  report,
  onExecute,
  onDownload,
  executing,
  executeLoading,
  downloading,
  onCardClick,
}) => {
  const suiteId = getSuiteId(suite);
  const execStatus = report?.suite_execution?.status || 'NOT_EXECUTED';
  const totalTestCases = report?.suite_execution?.total_testcases || 0;
  const passed = report?.summary?.passed || 0;
  const failed = report?.summary?.failed || 0;
  const execStyle = getStyle(EXEC_STATUS_STYLES, execStatus);

  return (
    <div
      onClick={onCardClick}
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
              onExecute(suite);
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
              onDownload(suite);
            }}
            disabled={downloading || !report}
            className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all duration-200 flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!report ? 'No report available' : 'Download report'}
          >
            <FontAwesomeIcon
              icon={downloading ? faSpinner : faDownload}
              className={`text-[10px] ${downloading ? 'animate-spin' : ''}`}
            />
            <span>{downloading ? 'Download...' : 'Report'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuiteCard;