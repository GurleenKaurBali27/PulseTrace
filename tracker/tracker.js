const logger = require("./logger");
const sendLog = require("./sendLog");

/**
 * Express middleware to track API requests and responses
 * Captures: method, route, status code, duration, errors, headers, body, and query params
 * 
 * @param {string|object} options - Server URL or options object
 * @param {string} options.serverUrl - Server URL (default: "http://localhost:5000")
 * @param {string} options.serviceName - Service name identifier (default: "default-service")
 * @returns {Function} Express middleware function
 */
function tracker(options = {}) {
  // Handle backward compatibility - if string is passed, treat as serverUrl
  let serverUrl = "http://localhost:5000";
  let serviceName = "default-service";

  if (typeof options === "string") {
    // Backward compatibility: tracker("http://localhost:5000")
    serverUrl = options;
  } else if (typeof options === "object") {
    // New format: tracker({ serverUrl, serviceName })
    serverUrl = options.serverUrl || "http://localhost:5000";
    serviceName = options.serviceName || "default-service";
  }

  return function (req, res, next) {
    const startTime = Date.now();
    const requestId = `${Date.now()}-${Math.random()}`;

    // Store original end function
    const originalEnd = res.end;

    // Capture response body for logging
    let responseBody = "";
    const originalWrite = res.write;

    res.write = function (chunk) {
      if (chunk) {
        responseBody += chunk.toString();
      }
      return originalWrite.apply(res, arguments);
    };

    res.end = function (chunk) {
      if (chunk) {
        responseBody += chunk.toString();
      }
      return originalEnd.apply(res, arguments);
    };

    // Capture when response finishes
    res.on("finish", async () => {
      const duration = Date.now() - startTime;

      // Build detailed request information
      const details = {
        request: {
          headers: sanitizeHeaders(req.headers),
          body: req.body || null,
          query: req.query && Object.keys(req.query).length > 0 ? req.query : null,
          params: req.params && Object.keys(req.params).length > 0 ? req.params : null,
          path: req.path,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get("user-agent") || null,
          contentType: req.get("content-type") || null
        },
        response: {
          statusCode: res.statusCode,
          headers: sanitizeHeaders(res.getHeaders ? res.getHeaders() : {}),
          body: tryParseJSON(responseBody),
          size: Buffer.byteLength(responseBody)
        }
      };

      const logData = {
        serviceName, // Include serviceName in log data
        requestId,
        method: req.method,
        route: req.originalUrl || req.url,
        statusCode: res.statusCode,
        duration,
        error: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : null,
        requestBody: req.body ? JSON.stringify(req.body) : null,
        responseSize: Buffer.byteLength(responseBody),
        details: JSON.stringify(details) // Store full details as JSON string
      };

      // Log locally
      logger.info(`[${logData.method}] ${logData.route} - ${logData.statusCode} (${duration}ms)`, {
        serviceName,
        requestId,
        method: logData.method,
        route: logData.route,
        statusCode: logData.statusCode,
        duration: logData.duration
      });

      // Send to server asynchronously (non-blocking)
      sendLog(logData, serverUrl).catch((error) => {
        logger.error(`Failed to send log for request ${requestId}:`, error);
      });
    });

    next();
  };
}

/**
 * Sanitize headers to remove sensitive information
 * @param {object} headers - Headers object
 * @returns {object} Sanitized headers
 */
function sanitizeHeaders(headers) {
  if (!headers) return {};
  
  const sensitiveKeys = ["authorization", "cookie", "set-cookie", "x-api-key", "x-auth-token"];
  const sanitized = { ...headers };

  sensitiveKeys.forEach((key) => {
    if (sanitized[key]) {
      sanitized[key] = "[REDACTED]";
    }
  });

  return sanitized;
}

/**
 * Safely parse JSON response body
 * @param {string} body - Response body string
 * @returns {object|string} Parsed JSON or original string
 */
function tryParseJSON(body) {
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    // If not JSON, return truncated string (max 1000 chars)
    return body.length > 1000 ? body.substring(0, 1000) + "..." : body;
  }
}

module.exports = tracker;