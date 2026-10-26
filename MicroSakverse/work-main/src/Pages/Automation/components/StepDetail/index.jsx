import React, { useState } from "react";
import StepHeader from "./StepHeader";
import StepContent from "./StepContent";
import DeleteConfirmModal from "./DeleteConfirmModal";
import ScreenshotModal from "./ScreenshotModal";
import { STATUS_STYLES } from "./constants";

const StepDetail = ({
  step = {},
  result = {},          // ✅ Now received directly from StepList
  status = "",
  isEditMode = false,
  onUpdatePlannedStep,
  onUpdateExecutionStep,
  onDelete,
  executionStatus
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const statusStyle = STATUS_STYLES?.[status] || STATUS_STYLES.pending;

const handleToggleOpen = (e) => {
  // Prevent drag interactions from triggering accordion
  if (e?.defaultPrevented) return;

  // Allow accordion toggle in both normal + edit mode
  setIsOpen((prev) => !prev);
};

  const handleDeleteRequest = () => setShowDeleteConfirm(true);
  const handleConfirmDelete = () => {
    if (onDelete) onDelete();
    setShowDeleteConfirm(false);
  };
  const handleCloseModals = () => {
    setShowDeleteConfirm(false);
    setShowScreenshot(false);
  };

  return (
    <div className={`rounded-lg border ${statusStyle.border} ${statusStyle.bg} transition`}>
      <div className={step?.enabled === false ? "opacity-50" : "opacity-100"}>
        <StepHeader
          step={step}
          status={status}
          statusStyle={statusStyle}
          isEditMode={isEditMode}
          executionStatus={executionStatus}
          isOpen={isOpen}
          onToggleOpen={handleToggleOpen}
          onDeleteRequest={handleDeleteRequest}
          onToggleAbility={(enabled) => {
            onUpdatePlannedStep?.(step.step_id, { enabled });
          }}
        />

        {isOpen && (
          <StepContent
            step={step}
            result={result}           // ✅ Clean direct pass
            isEditMode={isEditMode}
            executionStatus={executionStatus}
            onUpdatePlannedStep={onUpdatePlannedStep}
            onUpdateExecutionStep={onUpdateExecutionStep}
            onShowScreenshot={() => setShowScreenshot(true)}
          />
        )}
      </div>

      {showDeleteConfirm && (
        <DeleteConfirmModal
          onConfirm={handleConfirmDelete}
          onCancel={handleCloseModals}
        />
      )}

      {showScreenshot && result?.screenshot && (
        <ScreenshotModal
          screenshot={result.screenshot}
          stepNumber={step?.step}
          stepIntent={step?.intent}
          onClose={() => setShowScreenshot(false)}
        />
      )}
    </div>
  );
};

export default StepDetail;