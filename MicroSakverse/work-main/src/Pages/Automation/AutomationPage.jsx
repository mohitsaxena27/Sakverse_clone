import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  createContext,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import TestScenario from './components/TestScenario';
import StepList from './components/StepList';
import LiveView from './components/RightPanel/LiveView';
import GIFoption from './components/RightPanel/GIFoption';
import StatusIndicator from './components/Navbar';
import { useAutomationFlow } from '../../Hooks/Automation/Automation';
import Failed from './components/RightPanel/Failed';
import AddStepModal from './components/AddStepModal';

const POLLING_INTERVAL = 10_000;

export const EditModeContext = createContext({ isEditMode: false });

const renumberSteps = (arr) =>
  arr.map((step, i) => ({ ...step, step: i + 1 }));

const AutomationPage = ({ testScenario, testCaseId, projectId, selectedStoryId }) => {
  const flow = useAutomationFlow();
  const flowRef = useRef(flow);
  flowRef.current = flow;

  const [searchParams, setSearchParams] = useSearchParams();

  // ─── State ────────────────────────────────────────────────────────────────────
  const [isEditMode, setIsEditMode] = useState(false);
  const [localSteps, setLocalSteps] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null); // 👈 NEW: visual drop target
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addStepPosition, setAddStepPosition] = useState(null);
  const [scenarioPayload, setScenarioPayload] = useState(testScenario);
  const [executionData, setExecutionData] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(true);
  const [loadingAction, setLoadingAction] = useState(null);
  const [sourceExecutionId, setSourceExecutionId] = useState('');
const [isCloning, setIsCloning] = useState(false);
const [showCloneModal, setShowCloneModal] = useState(false);
  
const [rowNumber, setRowNumber] = useState(0);
  // Shape: { type: 'delete' | 'reorder' | 'update-planned' | 'update-exec' | 'add', id?: string }

  // ─── Refs ─────────────────────────────────────────────────────────────────────
  const pollingAbortRef = useRef(false);
  const prevTestCaseIdRef = useRef(testCaseId);
  const pollingIntervalRef = useRef(null);

  const executionId = searchParams.get('executionId') ?? '';
  const sessionId = searchParams.get('sessionId') ?? '';

  // ─── Fetch latest execution data (only used for addStep) ─────────────────────
  const fetchLatestExecutionData = useCallback(async () => {
    if (!executionId) return null;
    try {
      const result = await flowRef.current.getTestResult(executionId);
      setExecutionData(result);
      return result;
    } catch (err) {
      console.error('Failed to fetch execution data:', err);
      return null;
    }
  }, [executionId]);

  // ─── Reset on testCaseId change ───────────────────────────────────────────────
  useEffect(() => {
    if (prevTestCaseIdRef.current === testCaseId) return;
    prevTestCaseIdRef.current = testCaseId;

    pollingAbortRef.current = true; // stop any in-flight polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('executionId');
        next.delete('sessionId');
        return next;
      },
      { replace: true }
    );

    setExecutionData({
      status: 'IN_PROGRESS',
      plan: { steps: [] },
      results: []
    });
    setIsExecuting(false);
  }, [testCaseId, setSearchParams]);

  // ─── Polling effect with cleanup ─────────────────────────────────────────────
  useEffect(() => {
    if (!executionId) return;

    pollingAbortRef.current = false;

    const runPolling = async () => {
      setIsExecuting(true);
     

      while (true) {
        if (pollingAbortRef.current) break;

        try {
          const result = await flowRef.current.getTestResult(executionId);
          if (pollingAbortRef.current) break;

          setExecutionData(result);

          if (result?.status === 'SUCCESS') {
            toast.success(`Test execution completed`);
            pollingAbortRef.current = true;
            break;
          }

          if (result?.status === 'FAILED') {
            toast.error(`❌ Test execution failed: ${result?.error || 'Unknown error'}`);
            pollingAbortRef.current = true;
            break;   
          }

          if (!['IN_PROGRESS', 'RUNNING'].includes(result?.status)) break;

          await new Promise((res) => setTimeout(res, POLLING_INTERVAL));
        } catch (err) {
          console.error('Polling error:', err);
          toast.error('Error polling execution status');
          break;
        }
      }

      if (!pollingAbortRef.current) setIsExecuting(false);
    };

    runPolling();

    return () => {
      pollingAbortRef.current = true;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [executionId]);

  // ─── Sync localSteps from polling (only when step IDs change) ────────────────
  const steps = executionData?.plan?.steps ?? [];
  useEffect(() => {
    if (!steps.length) return;
    setLocalSteps((prev) => {
      const isSame =
        JSON.stringify(prev.map((s) => s.step_id)) ===
        JSON.stringify(steps.map((s) => s.step_id));
      if (isSame) return prev;
      return steps;
    });
  }, [steps]);

  // ─── Derived values ───────────────────────────────────────────────────────────
  const results = executionData?.results ?? [];
  const executionStatus = executionData?.status ?? 'PENDING';
  const errorMessage = executionData?.error;

  const totalSteps = steps.length;
  const passedSteps = results.filter((r) => r.status?.toLowerCase() === 'passed').length;
  const failedSteps = results.filter((r) => r.status?.toLowerCase() === 'failed').length;

  const isLoadingSteps = isExecuting && steps.length === 0;
  const hasStartedExecution = Boolean(executionId) || executionStatus !== 'PENDING';

  // ─── handleExecute — no reload, polling picks up new executionId ──────────────
  const handleScenarioChange = useCallback((updated) => setScenarioPayload(updated), []);

const handleExecute = async () => {
  try {
    pollingAbortRef.current = true;

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    setIsExecuting(true);
    setAccordionOpen(false);
    setExecutionData(null);

    const payload = {
      instruction: JSON.stringify(scenarioPayload),
      id: testCaseId,
      projectId,
      storyId: selectedStoryId,
      row_number: rowNumber,
    };

    // console.log("Execute Payload:", payload);

    const response = await flowRef.current.executeTest(payload);

    const newExecutionId = response?.execution_id;
    const newSessionId = response?.session_id;

    if (!newExecutionId) {
      throw new Error("No execution_id returned from server");
    }

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("executionId", newExecutionId);
        next.set("sessionId", newSessionId ?? "");
        next.set("projectId", projectId);
        next.set("selectedStoryId", selectedStoryId);
        next.set("testCaseId", testCaseId);
        return next;
      },
      { replace: false }
    );

    toast.success("Test execution started successfully!");

    window.location.reload();
  } catch (err) {
    console.error("Execution failed:", err);
    setIsExecuting(false);

    setExecutionData({
      status: "FAILED",
      error: err.message,
      plan: { steps: [] },
      results: [],
    });

    toast.error(`Execution failed: ${err.message}`);
  }
};


// cloning of already executed test case
const handleCloneTest = useCallback(async (sourceExecutionId) => {
  if (!sourceExecutionId) {
    toast.warning('Please enter a source execution ID');
    return;
  }

  setIsCloning(true);
  try {
    const payload = {
      source_execution_id: sourceExecutionId,
      instruction: JSON.stringify(scenarioPayload),
      testcase_id: testCaseId,
    };
    
    const result = await flowRef.current.cloneTest(payload);
    toast.success('Test cloned successfully!');
    
    // Optional: Handle the response
    if (result?.execution_id) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('executionId', result.execution_id);
          if (result.session_id) {
            next.set('sessionId', result.session_id);
          }
          return next;
        },
        { replace: true }
      );
      window.location.reload();
    }
    
    return result;
  } catch (err) {
    toast.error(`Failed to clone test: ${err.message}`);
    throw err;
  } finally {
    setIsCloning(false);
  }
}, [scenarioPayload, testCaseId, setSearchParams]);


  // ─── Drag handlers ────────────────────────────────────────────────────────────
  const handleDragStart = useCallback((index) => {
    setDraggedIndex(index);
    setDragOverIndex(null);
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    setDragOverIndex(index); // 👈 track visual drop target
  }, []);

  const handleDragLeave = useCallback(() => {
    // Small delay to prevent flicker between items
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleDrop = async (toIndex) => {
    setDragOverIndex(null);

    if (draggedIndex === null || draggedIndex === toIndex) {
      setDraggedIndex(null);
      return;
    }

    const draggedStep = localSteps[draggedIndex];
    if (!draggedStep?.step_id) {
      toast.warning('Cannot reorder: missing step ID');
      setDraggedIndex(null);
      return;
    }

    const snapshotSteps = localSteps;
    const snapshotExecution = executionData;

    // ✅ Optimistic UI update — instant visual feedback
    const reorderedSteps = [...localSteps];
    reorderedSteps.splice(draggedIndex, 1);
    reorderedSteps.splice(toIndex, 0, draggedStep);
    const renumbered = renumberSteps(reorderedSteps);

    setLocalSteps(renumbered);
    setExecutionData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        plan: { ...prev.plan, steps: renumbered },
        results: prev.results?.map((r) => {
          const idx = renumbered.findIndex((s) => s.step_id === r.step_id);
          return { ...r, execution_order: idx !== -1 ? idx + 1 : r.execution_order };
        }) || [],
      };
    });

    setDraggedIndex(null);
    setLoadingAction({ type: 'reorder', id: draggedStep.step_id });

    try {
      await flowRef.current.movePlannedStep(draggedStep.step_id, toIndex + 1);
      toast.success('Step reordered');
      // ✅ No refetch — optimistic state is correct
    } catch (err) {
      toast.error('Failed to reorder: ' + err.message);
      // Rollback on error
      setLocalSteps(snapshotSteps);
      setExecutionData(snapshotExecution);
    } finally {
      setLoadingAction(null);
    }
  };

  // ─── handleDeleteStep — optimistic, no refetch ───────────────────────────────
  const handleDeleteStep = async (indexToDelete) => {
    const stepToDelete = localSteps[indexToDelete];
    if (!stepToDelete?.step_id) {
      toast.error('Step ID missing. Cannot delete.');
      return;
    }

    const snapshotSteps = localSteps;
    const snapshotExecution = executionData;

    // ✅ Optimistic remove immediately
    const filteredSteps = renumberSteps(localSteps.filter((_, i) => i !== indexToDelete));
    setLocalSteps(filteredSteps);
    setExecutionData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        plan: { ...prev.plan, steps: filteredSteps },
        results: prev.results?.filter((r) => r.step_id !== stepToDelete.step_id) || [],
      };
    });

    setLoadingAction({ type: 'delete', id: stepToDelete.step_id });
    try {
      await flowRef.current.deletePlannedStep(stepToDelete.step_id);
      toast.success('Step deleted');
      // ✅ No refetch needed
    } catch (err) {
      toast.error('Failed to delete: ' + err.message);
      // Rollback
      setLocalSteps(snapshotSteps);
      setExecutionData(snapshotExecution);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAddStepAtPosition = useCallback((position) => {
    setAddStepPosition(position);
    setIsAddModalOpen(true);
  }, []);

  // ─── handleAddStep — refetch here only, server assigns step_id ────────────────
  const handleAddStep = async (newStep) => {
    if (!executionId) {
      toast.warning('Please execute the test first before adding steps.');
      return;
    }

    setLoadingAction({ type: 'add' });
    try {
      const insertAt =
        (addStepPosition !== null ? addStepPosition + 1 : localSteps.length) + 1;

      await flowRef.current.AddStep({
        user_intent_id: executionId,
        step_type: newStep.step_type?.toLowerCase(),
        intent: newStep.intent,
        target: newStep.target ?? null,
        value: newStep.value ?? null,
        insert_position: insertAt,
      });

      // ✅ Only refetch here — need server-assigned step_id
      const updated = await fetchLatestExecutionData();
      if (updated?.plan?.steps) {
        setLocalSteps(renumberSteps(updated.plan.steps));
      }

      toast.success('Step added');
    } catch (err) {
      toast.error('Failed to add step: ' + err.message);
    } finally {
      setLoadingAction(null);
      setAddStepPosition(null);
      setIsAddModalOpen(false);
    }
  };

  // ─── handleUpdatePlannedStep — optimistic, no refetch ────────────────────────
  const handleUpdatePlannedStep = async (stepId, updatedStep) => {
    if (!stepId) { toast.error('Missing step_id'); return; }

    const snapshotSteps = localSteps;
    const snapshotExecution = executionData;

    // ✅ Optimistic update
    setLocalSteps((prev) =>
      prev.map((s) => (s.step_id === stepId ? { ...s, ...updatedStep } : s))
    );
    setExecutionData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        plan: {
          ...prev.plan,
          steps: prev.plan?.steps?.map((s) =>
            s.step_id === stepId ? { ...s, ...updatedStep } : s
          ) || [],
        },
      };
    });

    setLoadingAction({ type: 'update-planned', id: stepId });
    try {
      await flowRef.current.updatePlannedIntent(stepId, {
        intent: updatedStep.intent,
        target: updatedStep.target,
        value: updatedStep.value,
        status: updatedStep.status,
        enabled: updatedStep.enabled,
      });
      toast.success('Step updated');
      // ✅ No refetch needed
    } catch (err) {
      toast.error('Failed to update: ' + err.message);
      setLocalSteps(snapshotSteps);
      setExecutionData(snapshotExecution);
    } finally {
      setLoadingAction(null);
    }
  };

  // ─── handleUpdateExecutionStep — optimistic, no refetch ──────────────────────
  const handleUpdateExecutionStep = async (resultId, updatedResult) => {
    if (!resultId) { toast.error('Missing execution step id'); return; }

    const snapshotExecution = executionData;

    // ✅ Optimistic update
    setExecutionData((prev) => ({
      ...prev,
      results: prev.results.map((r) =>
        r.id === resultId
          ? { ...r, ...updatedResult, ...(updatedResult.value && r.data ? { data: updatedResult.value } : {}) }
          : r
      ),
    }));

    setLoadingAction({ type: 'update-exec', id: resultId });
    try {
      await flowRef.current.updateExecutionStep(resultId, {
        target: updatedResult.target,
        value: updatedResult.value,
      });
      toast.success('Execution step updated');
      // ✅ No refetch needed
    } catch (err) {
      toast.error('Failed to update: ' + err.message);
      setExecutionData(snapshotExecution);
    } finally {
      setLoadingAction(null);
    }
  };

  // Add this function inside your AutomationPage component
const handleDownloadReport = useCallback(async () => {
  if (!executionData?.results || executionData.results.length === 0) {
    toast.warning('No execution data to generate report');
    return;
  }

  try {
    // Send the executionData.results as payload
    const html = await flowRef.current.generateHTMLReport({
      results: executionData.results
    });

    // Download the HTML file
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Execution_Report_${executionId || Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Report downloaded!');
  } catch (err) {
    toast.error('Failed to generate report');
  }
}, [executionData, executionId]);

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <EditModeContext.Provider value={{ isEditMode }}>
      <div className="h-screen bg-black text-gray-100 flex flex-col overflow-hidden whitespace-normal">
 <StatusIndicator
  status={executionStatus}
  totalSteps={totalSteps}
  completedSteps={passedSteps}
  failedSteps={failedSteps}
  onExecute={handleExecute}
  onNumberChange={setRowNumber}
  isExecuted={hasStartedExecution}
  isExecuting={isExecuting}
  error={errorMessage}
  isEditMode={isEditMode}
  setIsEditMode={setIsEditMode}
  onClone={handleCloneTest}  // Pass the clone handler
  isCloning={isCloning}       // Pass cloning state
  onDownloadReport={handleDownloadReport}
/>

        <div className="flex flex-1 overflow-hidden">
          {/* ── Left Panel ── */}
          <div className="w-full md:w-[38%] flex flex-col overflow-hidden border-r border-gray-900">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">

              {/* Test Scenario Accordion */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl">
                <button
                  className="w-full flex justify-between items-center p-4 hover:bg-gray-800 rounded-xl transition-colors"
                  onClick={() => setAccordionOpen((o) => !o)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-semibold text-gray-100">Test Scenario</span>
                  </div>
                  <span className={`text-gray-400 transition-transform duration-200 ${accordionOpen ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>

                {accordionOpen && (
                  <div className="p-4 pt-0">
                    <TestScenario
                      data={testScenario}
                      testCaseId={testCaseId}
                      Scenario={handleScenarioChange}
                      status={executionStatus}
                      failedSteps={failedSteps}
                    />
                  </div>
                )}
              </div>

              {/* Execution Logs */}
              {hasStartedExecution && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl">
                  <div className="p-4 border-b border-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        <span className="font-semibold text-gray-100">Execution Logs</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Global action loader */}
                        {loadingAction && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <svg
                              className="w-3.5 h-3.5 animate-spin text-blue-400"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            <span>
                              {loadingAction.type === 'delete' && 'Deleting...'}
                              {loadingAction.type === 'reorder' && 'Saving order...'}
                              {loadingAction.type === 'update-planned' && 'Updating...'}
                              {loadingAction.type === 'update-exec' && 'Updating...'}
                              {loadingAction.type === 'add' && 'Adding step...'}
                            </span>
                          </div>
                        )}

                        {executionStatus !== 'IN_PROGRESS' && executionStatus !== 'RUNNING' && (
                          <button
                            onClick={() => setIsEditMode((m) => !m)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              isEditMode
                                ? 'bg-blue-600 text-white hover:bg-blue-500'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                          >
                            Edit Mode: {isEditMode ? 'On' : 'Off'}
                          </button>
                        )}

                        {totalSteps > 0 && (
                          <>
                            <span className="text-sm text-gray-400">
                              {passedSteps}/{totalSteps}
                            </span>
                            {executionStatus === 'RUNNING' && (
                              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    {isLoadingSteps ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-4 bg-gray-800 rounded animate-pulse" />
                        ))}
                      </div>
                    ) : errorMessage ? (
                      <div className="text-red-400 p-3 bg-red-900/20 rounded-lg">
                        <strong>Error:</strong> {errorMessage}
                      </div>
                    ) : (
                      <StepList
                        executionData={executionData}
                        steps={localSteps}
                        results={results}
                        draggedIndex={draggedIndex}
                        dragOverIndex={dragOverIndex}
                        loadingAction={loadingAction}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDragEnd={handleDragEnd}
                        onDrop={handleDrop}
                        executionStatus={executionStatus}
                        onAddStep={handleAddStepAtPosition}
                        onDeleteStep={handleDeleteStep}
                        onUpdatePlannedStep={handleUpdatePlannedStep}
                        onUpdateExecutionStep={handleUpdateExecutionStep}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right Panel ── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {executionStatus === 'IN_PROGRESS' && executionId && sessionId && (
              <LiveView
                key={sessionId}
                sessionId={sessionId}
                totalSteps={totalSteps}
                completedSteps={passedSteps}
                status={executionStatus}
              />
            )}

            {!hasStartedExecution && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 mb-6 rounded-full bg-gray-900 border-2 border-gray-800 flex items-center justify-center">
                  <span className="text-4xl">▶️</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Ready to Execute</h3>
                <p className="text-gray-400 max-w-md">
                  Click the "Execute" button in the header to start automation testing.
                </p>
                <p className="text-gray-500 text-sm mt-4">
                  Test Case ID:{' '}
                  <code className="bg-gray-900 px-2 py-1 rounded">{testCaseId}</code>
                </p>
              </div>
            )}

            {executionStatus === 'SUCCESS' && (
              <div className="">
                <GIFoption
                  results={results}
                  testCaseId={testCaseId}
                  totalSteps={totalSteps}
                  completedSteps={passedSteps}
                  failedSteps={failedSteps}
                />
              </div>
            )}

            {executionStatus === 'FAILED' && (
              <Failed onExecute={handleExecute} />
            )}
          </div>
        </div>

        <AddStepModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setAddStepPosition(null);
          }}
          onAdd={handleAddStep}
        />
      </div>
    </EditModeContext.Provider>
  );
};

export default AutomationPage;