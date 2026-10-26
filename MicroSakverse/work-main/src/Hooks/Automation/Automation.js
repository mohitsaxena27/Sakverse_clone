import { useState, useCallback } from 'react';

const APIURL = import.meta.env.VITE_API_URL;
const PORT = import.meta.env.VITE_BACKEND_PORT;
const API_BASE = `/sakverse`;

export function useAutomationFlow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ---------------------------------- */
  /* Get Test Scenario                  */
  /* ---------------------------------- */
  const getTestScenario = useCallback(
    async (testID, selectedStoryId, projectId) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${API_BASE}/automation/GetTestScenario?projectId=${projectId}&selectedStoryId=${selectedStoryId}&testCaseId=${testID}`,
          {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch test scenario');

        return data;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /* ---------------------------------- */
  /* Execute Test                       */
  /* ---------------------------------- */
  const executeTest = useCallback(async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/automation/executeTest`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to execute test');

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /* ---------------------------------- */
  /* Clone Executed test                */
  /* ---------------------------------- */
  const cloneTest = useCallback(async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/automation/cloneTest`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to clone test');

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------------------------- */
  /* Get Test Execution Result          */
  /* ---------------------------------- */
  const getTestResult = useCallback(async (ExecutionId) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/automation/execution-result/${ExecutionId}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch test result');

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------------------------- */
  /* Add Step                           */
  /* ---------------------------------- */
  const AddStep = useCallback(async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/automation/addStep`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add step');

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------------------------- */
  /* Delete Planned Step                */
  /* ---------------------------------- */
  const deletePlannedStep = useCallback(async (plannedStepId) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/automation/delete-step/${plannedStepId}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete planned step');

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------------------------- */
  /* Move / Reorder Planned Step        */
  /* ---------------------------------- */
  const movePlannedStep = useCallback(async (plannedStepId, newOrder) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/automation/move-step/${plannedStepId}?new_order=${newOrder}`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update step order');

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------------------------- */
  /* Update Planned Intent              */
  /* payload: { intent, target, value } */
  /* ---------------------------------- */
  const updatePlannedIntent = useCallback(async (plannedStepId, payload) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/automation/planned-intent/${plannedStepId}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update planned intent');

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------------------------- */
  /* Update Execution Step Details      */
  /* payload: { target, value }         */
  /* ---------------------------------- */
  const updateExecutionStep = useCallback(async (plannedStepId, payload) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/automation/execution-step/${plannedStepId}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update execution step');

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);


  /* ---------------------------------- */
/* Execute Suite Parallel             */
/* ---------------------------------- */
const executeSuiteParallel = useCallback(async (payload) => {
  setLoading(true);
  setError(null);

  try {
    const res = await fetch(
      `${API_BASE}/automation/execute-suite-parallel`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to execute suite');
    }

    return data;
  } catch (err) {
    setError(err.message);
    throw err;
  } finally {
    setLoading(false);
  }
}, []);

/* ---------------------------------- */
/* Open Suite Report                  */
/* ---------------------------------- */
const openSuiteReport = useCallback(async () => {
  setLoading(true);
  setError(null);

  try {
    const res = await fetch(
      `${API_BASE}/automation/open-suite-report`,
      {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to open suite report');
    }

    return data;
  } catch (err) {
    setError(err.message);
    throw err;
  } finally {
    setLoading(false);
  }
}, []);

/* ---------------------------------- */
/* Generate HTML Report               */
/* ---------------------------------- */
const generateHTMLReport = useCallback(async (payload) => {
  setLoading(true);
  setError(null);

  try {
    const res = await fetch(
      `${API_BASE}/automation/generate-report`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to generate report');
    }

    // Return the HTML as text
    const htmlContent = await res.text();
    return htmlContent;
  } catch (err) {
    setError(err.message);
    throw err;
  } finally {
    setLoading(false);
  }
}, []);

  return {
    // Existing
    getTestScenario,
    executeTest,
    cloneTest,
    getTestResult,
    AddStep,
    // New
    deletePlannedStep,
    movePlannedStep,
    updatePlannedIntent,
    updateExecutionStep,
    // State


    // suite
    executeSuiteParallel,
openSuiteReport,
 generateHTMLReport,


    loading,
    error,
  };
}