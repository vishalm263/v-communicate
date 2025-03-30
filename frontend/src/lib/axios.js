import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" 
    ? "http://localhost:5001/api" 
    : import.meta.env.VITE_BACKEND_URL || "https://v-communicate-backend.onrender.com/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  }
});

// Add request interceptor to include token from localStorage if available
axiosInstance.interceptors.request.use(
  (config) => {
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
