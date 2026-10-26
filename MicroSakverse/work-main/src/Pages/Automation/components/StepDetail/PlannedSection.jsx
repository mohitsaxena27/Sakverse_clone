import React, { useState } from "react";

const PlannedSection = ({ step, isEditMode, isEditable, onUpdateStep, onSaveStep }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localStep, setLocalStep] = useState(step);

  const handleSave = async () => {
    await onSaveStep(localStep);
    onUpdateStep(localStep);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalStep(step);
    setIsEditing(false);
  };

  const getFieldLabel = (field) => {
    if (field === "value" && step?.step_type === "custom") return "script";
    return field;
  };

  const hasContent = (field) => isEditing || step?.[field];

  if (!isEditMode && !step?.intent && !step?.target && !step?.value) return null;

  return (
    <div className="mt-6 border-gray-700 space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-md text-gray-300 font-semibold">Planned</span>

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

      {["intent", "target", "value"].map((field) =>
        hasContent(field) ? (
          <div key={field} className="flex flex-col text-xs">
            <div className="flex justify-between items-center mb-1">
              <span className="capitalize">{getFieldLabel(field)}:</span>
            </div>

            {isEditing ? (
              <textarea
                value={localStep[field] || ""}
                onChange={(e) =>
                  setLocalStep({ ...localStep, [field]: e.target.value })
                }
                onKeyDown={(e) => e.stopPropagation()}
                className="w-full px-2 py-1 bg-gray-900 rounded font-mono text-sm"
              />
            ) : (
              <code className="block w-full px-2 py-1 bg-gray-900 rounded font-mono break-all whitespace-pre-wrap text-sm">
                {step[field]}
              </code>
            )}
          </div>
        ) : null
      )}
    </div>
  );
};

export default PlannedSection;