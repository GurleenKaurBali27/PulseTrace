/**
 * Retry Logic with Exponential Backoff
 * Handles transient failures by automatically retrying with increasing delays
 */

/**
 * Retry configuration
 */
const DEFAULT_CONFIG = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  timeoutMs: 30000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * Check if error is retryable
 * @param {Error} error - The error object
 * @param {number} statusCode - HTTP status code (if applicable)
 * @returns {boolean}
 */
function isRetryableError(error, statusCode = null) {
  // Network errors are retryable
  if (error.code === "ECONNREFUSED") return true;
  if (error.code === "ECONNRESET") return true;
  if (error.code === "ETIMEDOUT") return true;
  if (error.code === "EHOSTUNREACH") return true;

  // Timeouts are retryable
  if (error.message?.includes("timeout")) return true;

  // Check status codes
  if (statusCode && DEFAULT_CONFIG.retryableStatusCodes.includes(statusCode)) {
    return true;
  }

  return false;
}

/**
 * Calculate exponential backoff delay
 * @param {number} attempt - Current attempt number (0-indexed)
 * @param {Object} config - Retry configuration
 * @returns {number} Delay in milliseconds
 */
function calculateBackoffDelay(attempt, config = DEFAULT_CONFIG) {
  const delay = Math.min(
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelayMs
  );

  // Add jitter to prevent thundering herd
  const jitter = delay * 0.1 * Math.random();
  return Math.round(delay + jitter);
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} Result from function
 */
async function retryWithBackoff(fn, options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };

  let lastError;
  let lastStatusCode;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      return await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Operation timeout")),
            config.timeoutMs
          )
        ),
      ]);
    } catch (error) {
      lastError = error;
      lastStatusCode = error.response?.status;

      // Check if error is retryable
      if (!isRetryableError(error, lastStatusCode)) {
        throw error;
      }

      // Don't retry if this was the last attempt
      if (attempt === config.maxAttempts - 1) {
        throw error;
      }

      const delay = calculateBackoffDelay(attempt, config);

      console.warn(
        `Retry attempt ${attempt + 1}/${config.maxAttempts} ` +
          `(waiting ${delay}ms): ${error.message}`
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Retry wrapper for HTTP requests
 * @param {Promise} requestPromise - Axios/fetch promise
 * @param {Object} options - Retry options
 * @returns {Promise} Response from request
 */
async function retryRequest(requestPromise, options = {}) {
  return retryWithBackoff(() => requestPromise, options);
}

/**
 * Higher-order function to wrap a function with retry logic
 * @param {Function} fn - Function to wrap
 * @param {Object} options - Retry options
 * @returns {Function} Wrapped function with retry
 */
function withRetry(fn, options = {}) {
  return async function retryWrapper(...args) {
    return retryWithBackoff(() => fn(...args), options);
  };
}

/**
 * Retry decorator for axios instance
 * @param {Object} axiosInstance - Axios instance
 * @param {Object} options - Retry options
 * @returns {Object} Same axios instance (modified)
 */
function setupAxiosRetry(axiosInstance, options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const currentAttempt = (error.config?._retryCount || 0) + 1;
      const maxAttempts = error.config?.retryConfig?.maxAttempts || config.maxAttempts;

      if (
        currentAttempt < maxAttempts &&
        isRetryableError(error, error.response?.status)
      ) {
        error.config._retryCount = currentAttempt;
        const delay = calculateBackoffDelay(currentAttempt - 1, config);

        console.warn(
          `HTTP Retry ${currentAttempt}/${maxAttempts} ` +
            `(${error.response?.status}) waiting ${delay}ms`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        return axiosInstance(error.config);
      }

      return Promise.reject(error);
    }
  );

  return axiosInstance;
}

module.exports = {
  retryWithBackoff,
  retryRequest,
  withRetry,
  setupAxiosRetry,
  isRetryableError,
  calculateBackoffDelay,
  DEFAULT_CONFIG,
};
