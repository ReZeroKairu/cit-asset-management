//frontend/src/api/axios.ts
import axios from "axios";

const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  return `http://${hostname}:3001`;
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
      console.error("401 ERROR CAUGHT! Token might be invalid or rejected by backend.");

      // 🛑 TEMPORARILY COMMENT OUT THE LOGOUT LOGIC FOR DEBUGGING
      // localStorage.removeItem("token");
      // localStorage.removeItem("user");
      // const currentPath = window.location.pathname;
      // if (currentPath !== '/login') {
      //   window.location.href = "/login";
      // }
    }
    return Promise.reject(error);
  }
);

export default api;