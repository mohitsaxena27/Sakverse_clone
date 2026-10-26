import React, { useEffect, useState } from "react";

const TestCaseEditModal = ({ isOpen, onClose, testCase, onSave }) => {
  const [formData, setFormData] = useState({
    summary: "",
    test_data: [],
    test_steps: [],
    expected_result: "",
  });

  useEffect(() => {
    if (testCase) {
      setFormData({
        summary: testCase.summary || "",
        test_data: testCase.test_data || [],
        test_steps: testCase.test_steps || [],
        expected_result: testCase.expected_result || "",
      });
    }
  }, [testCase]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    onSave({
      ...testCase,
      ...formData,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-[750px] rounded-lg shadow-xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="bg-blue-700 px-6 py-4 rounded-t-lg">
          <h2 className="text-lg font-semibold text-white">
            Edit Test Case
          </h2>
          <p className="text-blue-200 text-xs mt-1">
            Modify the test case details
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-sm">

          {/* Scenario */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Scenario <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.summary}
              onChange={(e) => handleChange("summary", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 text-sm"
              placeholder="Enter test case scenario..."
            />
          </div>

          {/* Test Data */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-gray-700">
                Test Data <span className="text-gray-400 text-[11px] font-normal">(One per line)</span>
              </label>
              <span className="text-[11px] bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                {formData.test_data.length} items
              </span>
            </div>
            <textarea
              value={formData.test_data.join("\n")}
              onChange={(e) =>
                handleChange("test_data", e.target.value.split("\n"))
              }
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono text-xs resize-none"
            />
          </div>

          {/* Test Steps */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-gray-700">
                Test Steps <span className="text-gray-400 text-[11px] font-normal">(One per line)</span>
              </label>
              <span className="text-[11px] bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                {formData.test_steps.length} steps
              </span>
            </div>
            <textarea
              value={formData.test_steps.join("\n")}
              onChange={(e) =>
                handleChange("test_steps", e.target.value.split("\n"))
              }
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono text-xs resize-none"
            />
          </div>

          {/* Expected Result */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Expected Result <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.expected_result}
              onChange={(e) => handleChange("expected_result", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 text-sm"
              placeholder="Enter expected result..."
            />
          </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-md hover:bg-blue-800 transition"
          >
            Save
          </button>
        </div>

      </div>
    </div>
  );
};

export default TestCaseEditModal;
