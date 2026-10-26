// const BASE_URL = "http://localhost:5000"; // Change to backend proxy URL

// export const fetchUsers = async () => {
//     const response = await fetch(`http://localhost:3000/users`);
//     return response.json();
// };

// export const fetchProjects = async () => {
//     const response = await fetch(`http://localhost:3000/users`);
//     return response.json();
// };

import axios from "axios";

const APIURL = import.meta.env.VITE_API_URL;
const PORT = import.meta.env.VITE_BACKEND_PORT;

// Correct template literal
const API_BASE = ``;


// utils/api.js
const BASE_URL = `/sakverse/admin`;

// export const fetchProjects = async () => {
//   try {
//     const res = await fetch(`${BASE_URL}/projects`);
//     const data = await res.json();

//     if (Array.isArray(data.projects)) return data.projects;
//     else if (Array.isArray(data.project)) return data.project;
//     else if (data.project) return [data.project];
//     else return [];
//   } catch (error) {
//     console.error("Error fetching projects:", error);
//     return [];
//   }
// };

// export const fetchUsers = async () => {
//   try {
//     const res = await axios.get(`${BASE_URL}/user`);
    
//     // The API returns an array directly
//     if (Array.isArray(res.data)) {
//       return res.data;
//     } else {
//       console.warn("Unexpected response format:", res.data);
//       return [];
//     }
//   } catch (error) {
//     console.error("Error fetching users:", error.message || error);
//     return [];
//   }
// };


// You can add more APIs here in the future
