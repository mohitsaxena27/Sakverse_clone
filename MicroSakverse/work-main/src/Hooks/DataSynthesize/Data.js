
import { useState, useCallback } from 'react';

const APIURL = import.meta.env.VITE_API_URL;
const PORT = import.meta.env.VITE_BACKEND_PORT;
const API_BASE = `/sakverse/data`;

export function useData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ---------------------------------- */
  /* Generate synthetic data            */
  /* ---------------------------------- */
  const generateSyntheticData = useCallback(async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/generate_synthetic_data`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || 'Failed to generate synthetic data'
        );
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
    // Data APIs
    generateSyntheticData,

    // State
    loading,
    error,
  };
}
