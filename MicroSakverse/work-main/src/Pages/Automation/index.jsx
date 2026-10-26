import React, { useState, useEffect } from 'react';
import AutomationPage from './AutomationPage';
import { useSearchParams } from 'react-router-dom';
import { useAutomationFlow } from '../../Hooks/Automation/Automation';
import ProtectedProjectRoute from '../../Hooks/Auth/ProtectedProjectRoute';
import { ToastContainer, toast } from 'react-toastify';


const Index = () => {
  const [executionData, setExecutionData] = useState(null);
  const [searchParams] = useSearchParams();
  const { getTestScenario } = useAutomationFlow();

  const projectId = searchParams.get('projectId');
  const selectedStoryId = searchParams.get('selectedStoryId');
  const testCaseId = searchParams.get('testCaseId');
  const source = searchParams.get('source');

useEffect(() => {
  // ✅ Only run for TCG
  if (source !== 'tcg') return;

  if (!projectId || !selectedStoryId || !testCaseId) return;

  getTestScenario(testCaseId, selectedStoryId, projectId)
    .then(setExecutionData)
    .catch(error => {
      console.error('Failed to load test scenario:', error);
      setExecutionData({
        summary: "Failed to load test scenario",
        expected_result: "",
        test_data: [],
        test_steps: [],
        technique: ""
      });
    });

}, [source, testCaseId, selectedStoryId, projectId, getTestScenario]);

  const testScenario = executionData || {
    summary: "Loading...",
    expected_result: "",
    test_data: [],
    test_steps: [],
    technique: ""
  };

  return (
    <ProtectedProjectRoute paramType="query">
      <ToastContainer />
      <AutomationPage 
        testScenario={testScenario} 
        projectId={projectId} 
        testCaseId={testCaseId}
        selectedStoryId={selectedStoryId}
      />
    </ProtectedProjectRoute>
  ); 
};

export default Index;