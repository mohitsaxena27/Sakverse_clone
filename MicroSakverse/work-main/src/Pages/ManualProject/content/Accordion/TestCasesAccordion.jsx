import React, { useState, useEffect, useRef } from 'react';
import Accordion from './index';
import { useFetchData } from '../../useFetchData';
import { useLocation, useNavigate } from "react-router-dom";

import Edit from '../../../../assets/icons/edit_icon.svg';
import Update from '../../../../assets/icons/update_icon.svg';
import play from '../../../../assets/icons/play.jpg';
import 'react-toastify/dist/ReactToastify.css';
import showToast from '../../../../items/ToastMessage/toastUtil';
import { motion, useSpring } from "framer-motion";
import Modal from './';
import { usePublishTestCases, useReviewStatusUpdate, useUpdateTestCase, useTestConfiguration } from '../../../../Hooks/Manual/UserData';
import PublishModal from './components/publish/publishModal';
import Automation from '../../../Automation/index';
import TestCaseEditModal from "./components/TestCaseEditModal";

const TestCasesAccordion = ({ data, selectedStoryId, isOpen, toggle, isTMConnected, TMTool, projectId, linkedStatus, tmCustomId, selectedStatus }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState(null);

  const { error, isLoading } = useFetchData(selectedStoryId);
  const [editedData, setEditedData] = useState({});
  const [selectedTechnique, setSelectedTechnique] = useState('All');
  const [selectedRequirement, setSelectedRequirement] = useState('All');
  const [techniques, setTechniques] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const editRef = useRef();
  const initialCount = data?.test_cases?.length || 0;
  const [testCaseCount, setTestCaseCount] = useState(initialCount);
  const animatedCount = useSpring(testCaseCount, { stiffness: 100, damping: 10 });
  const [testCases, setTestCases] = useState([]);
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [acceptedTestCases, setAcceptedTestCases] = useState([]);
  const { updateTestCase } = useUpdateTestCase();
  const { updateReviewStatus } = useReviewStatusUpdate();
  const { publishTestCases } = usePublishTestCases();
  const navigate = useNavigate();
  const [expandedRow, setExpandedRow] = useState(null);


  console.log("Status in TestCasesAccordion:", selectedStatus);




  const priorities = [
    { id: "All", label: "All", color: "bg-gray-800" },
    { id: "P1", label: "P1", color: "bg-red-600" }, // High Priority
    { id: "P2", label: "P2", color: "bg-yellow-400" }, // Medium Priority
    { id: "P3", label: "P3", color: "bg-green-500" }, // Low Priority
  ];

  // Effect to update count when data changes
  useEffect(() => {
    if (data?.test_cases) {
      const count = data.test_cases.length;
      setTestCaseCount(count);
      animatedCount.set(count);
    }
  }, [data?.test_cases]); // Trigger when test case data updates

  // Dynamic status messages
  const getStatusMessage = (count) => {
    if (count === 0) return "Fetching Test Cases...";
    if (count < 5) return "Few Test Cases Found 🧐";
    if (count < 10) return "Test Cases Generation is in-progress";

  };


  const handleEditClick = (testCase) => {
    setEditedData({ ...testCase });
  };

  const handleUpdateClick = async (testCaseId) => {
    const postData = {
      ...editedData,
      test_steps: JSON.stringify(editedData.test_steps),
      test_data: JSON.stringify(editedData.test_data),
    };

    try {
      const result = await updateTestCase(postData);

      if (result.success) {
        showToast('Test case updated successfully', 'success');

        setEditedData({});
        setTestCaseCount((prev) => prev); // trigger re-render if needed

        const updatedTestCases = data.test_cases.map((testCase) =>
          testCase.id === testCaseId ? { ...testCase, ...editedData } : testCase
        );

        data.test_cases = updatedTestCases; // Update state with modified test case
      } else {
        showToast('Failed to update test case', 'error');
      }
    } catch (error) {
      console.error('Update error:', error);
      showToast('Error occurred during update', 'error');
    }
  };

  useEffect(() => {
    if (data?.test_cases) {
      setTestCases(data.test_cases);
    }
  }, [data?.test_cases]);

  // Handle checkbox click
  const handleCheckboxClick = async (testCaseId, isAccepted) => {
    // Optimistically update UI
    setTestCases((prev) =>
      prev.map((testCase) =>
        testCase.id === testCaseId ? { ...testCase, accepted: isAccepted } : testCase
      )
    );

    const postData = {
      test_case_id: testCaseId,
      accepted: isAccepted,
    };

    const result = await updateReviewStatus(postData);

    if (result.success) {
      showToast(
        isAccepted ? 'Test case accepted' : 'Test case unchecked',
        isAccepted ? 'success' : 'error'
      );

    } else {
      showToast('Failed to update', 'error');

      // Revert change on failure
      setTestCases((prev) =>
        prev.map((testCase) =>
          testCase.id === testCaseId ? { ...testCase, accepted: !isAccepted } : testCase
        )
      );
    }
  };

  const handleRegressionClick = async (testCaseId) => {
    setTestCases((prev) =>
      prev.map((testCase) =>
        testCase.id === testCaseId
          ? { ...testCase, regression: !testCase.regression }
          : testCase
      )
    );

    const selectedCase = testCases.find((tc) => tc.id === testCaseId);
    const newStatus = selectedCase?.regression ? 0 : 1;

    const postData = {
      id: testCaseId,
      regression: newStatus,
    };

    try {
      const result = await updateTestCase(postData);

      if (result.success) {
        showToast(
          newStatus === 1
            ? "Selected for Regression"
            : "Removed from Regression",
          newStatus === 1 ? "success" : "error"
        );
      } else {
        showToast("Failed to update regression status", "error");

        // revert on failure
        setTestCases((prev) =>
          prev.map((testCase) =>
            testCase.id === testCaseId
              ? { ...testCase, regression: selectedCase?.regression }
              : testCase
          )
        );
      }
    } catch (error) {
      console.error("Regression update error:", error);
      showToast("Error occurred during regression update", "error");

      // revert on error
      setTestCases((prev) =>
        prev.map((testCase) =>
          testCase.id === testCaseId
            ? { ...testCase, regression: selectedCase?.regression }
            : testCase
        )
      );
    }
  };


const handleAutomateClick = (testCaseId) => {
  window.open(
    `/automation?projectId=${projectId}&selectedStoryId=${selectedStoryId}&testCaseId=${testCaseId}&source=tcg`,
    '_blank'
  );
};


  const handleChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  // const handlePublishClick = async () => {
  //   const postData = { userstory_ref_id: selectedStoryId };

  //   try {
  //     const response = await fetch(`${config.BaseIP}/publish_testcase`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify(postData),
  //     });

  //     if (response.status === 200) {
  //       showToast('Test case published', 'success');
  //     } else {
  //       showToast('Failed to publish Test case', 'error');
  //     }
  //   } catch (error) {
  //     showToast('Error occurred during publishing', 'error');
  //   }
  // };

  const handlePublishClick = () => {
    if (!isTMConnected) {
      showToast('TM is not connected', 'error');
      return;
    }

    const selectedTestCases = testCases.filter(
      (testCase) => testCase.accepted && !testCase.published
    );

    if (selectedTestCases.length === 0) {
      showToast('Please select at least one unpublished test case to publish', 'error');
      return;
    }

    setAcceptedTestCases(selectedTestCases);
    setIsPublishModalOpen(true);
  };



  const confirmPublish = async () => {
    const postData = {
      userstory_ref_id: selectedStoryId,
      test_cases: acceptedTestCases.map(tc => tc.id),
    };

    const result = await publishTestCases(postData);

    if (result.success) {
      showToast('Test cases published successfully', 'success');
      setIsPublishModalOpen(false);
    } else {
      showToast('Failed to publish test cases', 'error');
    }
  };



  const handleClickOutside = (event) => {
    if (editRef.current && !editRef.current.contains(event.target)) {
      setEditedData({});
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (data?.test_cases?.length > 0) {
      const uniqueTechniques = [
        'All',
        ...new Set(data.test_cases.map((testCase) => testCase.technique).filter(Boolean)),
      ];
      setTechniques(uniqueTechniques);

      const uniqueRequirements = [
        'All',
        ...new Set(data.test_cases.map((testCase) => testCase.requirment_summary).filter(Boolean)),
      ];
      setRequirements(uniqueRequirements);
    }
  }, [data]);


  const renderTestData = (testData) => {
    if (Array.isArray(testData)) {
      return (
        <ul className="list-disc pl-5">
          {testData.map((item, index) => (
            <li key={index} className="text-font">
              {typeof item === 'object' && item !== null ? (
                <pre>{JSON.stringify(item, null, 2)}</pre>
              ) : (
                item
              )}
            </li>
          ))}
        </ul>
      );
    }
    return <p className="text-font">No test data available</p>;
  };

  const handleToggle = () => {
    if (!data?.test_cases?.length) {
      alert("Test case creation is in progress, please wait.");
      return;
    }
    toggle();

  };

  const filteredTestCases = testCases.filter((testCase) => {
    const techniqueMatch = selectedTechnique === 'All' || testCase.technique === selectedTechnique;
    const requirementMatch = selectedRequirement === 'All' || testCase.requirment_summary === selectedRequirement;
    const priorityMatch = selectedPriority === 'All' || testCase.priority === selectedPriority;

    return techniqueMatch && requirementMatch && priorityMatch;
  });


  const getTechniqueClass = (technique) => {
    switch (technique) {
      case 'uc':
        return 'tag-use-case';
      case 'decision-table':
        return 'tag-decision-table';
      case 'ecp':
        return 'ecp';
      case 'bva':
        return 'bva';
      case 'st':
        return 'st';
      case 'dtt':
        return 'dtt';
      default:
        return 'tag-default';
    }
  };


  const renderValue = (value) => {
    if (typeof value === 'string') {
      return <p className="text-gray-700">{value || 'N/A'}</p>;
    }

    if (Array.isArray(value)) {
      return (
        <ul className="list-disc ml-5 text-gray-700">
          {value.map((item, index) => (
            <li key={index}>{typeof item === 'object' ? renderValue(item) : item}</li>
          ))}
        </ul>
      );
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <ul className="list-disc ml-5 text-gray-700">
          {Object.entries(value).map(([subKey, subValue], idx) => (
            <h1 key={idx}>
              <strong>{subKey.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()).toUpperCase()}:</strong> {typeof subValue === 'object' ? renderValue(subValue) : subValue}
            </h1>
          ))}
        </ul>
      );
    }

    return <p className="text-gray-700">N/A</p>;
  };


  const getFullTechniqueName = (shortName) => {
    const techniqueNames = {
      uc: "Use Case",
      ecp: "Equivalence Class Partitioning",
      bva: "Boundary Value Analysis",
      st: "State Transition",
      dtt: "Decision Table Testing",
      "decision-table": "Decision Table",
    };

    return techniqueNames[shortName] || shortName; // Default to the same name if not found
  };



  const handleModalSave = async (updatedTestCase) => {
    const postData = {
      ...updatedTestCase,
      test_steps: JSON.stringify(updatedTestCase.test_steps),
      test_data: JSON.stringify(updatedTestCase.test_data),
    };

    try {
      const result = await updateTestCase(postData);

      if (result.success) {
        showToast("Test case updated successfully", "success");

        // Update UI instantly
        setTestCases((prev) =>
          prev.map((tc) =>
            tc.id === updatedTestCase.id
              ? updatedTestCase
              : tc
          )
        );

        setIsEditModalOpen(false);
        setSelectedTestCase(null);
      } else {
        showToast("Failed to update test case", "error");
      }
    } catch (error) {
      showToast("Error occurred during update", "error");
    }
  };



  if (isLoading) return <p>Loading test cases...</p>;
  if (error) return <p>An error occurred: {error}</p>;

  return (
    <>
      <Accordion
        title={
          <div className="flex items-center gap-2">
            Test Cases
            <span className="ml-2 text-sm text-gray-500">{getStatusMessage(testCaseCount)}</span>
          </div>
        }
        isOpen={isOpen}
        toggle={handleToggle}
        icon={<span role="img" aria-label="test case">🧪</span>}
        className="text-xs"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          {/* Requirement Dropdown */}
          <div className="relative w-[45%]">
            <select
              value={selectedRequirement}
              onChange={(e) => setSelectedRequirement(e.target.value || "All")}
              className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-800 shadow-sm transition hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 focus:outline-none"
            >
              {requirements.map((requirement, index) => (
                <option key={index} value={requirement} className="text-gray-800">
                  {requirement}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              ▼
            </span>
          </div>

          {/* Priority Buttons */}
          <div className="flex items-center gap-2">
            {priorities.map((priority) => (
              <button
                key={priority.id}
                onClick={() => setSelectedPriority(priority.id)}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white transition ${priority.color} ${selectedPriority === priority.id
                    ? "ring-2 ring-black"
                    : "opacity-60 hover:opacity-100"
                  }`}
                title={`Priority ${priority.label}`}
              >
                {priority.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto max-h-[32rem] border border-gray-300 rounded-xl shadow-lg bg-white">
          <table className="min-w-full table-fixed border-collapse text-sm text-left">
            <thead className="bg-blue-800 text-white sticky top-0 z-10">
              <tr>
                <th className="p-3 font-semibold w-1/5 min-w-[140px]">Scenario</th>
                <th className="p-3 font-semibold w-1/5 min-w-[140px]">Test Data</th>
                <th className="p-3 font-semibold w-2/5 min-w-[220px]">Test Steps</th>
                <th className="p-3 font-semibold w-1/5 min-w-[160px]">Expected Result</th>
                <th className="p-3 font-semibold text-center w-[90px]">To be Automated?</th>
                <th className="p-4 font-semibold text-center w-[140px]">Actions</th>
                {/* <th className="p-3 font-semibold text-center w-[80px]">Play</th> */}
                {linkedStatus && (
                  <th className="p-3 font-semibold text-center w-[80px]">Play</th>
                )}
              </tr>
            </thead>

            <tbody>
              {(filteredTestCases || []).map((testCase = {}, index) => {
                const isEditing = editedData?.id === testCase?.id;

                return (
                  <tr
                    key={testCase?.id || index}
                    className={`${index % 2 === 0 ? "bg-white" : "bg-blue-50"
                      } border-b border-gray-500`}
                  >
                    {/* Scenario */}
                    <td className="p-3 align-top max-w-0">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedData?.summary || ""}
                          onChange={(e) => handleChange?.("summary", e.target.value)}
                          className="w-full rounded border border-gray-300 p-1 text-xs focus:ring-1 focus:ring-blue-400"
                        />
                      ) : (
                        <div className="text-xs break-words whitespace-pre-wrap overflow-wrap-anywhere">
                          {testCase?.summary || "—"}
                        </div>
                      )}
                    </td>

                    {/* Test Data */}
                    <td className="p-3 align-top max-w-[280px] ">
                      <div className="text-[12px] break-all leading-relaxed">
                        {(expandedRow === testCase.id
                          ? testCase.test_data
                          : testCase.test_data.slice(0, 3)
                        ).map((item, i) => {
                          const cleanedItem = item
                            ?.replace(/^\s+/g, "")
                            ?.replace(/\s+/g, " ")
                            ?.trim();

                          return <div key={i}>{cleanedItem}</div>;
                        })}

                        {testCase.test_data.length > 3 && (
                          <button
                            onClick={() =>
                              setExpandedRow(
                                expandedRow === testCase.id ? null : testCase.id
                              )
                            }
                            className="text-blue-600 text-xs mt-1"
                          >
                            {expandedRow === testCase.id ? "Show Less" : "Show More"}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Test Steps */}
                    <td className="p-3 align-top max-w-0">
                      {isEditing ? (
                        <textarea
                          value={(editedData?.test_steps || [])
                            .map((step, i) => `${i + 1}. ${step}`)
                            .join("\n")}
                          onChange={(e) =>
                            handleChange?.(
                              "test_steps",
                              e.target.value.split("\n").map((l) => l.replace(/^\d+\.\s*/, ""))
                            )
                          }
                          rows={Math.max((editedData?.test_steps || []).length, 3)}
                          className="w-full rounded border border-gray-300 p-1 text-xs resize-none focus:ring-1 focus:ring-blue-400"
                          style={{
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            overflowWrap: "anywhere",
                          }}
                        />
                      ) : (
                        <ol className="list-decimal list-inside space-y-0.5 text-xs break-words whitespace-pre-wrap">
                          {(testCase?.test_steps || []).length > 0 ? (
                            (testCase.test_steps || []).map((step, i) => (
                              <li key={i}>{step}</li>
                            ))
                          ) : (
                            <li>—</li>
                          )}
                        </ol>
                      )}
                    </td>

                    {/* Expected Result */}
                    <td className="p-3 align-top max-w-0">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedData?.expected_result || ""}
                          onChange={(e) => handleChange?.("expected_result", e.target.value)}
                          className="w-full rounded border border-gray-300 p-1 text-xs focus:ring-1 focus:ring-blue-400"
                        />
                      ) : (
                        <div className="text-xs break-words whitespace-pre-wrap">
                          {testCase?.expected_result || "—"}
                        </div>
                      )}
                    </td>

                    {/* To Be Automated */}
                    <td className="p-3 text-center font-semibold text-xs">
                      {testCase?.tobeautomate === 1 ? "Yes" : "-"}
                    </td>

                    {/* Actions */}
                    <td className="p-3 align-center">
                      <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                        {/* Edit / Update */}
                        {isEditing ? (
                          <button
                            onClick={() => !testCase?.published && handleUpdateClick?.(testCase?.id)}
                            disabled={testCase?.published}
                            className="h-8 w-8 flex items-center justify-center rounded-md bg-blue-100 hover:bg-blue-200 disabled:opacity-50 shrink-0"
                          >
                            <img src={Update} alt="Update" className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (!testCase?.published) {
                                setSelectedTestCase(testCase);
                                setIsEditModalOpen(true);
                              }
                            }}
                            disabled={testCase?.published}
                            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-200 disabled:opacity-50"
                          >
                            <img src={Edit} alt="Edit" className="h-4 w-4" />
                          </button>
                        )}

                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={!!testCase?.accepted}
                          disabled={testCase?.published}
                          onChange={(e) => handleCheckboxClick?.(testCase?.id, e.target.checked)}
                          className="h-4 w-4 accent-blue-600 shrink-0"
                        />

                        {/* Regression */}
                        <button
                          onClick={() => handleRegressionClick?.(testCase?.id)}
                          className={`h-8 w-8 rounded-full text-xs font-bold border shrink-0 ${testCase?.regression ? "bg-green-500 text-white" : "bg-gray-200"
                            }`}
                        >
                          R
                        </button>
                      </div>
                    </td>

                    {/* Play */}
                    {linkedStatus && (
                      <td className="p-3 text-center">
                        {testCase?.accepted ? (
                          <button onClick={() => handleAutomateClick?.(testCase?.id)}>
                            <img src={play} alt="Run" className="h-6 w-6 mx-auto" />
                          </button>
                        ) : (
                          ""
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="text-right mt-4">
          {isTMConnected && (
            <button
              onClick={handlePublishClick}
              disabled={selectedStatus !== "Completed"}
              className={`px-4 py-2 text-white rounded 
    ${selectedStatus !== "Completed"
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
                }`}
            >
              Publish Test Cases
            </button>
          )}
          {isPublishModalOpen && (
            <PublishModal
              isOpen={isPublishModalOpen}
              onClose={() => setIsPublishModalOpen(false)}
              selectedTestCases={acceptedTestCases}
              userStoryId={selectedStoryId}
              publishTestCasesApi={publishTestCases}
              TMTool={TMTool}
              tmCustomId={tmCustomId}
            />
          )}
        </div>
      </Accordion>

      <TestCaseEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        testCase={selectedTestCase}
        onSave={handleModalSave}
      />
    </>
  );
};

export default TestCasesAccordion;