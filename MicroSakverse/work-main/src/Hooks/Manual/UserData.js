import { useState, useEffect , useCallback } from 'react';

import { authFetch } from "../Auth/authFetch"

const APIURL = import.meta.env.VITE_API_URL;
const PORT = import.meta.env.VITE_BACKEND_PORT;

const API_BASE = `/sakverse`;


// Function to fetch user-specific assigned projects using the token
export default function useUserData() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${API_BASE}/auth/project`, {
        method: "GET",
        credentials: "include", // This tells the browser to send cookies
      });

      if (!res.ok) throw new Error("Failed to fetch project data");

      const data = await res.json();
      setProjects(data);
    } catch (err) {
      setError(err.message);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
  };
}

// Hook for Jira Data
// export const useJiraData = () => {
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchData = async () => {
    

//       const url = `http://tcg.saksoft.com:3000/sakverse/project/jira`; // Change the URL to point to your proxy

//       try {
//         const response = await authFetch(url, {
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//           },
//         });

//         if (!response.ok) {
//           throw new Error(`Error: ${response.status}`);
//         }

//         const result = await response.json();
//         setData(result);
//         // console.log(result);  // Print result in console
//       } catch (err) {
//         setError(err.message);
//         console.error(err);  // Print error in console
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   return { data, loading, error };
// };

export const useJiraData = (projectId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE}/project/externalstories/${projectId}`, {
          method: "GET",
          credentials: "include", // ✅ VERY IMPORTANT: sends cookies/session
          headers: {
            'Accept': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching Jira data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  return { data, loading, error };
};


export const useNextStep = (selectedStoryId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedStoryId) return;

    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE}/project/nextStep/${selectedStoryId}`, {
          method: "POST",
          credentials: "include", // ✅ VERY IMPORTANT: sends cookies/session
          headers: {
            'Accept': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching Jira data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedStoryId]);

  return { data, loading, error };
};


// export function useUserStoriesData(projectId) {
//   const [userStories, setUserStories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchUserStories = useCallback(async () => {
//     if (!projectId) return;
//     setLoading(true);
//     setError(null);

//     try {
//       const res = await authFetch(`${API_BASE}/project/us_list?pr_id=${projectId}`, {
//         method: 'GET',
//         credentials: 'include',
//       });

//       if (!res.ok) throw new Error('Failed to fetch user stories');

//       const data = await res.json();
//       const sortedStories = data.message.list.sort((a, b) => b._id - a._id);
//       setUserStories(sortedStories);
//     } catch (err) {
//       setError(err.message);
//       setUserStories([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [projectId]);

//   useEffect(() => {
//     fetchUserStories();
//     const interval = setInterval(fetchUserStories, 120000); // 2 min refresh
//     return () => clearInterval(interval);
//   }, [fetchUserStories]);

//   return { userStories, loading, error, refetch: fetchUserStories };
// }


// Custom Hook to check if a project is linked


export function useProjectLinkedStatus(projectId) {
  const [projectLinked, setProjectLinked] = useState(false);

  useEffect(() => {
    const fetchLinkedStatus = async () => {
      try {
        const res = await authFetch(`${API_BASE}/auth/project`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        const project = data.find(p => p.project_id === parseInt(projectId));
        setProjectLinked(!!project?.linked);
      } catch (err) {
        console.error("Error fetching project linked status:", err);
      }
    };

    if (projectId) fetchLinkedStatus();
  }, [projectId]);

  return { projectLinked };
}


export function useUserStorySubmit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);

  const submitUserStory = async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const res = await authFetch(`${API_BASE}/project/us_submit`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit user story');
      }

      setResponse(data);
      return data; // Allow caller to access result
    } catch (err) {
      setError(err.message);
      setResponse(null);
      throw err; // Let caller catch it
    } finally {
      setLoading(false);
    }
  };

  return {
    submitUserStory,
    response,
    loading,
    error,
  };
}


// Hook to update QnA or queries
export function useUpdateQueries() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);

  const updateQueries = async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const res = await authFetch(`${API_BASE}/project/updateQueries`, {
        method: 'POST',
        credentials: 'include', // Send session cookie
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to update queries');

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err.message);
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    updateQueries,
    response,
    loading,
    error,
  };
}


// Hook to update QnA or queries
export function useReviewStatusUpdate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateReviewStatus = async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const res = await authFetch(`${API_BASE}/project/Accept_Testcase`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to update review status');
      const data = await res.json();
      return { success: true, data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { updateReviewStatus, loading, error };
}


export function useUpdateUserStory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);

  const updateUserStory = async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const res = await authFetch(`${API_BASE}/project/update_us`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to update user story');

      const data = await res.json();
      setResponse(data);
      return { success: true, data };
    } catch (err) {
      setError(err.message);
      setResponse(null);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    updateUserStory,
    response,
    loading,
    error,
  };
}


export function useUpdateRequirement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);

  const updateRequirement = async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const res = await authFetch(`${API_BASE}/project/update_r`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to update user story');

      const data = await res.json();
      setResponse(data);
      return { success: true, data };
    } catch (err) {
      setError(err.message);
      setResponse(null);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    updateRequirement,
    response,
    loading,
    error,
  };
}


export function useUpdateTestCase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);

  const updateTestCase = async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const res = await authFetch(`${API_BASE}/project/update_tc`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to update user story');

      const data = await res.json();
      setResponse(data);
      return { success: true, data };
    } catch (err) {
      setError(err.message);
      setResponse(null);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    updateTestCase,
    response,
    loading,
    error,
  };
}


export function usePublishTestCases() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);

  const publishTestCases = async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const res = await authFetch(`${API_BASE}/project/publish`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to publish test cases');

      const data = await res.json();
      setResponse(data);
      return { success: true, data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { publishTestCases, loading, error, response };
}




export function useRequirementGraph() {
  const requirementTable = async (projectId, selectedStoryId) => {
    try {
      const res = await authFetch(
        `${API_BASE}/project/requirement_list?pr_id=${projectId}&selectedStoryId=${selectedStoryId}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.ok) throw new Error('Failed to fetch requirement data');

      const data = await res.json();
      return { status: 200, data };
    } catch (err) {
      return { status: 500, message: err.message };
    }
  };

  return { requirementTable };
}


export function useDownloadExcel() {
  const downloadExcelFile = async (projectId, selectedStoryId) => {
    try {
      if (!selectedStoryId || !projectId) {
        throw new Error('Project ID and Story ID are required.');
      }

      const response = await authFetch(
        `${API_BASE}/project/DownloadUserstory?pr_id=${projectId}&selectedStoryId=${selectedStoryId}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download the file. Please try again.');
      }

      const blob = await response.blob();
      const fileName = `TestCaseFile_${selectedStoryId}.xlsx`;

      // Try File System Access API first
      if (window.showSaveFilePicker) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: fileName,
            types: [
              {
                description: 'Excel Files',
                accept: {
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                },
              },
            ],
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
        } catch (err) {
          // ✅ If user cancels save, just silently ignore
          if (err.name === 'AbortError') {
            console.log('User canceled file save.');
            return;
          }
          throw err;
        }
      } else {
        // Fallback for older browsers
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Excel download error:', err);
      throw err;
    }
  };

  return { downloadExcelFile };
}


export function usePublishUserStory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);

  const publishUserStory = async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/project/appendUS`, {
        method: 'POST',
        credentials: 'include', // important for sending cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Get full response, even on failure
      const responseText = await res.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { raw: responseText };
      }

      if (!res.ok) {
        console.error('Backend error response:', responseData);
        throw new Error(responseData?.message || 'Failed to publish user story');
      }

      setResponse(responseData);
      return { success: true, data: responseData };
    } catch (err) {
      console.error('Frontend caught error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { publishUserStory, loading, error, response };
}




export const useTestConfiguration = (userstory_ref_id) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userstory_ref_id) return;

    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE}/project/TestConfigurations/${userstory_ref_id}`, {
          method: "GET",
          credentials: "include", 
          headers: {
            'Accept': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching Jira data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userstory_ref_id]);

  return { data, loading, error };
};



export const useAdoTestPlan = (userstory_ref_id) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userstory_ref_id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE}/project/Ado_fetch_testplans/${userstory_ref_id}`,
          {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
          }
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching ADO Test Plans:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userstory_ref_id]);

  return { data, loading, error };
};


/* ============================
   FETCH TEST SUITES
============================ */
export const useAdoTestSuite = (userstory_ref_id, plan_id) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userstory_ref_id || !plan_id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE}/project/Ado_fetch_testsuite/${userstory_ref_id}/${plan_id}`,
          {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
          }
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching ADO Test Suites:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userstory_ref_id, plan_id]);

  return { data, loading, error };
};

export const useAdoTestData = (userstory_ref_id) => {
  const [data, setData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userstory_ref_id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE}/project/Ado_fetch_testdata/${userstory_ref_id}`,
          {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
          }
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const result = await response.json();

        setData(result);
        setPlans(result?.plans?.plans || []);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching ADO Test Data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userstory_ref_id]);

  return { data, plans, loading, error };
};


export function useUserStorySubmit_v2() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);

  const twoStepSubmit = useCallback(
    async (
      pr_id,
      user_input,
      autopilot, // boolean: true or false
      key,
      additional_context,
      data,
      files
    ) => {
      setLoading(true);
      setError(null);

      // Validate mandatory fields (autopilot can be false, so we don't check !autopilot)
      if (!pr_id || !user_input) {
        setLoading(false);
        const msg = 'pr_id and user_input are mandatory fields';
        setError(msg);
        throw new Error(msg);
      }

      try {
        const formData = new FormData();

        // Mandatory fields
        formData.append('pr_id', pr_id);
        formData.append('user_input', user_input);
        formData.append('autopilot', autopilot);

        // Optional fields
        if (key) formData.append('key', key);
        if (additional_context) formData.append('additional_context', additional_context);
        if (data) formData.append('data', typeof data === 'string' ? data : JSON.stringify(data));

        // Optional files
        if (files?.length) {
          files.forEach(file => formData.append('files', file));
        }

        const token = sessionStorage.getItem('token'); // adjust as needed

        const res = await fetch(`${API_BASE}/project/us_submit_v2`, {
          method: 'POST',
          body: formData,
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
          credentials: 'include',
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Upload failed: ${res.status} - ${errorText}`);
        }

        const resData = await res.json();
        setResponse(resData);
        return resData;
      } catch (err) {
        console.error('Upload Error:', err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    twoStepSubmit,
    loading,
    error,
    response,
  };
}