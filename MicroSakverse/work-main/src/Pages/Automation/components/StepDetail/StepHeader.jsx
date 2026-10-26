import React from "react";
import { AiOutlineDelete, AiOutlineDown } from "react-icons/ai";
import { MdDragHandle } from "react-icons/md";

const STEP_TYPES = [
  {
    value: "ACTION",
    label: "Action",
    icon: "⚡",
    description:
      "Executes a user interaction such as clicking buttons, submitting forms, or triggering UI events."
  },

  {
    value: "NAVIGATION",
    label: "Navigation",
    icon: "🧭",
    description:
      "Moves the test flow to a different page, route, tab, or application state."
  },

  {
    value: "INPUT",
    label: "Input",
    icon: "⌨️",
    description:
      "Enters or updates text, numbers, credentials, or other field values in the application."
  },

  {
    value: "SELECTION",
    label: "Selection",
    icon: "🎯",
    description:
      "Selects specific elements, options, checkboxes, radio buttons, or targets within the UI."
  },

  {
    value: "EXPAND",
    label: "Expand",
    icon: "🔍",
    description:
      "Expands hidden content such as dropdowns, accordions, menus, modals, or collapsible sections."
  },

  {
    value: "WAIT",
    label: "Wait",
    icon: "⏳",
    description:
      "Pauses execution until a timeout, element visibility, page load, or expected condition is met."
  },

  {
    value: "SCREENSHOT",
    label: "Screenshot",
    icon: "📸",
    description:
      "Captures the current browser or application view for debugging, reporting, or visual validation."
  },

  {
    value: "ASSERTION",
    label: "Assertion",
    icon: "✅",
    description:
      "Validates expected application behavior, UI state, content, or test conditions."
  },

  {
    value: "CUSTOM",
    label: "Custom",
    icon: "<>",
    description:
      "Executes custom automation logic or advanced scripted behavior outside predefined step types."
  }
];

const StepHeader = ({
  step,
  statusStyle,
  isEditMode,
  executionStatus,
  isOpen,
  onToggleOpen,
  onDeleteRequest,
  onToggleAbility
}) => {
  const isEditable = isEditMode && executionStatus !== "IN_PROGRESS";

  const stepTypeData =
    STEP_TYPES.find(
      (item) =>
        item.value.toLowerCase() === step?.step_type?.toLowerCase()
    ) || {};

 return (
  <div className="p-4 flex gap-4 hover:bg-white/5 transition">
    
    {/* Drag and Delete Icons */}
    {isEditable && (
      <div className="flex items-center gap-1 pr-2 shrink-0">
        <div className="text-gray-500 cursor-grab active:cursor-grabbing">
          <MdDragHandle className="w-5 h-5" />
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteRequest();
          }}
          className="text-red-500 hover:text-red-300 transition-colors p-1"
        >
          <AiOutlineDelete className="w-4 h-4" />
        </button>
      </div>
    )}

    {/* CLICKABLE ACCORDION AREA */}
    <div
      onClick={onToggleOpen}
      className="flex flex-1 gap-4 cursor-pointer min-w-0"
    >
      {/* Step Number */}
      <div className="flex items-center justify-center shrink-0">
        <div
          className={`w-9 h-9 rounded-full border ${statusStyle.border} flex items-center justify-center`}
        >
          <span className={`text-sm font-bold ${statusStyle.text}`}>
            {step?.step ?? "-"}
          </span>
        </div>
      </div>

      {/* Step Info */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center gap-3">
          <div className="space-y-1 flex-1">
            <div className="flex items-start gap-2 flex-wrap">

              {/* STEP TYPE WITH TOOLTIP */}
              <div
                className="relative group"
                onClick={(e) => e.stopPropagation()}
              >
                <span
                  className={`px-2.5 py-1 rounded text-xs font-semibold cursor-help ${statusStyle.bg}`}
                >
                  {step?.step_type?.toUpperCase() || "STEP"}
                </span>

                {/* Tooltip */}
                <div className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                  <div className="rounded-xl border border-white bg-sky-950 shadow-2xl px-4 py-3 backdrop-blur">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">
                        {stepTypeData.icon}
                      </span>

                      <span className="font-semibold text-white text-sm">
                        {stepTypeData.label || "Step"}
                      </span>
                    </div>

                    <p className="text-sm text-gray-300 leading-relaxed">
                      {stepTypeData.description ||
                        "Performs an automation step."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Intent */}
              <span className="font-medium text-white break-all whitespace-pre-wrap">
                {step?.intent || "—"}
              </span>
            </div>

            {step?.timestamp && (
              <div className="text-xs text-gray-500">
                {step.timestamp}
              </div>
            )}
          </div>

          {/* Enable/Disable Button */}
          {executionStatus !== "IN_PROGRESS" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleAbility(!step?.enabled);
              }}
              className={`px-3 py-1 text-xs rounded transition ${
                step?.enabled
                  ? "bg-green-700 hover:bg-green-600 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-gray-300"
              }`}
            >
              {step?.enabled ? "Enabled" : "Disabled"}
            </button>
          )}

          {/* Status Badge + Accordion Toggle */}
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${statusStyle.bg}`}
            >
              <span className={statusStyle.text}>
                {statusStyle.icon}
              </span>

              <span
                className={`text-xs font-semibold ${statusStyle.text}`}
              >
                {status?.toUpperCase?.()}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleOpen();
              }}
              className="p-1 rounded hover:bg-white/10 transition"
            >
              <AiOutlineDown
                className={`transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default StepHeader;