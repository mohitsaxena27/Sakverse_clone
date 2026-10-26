// hooks/useTDM.js
import { useState, useCallback } from 'react';

const APIURL = import.meta.env.VITE_API_URL;
const PORT = import.meta.env.VITE_BACKEND_PORT;
const API_BASE = `/sakverse/tdm`;

export function useTDM() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ---------------------------------- */
  /* Get all repositories               */
  /* ---------------------------------- */
  const getRepositories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/repositories`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch repositories');

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------------------------- */
  /* Create new repository              */
  /* ---------------------------------- */
  const createRepository = useCallback(async (name) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/createrepository`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create repository');

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------------------------- */
  /* Delete repository                  */
  /* ---------------------------------- */
  const deleteRepository = useCallback(async (repoId) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/deleteRepository/${repoId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete repository');

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------------------------- */
  /* Get table data by table ID         */
  /* ---------------------------------- */
  const getTableData = useCallback(async (tableId) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/tabledata/${tableId}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch table data');

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------------------------- */
  /* Create new table                   */
  /* ---------------------------------- */
  const createTable = useCallback(async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/createtable`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create table');

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------------------------- */
  /* Delete table                       */
  /* ---------------------------------- */
  const deleteTable = useCallback(async (tableId) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/deleteTable/${tableId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete table');

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------------------------- */
  /* Update data record                 */
  /* ---------------------------------- */
const updateDataRecord = useCallback(async (repoName, tableName, rowNumber, columnName, value) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/repository/${repoName}/table/${tableName}/row/${rowNumber}/column/${columnName}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });

      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message || 'Failed to update data record');

      return responseData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------------------------- */
  /* Create new data record             */
  /* ---------------------------------- */
  const createDataRecord = useCallback(async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/createdatarecord`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create data record');

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------------------------- */
  /* Delete data record                 */
  /* ---------------------------------- */
  const deleteDataRecord = useCallback(async (dataId) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/deleteDataRecord/${dataId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete data record');

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------------------------- */
  /* Download table as XLSX             */
  /* ---------------------------------- */
  const downloadTable = useCallback(async (tableId) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/download/${tableId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to download table');
      }

      const blob = await res.blob();
      return blob;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------------------------- */
  /* Add table column                   */
  /* ---------------------------------- */
  const addTableColumn = useCallback(async (tableId, payload) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/table/${tableId}/columns`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to add table column');
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // Repository APIs
    getRepositories,
    createRepository,
    deleteRepository,
    
    // Table APIs
    getTableData,
    createTable,
    deleteTable,
    
    // Data Record APIs
    updateDataRecord,
    createDataRecord,
    deleteDataRecord,
    addTableColumn,
    
    // File APIs
    downloadTable,
    
    // State
    loading,
    error,
  };
}