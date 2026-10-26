import React, { useState, useEffect } from "react";
import { useUpdateTestCase } from "../../../Hooks/Manual/UserData";

const TestScenario = ({ data, testCaseId, Scenario, status, failedSteps }) => {
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState(data);
  const [expandedSections, setExpandedSections] = useState({
    testData: false,
    manualSteps: false,
    expectedResult: false,
  });

  const { updateTestCase, loading, error } = useUpdateTestCase();

  useEffect(() => {
    setFormData(data);
  }, [data]);

  useEffect(() => {
    if (!formData) return;
    Scenario({
      summary: formData.summary,
      test_data: formData.test_data,
      test_steps: formData.test_steps,
      expected_result: formData.expected_result,
    });
  }, [
    formData?.summary,
    formData?.test_data,
    formData?.test_steps,
    formData?.expected_result,
  ]);

  const toggleSection = (section) =>
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));

  const update = (key, value) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const updateArray = (key, index, value) => {
    const updated = [...formData[key]];
    updated[index] = value;
    update(key, updated);
  };

  const addItem = (key) => update(key, [...formData[key], ""]);

  const removeItem = (key, index) =>
    update(
      key,
      formData[key].filter((_, i) => i !== index)
    );

  const handleConfirm = async () => {
    const postData = {
      id: testCaseId,
      requirment_id: data.requirment_id,
      requirment_summary: data.requirment_summary,
      technique: data.technique,
      accepted: data.accepted,
      priority: data.priority,
      tobeautomate: data.tobeautomate,
      regression: data.regression,
      external_id: data.external_id ?? null,
      published: data.published ?? false,
      summary: formData.summary,
      expected_result: formData.expected_result,
      test_steps: JSON.stringify(formData.test_steps),
      test_data: JSON.stringify(formData.test_data),
    };

    try {
      const result = await updateTestCase(postData);
      if (result?.success) setIsEdit(false);
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  if (!formData) return null;


  const isReadOnly =
    (status === "SUCCESS" || status === "IN_PROGRESS") &&
    failedSteps === 0;


  // console.log("Current Status:", status);


  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {formData.summary}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Test Case ID:{" "}
            <span className="text-indigo-400 font-medium">{testCaseId}</span>
          </p>
        </div>
        <button
          onClick={() => (isEdit ? handleConfirm() : setIsEdit(true))}
          disabled={loading || isReadOnly}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
    ${isReadOnly
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
            }
  `}
          title={
            isReadOnly
              ? "Editing is disabled while test is running or after it has passed"
              : ""
          }
        >
          {loading ? "Saving..." : isEdit ? "Confirm" : "Edit"}
        </button>

      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Accordions */}
      <div className="space-y-3">
        <AccordionSection
          title="Test Data"
          count={formData.test_data?.length || 0}
          isExpanded={expandedSections.testData}
          onToggle={() => toggleSection("testData")}
        >
    <ListItems
  items={formData?.test_data || []}
  isEdit={isEdit}
  onUpdate={(i, val) => updateArray?.("test_data", i, val)}
  onRemove={(i) => removeItem?.("test_data", i)}
  onAdd={() => addItem?.("test_data")}
  renderItem={(item, i) => (
    <code
      className="flex-1 min-w-0 text-sm text-blue-300 bg-gray-800 p-2.5 rounded border border-gray-700 font-mono break-words whitespace-pre-wrap overflow-wrap-anywhere"
    >
      {item}
    </code>
  )}
  placeholder="Enter test data"
  emptyText="No test data added"
  addText="Add Test Data"
/>

        </AccordionSection>

        <AccordionSection
          title="Manual Steps"
          count={formData.test_steps?.length || 0}
          isExpanded={expandedSections.manualSteps}
          onToggle={() => toggleSection("manualSteps")}
        >
          <ListItems
            items={formData.test_steps}
            isEdit={isEdit}
            onUpdate={(i, val) => updateArray("test_steps", i, val)}
            onRemove={(i) => removeItem("test_steps", i)}
            onAdd={() => addItem("test_steps")}
            renderItem={(item) => (
              <span className="flex-1 text-gray-200 text-sm leading-relaxed">
                {item}
              </span>
            )}
            placeholder="Enter step description"
            emptyText="No steps added"
            addText="Add Step"
          />
        </AccordionSection>

        <AccordionSection
          title="Expected Result"
          isExpanded={expandedSections.expectedResult}
          onToggle={() => toggleSection("expectedResult")}
        >
          {isEdit ? (
            <textarea
              value={formData.expected_result}
              onChange={(e) => update("expected_result", e.target.value)}
              className="w-full bg-gray-800 p-3 rounded text-white text-sm border border-gray-700 focus:border-blue-500 focus:outline-none resize-none transition-colors"
              rows={5}
              placeholder="Describe the expected result..."
            />
          ) : (
            <div className="bg-blue-900/20 p-3 rounded text-white border border-blue-800/30 min-h-[60px]">
              {formData.expected_result || (
                <span className="text-gray-500 italic text-sm">
                  No expected result specified
                </span>
              )}
            </div>
          )}
        </AccordionSection>
      </div>
    </div>
  );
};

/* --------------------------------
   Reusable Components
--------------------------------- */
const AccordionSection = ({
  title,
  count,
  isExpanded,
  onToggle,
  children,
}) => (
  <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800/30">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between bg-gray-800 p-3 hover:bg-gray-750 transition-colors"
    >
      <h4 className="font-medium text-gray-300 flex items-center gap-2">
        {title}
        {count !== undefined && (
          <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </h4>
      <span className="text-gray-400 text-lg font-light">
        {isExpanded ? "−" : "+"}
      </span>
    </button>
    {isExpanded && (
      <div className="p-4 bg-gray-900/50 max-h-80 overflow-y-auto">
        {children}
      </div>
    )}
  </div>
);

const ListItems = ({
  items = [],
  isEdit,
  onUpdate,
  onRemove,
  onAdd,
  renderItem,
  placeholder,
  emptyText,
  addText,
}) => (
  <div className="space-y-2">
    {items.length > 0 ? (
      items.map((item, i) =>
        isEdit ? (
          <div key={i} className="flex gap-2 items-start">
            <span className="text-gray-400 text-sm mt-2.5 min-w-[28px] font-medium text-right">
              {i + 1}.
            </span>
            <input
              value={item}
              onChange={(e) => onUpdate(i, e.target.value)}
              className="flex-1 bg-gray-800 p-2 rounded text-sm text-white border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
              placeholder={placeholder}
            />
            <button
              onClick={() => onRemove(i)}
              className="text-red-400 hover:text-red-300 text-sm mt-2 px-2 transition-colors"
              title="Remove"
            >
              ✕
            </button>
          </div>
        ) : (
          <div key={i} className="flex gap-3 items-start">
            <span className="text-gray-400 text-sm min-w-[28px] font-medium text-right mt-0.5">
              {i + 1}.
            </span>
            {renderItem(item, i)}
          </div>
        )
      )
    ) : (
      <p className="text-gray-500 text-sm italic text-center py-4">
        {emptyText}
      </p>
    )}

    {isEdit && (
      <button
        onClick={onAdd}
        className="text-sm text-blue-400 hover:text-blue-300 mt-2 flex items-center gap-1.5 transition-colors"
      >
        <span className="text-lg leading-none">+</span>
        <span>{addText}</span>
      </button>
    )}
  </div>
);

export default TestScenario;