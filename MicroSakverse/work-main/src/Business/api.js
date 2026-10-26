import { useState, useCallback } from 'react';

const APIURL = import.meta.env.VITE_API_URL;
const PORT = import.meta.env.VITE_BACKEND_PORT;

const API_BASE = `/sakverse`;

export function useUserStoryFlow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);

  // 1. Upload BA
  const uploadBA = useCallback(async (text, files, prId) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      if (text) formData.append('text', text);
      if (files && files.length > 0) {
        files.forEach((file) => formData.append('files', file));
      }
      if (prId) formData.append('pr_id', prId);

      const response = await fetch(`${API_BASE}/business/uploadBA`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
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

  // 2. Fetch user story using request_id
  const fetchUserStoryById = useCallback(async (requestId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/business/getUS/${requestId}`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch user story');
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. Get all processed ideas for a project
  const getProcessedIdea = useCallback(async (prId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/business/get_processed_idea/${prId}`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch processed idea');
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 4. Publish user story
  const publishUserStory = useCallback(async (userstoryRefId, projectId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/business/publishUS`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userstory_ref_id: userstoryRefId,
          project_id: projectId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to publish user story');
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

// 5. Download feature as Excel file
const downloadFeature = useCallback(async (payload) => {
  setLoading(true);
  setError(null);
  try {
    const res = await fetch(`${API_BASE}/business/downloadFeature`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Download failed: ${res.status} - ${errorText}`);
    }

    // Get the blob from response
    const blob = await res.blob();
    
    // Create a download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Extract filename from Content-Disposition header or use default
    const contentDisposition = res.headers.get('Content-Disposition');
    let filename = 'features.xlsx';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }
    
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    return { success: true, blob, filename };
  } catch (err) {
    console.error('Download Feature Error:', err);
    setError(err.message);
    throw err;
  } finally {
    setLoading(false);
  }
}, []);

// 6. Download feature as Word document
const downloadFeatureDoc = useCallback(async (payload) => {
  setLoading(true);
  setError(null);
  try {
    const res = await fetch(`${API_BASE}/business/downloadFeatureDoc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Download failed: ${res.status} - ${errorText}`);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const contentDisposition = res.headers.get('Content-Disposition');
    let filename = 'feature.docx';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }
    
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    return { success: true, blob, filename };
  } catch (err) {
    console.error('Download Feature Doc Error:', err);
    setError(err.message);
    throw err;
  } finally {
    setLoading(false);
  }
}, []);

  return {
    uploadBA,
    fetchUserStoryById,
    publishUserStory,
    getProcessedIdea,
    downloadFeature, // New function
    downloadFeatureDoc,
    loading,
    error,
    response,
  };
}