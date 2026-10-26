import React, { useState } from 'react';
import Edit from '../../../../assets/icons/edit_icon.svg';
// import Edit from '../../../../../../assets/icons/edit_icon.svg';
import Update from '../../../../../../assets/icons/update_icon.svg';
import play from '../../../../../../assets/icons/play.jpg';

const ActionModal = ({ 
  isOpen, 
  onClose, 
  testCase,
  // Action handlers
  handleEditClick,
  handleUpdateClick,
  handleCheckboxClick,
  handleRegressionClick,
  handleAutomateClick,
  // State for editing
  isEditing = false,
  // Optional: if you need to pass project/ story context
  projectId,
  selectedStoryId
}) => {
  const [editedData, setEditedData] = useState({});
  const [isLocalEditing, setIsLocalEditing] = useState(false);

  if (!isOpen || !testCase) return null;

  const handleLocalEditClick = () => {
    setEditedData({ ...testCase });
    setIsLocalEditing(true);
    handleEditClick?.(testCase);
  };

  const handleLocalUpdateClick = async () => {
    await handleUpdateClick?.(testCase.id);
    setIsLocalEditing(false);
    setEditedData({});
  };

  const handleLocalCheckboxChange = (e) => {
    handleCheckboxClick?.(testCase.id, e.target.checked);
  };

  const handleLocalRegressionClick = () => {
    handleRegressionClick?.(testCase.id);
  };

  const handleLocalAutomateClick = () => {
    handleAutomateClick?.(testCase.id);
    // Optionally close modal when navigating to automation
    // onClose();
  };

  const handleChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const isPublished = testCase?.published;
  const isAccepted = !!testCase?.accepted;
  const isRegression = !!testCase?.regression;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-[800px] max-h-[90vh] overflow-auto rounded-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Test Case Details
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                ID: {testCase.id} • {testCase.technique && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {testCase.technique}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Action Buttons Bar */}
          <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              {/* Edit/Update Button */}
              {isLocalEditing ? (
                <button
                  onClick={handleLocalUpdateClick}
                  disabled={isPublished}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <img src={Update} alt="Update" className="h-4 w-4" />
                  <span>Update</span>
                </button>
              ) : (
                <button
                  onClick={handleLocalEditClick}
                  disabled={isPublished}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <img src={Edit} alt="Edit" className="h-4 w-4" />
                  <span>Edit</span>
                </button>
              )}

              {/* Accept Checkbox */}
              <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${isPublished ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:bg-gray-50 cursor-pointer'}`}>
                <input
                  type="checkbox"
                  checked={isAccepted}
                  disabled={isPublished}
                  onChange={handleLocalCheckboxChange}
                  className="h-4 w-4 accent-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Accepted</span>
              </label>

              {/* Regression Button */}
              <button
                onClick={handleLocalRegressionClick}
                className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isRegression
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
              >
                <span className="mr-1">R</span>
                <span>Regression</span>
              </button>

              {/* Automate Button - Only shown if accepted */}
              {isAccepted && (
                <button
                  onClick={handleLocalAutomateClick}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <img src={play} alt="Run" className="h-4 w-4" />
                  <span>Automate</span>
                </button>
              )}
            </div>

            {/* Published Badge */}
            {isPublished && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Published
              </span>
            )}
          </div>

          {/* Test Case Details */}
          <div className="space-y-6">
            {/* Summary/Scenario */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Scenario</h3>
              {isLocalEditing ? (
                <textarea
                  value={editedData?.summary || ""}
                  onChange={(e) => handleChange("summary", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Enter scenario description..."
                />
              ) : (
                <p className="text-gray-800 whitespace-pre-wrap break-words">
                  {testCase?.summary || "—"}
                </p>
              )}
            </div>

            {/* Test Data */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Test Data</h3>
              {isLocalEditing ? (
                <textarea
                  value={(editedData?.test_data || []).join("\n")}
                  onChange={(e) => handleChange("test_data", e.target.value.split("\n"))}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent font-mono"
                  placeholder="Enter test data (one item per line)"
                />
              ) : (
                <div className="space-y-1">
                  {(testCase?.test_data || []).length > 0 ? (
                    (testCase.test_data || []).map((item, i) => (
                      <div key={i} className="text-sm text-gray-800 p-1 even:bg-gray-50 rounded">
                        {item}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No test data available</p>
                  )}
                </div>
              )}
            </div>

            {/* Test Steps */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Test Steps</h3>
              {isLocalEditing ? (
                <textarea
                  value={(editedData?.test_steps || [])
                    .map((step, i) => `${i + 1}. ${step}`)
                    .join("\n")}
                  onChange={(e) =>
                    handleChange(
                      "test_steps",
                      e.target.value
                        .split("\n")
                        .map((l) => l.replace(/^\d+\.\s*/, ""))
                    )
                  }
                  rows={5}
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent font-mono"
                  placeholder="Enter test steps (one per line)"
                />
              ) : (
                <ol className="list-decimal list-inside space-y-1">
                  {(testCase?.test_steps || []).length > 0 ? (
                    (testCase.test_steps || []).map((step, i) => (
                      <li key={i} className="text-sm text-gray-800">
                        {step}
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500 italic">No test steps available</li>
                  )}
                </ol>
              )}
            </div>

            {/* Expected Result */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Expected Result</h3>
              {isLocalEditing ? (
                <textarea
                  value={editedData?.expected_result || ""}
                  onChange={(e) => handleChange("expected_result", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Enter expected result..."
                />
              ) : (
                <p className="text-gray-800 whitespace-pre-wrap break-words">
                  {testCase?.expected_result || "—"}
                </p>
              )}
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase">Priority</h4>
                <p className="text-sm font-medium mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                    ${testCase?.priority === 'P1' ? 'bg-red-100 text-red-800' : 
                      testCase?.priority === 'P2' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-green-100 text-green-800'}`}>
                    {testCase?.priority || 'N/A'}
                  </span>
                </p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase">To be Automated</h4>
                <p className="text-sm font-medium mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                    ${testCase?.tobeautomate === 1 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {testCase?.tobeautomate === 1 ? 'Yes' : 'No'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionModal;