// ./api.js
import axios from 'axios';

const APIURL = import.meta.env.VITE_API_URL;
const PORT = import.meta.env.VITE_BACKEND_PORT;

// Correct template literal
const API_BASE = ``;

const BASE_URL = `${API_BASE}/sakverse/upload`;

// Get folder structure
export const fetchFolderStructure = async () => {
  const response = await axios.get(`${BASE_URL}/folder-structure`);
  return response.data;
};

// Upload files to a folder
export const uploadFilesToFolder = async (folderName, files) => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  const response = await axios.post(`${BASE_URL}/UploadFiles/${encodeURIComponent(folderName)}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Create new file or folder
export const createFileOrFolder = async (folderName, data) => {
  const response = await axios.post(`${BASE_URL}/CreateFile/${encodeURIComponent(folderName)}`, data);
  return response.data;
};

// Delete a file or folder
export const deleteFileOrFolder = async (folderName, relativePath) => {
  const response = await axios.delete(`${BASE_URL}/DeleteFile/${encodeURIComponent(folderName)}`, {
    data: { relativePath },
  });
  return response.data;
};