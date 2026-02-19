//frontend/src/api/axios.ts
import axios from "axios";

const api = axios.create({
  baseURL: 'http://192.168.110.72:3001',
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const API_BASE_URL = 'http://192.168.110.72:3001';
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, logout user
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Only redirect to login if not on public pages
      const publicPages = ['/public-forms', '/public-landing', '/one-time'];
      const currentPath = window.location.pathname;
      if (!publicPages.includes(currentPath)) {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
