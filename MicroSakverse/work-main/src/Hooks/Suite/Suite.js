import { useState, useCallback } from 'react';

const APIURL = import.meta.env.VITE_API_URL;
const PORT = import.meta.env.VITE_BACKEND_PORT;
const API_BASE = `/sakverse`;

export function useSuite() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ---------------------------------- */
  /* Create Suite                       */
  /* ---------------------------------- */
  const createSuite = useCallback(async (projectId, payload) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/suite/test-suites?project_id=${projectId}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create suite');

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------------------------- */
  /* Get Suite List                     */
  /* ---------------------------------- */
  const getSuiteList = useCallback(async (projectId) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/suite/test-suites?project_id=${projectId}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch suite list');

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------------------------- */
  /* Execute Suite                      */
  /* ---------------------------------- */
  const executeSuite = useCallback(async (suiteId, maxParallel = 1) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/suite/execute-suite/${suiteId}?max_parallel=${maxParallel}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to execute suite');

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------------------------- */
  /* Get Suite Report (JSON)            */
  /* ---------------------------------- */
const getSuiteReportJson = useCallback(async (suiteId, screenshotMode = 'all') => {
  setLoading(true);
  setError(null);

  try {
    // Build URL with screenshot_mode parameter
    let url = `${API_BASE}/suite/test-suites/${suiteId}/report/json`;
    if (screenshotMode) {
      url += `?screenshot_mode=${screenshotMode}`;
    }

    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch suite report');

    return data;
  } catch (err) {
    setError(err.message);
    throw err;
  } finally {
    setLoading(false);
  }
}, []);

  return {
    // Suite operations
    createSuite,
    getSuiteList,
    executeSuite,
    getSuiteReportJson,
    
    // State
    loading,
    error,
  };
}