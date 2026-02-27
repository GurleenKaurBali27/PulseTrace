import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_URL}/logs`,
  headers: {
    "Content-Type": "application/json"
  }
});

export const fetchLogs = async () => {
  const response = await fetch(`${API_URL}/logs`);
  if (!response.ok) throw new Error("Failed to fetch logs");
  return response.json();
};

export const fetchLogDetail = async (id) => {
  const response = await api.get(`/${id}`);
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
