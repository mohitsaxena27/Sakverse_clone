import React, { useState, useEffect, useMemo } from "react";
import showToast from "../../../../../../items/ToastMessage/toastUtil";
import { useAdoTestData } from "../../../../../../Hooks/Manual/UserData";

const AdoPublishModal = ({
  isOpen,
  onClose,
  selectedTestCases,
  userStoryId,
  publishTestCasesApi,
  projectId,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedSuiteId, setSelectedSuiteId] = useState("");
  const [publishSelection, setPublishSelection] = useState([]);
  const [isPublishing, setIsPublishing] = useState(false);

  /* ============================
     FETCH COMBINED ADO DATA
  ============================ */
  const { plans, loading, error } = useAdoTestData(userStoryId);

  /* ============================
     GET SELECTED PLAN
  ============================ */
  const selectedPlan = useMemo(() => {
    return plans?.find(
      (plan) => String(plan.id) === String(selectedPlanId)
    );
  }, [plans, selectedPlanId]);

  const suites = selectedPlan?.suites || [];

  /* ============================
     Initialize Unpublished Cases
  ============================ */
  useEffect(() => {
    if (isOpen && selectedTestCases?.length) {
      const defaultSelection = selectedTestCases
        .filter((tc) => !tc.published)
        .map((tc) => tc.id);

      setPublishSelection(defaultSelection);
    }
  }, [isOpen, selectedTestCases]);

  const handleCheckboxChange = (id) => {
    setPublishSelection((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  /* ============================
     Confirm Publish
  ============================ */
  const confirmPublish = async () => {
    if (isPublishing) return;

    if (!selectedPlanId || !selectedSuiteId) {
      showToast("Please select test plan and test suite", "error");
      return;
    }

    if (!publishSelection.length) {
      showToast("Select at least one test case", "error");
      return;
    }

    setIsPublishing(true);

    const payload = {
      userstory_ref_id: Number(userStoryId),
      plan_id: String(selectedPlanId),
      suite_id: String(selectedSuiteId),
      testcases: publishSelection.map(Number),
    };

    // console.log("Publishing Payload:", payload);

    const result = await publishTestCasesApi(payload);

    if (result?.success) {
      showToast("Test cases published successfully", "success");
      onClose();
    } else {
      showToast("Failed to publish test cases", "error");
    }

    setIsPublishing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-2">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-2 flex flex-col max-h-[95vh] border border-gray-200 overflow-hidden">

        {/* ================= HEADER ================= */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-4 text-white flex justify-between items-center">
          <div>
            <h2 className="text-lg sm:text-xl font-bold">
              Publish to Azure DevOps
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm mt-1">
              Select test plan and suite to publish test cases
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white text-xl font-bold hover:text-red-500"
          >
            ✕
          </button>
        </div>

        {/* ================= BODY ================= */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* PLAN + SUITE SELECTORS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* Test Plan */}
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Test Plan *
              </label>

              {loading && <p>Loading plans...</p>}
              {error && <p className="text-red-600">{error}</p>}

              <select
                value={selectedPlanId}
                onChange={(e) => {
                  setSelectedPlanId(e.target.value);
                  setSelectedSuiteId("");
                }}
                className="px-3 py-2 border rounded text-sm"
              >
                <option value="">Select Test Plan</option>
                {plans?.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Test Suite */}
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Test Suite *
              </label>

              {loading && selectedPlanId && <p>Loading suites...</p>}

              <select
                value={selectedSuiteId}
                onChange={(e) => setSelectedSuiteId(e.target.value)}
                disabled={!selectedPlanId}
                className="px-3 py-2 border rounded text-sm disabled:bg-gray-100"
              >
                <option value="">Select Test Suite</option>
                {suites?.map((suite) => (
                  <React.Fragment key={suite.id}>
                    <option value={suite.id}>{suite.name}</option>
                    {suite.children?.map((child) => (
                      <option key={child.id} value={child.id}>
                        └ {child.name}
                      </option>
                    ))}
                  </React.Fragment>
                ))}
              </select>
            </div>
          </div>

          {/* ================= TEST CASE TABLE ================= */}
          <div className="flex flex-col space-y-2">
            <h3 className="text-base font-semibold text-gray-800">
              Selected Test Cases ({publishSelection.length})
            </h3>

            <div className="bg-white border rounded shadow-sm overflow-auto max-h-60">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-blue-50 sticky top-0 z-10">
                  <tr className="text-blue-700">
                    <th className="px-3 py-2 border-b">Select</th>
                    <th className="px-3 py-2 border-b">Scenario</th>
                    <th className="px-3 py-2 border-b">Expected Result</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTestCases?.map((tc) => (
                    <tr key={tc.id} className="hover:bg-blue-50">
                      <td className="px-3 py-2 border-b text-center">
                        <input
                          type="checkbox"
                          checked={publishSelection.includes(tc.id)}
                          onChange={() => handleCheckboxChange(tc.id)}
                          disabled={tc.published}
                          className="h-4 w-4 accent-blue-600"
                        />
                      </td>
                      <td className="px-3 py-2 border-b">{tc.summary}</td>
                      <td className="px-3 py-2 border-b">
                        {tc.expected_result}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="border-t px-6 py-4 flex justify-between items-center">
          <button
            onClick={onClose}
            disabled={isPublishing}
            className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
          >
            Cancel
          </button>

<button
  onClick={confirmPublish}
  disabled={
    isPublishing ||
    !selectedPlanId ||
    !selectedSuiteId ||
    !publishSelection.length
  }
  className={`px-4 py-2 text-white rounded text-sm font-semibold transition-colors ${
    isPublishing ||
    !selectedPlanId ||
    !selectedSuiteId ||
    !publishSelection.length
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
  }`}
>
  {isPublishing ? "Publishing..." : "Publish Test Cases"}
</button>

        </div>
      </div>
    </div>
  );
};

export default AdoPublishModal;
