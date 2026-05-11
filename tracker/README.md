# API Failure Tracker

Express middleware to track API requests and responses for local development observability. Captures detailed metrics and sends them to a visualization server for real-time debugging and monitoring.

## Features

- 📊 **Real-time Tracking** - Captures all API requests/responses
- 🚀 **Request Details** - Method, route, status code, duration, headers, body, query params
- ⏱️ **Performance Metrics** - Automatically measures request duration
- 🛡️ **Error Tracking** - Identifies and logs HTTP errors (4xx, 5xx)
- 🔄 **Non-blocking** - Sends logs asynchronously without slowing requests
- 🔁 **Retry Logic** - Automatically retries failed log submissions
- 📝 **Local Logging** - Stores logs locally for offline reference
- 🔐 **Multi-service** - Track multiple services with different identifiers

## Installation

### install from npm

```bash
npm install api-failure-tracker
```

### Peer Dependencies

This package requires Express.js as a peer dependency. Make sure you have it installed:

```bash
npm install express
```

## Basic Usage

### Quick Start

```javascript
const express = require('express');
const tracker = require('api-failure-tracker');

const app = express();

// Use the tracker middleware
app.use(tracker({
  serverUrl: 'http://localhost:5000',
  serviceName: 'my-service'
}));

// Your routes here
app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### With Demo Data

If you're using the API Failure Visualizer, you can generate demo data:

```javascript
const express = require('express');
const tracker = require('api-failure-tracker');

const app = express();

app.use(express.json());
app.use(tracker({
  serverUrl: 'http://localhost:5000',
  serviceName: 'demo-service'
}));

// Simulate an API failure
app.get('/api/error', (req, res) => {
  res.status(500).json({ 
    error: 'Database connection failed',
    timestamp: new Date().toISOString()
  });
});

// Success endpoint
app.get('/api/success', (req, res) => {
  res.json({ 
    message: 'Request successful',
    data: [1, 2, 3]
  });
});

app.listen(3000);
```

## Configuration Options

### Options Object

```javascript
const options = {
  serverUrl: 'http://localhost:5000',    // URL of visualization server
  serviceName: 'my-service'              // Identifier for this service
};

app.use(tracker(options));
```

#### `serverUrl` (string)
- **Default:** `'http://localhost:5000'`
- **Description:** Base URL of the API Failure Visualizer server where logs are sent
- **Example:** `'http://localhost:5000'` or `'http://192.168.1.100:5000'`

#### `serviceName` (string)
- **Default:** `'default-service'`
- **Description:** Name to identify this service in the visualization dashboard
- **Example:** `'auth-service'`, `'user-api'`, `'payment-service'`

### Backward Compatibility

For backward compatibility, you can pass a string as the first argument (treated as `serverUrl`):

```javascript
// Old format (still works)
app.use(tracker('http://localhost:5000'));

// New format (recommended)
app.use(tracker({
  serverUrl: 'http://localhost:5000',
  serviceName: 'my-service'
}));
```

## What Gets Tracked

### Captured Request Data
- HTTP method (GET, POST, PUT, DELETE, etc.)
- URL path and query parameters
- Request headers
- Request body
- Client IP address
- User-Agent string
- Content type

### Captured Response Data
- HTTP status code
- Response headers
- Response body
- Response size (bytes)
- Request duration (milliseconds)

### Error Tracking
- Automatically flags 4xx and 5xx status codes as errors
- Captures full error context
- Includes request and response bodies for debugging

## Logging

### Local Logs

Logs are stored in the `logs/` directory:

```
tracker/
└── logs/
    └── tracker.log
```

View local logs for debugging:

```bash
cat logs/tracker.log
```

### Server Logs

All logs are also sent to the API Failure Visualizer server at:

```
POST {serverUrl}/logs
```

## Multi-Service Setup

Track multiple services simultaneously in the same dashboard:

**Service 1 (auth-service):**
```javascript
app.use(tracker({
  serverUrl: 'http://localhost:5000',
  serviceName: 'auth-service'
}));
```

**Service 2 (api-service):**
```javascript
app.use(tracker({
  serverUrl: 'http://localhost:5000',
  serviceName: 'api-service'
}));
```

All logs from different services will be aggregated in the visualization dashboard with clear service identification.

## Advanced Usage

### With API Failure Visualizer

The tracker is designed to work with [API Failure Visualizer](https://github.com/GurleenKaurBali27/api-failure-visualizer). Install both:

```bash
npm install api-failure-tracker
npm install -g api-failure-visualizer  # or npm install as dev dependency
```

Then start the visualization server:

```bash
npm run dev  # In the visualizer's server directory
```

In your Express app:

```javascript
const tracker = require('api-failure-tracker');

app.use(tracker({
  serverUrl: 'http://localhost:5000',
  serviceName: 'my-service'
}));
```

### Error Handling

Logs are sent asynchronously with automatic retry logic:

- **Retries:** 3 attempts
- **Timeout:** 5 seconds per attempt
- **Backoff:** Exponential (100ms, 200ms, 400ms)
- **Non-blocking:** Failed sends don't affect request responses

If the server is unavailable, logs are still stored locally.

### Performance Considerations

- **Minimal overhead:** Request duration includes tracking overhead (typically <1ms)
- **Async operations:** Log sending doesn't block responses
- **Memory efficient:** Response bodies are capped at 1000 characters
- **Batching:** Each request creates one log entry

## Security

### Sensitive Data

By default, sensitive headers are sanitized:
- `authorization`
- `cookie`
- `x-api-key`
- `x-auth-token`
- `x-access-token`

These headers are non-blocked but you can verify the implementation in `tracker.js`.

### HTTPS

For production, use HTTPS server URLs:

```javascript
app.use(tracker({
  serverUrl: 'https://observability.example.com',
  serviceName: 'api-service'
}));
```

## Troubleshooting

### Logs Not Appearing

1. **Check Visualization Server**
   ```bash
   curl http://localhost:5000/health
   ```

2. **Verify Configuration**
   ```javascript
   console.log('Tracker configured for:', serverUrl, serviceName);
   ```

3. **Check Local Logs**
   ```bash
   tail -f logs/tracker.log
   ```

### High Memory Usage

If memory usage is high:
- Large response bodies (>1000 chars) are truncated
- Local logs can be rotated manually
- Consider running visualizer on separate machine

### Network Errors

The middleware retries failed submissions:
- Check server connectivity: `ping localhost:5000`
- Verify firewall rules
- Check server logs for errors

## Examples

### Example 1: Basic REST API

```javascript
const express = require('express');
const tracker = require('api-failure-tracker');

const app = express();
app.use(express.json());

app.use(tracker({
  serverUrl: 'http://localhost:5000',
  serviceName: 'rest-api'
}));

app.get('/api/users/:id', (req, res) => {
  // Tracking automatically captures this request
  res.json({ id: req.params.id, name: 'John' });
});

app.post('/api/users', (req, res) => {
  // Tracking captures request body and response
  res.status(201).json({ id: 123, ...req.body });
});

app.listen(3000);
```

### Example 2: Multiple Services in Monorepo

```javascript
// services/auth/server.js
const tracker = require('api-failure-tracker');
app.use(tracker({ 
  serverUrl: 'http://localhost:5000',
  serviceName: 'auth-service' 
}));

// services/api/server.js
const tracker = require('api-failure-tracker');
app.use(tracker({ 
  serverUrl: 'http://localhost:5000',
  serviceName: 'api-service' 
}));

// services/payment/server.js
const tracker = require('api-failure-tracker');
app.use(tracker({ 
  serverUrl: 'http://localhost:5000',
  serviceName: 'payment-service' 
}));
```

### Example 3: Gateway with Service Name from Header

```javascript
const tracker = require('api-failure-tracker');

app.use((req, res, next) => {
  // Extract service name from header or routing
  const serviceName = req.headers['x-service-name'] || 'gateway';
  
  tracker({
    serverUrl: 'http://localhost:5000',
    serviceName: serviceName
  })(req, res, next);
});
```

## API Reference

### tracker(options)

Returns an Express middleware function.

**Parameters:**
- `options` (string | object)
  - If string: treated as `serverUrl`
  - If object:
    - `serverUrl` (string): Server URL
    - `serviceName` (string): Service identifier

**Returns:** Express middleware function

**Example:**
```javascript
// As middleware
const middleware = tracker({ serverUrl: 'http://localhost:5000' });
app.use(middleware);

// Or directly
app.use(tracker({ serverUrl: 'http://localhost:5000' }));
```

## Browser Extension (Optional)

View logs in real-time using the companion browser extension (coming soon).

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT - See LICENSE file for details

## Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the [main project](https://github.com/GurleenKaurBali27/api-failure-visualizer)

## Related Packages

- **[api-failure-visualizer](https://github.com/GurleenKaurBali27/api-failure-visualizer)** - Server & dashboard for visualizing tracked logs

## Changelog

### 1.0.0
- Initial release
- Express middleware for request/response tracking
- Multi-service support with service naming
- Local and remote log storage
- Retry logic for robust submission
- Automatic error detection (4xx, 5xx)
