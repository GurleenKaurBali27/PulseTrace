const logger = require("./logger");
const sendLog = require("./sendLog");
const { AsyncLocalStorage } = require("async_hooks");
const http = require("http");
const https = require("https");

// Context storage for tracing
const traceContext = new AsyncLocalStorage();

/**
 * Monkey-patch http/https request to automatically propagate trace headers
 */
const patchRequest = (module) => {
  const originalRequest = module.request;
  module.request = function (options, callback) {
    const context = traceContext.getStore();
    
    if (context) {
      // Handle both string URLs and options objects
      if (typeof options === 'string') {
        try {
          const url = new URL(options);
          options = {
            protocol: url.protocol,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: 'GET',
            headers: {}
          };
        } catch (e) {
          return originalRequest.apply(this, arguments);
        }
      }

      const headers = (options.headers = options.headers || {});
      headers["x-trace-id"] = context.traceId;
      headers["x-span-id"] = context.spanId;
      headers["x-request-depth"] = (context.requestDepth + 1).toString();
    }
    
    return originalRequest.apply(this, arguments);
  };
};

patchRequest(http);
patchRequest(https);

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
    
    // Trace Identification
    const traceId = req.headers["x-trace-id"] || req.headers["traceparent"]?.split("-")[1] || require("crypto").randomUUID();
    const parentSpanId = req.headers["x-span-id"] || req.headers["traceparent"]?.split("-")[2] || null;
    const spanId = require("crypto").randomUUID();
    const requestDepth = parseInt(req.headers["x-request-depth"] || "0");

    const requestId = `${Date.now()}-${Math.random()}`;

    return traceContext.run({ traceId, spanId, requestDepth }, () => {
      // Propagate trace IDs back in response headers
      res.setHeader("x-trace-id", traceId);
      res.setHeader("x-span-id", spanId);

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
        serviceName,
        requestId,
        traceId,
        spanId,
        parentSpanId,
        requestDepth,
        method: req.method,
        route: req.originalUrl || req.url,
        statusCode: res.statusCode,
        duration,
        error: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : null,
        requestBody: req.body ? JSON.stringify(req.body) : null,
        responseSize: Buffer.byteLength(responseBody),
        details: JSON.stringify(details)
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
      const currentApiKey = options.apiKey || process.env.PULSE_API_KEY || req.headers["x-api-key"] || null;
      sendLog(logData, serverUrl, currentApiKey).catch((error) => {
        logger.error(`Failed to send log for request ${requestId}:`, error);
      });
    });

    next();
  });
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