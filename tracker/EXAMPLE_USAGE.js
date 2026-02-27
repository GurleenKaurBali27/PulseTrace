/**
 * Example: Basic Usage of api-failure-tracker
 * 
 * This demonstrates how users can use the tracker package:
 * const tracker = require('api-failure-tracker');
 * app.use(tracker({ serverUrl: '...' }));
 */

const express = require('express');
const tracker = require('./tracker');

const app = express();
app.use(express.json());

// ============================================
// Setup Tracker Middleware
// ============================================

app.use(tracker({
  serverUrl: 'http://localhost:5000',
  serviceName: 'my-app'
}));

// ============================================
// Example Routes
// ============================================

// Success endpoint
app.get('/api/users', (req, res) => {
  res.json({
    users: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ]
  });
});

// Success with ID parameter
app.get('/api/users/:id', (req, res) => {
  res.json({
    id: req.params.id,
    name: 'John Doe',
    email: 'john@example.com'
  });
});

// Error endpoint (will be tracked as 500)
app.get('/api/error', (req, res) => {
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Database connection failed'
  });
});

// Not found endpoint (will be tracked as 404)
app.get('/api/notfound', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Resource does not exist'
  });
});

// POST with body
app.post('/api/users', (req, res) => {
  res.status(201).json({
    id: 123,
    ...req.body,
    createdAt: new Date().toISOString()
  });
});

// ============================================
// Start Server
// ============================================

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n✅ Server running on port ${PORT}`);
  console.log(`📊 Tracker configured:`);
  console.log(`   - Server URL: http://localhost:5000`);
  console.log(`   - Service Name: my-app`);
  console.log(`\n🔗 Try these endpoints:`);
  console.log(`   GET    http://localhost:${PORT}/api/users`);
  console.log(`   GET    http://localhost:${PORT}/api/users/1`);
  console.log(`   GET    http://localhost:${PORT}/api/error`);
  console.log(`   GET    http://localhost:${PORT}/api/notfound`);
  console.log(`   POST   http://localhost:${PORT}/api/users`);
  console.log(`\n📝 Logs will be:`);
  console.log(`   1. Stored locally in: ./logs/tracker.log`);
  console.log(`   2. Sent to: http://localhost:5000/logs\n`);
});
