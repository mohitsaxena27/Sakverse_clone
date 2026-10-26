// axios.js (or create an interceptor)
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Create an instance of axios
const api = axios.create({
  baseURL: `${config.JavaIP}/api`,
  baseURL: `${config.BaseIP}/api`,
  withCredentials: true, // ✅ Send cookies with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to handle 401 errors globally
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.clear();

    }
    return Promise.reject(error);
  }
);

export default api;
