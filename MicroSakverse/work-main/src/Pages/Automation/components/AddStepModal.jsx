import React, { useState, useEffect, useRef } from "react";
import { AiOutlineClose, AiOutlineDown, AiOutlineInfoCircle } from "react-icons/ai";
import { BiTargetLock } from "react-icons/bi";
import { MdOutlineSubtitles, MdOutlineNumbers } from "react-icons/md";
import { FiType } from "react-icons/fi";
import { toast } from "react-toastify";

const STEP_TYPES = [
  { value: "ACTION", label: "Action", icon: "⚡", description: "Perform click or action" },
  { value: "NAVIGATION", label: "Navigation", icon: "🧭", description: "Navigate to different page" },
  { value: "INPUT", label: "Input", icon: "⌨️", description: "Enter text or value" },
  { value: "SELECTION", label: "Selection", icon: "🎯", description: "Select an element on page" },
  { value: "EXPAND", label: "Expand", icon: "🔍", description: "Expand dropdown or section" },
  { value: "WAIT", label: "Wait", icon: "⏳", description: "Wait for element or time" },
  { value: "SCREENSHOT", label: "Screenshot", icon: "📸", description: "Capture screen" },
  { value: "assertion", label: "Assertion", icon: "✅", description: "Verify a condition" },
  { value: "CUSTOM", label: "Custom", icon: "<>", description: "Custom step" },
];

const AddStepModal = ({ isOpen, onClose, onAdd }) => {
  const [form, setForm] = useState({
    step_type: "ACTION",
    intent: "",
    target: "",
    value: "",
  });

  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const dropdownRef = useRef(null);
  const textareaRef = useRef(null);
  const lineRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsTypeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const selectStepType = (type) => {
    setForm((prev) => ({ ...prev, step_type: type }));
    setIsTypeDropdownOpen(false);

    if (errors.step_type) {
      setErrors((prev) => ({ ...prev, step_type: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.intent.trim()) newErrors.intent = "Intent is required";
    if (!form.target.trim()) newErrors.target = "Target is required";
    if (!form.step_type) newErrors.step_type = "Please select a step type";

    return newErrors;
  };

  const isFormValid =
    form.intent.trim() &&
    form.target.trim() &&
    form.step_type;

  const handleSubmit = () => {
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill all required fields");
      return;
    }

    onAdd({
      step_type: form.step_type.toLowerCase(),
      intent: form.intent,
      target: form.target,
      value: form.value || null,
    });

    toast.success("Step created successfully");

    onClose();
    setForm({ step_type: "ACTION", intent: "", target: "", value: "" });
    setErrors({});
  };

  const selectedType =
    STEP_TYPES.find((t) => t.value === form.step_type) || STEP_TYPES[0];

  const isCustom = form.step_type === "CUSTOM";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md shadow-2xl">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">
              Add New Step
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white bg-gray-800 rounded-lg p-1.5"
            >
              <AiOutlineClose size={18} />
            </button>
          </div>

          {/* Form */}
          <div className="p-4 space-y-4">
            
            {/* Step Type */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-300">
                <FiType />
                Step Type
              </label>

              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() =>
                    setIsTypeDropdownOpen(!isTypeDropdownOpen)
                  }
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span>{selectedType.icon}</span>
                    <span className="text-white">
                      {selectedType.label}
                    </span>
                  </div>
                  <AiOutlineDown />
                </button>

                {isTypeDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg">
                    {STEP_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => selectStepType(type.value)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 text-left"
                      >
                        <span>{type.icon}</span>
                        <span className="text-white text-sm">
                          {type.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Intent */}
            <div className="space-y-1.5">
              <label className="text-sm text-gray-300">
                Intent *
              </label>
             <input
  name="intent"
  value={form.intent}
  onChange={handleChange}
  onKeyDown={(e) => e.stopPropagation()}   // ← ADD THIS
  placeholder="Click login button"
  className={`w-full px-3 py-2 rounded-lg bg-gray-800 text-white ${
    errors.intent ? "border-red-500 border" : ""
  }`}
/>
              {errors.intent && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AiOutlineInfoCircle /> {errors.intent}
                </p>
              )}
            </div>

            {/* Target */}
            <div className="space-y-1.5">
              <label className="text-sm text-gray-300">
                Target *
              </label>
        <input
  name="target"
  value={form.target}
  onChange={handleChange}
  onKeyDown={(e) => e.stopPropagation()}   // ← ADD THIS
  placeholder="CSS selector..."
  className={`w-full px-3 py-2 rounded-lg bg-gray-800 text-white ${
    errors.target ? "border-red-500 border" : ""
  }`}
/>
              {errors.target && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AiOutlineInfoCircle /> {errors.target}
                </p>
              )}
            </div>

            {/* Value / Custom */}
            {!isCustom ? (
                  <input
  name="value"
  value={form.value}
  onChange={handleChange}
  onKeyDown={(e) => e.stopPropagation()}   // ← ADD THIS
  placeholder="Value"
  className={`w-full px-3 py-2 rounded-lg bg-gray-800 text-white ${
    errors.value ? "border-red-500 border" : ""
  }`}
/>
            ) : (
       <div className="space-y-1.5 col-span-1">
  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-300">
    <FiType />
    Custom Script
  </label>

  <div className="border border-gray-700 rounded-lg overflow-hidden bg-[#0d1117]">
    
    <div className="flex font-mono text-sm leading-6 h-56">
      
      {/* Line Numbers */}
      <div
        ref={lineRef}
        className="bg-[#161b22] text-gray-500 px-3 py-2 text-right select-none overflow-hidden"
      >
        {(form.value || "").split("\n").map((_, i) => (
          <div key={i} className="h-6">
            {i + 1}
          </div>
        ))}
      </div>

      {/* Textarea */}
<textarea
  ref={textareaRef}
  name="value"
  value={form.value}
  onChange={handleChange}
  placeholder="// Write your custom script here..."
  spellCheck={false}
  className="flex-1 bg-transparent text-gray-200 px-3 py-2 outline-none resize-none leading-6 overflow-auto"
  onScroll={(e) => {
    if (lineRef.current) {
      lineRef.current.scrollTop = e.target.scrollTop;
    }
  }}
  onKeyDown={(e) => {
    e.stopPropagation(); // ← now always runs
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;

      const newValue =
        form.value.substring(0, start) +
        "  " +
        form.value.substring(end);

      setForm((prev) => ({ ...prev, value: newValue }));

      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  }}
/>
    </div>
  </div>
</div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t border-gray-800">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-300"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className={`px-4 py-2 rounded text-white ${
                isFormValid
                  ? "bg-blue-600"
                  : "bg-gray-700 opacity-50 cursor-not-allowed"
              }`}
            >
              Create Step
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStepModal;