import React, { useState } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";

const ExecutedSection = ({ result, isEditable, onUpdateResult, onSaveResult, onCopy, copied }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localResult, setLocalResult] = useState(result);

  const handleSave = async () => {
    await onSaveResult(localResult);
    onUpdateResult(localResult);
    setIsEditing(false);
  };
// console.log("ExecutedSection result:", result);
  const handleCancel = () => {
    setLocalResult(result);
    setIsEditing(false);
  };

const renderField = (field, label, value, isError = false) => {
  // Hide empty fields except target while editing
  if (
    !isEditing &&
    (!value || value.toString().trim() === "")
  ) {
    return null;
  }

  const displayValue = value || "";
  const colorClass = isError ? "text-red-300" : "text-green-300";
  const bgClass = isError
    ? "bg-red-900/20 border-red-800"
    : "bg-gray-900/50 border-gray-800";

  return (
    <div className={`p-3 ${bgClass} rounded-lg border`}>
      <div className="flex justify-between items-center mb-1">
        <span
          className={`text-xs ${
            isError ? "text-red-400" : "text-gray-500"
          } capitalize`}
        >
          {label}
        </span>

        {!isEditing && !isError && displayValue && (
          <button
            onClick={(e) => onCopy(displayValue, e)}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            {copied ? (
              <FiCheck className="w-3 h-3" />
            ) : (
              <FiCopy className="w-3 h-3" />
            )}
          </button>
        )}
      </div>

      {isEditing && !isError ? (
        <textarea
          value={localResult[field] || ""}
          onChange={(e) =>
            setLocalResult({
              ...localResult,
              [field]: e.target.value,
            })
          }
          onKeyDown={(e) => e.stopPropagation()}
          className="w-full text-sm bg-gray-900 text-green-300 font-mono p-2 rounded"
        />
      ) : (
        <code
          className={`block w-full text-sm ${colorClass} font-mono break-all whitespace-pre-wrap`}
        >
          {displayValue}
        </code>
      )}
    </div>
  );
};

  return (
    <div className="mt-6 pt-4 border-t border-gray-700 space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-md text-gray-300 font-semibold">Executed</span>

        {isEditable && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="text-xs px-3 py-1 bg-green-700 hover:bg-green-600 rounded"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="text-xs px-3 py-1 bg-red-700 hover:bg-red-600 rounded"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded"
              >
                Edit
              </button>
            )}
          </div>
        )}
      </div>

      {renderField("target", "target", result?.target)}
      {renderField("value", "value", result?.value)}
      {renderField("data", "data", result?.data)}
      {result?.error && renderField("error", "error | logs", result.error, true)}
    </div>
  );
};

export default ExecutedSection;