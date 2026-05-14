import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_URL}`,
  headers: {
    "Content-Type": "application/json"
  }
});

// Add interceptor to attach JWT and Org ID
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const orgId = localStorage.getItem("activeOrgId");
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (orgId) {
    config.headers["x-org-id"] = orgId;
  }
  return config;
});

export const fetchLogs = async (params = "") => {
  const response = await api.get(`/logs${params}`);
  return response.data;
};

export const fetchLogDetail = async (id, config = {}) => {
  const response = await api.get(`/logs/${id}`, config);
  return response.data;
};

export const createLog = async (logData) => {
  const response = await fetch(`${API_URL}/logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(logData)
  });
  if (!response.ok) throw new Error("Failed to create log");
  return response.json();
};

export default api;
