import React, { useState, useEffect } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";
import PlannedSection from "./PlannedSection";
import ExecutedSection from "./ExecutedSection";

const StepContent = ({
  step,
  result,
  isEditMode,
  executionStatus,
  onUpdatePlannedStep,
  onUpdateExecutionStep,
  onShowScreenshot
}) => {
  const [copied, setCopied] = useState(false);
  const [editableStep, setEditableStep] = useState(step);
  const [editableResult, setEditableResult] = useState(result);

  useEffect(() => {
    setEditableStep((prev) => ({
      ...step,
      enabled: step.enabled !== undefined ? step.enabled : (prev?.enabled ?? true),
    }));
  }, [step]);

  useEffect(() => {
    if (result && Object.keys(result).length > 0) {
      setEditableResult(result);
    }
  }, [result]);

  const handleCopy = async (text, e) => {
    if (e) e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const buildFullStepText = () => {
    const planned = [
      editableStep?.intent && `Intent: ${editableStep.intent}`,
      editableStep?.target && `Target: ${editableStep.target}`,
      editableStep?.value &&
        `${editableStep?.step_type === "custom" ? "Script" : "Value"}: ${editableStep.value}`
    ].filter(Boolean);

    const executed = [
      editableResult?.data && `Data: ${editableResult.data}`,
      editableResult?.target && `Target: ${editableResult.target}`,
      editableResult?.error && `Error: ${editableResult.error}`,
      editableResult?.value && `Value: ${editableResult.value}`
    ].filter(Boolean);

    return [
      `Step ${editableStep?.step || ""}`,
      editableStep?.step_type && `Type: ${editableStep.step_type}`,
      "--------",
      planned.length && "",
      planned.length && "Planned : ",
      ...planned,
      "--------",
      executed.length && "",
      executed.length && "Executed :",
      ...executed
    ]
      .filter(Boolean)
      .join("\n");
  };

  const isEditable = executionStatus !== "IN_PROGRESS";

  return (
    <div className="px-4 pb-4 border-t border-gray-800">
      <div className="w-full flex justify-end pt-3">
        <button
          onClick={(e) => handleCopy(buildFullStepText(), e)}
          className="text-xs px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded flex items-center gap-1"
        >
          {copied ? <FiCheck /> : <FiCopy />}
          copy
        </button>
      </div>

      <PlannedSection
        step={editableStep}
        isEditMode={isEditMode}
        isEditable={isEditable}
        onUpdateStep={(updatedStep) => setEditableStep(updatedStep)}
        onSaveStep={async (stepData) => {
          await onUpdatePlannedStep?.(stepData.step_id, {
            intent: stepData.intent,
            target: stepData.target,
            value: stepData.value,
            status: "pending",
          });
        }}
      />

      {(editableResult?.data || editableResult?.error || editableResult?.target || editableResult?.value) && (
        <ExecutedSection
          result={editableResult}
          isEditable={isEditable}
          onUpdateResult={(updatedResult) => setEditableResult(updatedResult)}
          onSaveResult={async (resultData) => {
            const payload = {};
            if (resultData.hasOwnProperty('target')) payload.target = resultData.target;
            if (resultData.hasOwnProperty('value')) payload.value = resultData.value;
            if (resultData.hasOwnProperty('data')) payload.value = resultData.data;
            
            if (Object.keys(payload).length > 0) {
              await onUpdateExecutionStep?.(resultData.id, payload);
            }
          }}
          onCopy={handleCopy}
          copied={copied}
        />
      )}

      {editableResult?.screenshot && (
        <div className="mt-6 pt-4 border-t border-gray-800">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowScreenshot();
            }}
            className="text-blue-400 hover:text-blue-300 text-sm hover:underline"
          >
            View Screenshot →
          </button>
        </div>
      )}
    </div>
  );
};

export default StepContent;