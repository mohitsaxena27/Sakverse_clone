import { useState, useCallback } from 'react';


const APIURL = import.meta.env.VITE_API_URL;
const PORT = import.meta.env.VITE_BACKEND_PORT;

// Correct template literal
const API_BASE = `/sakverse`;


export function useUserStoryFlow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);

  const projectOnboarding = useCallback(async (text, files) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();

      // Backend expects 'data' key
      if (text) formData.append('data', text);

      // Append files safely
      if (files?.length) {
        files.forEach(file => formData.append('files', file));
      }

      // Get token if backend uses Bearer auth
      const token = sessionStorage.getItem('token'); // adjust if stored elsewhere

      const res = await fetch(`${API_BASE}/admin/project_onboarding`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}` // remove if backend only uses cookies
        },
        credentials: 'include', // include cookies if backend uses session
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Upload failed: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      setResponse(data);
      return data;
    } catch (err) {
      console.error('Upload Error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    projectOnboarding,
    loading,
    error,
    response,
  };
}
