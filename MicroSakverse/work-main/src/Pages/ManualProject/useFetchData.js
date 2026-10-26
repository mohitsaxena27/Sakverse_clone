import { useState, useEffect, useCallback } from 'react';

const APIURL = import.meta.env.VITE_API_URL;
const PORT = import.meta.env.VITE_BACKEND_PORT;

// Correct template literal
const API_BASE = `/sakverse`; // Ensure this is correct or replace with your actual base

// Hook 1: Fetch individual story data
export const useFetchData = (selectedStoryId, projectId) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0); // 👈 key to force reload

  const fetchData = useCallback(async () => {
    if (!selectedStoryId || !projectId) {
      setData(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/project/Get_update?pr_id=${projectId}&selectedStoryId=${selectedStoryId}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`Network error: ${response.statusText}`);
      }

      const blob = await response.blob();
      const text = await new TextDecoder().decode(await blob.arrayBuffer());
      const jsonData = JSON.parse(text);

      if (!jsonData.message) throw new Error('Invalid response format.');

      setData(jsonData.message);
      setError(null);
    } catch (err) {
      console.error('Fetch Error:', err);
      setError(err.message || 'Something went wrong while fetching data.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedStoryId, projectId]);

  // 👇 This runs when IDs change OR reloadKey changes
  useEffect(() => {
    fetchData();
  }, [fetchData, reloadKey]);

  // 👇 This allows external force refresh
  const GetUpdate = useCallback(() => {
    setReloadKey(prev => prev + 1);
  }, []);

  return { data, error, isLoading, refetch: fetchData, GetUpdate };
};

// Hook 2: Fetch user stories list
export const useUserStoriesData = (projectId) => {
  const [userStories, setUserStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserStories = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/project/us_list?pr_id=${projectId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to fetch user stories');

      const data = await res.json();
      const sortedStories = data.message.list.sort((a, b) => b._id - a._id);
      setUserStories(sortedStories);
    } catch (err) {
      setError(err.message);
      setUserStories([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchUserStories();
    // const interval = setInterval(fetchUserStories, 120000); // Refresh every 2 minutes
    // return () => clearInterval(interval);
  }, [fetchUserStories]);

  return { userStories, loading, error, refetch: fetchUserStories };
};
