/**
 * Demo Data Generator
 * Creates realistic fake API logs for demonstration purposes
 * Used for recruiters/stakeholders to see dashboard in action
 */

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const STATUS_CODES = [
  200, 201, 204, 
  400, 401, 403, 404, 409,
  500, 502, 503, 504
];
const SERVICES = [
  'auth-service',
  'user-service',
  'payment-service',
  'notification-service',
  'inventory-service',
  'order-service',
  'analytics-service'
];
const ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/users',
  '/api/users/:id',
  '/api/users/:id/profile',
  '/api/payments',
  '/api/payments/:id',
  '/api/notifications',
  '/api/inventory/stock',
  '/api/orders',
  '/api/orders/:id',
  '/api/orders/:id/items',
  '/api/analytics/dashboard',
  '/api/analytics/charts'
];

const ERROR_MESSAGES = {
  400: 'Invalid request parameters',
  401: 'Unauthorized - missing or invalid token',
  403: 'Forbidden - insufficient permissions',
  404: 'Resource not found',
  409: 'Conflict - resource already exists',
  500: 'Internal server error',
  502: 'Bad gateway - service unavailable',
  503: 'Service temporarily unavailable',
  504: 'Gateway timeout'
};

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random element from an array
 */
function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate a single fake log entry
 */
export function generateFakeLog() {
  const method = randomElement(HTTP_METHODS);
  const statusCode = randomElement(STATUS_CODES);
  const service = randomElement(SERVICES);
  const endpoint = randomElement(ENDPOINTS);
  const duration = randomInt(10, 5000);
  const isError = statusCode >= 400;

  return {
    method,
    route: `http://localhost:5000${endpoint}`,
    statusCode,
    duration,
    serviceName: service,
    requestId: `req-${Math.random().toString(36).substr(2, 9)}`,
    responseSize: randomInt(100, 500000),
    errorMessage: isError ? ERROR_MESSAGES[statusCode] || 'Unknown error' : null,
    requestBody: method !== 'GET' ? {
      timestamp: Date.now(),
      userId: randomInt(1, 100),
      data: {
        sample: 'request data'
      }
    } : null,
    responseBody: {
      success: !isError,
      timestamp: Date.now(),
      data: isError ? null : { id: randomInt(1, 1000) }
    },
    details: {
      userAgent: 'Mozilla/5.0 (Demo)',
      ipAddress: `192.168.1.${randomInt(1, 255)}`,
      region: 'US-East'
    },
    timestamp: Date.now() - randomInt(0, 300000) // Within last 5 minutes
  };
}

/**
 * Generate multiple fake log entries
 * @param {number} count - Number of logs to generate (default 8)
 */
export function generateFakeLogs(count = 8) {
  const logs = [];
  for (let i = 0; i < count; i++) {
    logs.push(generateFakeLog());
  }
  // Sort by timestamp (newest first)
  return logs.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Generate demo logs with stats
 * Includes mix of successful and failed requests
 */
export function generateDemoLogs() {
  const count = randomInt(5, 10);
  return generateFakeLogs(count);
}
