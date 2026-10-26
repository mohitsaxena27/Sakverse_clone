import React, { useState, useEffect } from "react";
import showToast from "../../../../../../items/ToastMessage/toastUtil";
import { useTestConfiguration } from "../../../../../../Hooks/Manual/UserData";
import { useFetchData } from "../../../../useFetchData";

const KiwiPublishModal = ({
  isOpen,
  onClose,
  selectedTestCases,
  userStoryId,
  publishTestCasesApi,
  projectId, // ✅ Add this to use useFetchData
}) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [selectedTestPlan, setSelectedTestPlan] = useState("");
  const [isNewVersion, setIsNewVersion] = useState(false);
  const [newVersionName, setNewVersionName] = useState("");
  const [isNewTestPlan, setIsNewTestPlan] = useState(false);
  const [newTestPlanName, setNewTestPlanName] = useState("");
  const [newTestPlanParent, setNewTestPlanParent] = useState(null);
  const [dropdownConfig, setDropdownConfig] = useState({ Versions: [], TestPlans: {} });
  const [publishSelection, setPublishSelection] = useState([]);
  const [isPublishing, setIsPublishing] = useState(false); // ✅ new state for loader

  const { data, loading, error } = useTestConfiguration(userStoryId);
  const { data: updatedData, GetUpdate } = useFetchData(userStoryId, projectId);

  // ✅ Initialize product, versions, and test plans
  useEffect(() => {
    if (!loading && !error && data) {
      const versions = [];
      const testPlans = {};
      data.Configuration.forEach((product) => {
        product.version.forEach((version) => {
          versions.push({
            id: version.id,
            name: version.name,
            productName: product.name,
          });
          setSelectedProduct(product.id);
          testPlans[version.id] = version.test_plan || [];
        });
      });
      setDropdownConfig({ Versions: versions, TestPlans: testPlans });
    }
  }, [data, loading, error]);

  // ✅ Initialize checkbox selections for unpublished test cases
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

  const findTestPlanById = (plans, id) => {
    for (let plan of plans) {
      if (plan.id.toString() === id.toString()) return plan;
      if (plan["child Test plan"]?.length > 0) {
        const found = findTestPlanById(plan["child Test plan"], id);
        if (found) return found;
      }
    }
    return null;
  };

  const renderIndentedPlan = (plan, prefix, level) => {
    const children = plan["child Test plan"];
    const indent = "\u00A0\u00A0\u00A0\u00A0".repeat(level);
    return (
      <React.Fragment key={plan.id}>
        <option value={plan.id}>
          {indent}
          {prefix}. {plan.name}
        </option>
        {children?.map((child, idx) =>
          renderIndentedPlan(child, `${prefix}.${idx + 1}`, level + 1)
        )}
      </React.Fragment>
    );
  };

  const handleAddTestPlan = () => {
    setIsNewTestPlan(true);
    setSelectedTestPlan("");
    if (selectedTestPlan && selectedVersion) {
      const parentPlan = findTestPlanById(
        dropdownConfig.TestPlans[selectedVersion],
        selectedTestPlan
      );
      if (parentPlan) setNewTestPlanParent(parseInt(selectedTestPlan));
    } else {
      setNewTestPlanParent(null);
    }
  };

  // ✅ Confirm publish button handler
  const confirmPublish = async () => {
    if (isPublishing) return; // ✅ prevent multiple clicks
    setIsPublishing(true); // ✅ start loader

    if (!userStoryId || !publishSelection.length) {
      showToast("Please select at least one unpublished test case", "error");
      setIsPublishing(false);
      return;
    }

    const versionPayload =
      isNewVersion && newVersionName
        ? { value: newVersionName }
        : selectedVersion
        ? { id: parseInt(selectedVersion) }
        : null;

    const testPlanPayload =
      isNewTestPlan && newTestPlanName
        ? {
            name: newTestPlanName,
            ...(newTestPlanParent ? { parent: newTestPlanParent } : {}),
          }
        : selectedTestPlan
        ? { id: parseInt(selectedTestPlan) }
        : null;

    if (!versionPayload) {
      showToast("Version is required", "error");
      setIsPublishing(false);
      return;
    }

    const payload = {
      userstory_ref_id: userStoryId,
      product: selectedProduct,
      version: versionPayload,
      test_plan: testPlanPayload,
      testcases: publishSelection,
    };

    // console.log("Payload sent to API:", payload);
    const result = await publishTestCasesApi(payload);

    if (result?.success) {
      showToast("Test cases published successfully", "success");

      // 🔄 Refresh updated test cases (without closing modal)
      if (typeof GetUpdate === "function") {
        await GetUpdate();
      }

      // Immediately disable published test cases
      const refreshed =
        updatedData?.test_cases || selectedTestCases.map((tc) => tc);
      refreshed.forEach((tc) => {
        if (publishSelection.includes(tc.id)) {
          tc.published = true;
        }
      });

      // Remove published ones from selection
      setPublishSelection((prev) =>
        prev.filter(
          (id) => !refreshed.find((tc) => tc.id === id && tc.published)
        )
      );
    } else {
      showToast("Failed to publish test cases", "error");
    }

    setIsPublishing(false); // ✅ stop loader
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-2">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-2 flex flex-col max-h-[95vh] border border-gray-200 overflow-hidden">
        {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-4 text-white flex-shrink-0 flex items-start justify-between">
          <div>
            <h2 className="flex items-start text-lg sm:text-xl font-bold">Publish Test Cases</h2>
            <p className="text-blue-100 mt-1 text-xs sm:text-sm">
              Configure your test environment and publish selected test cases
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white text-xl font-bold hover:text-red-600 focus:outline-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {loading && (
            <div className="text-center py-12">Loading configurations...</div>
          )}
          {error && !loading && (
            <div className="text-center py-12 text-red-600">
              Failed to load configurations
            </div>
          )}

          {!loading && !error && data && (
            <div className="flex flex-col space-y-6">
              {/* Version + Test Plan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Version Selector */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    Version *
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewVersion(true);
                        setSelectedVersion("");
                        setIsNewTestPlan(false);
                      }}
                      className="w-5 h-5 flex items-center justify-center bg-blue-600 text-white rounded-full text-xs hover:bg-blue-700"
                    >
                      +
                    </button>
                  </label>
                  <select
                    value={selectedVersion}
                    onChange={(e) => {
                      setSelectedVersion(e.target.value);
                      setSelectedTestPlan("");
                      setIsNewVersion(false);
                      setIsNewTestPlan(false);
                    }}
                    className="flex-1 px-3 py-2 border rounded text-sm"
                  >
                    <option value="">Choose a version</option>
                    {dropdownConfig.Versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.productName})
                      </option>
                    ))}
                  </select>
                  {isNewVersion && (
                    <div className="mt-1 relative w-full">
                      <input
                        type="text"
                        placeholder="Enter new version name"
                        value={newVersionName}
                        onChange={(e) => setNewVersionName(e.target.value)}
                        className="px-3 py-2 border rounded w-full pr-8 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewVersion(false);
                          setNewVersionName("");
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Test Plan Selector */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    Test Plan *
                    <button
                      type="button"
                      onClick={handleAddTestPlan}
                      disabled={!(selectedVersion || isNewVersion)}
                      className="w-5 h-5 flex items-center justify-center bg-blue-600 text-white rounded-full text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </label>
                  <select
                    value={selectedTestPlan}
                    onChange={(e) => {
                      setSelectedTestPlan(e.target.value);
                      setIsNewTestPlan(false);
                    }}
                    disabled={!(selectedVersion || isNewVersion)}
                    className="flex-1 px-3 py-2 border rounded disabled:bg-gray-100 text-sm"
                  >
                    <option value="">Choose a test plan</option>
                    {selectedVersion &&
                      dropdownConfig.TestPlans[selectedVersion]?.map((plan, idx) =>
                        renderIndentedPlan(plan, `${idx + 1}`, 0)
                      )}
                  </select>
                  {isNewTestPlan && (
                    <div className="mt-1 relative">
                      <input
                        type="text"
                        placeholder="Enter new test plan name"
                        value={newTestPlanName}
                        onChange={(e) => setNewTestPlanName(e.target.value)}
                        className="w-full px-3 py-2 border rounded pr-8 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewTestPlan(false);
                          setNewTestPlanName("");
                          setNewTestPlanParent(null);
                        }}
                        className="absolute right-2 top-2 text-gray-400 hover:text-red-500 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ✅ Test Cases Table with Checkbox */}
              <div className="flex-1 flex flex-col space-y-2">
                {/* <h3 className="text-base font-semibold text-gray-800">
                  Selected Test Cases ({selectedTestCases.length})
                </h3> */}
                <h3 className="text-base font-semibold text-gray-800">
  Selected Test Cases ({selectedTestCases.filter(tc => !tc.published).length})
</h3>
                <div className="bg-white border rounded shadow-sm overflow-auto max-h-48">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-blue-50 sticky top-0 z-10">
                      <tr className="text-blue-700">
                        <th className="px-3 py-2 font-semibold border-b">Select</th>
                        <th className="px-3 py-2 font-semibold border-b">Scenario</th>
                        <th className="px-3 py-2 font-semibold border-b">Expected Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTestCases.map((tc) => (
                        <tr key={tc.id} className={`hover:bg-blue-100 transition-colors
                         ${
                                tc.published ? " hidden" : ""
                              }
                        `}>
                          <td className={`px-3 py-2 border-b text-center
                           `}>
                            <input
                              type="checkbox"
                              checked={publishSelection.includes(tc.id)}
                              onChange={() => handleCheckboxChange(tc.id)}
                              disabled={tc.published}
                              className={`h-4 w-4 accent-blue-600 rounded border-gray-300 focus:ring-blue-500 transition ${
                                tc.published ? "opacity-50 cursor-not-allowed hidden" : ""
                              }`}
                              title={tc.published ? "Already Published" : "Select for Publishing"}

                            />
                          </td>
                          <td className="px-3 py-2 border-b">{tc.summary}</td>
                          <td className="px-3 py-2 border-b">{tc.expected_result}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-200 px-4 py-3 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
            disabled={isPublishing}
          >
            Cancel
          </button>
        <button
  onClick={confirmPublish}
disabled={
  isPublishing ||
  (!selectedVersion && (!isNewVersion || newVersionName.trim() === "")) ||
  !publishSelection.length
}

  className={`px-4 py-2 text-white rounded text-sm font-semibold ${
    isPublishing
      ? "bg-blue-400 cursor-not-allowed"
      : "bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
  }`}
>
  {isPublishing ? "Publishing..." : "Publish Test Cases"}
</button>

        </div>
      </div>
    </div>
  );
};

export default KiwiPublishModal;