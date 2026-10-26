import React, { useState } from "react";
import showToast from "../../../../../../items/ToastMessage/toastUtil"; 
import KiwiPublishModal from "./KiwiPublishModal";
import AdoPublishModal from "./AdoPublishModal";

const PublishModal = ({
  isOpen,
  onClose,
  selectedTestCases,
  userStoryId,
  publishTestCasesApi,
  TMTool,
  tmCustomId
}) => {
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedTestPlan, setSelectedTestPlan] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePublish = async () => {
    setIsLoading(true);
    const payload = {
      userstory_ref_id: userStoryId,
      testcases: selectedTestCases.map(tc => tc.id),
      product: selectedProduct || null,
      version: null,
      test_plan: selectedTestPlan || null,
    };

    try {
      const result = await publishTestCasesApi(payload);
      if (result?.success) {
        showToast("Test cases published successfully", "success");
        onClose();
      } else {
        showToast("Failed to publish test cases", "error");
      }
    } catch (error) {
      showToast("Failed to publish test cases", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  if (tmCustomId === 2) {
    return (
      <KiwiPublishModal
        isOpen={isOpen}
        onClose={onClose}
        selectedTestCases={selectedTestCases}
        userStoryId={userStoryId}
        publishTestCasesApi={publishTestCasesApi}
      />
    );
  }
  if (tmCustomId === 3) {
    return (
      <AdoPublishModal
        isOpen={isOpen}
        onClose={onClose}
        selectedTestCases={selectedTestCases}
        userStoryId={userStoryId}
        publishTestCasesApi={publishTestCasesApi}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-10 relative text-left">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-blue-700 mb-2">Publish Test Cases</h2>
          <p className="text-gray-600 text-sm">Configure the fields below before publishing your test cases.</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm max-h-64 overflow-y-auto mb-10">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-blue-50 sticky top-0 z-10">
              <tr className="text-blue-700">
                <th className="px-4 py-3 font-semibold border-b border-gray-300">Scenario</th>
                <th className="px-4 py-3 font-semibold border-b border-gray-300">Expected Result</th>
              </tr>
            </thead>
            <tbody>
              {selectedTestCases.map(tc => (
                <tr key={tc.id} className="hover:bg-blue-100 transition-colors duration-150">
                  <td className="px-4 py-3 border-b border-gray-200">{tc.summary}</td>
                  <td className="px-4 py-3 border-b border-gray-200">{tc.expected_result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-4">
          <button 
            onClick={onClose} 
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Cancel
          </button>
          <button 
            onClick={handlePublish} 
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-md transition flex items-center gap-2 ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <svg 
                  className="animate-spin h-5 w-5 text-white" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  ></circle>
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Publishing...
              </>
            ) : (
              'Publish'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublishModal;