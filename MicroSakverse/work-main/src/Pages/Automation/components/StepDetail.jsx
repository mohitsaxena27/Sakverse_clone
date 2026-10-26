import React, { useState, useEffect } from "react";
import { AiOutlineClose, AiOutlineDown, AiOutlineDelete } from "react-icons/ai";
import { MdDragHandle } from "react-icons/md";
import { FiCopy, FiCheck } from "react-icons/fi";

const STATUS_STYLES = {
  passed: {
    bg: "bg-green-900/20",
    border: "border-green-700",
    text: "text-green-400",
    icon: "✓",
  },
  failed: {
    bg: "bg-red-900/20",
    border: "border-red-700",
    text: "text-red-400",
    icon: "✗",
  },
  running: {
    bg: "bg-blue-900/20",
    border: "border-blue-700",
    text: "text-blue-400",
    icon: "▶",
  },
  pending: {
    bg: "bg-gray-800/30",
    border: "border-gray-700",
    text: "text-gray-400",
    icon: "•",
  },
};

const StepDetail = ({
  step = {},
  status = "",
  result = {},
  isEditMode = false,
  onUpdatePlannedStep,
  onUpdateExecutionStep,
  onDelete,
  executionStatus
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const [isEditingStep, setIsEditingStep] = useState(false);
  const [isEditingResult, setIsEditingResult] = useState(false);

  const [editableStep, setEditableStep] = useState(step);
  const [editableResult, setEditableResult] = useState(result);

useEffect(() => {
  setEditableStep((prev) => ({
    ...step,
    // Preserve local enabled state if incoming step doesn't explicitly define it
    enabled: step.enabled !== undefined ? step.enabled : (prev?.enabled ?? true),
  }));
}, [step]);

// Replace the existing useEffect for editableResult:

useEffect(() => {
  // Only update editableResult if the new result has content
  // Don't clear existing result when result becomes empty
  if (result && Object.keys(result).length > 0) {
    setEditableResult(result);
  }
  // Keep existing result if new result is empty
}, [result]);

const statusStyle = STATUS_STYLES?.[status] || STATUS_STYLES.pending;
  // console.log("Status:", status);

  const handleCopy = async (text, e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const cancelStepEdit = () => {
    setEditableStep(step);
    setIsEditingStep(false);
  };

const cancelResultEdit = () => {
  setEditableResult(result); // Reset to original result
  setIsEditingResult(false);
};


const handleSaveStep = async () => {
  try {
    // Update planned fields with pending status
    await onUpdatePlannedStep?.(editableStep.step_id, {
      intent: editableStep.intent,
      target: editableStep.target,
      value: editableStep.value,
      status: "pending",
    });

    // DON'T clear execution data - keep it
    // Remove this line: setEditableResult({});
    
    setIsEditingStep(false);
  } catch (err) {
    console.error(err);
  }
};
const handleSaveResult = async () => {
  try {
    // Only include fields that exist in the current editableResult and have been modified
    const payload = {};
    
    // Only add target if it exists in the original result
    if (editableResult.hasOwnProperty('target')) {
      payload.target = editableResult.target;
    }
    
    // Only add value if it exists in the original result
    if (editableResult.hasOwnProperty('value')) {
      payload.value = editableResult.value;
    }
    
    // Map 'data' field to 'value' for backend compatibility
    if (editableResult.hasOwnProperty('data')) {
      payload.value = editableResult.data;  // ← Map data to value
    }
    
    // If no fields to update, just exit edit mode
    if (Object.keys(payload).length === 0) {
      setIsEditingResult(false);
      return;
    }
    
    await onUpdateExecutionStep?.(editableResult.id, payload);
    setIsEditingResult(false);
  } catch (err) {
    console.error(err);
    alert('Failed to update execution step: ' + err.message);
  }
};

const handleAbilityToggle = async (enabled) => {
  // Store current result before making changes
  const currentResult = editableResult;
  
  setEditableStep((prev) => {
    if (!prev?.step_id) return prev;

    // fire API using safe value
    onUpdatePlannedStep?.(prev.step_id, { enabled }).catch((err) => {
      console.error(err);
    });

    return { ...prev, enabled };
  });
  
  // Restore the result after state update
  if (currentResult && Object.keys(currentResult).length > 0) {
    setEditableResult(currentResult);
  }
};
  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
    setShowDeleteConfirm(false);
  };



  const getFieldLabel = (field) => {
  if (field === "value" && editableStep?.step_type === "custom") {
    return "script";
  }
  return field;
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

  return (
<div
  className={`rounded-lg border ${statusStyle.border} ${statusStyle.bg} transition`}
>
  {/* ================= HEADER ================= */}
  <div className={editableStep?.enabled === false ? "opacity-50" : "opacity-100"}>
    <div
      onClick={() => !isEditMode && setIsOpen(!isOpen)}
      className="cursor-pointer p-4 flex gap-4 hover:bg-white/5 transition"
    >
      {/* Edit Mode Icons - Hidden during IN_PROGRESS */}
      {isEditMode && executionStatus !== "IN_PROGRESS" && (
        <div className="flex items-center gap-1 pr-2">
          <div className="text-gray-500 cursor-grab active:cursor-grabbing">
            <MdDragHandle className="w-5 h-5" />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            className="text-red-500 hover:text-red-300 transition-colors p-1"
          >
            <AiOutlineDelete className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-center shrink-0">
        <div
          className={`w-9 h-9 rounded-full border ${statusStyle.border} flex items-center justify-center`}
        >
          <span className={`text-sm font-bold ${statusStyle.text}`}>
            {editableStep?.step ?? "-"}
          </span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center gap-3">
          <div className="space-y-1 flex-1">
            <div className="flex items-start gap-2 flex-wrap">
              <span
                className={`px-2.5 py-1 rounded text-xs font-semibold ${statusStyle.bg}`}
              >
                {editableStep?.step_type?.toUpperCase() || "STEP"}
              </span>

              <span className="font-medium text-white break-all whitespace-pre-wrap">
                {editableStep?.intent || "—"}
              </span>
            </div>

            {editableStep?.timestamp && (
              <div className="text-xs text-gray-500">
                {editableStep.timestamp}
              </div>
            )}
          </div>
          
          {/* Enable/Disable Button - Hidden during IN_PROGRESS */}
          {executionStatus !== "IN_PROGRESS" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAbilityToggle(!editableStep?.enabled);
              }}
              className={`px-3 py-1 text-xs rounded transition ${
                editableStep?.enabled
                  ? "bg-green-700 hover:bg-green-600 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-gray-300"
              }`}
            >
              {editableStep?.enabled ? "Enabled" : "Disabled"}
            </button>
          )}

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${statusStyle.bg}`}
            >
              <span className={statusStyle.text}>
                {statusStyle.icon}
              </span>
              <span className={`text-xs font-semibold ${statusStyle.text}`}>
                {status?.toUpperCase?.()}
              </span>
            </div>

            <AiOutlineDown
              className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        </div>
      </div>
    </div>

    {/* ================= BODY ================= */}
    {isOpen && (
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

        {/* -------- Planned Section -------- */}
        <div className="mt-6 border-gray-700 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-md text-gray-300 font-semibold">
              Planned
            </span>

            {/* Edit buttons - Hidden during IN_PROGRESS */}
            {executionStatus !== "IN_PROGRESS" && (
              <div className="flex gap-2">
                {isEditingStep ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveStep();
                      }}
                      className="text-xs px-3 py-1 bg-green-700 hover:bg-green-600 rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelStepEdit();
                      }}
                      className="text-xs px-3 py-1 bg-red-700 hover:bg-red-600 rounded"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingStep(true);
                    }}
                    className="text-xs px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded"
                  >
                    Edit
                  </button>
                )}
              </div>
            )}
          </div>

          {["intent", "target", "value"].map((field) =>
            (isEditingStep || editableStep?.[field]) ? (
              <div key={field} className="flex flex-col text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="capitalize">{getFieldLabel(field)}:</span>
                </div>

                {isEditingStep ? (
                  <textarea
                    value={editableStep[field] || ""}
                    onChange={(e) =>
                      setEditableStep({
                        ...editableStep,
                        [field]: e.target.value,
                      })
                    }
                    onKeyDown={(e) => e.stopPropagation()}
                    className="w-full px-2 py-1 bg-gray-900 rounded font-mono text-sm"
                  />
                ) : (
                  <code className="block w-full px-2 py-1 bg-gray-900 rounded font-mono break-all whitespace-pre-wrap text-sm">
                    {editableStep[field]}
                  </code>
                )}
              </div>
            ) : null
          )}
        </div>

        {/* -------- Executed Section -------- */}
        {(editableResult?.data ||
          editableResult?.error ||
          editableResult?.target ||
          editableResult?.value) && (
          <div className="mt-6 pt-4 border-t border-gray-700 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-md text-gray-300 font-semibold">
                Executed
              </span>

              {/* Edit buttons - Hidden during IN_PROGRESS */}
              {executionStatus !== "IN_PROGRESS" && (
                <div className="flex gap-2">
                  {isEditingResult ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveResult();
                        }}
                        className="text-xs px-3 py-1 bg-green-700 hover:bg-green-600 rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelResultEdit();
                        }}
                        className="text-xs px-3 py-1 bg-red-700 hover:bg-red-600 rounded"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingResult(true);
                      }}
                      className="text-xs px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded"
                    >
                      Edit
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Display all fields that exist in the result */}
            {["target", "value", "data"].map((field) => {
              const fieldValue = editableResult?.[field];
              if (!fieldValue || fieldValue.toString().trim() === '') return null;
              
              return (
                <div key={field} className="p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500 capitalize">{field}</span>
                    {!isEditingResult && (
                      <button
                        onClick={(e) => handleCopy(fieldValue, e)}
                        className="text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {copied ? <FiCheck className="w-3 h-3" /> : <FiCopy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>

                  {isEditingResult ? (
                    <textarea
                      value={editableResult[field] || ""}
                      onChange={(e) =>
                        setEditableResult({
                          ...editableResult,
                          [field]: e.target.value,
                        })
                      }
                      onKeyDown={(e) => e.stopPropagation()}
                      className="w-full text-sm bg-gray-900 text-green-300 font-mono p-2 rounded"
                    />
                  ) : (
                    <code className="block w-full text-sm text-green-300 font-mono break-all whitespace-pre-wrap">
                      {fieldValue}
                    </code>
                  )}
                </div>
              );
            })}

            {/* Display error field (read-only, no edit) */}
            {editableResult?.error && (
              <div className="p-3 bg-red-900/20 rounded-lg border border-red-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-red-400 capitalize">error</span>
                  <button
                    onClick={(e) => handleCopy(editableResult.error, e)}
                    className="text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {copied ? <FiCheck className="w-3 h-3" /> : <FiCopy className="w-3 h-3" />}
                  </button>
                </div>
                <code className="block w-full text-sm text-red-300 font-mono break-all whitespace-pre-wrap">
                  {editableResult.error}
                </code>
              </div>
            )}
          </div>
        )}

        {/* -------- Screenshot -------- */}
        {editableResult?.screenshot && (
          <div className="mt-6 pt-4 border-t border-gray-800">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowScreenshot(true);
              }}
              className="text-blue-400 hover:text-blue-300 text-sm hover:underline"
            >
              View Screenshot →
            </button>
          </div>
        )}
      </div>
    )}
  </div>

  {/* ================= Delete Confirmation Modal ================= */}
  {showDeleteConfirm && (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold text-white mb-2">Delete Step</h3>
        <p className="text-gray-400 text-sm mb-6">
          Are you sure you want to delete this step?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(false);
            }}
            className="px-4 py-2 text-sm text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-500 rounded-lg"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )}

  {/* ================= Screenshot Modal ================= */}
  {showScreenshot && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="relative bg-gray-900 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden">
        <button
          onClick={() => setShowScreenshot(false)}
          className="absolute top-4 right-4 p-2 bg-red-600 rounded-full hover:bg-red-700 z-10"
        >
          <AiOutlineClose className="w-4 h-4 text-white" />
        </button>

        <img
          src={`data:image/webp;base64,${editableResult?.screenshot}`}
          alt="Step Screenshot"
          className="w-full h-auto max-h-[80vh] object-contain"
        />

        <div className="p-4 border-t border-gray-800">
          <div className="text-sm text-gray-400 break-all whitespace-pre-wrap">
            Step {editableStep?.step}: {editableStep?.intent}
          </div>
        </div>
      </div>
    </div>
  )}
</div>
  );
};

export default StepDetail;