// apiService.jsx

const APIURL = import.meta.env.VITE_API_URL;
const PORT = import.meta.env.VITE_BACKEND_PORT;

// Correct template literal
const API_BASE = ``;


const BASE_URL = `/sakverse/admin`;

// Add User (no password sent from frontend)
export const addUser = async (userData) => {
  const response = await fetch(`${BASE_URL}/add_user`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(`Failed to add user: ${errorMsg}`);
  }

  return await response.json();
};

// Add Project
export const addProject = async (projectData) => {
  const response = await fetch(`${BASE_URL}/add_project`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(projectData),
  });

  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(`Failed to add project: ${errorMsg}`);
  }

  return await response.json();
};

// Assign Role
export const AssignRole = async ({ userId, projectId }) => {
  const url = `${BASE_URL}/assign_role?userId=${encodeURIComponent(userId)}&projectId=${encodeURIComponent(projectId)}`;

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(`Failed to assign role: ${errorMsg}`);
  }

  return await response.json();
};
