import axios from 'axios';

/**
 * API Service using Axios
 * Uses VITE_API_URL environment variable for baseURL
 * Falls back to http://localhost:5000/logs if VITE_API_URL not set
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create Axios instance with baseURL
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Fetch all logs from the server
 * GET /logs
 */
export const fetchLogs = async () => {
  try {
    const response = await apiClient.get('/logs');
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error fetching logs:', error.message);
    throw error;
  }
};

/**
 * Create a new log entry
 * POST /logs
 */
export const createLog = async (logData) => {
  try {
    const response = await apiClient.post('/logs', logData);
    return response.data;
  } catch (error) {
    console.error('Error creating log:', error.message);
    throw error;
  }
};

/**
 * Create multiple logs (batch)
 * POST /logs (called multiple times)
 */
export const createLogs = async (logsArray) => {
  try {
    const results = await Promise.all(
      logsArray.map(log => apiClient.post('/logs', log))
    );
    return results.map(res => res.data);
  } catch (error) {
    console.error('Error creating logs:', error.message);
    throw error;
  }
};

/**
 * Fetch logs with filtering
 * GET /logs with query parameters
 */
export const fetchLogsWithFilter = async (filters = {}) => {
  try {
    const response = await apiClient.get('/logs', { params: filters });
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error fetching filtered logs:', error.message);
    throw error;
  }
};

/**
 * Get health status
 * GET /health
 */
export const getHealthStatus = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    console.error('Error getting health status:', error.message);
    throw error;
  }
};

// Export the Axios client for direct use if needed
export default apiClient;
