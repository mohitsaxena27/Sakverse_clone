import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight,
  faCode,
  faTriangleExclamation,
  faArrowUpRightFromSquare,
} from '@fortawesome/free-solid-svg-icons';
import { getStyle } from '../constants';
import { CASE_STATUS_STYLES, ACTION_STYLES } from '../constants';
import { formatDate } from '../utils';
import { ScreenshotThumb } from './Lightbox';

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
              <span className="text-[11px] font-mono text-gray-400">
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

export default TestCaseAccordion;