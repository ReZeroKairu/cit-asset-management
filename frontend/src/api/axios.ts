//frontend/src/api/axios.ts
import axios from "axios";

const getApiBaseUrl = () => {
  // Use network IP when accessing from network, localhost for local development
  const isNetworkAccess = window.location.hostname.includes('192.168.56.1') || 
                          window.location.hostname.includes('192.168.0.104');
  return isNetworkAccess 
    ? "http://192.168.56.1:3001" 
    : "http://localhost:3001";
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      // ✅ BULLETPROOF FIX: Use the .set() method for modern Axios
      config.headers.set("Authorization", `Bearer ${token}`);
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

      // Only redirect to login if not already on login page AND not on public pages
      const currentPath = window.location.pathname;
      const publicPages = [
        "/login",
        "/public-forms",
        "/public-complaints",
        "/complaints",
        "/one-time",
        "/public-landing",
      ];

      if (!publicPages.includes(currentPath)) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
