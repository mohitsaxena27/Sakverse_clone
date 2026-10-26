// import { config } from "../../../../../config.mjs";


// const API_BASE_URL = `${config.JavaIP}/api/admin`;


// export const addUser = async (userData) => {
//   const token = sessionStorage.getItem("token");
//   if (!token) {
//     throw new Error("No authentication token found");
//   }

//   const response = await fetch(`${API_BASE_URL}/users`, {
//   // const response = await fetch(`http://localhost:3000/projects`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     },
//     body: JSON.stringify(userData),
//   });

//   if (!response.ok) {
//     throw new Error("Failed to add user");
//   }

//   const result = await response.json();
//   // setUserID(response);
//   return result; 
// };

// export const addProject = async (projectData) => {
//   const token = sessionStorage.getItem("token");
//   if (!token) {
//     throw new Error("No authentication token found");
//   }

//   const response = await fetch(`${API_BASE_URL}/projects`, {
//   // const response = await fetch(`http://localhost:3000/users`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     },
//     body: JSON.stringify(projectData),
//   });

//   if (!response.ok) {
//     throw new Error("Failed to add project");
//   }

//   const result = await response.json();
//   // setProjectID(response);
//   return result; // Ensure API returns projectId
// };

// export const AssignRole = async ({ userId, projectId }) => {
//   const token = sessionStorage.getItem("token");
//   if (!token) throw new Error("No authentication token found");

//   const apiUrl = `${API_BASE_URL}/assignments?userId=${encodeURIComponent(userId)}&projectId=${encodeURIComponent(projectId)}`;

//   const response = await fetch(apiUrl, {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${token}`,
//     }, 
//   });

//   if (!response.ok) {
//     const errorMsg = await response.text();
//     throw new Error(`Failed to assign role: ${errorMsg}`);
//   }

//   return response;
// };
