const axios = require("axios");
const logger = require("./logger");

/**
 * Send log data to the visualization server
 * Uses axios with retry logic for robustness
 * 
 * @param {object} logData - Log data to send
 * @param {string} serverUrl - Server URL (default: http://localhost:5000)
 * @returns {Promise<object>} Response from server
 */
async function sendLog(logData, serverUrl = "http://localhost:5000", apiKey = null) {
  const endpoint = `${serverUrl}/logs`;
  const maxRetries = 3;
  let lastError;

  const headers = {
    "Content-Type": "application/json"
  };

  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(endpoint, logData, {
        timeout: 5000, 
        headers
      });

      logger.info(`Log sent successfully to ${endpoint}`, {
        requestId: logData.requestId,
        attempt,
        statusCode: response.status
      });

      return response.data;
    } catch (error) {
      lastError = error;
      logger.warn(`Failed to send log (attempt ${attempt}/${maxRetries}):`, {
        requestId: logData.requestId,
        endpoint,
        error: error.message
      });

      // Wait before retrying (exponential backoff: 100ms, 200ms, 400ms)
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt - 1) * 100));
      }
    }
  }

  // All retries failed
  logger.error(`Failed to send log after ${maxRetries} attempts`, {
    requestId: logData.requestId,
    endpoint,
    error: lastError ? lastError.message : "Unknown error"
  });

  throw lastError || new Error("Failed to send log");
}

module.exports = sendLog;
