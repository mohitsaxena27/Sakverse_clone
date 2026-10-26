import React, { useContext, useMemo } from 'react';
import StepDetail from './StepDetail/index';
import { EditModeContext } from '../AutomationPage';

const ADD_AT_TOP = -1;

const StepList = ({
  steps = [],
  executionData,
  draggedIndex,
  dragOverIndex,
  loadingAction,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDragEnd,
  onDrop,
  onAddStep,
  onDeleteStep,
  onUpdatePlannedStep,
  onUpdateExecutionStep,
  executionStatus,
}) => {
  const { isEditMode } = useContext(EditModeContext);

  // ✅ Key results by step_id — position-independent, survives reorder
const resultsByStepId = useMemo(() => {
  const map = {};
  executionData?.results?.forEach((r) => {
    // r.id === step_id in the plan (that's how the API links them)
    if (r.id != null) {
      if (!map[r.id] || r.execution_order > map[r.id].execution_order) {
        map[r.id] = r;
      }
    }
  });
  return map;
}, [executionData]);

  // ✅ Status is now derived from step_id match, not position
const getStepStatus = (step) => {
  const result = resultsByStepId[step.step_id];

  // No result yet = this step hasn't run (new step, or execution hasn't reached it)
  if (!result) {
    // Fall back to the plan's execution_status for context
    const planStatus = step.execution_status?.toLowerCase();
    if (planStatus === 'running') return 'running';
    return 'pending';
  }

  // Result exists — use result.status (source of truth)
  const s = result.status?.toLowerCase();
  if (s === 'failed') return 'failed';
  if (s === 'running') return 'running';
  if (s === 'passed') return 'passed';
  return 'pending';
};

  if (!steps.length) {
    return (
      <div className="text-gray-500 text-sm text-center py-6">
        No steps available.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Add at top — only in edit mode */}
      {isEditMode && (
        <AddStepDivider
          onAddStep={() => onAddStep(ADD_AT_TOP)}
          isLoading={loadingAction?.type === 'add'}
        />
      )}

      {steps.map((step, index) => {
        // ✅ Result lookup by step_id — unaffected by drag reorder
        const result = resultsByStepId[step.step_id] ?? null;
        const status = getStepStatus(step);

        const isDragging = draggedIndex === index;
        const isDropTarget = dragOverIndex === index && draggedIndex !== index;
        const isActionLoading =
          loadingAction?.id === step.step_id &&
          (loadingAction?.type === 'delete' ||
            loadingAction?.type === 'reorder' ||
            loadingAction?.type === 'update-planned');

        return (
          <div key={step.step_id ?? index}>
            {/* Drop zone indicator ABOVE this step */}
            {isDropTarget && dragOverIndex <= draggedIndex && (
              <div className="h-0.5 bg-blue-500 rounded-full mx-2 my-1 transition-all" />
            )}

            <div
              draggable={isEditMode}
              onDragStart={() => isEditMode && onDragStart(index)}
              onDragOver={(e) => {
                e.preventDefault();
                isEditMode && onDragOver(e, index);
              }}
              onDragLeave={onDragLeave}
              onDragEnd={onDragEnd}
              onDrop={() => isEditMode && onDrop(index)}
              className={[
                'transition-all duration-150 rounded-lg',
                isEditMode ? 'cursor-move' : '',
                // Faded out while being dragged
                isDragging ? 'opacity-40 scale-[0.98]' : 'opacity-100',
                // Highlight drop target
                isDropTarget ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-black' : '',
                // Dim while this specific step's action is in-flight
                isActionLoading ? 'opacity-60 pointer-events-none' : '',
              ].filter(Boolean).join(' ')}
            >
              {/* Per-step loading overlay for delete/update */}
              <div className="relative">
                {isActionLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-end pr-3 pointer-events-none">
                    <svg
                      className="w-4 h-4 animate-spin text-blue-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  </div>
                )}

                <StepDetail
                  step={step}
                  result={result}
                  status={status}
                  isEditMode={isEditMode}
                  executionStatus={executionStatus}
                  onDelete={() => onDeleteStep(index)}
                  onUpdatePlannedStep={onUpdatePlannedStep}
                  onUpdateExecutionStep={onUpdateExecutionStep}
                />
              </div>
            </div>

            {/* Drop zone indicator BELOW this step */}
            {isDropTarget && dragOverIndex > draggedIndex && (
              <div className="h-0.5 bg-blue-500 rounded-full mx-2 my-1 transition-all" />
            )}

            {/* Add after each step — only in edit mode */}
            {isEditMode && (
              <AddStepDivider
                onAddStep={() => onAddStep(index)}
                isLoading={loadingAction?.type === 'add'}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

const AddStepDivider = ({ onAddStep, isLoading }) => (
  <div className="flex items-center gap-2 py-1 group">
    <div className="flex-1 h-px bg-gray-800 group-hover:bg-blue-800/50 transition-colors" />
    <button
      onClick={onAddStep}
      disabled={isLoading}
      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-400 bg-gray-900 hover:bg-blue-900/20 border border-gray-800 hover:border-blue-700/50 px-3 py-1 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <svg className="w-3 h-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : (
        <span className="text-base leading-none">+</span>
      )}
      {isLoading ? 'Adding...' : 'Add Step'}
    </button>
    <div className="flex-1 h-px bg-gray-800 group-hover:bg-blue-800/50 transition-colors" />
  </div>
);

export default StepList;