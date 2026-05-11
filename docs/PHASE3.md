# Phase 3 Implementation: Reliability & Resilience

**Status:** ✅ COMPLETE  
**Focus:** Error handling, retry logic, circuit breakers, resource monitoring  
**Date:** February 2026  
**Version:** 2.0.0

---

## Overview

Phase 3 transforms the API Failure Visualizer into a production-grade resilient system with comprehensive error handling, automatic recovery mechanisms, and resource monitoring.

### What's New

- **Error Boundaries:** React component error boundary catches rendering errors
- **Retry Logic:** Automatic retries with exponential backoff for transient failures
- **Circuit Breaker:** Prevents cascading failures by blocking failing services
- **Connection Pooling:** Optimized database connections for high concurrency
- **Graceful Shutdown:** Clean shutdown of resources on termination signals
- **Memory Monitoring:** Automatic memory leak detection and warnings
- **Enhanced Health Checks:** Resilience feature status and diagnostics endpoints

---

## Components Added

### 1. Error Boundary Component (`client/components/ErrorBoundary.jsx`)

**Purpose:** Catches React rendering errors and prevents app crashes

**Features:**
- ✅ Catches component render errors
- ✅ Displays user-friendly fallback UI
- ✅ Error tracking with reporting (optional)
- ✅ Development error details
- ✅ Recovery actions (Try Again, Go Home, Reload)
- ✅ Error counting for persistence detection

**Integration:**

```jsx
// client/App.jsx
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <div className="app">
        {/* Your app content */}
      </div>
    </ErrorBoundary>
  );
}
```

**Error Reporting (Optional):**

```env
# In .env
REACT_APP_ERROR_TRACKING_URL=https://your-error-tracking-service.com/api/errors
```

**User Experience:**

When an error occurs:

```
😞

Something Went Wrong
The application encountered an unexpected error. 
Our team has been notified.

[Try Again] [Go Home] [Reload Page]

Error Details (shows in development only):
...stack trace...

Error ID: 1708850400000
```

### 2. Retry Logic (`server/utils/retry.js`)

**Purpose:** Automatic retry with exponential backoff for transient failures

**Features:**
- ✅ Configurable retry attempts (default: 3)
- ✅ Exponential backoff with jitter
- ✅ Timeout protection
- ✅ Retryable error detection
- ✅ Request-level and function-level wrappers
- ✅ Axios interceptor support

**Default Configuration:**

```javascript
{
  maxAttempts: 3,              // Retry up to 3 times
  initialDelayMs: 100,         // Start with 100ms
  maxDelayMs: 10000,           // Cap at 10s
  backoffMultiplier: 2,        // Double each time
  timeoutMs: 30000,            // Overall timeout
  retryableStatusCodes: [408, 429, 500, 502, 503, 504]
}
```

**Retry Sequence Example:**

```
Attempt 1: Fails immediately
Wait 100ms
Attempt 2: Fails
Wait 200ms (100 * 2)
Attempt 3: Fails
Wait 400ms (200 * 2)
Throw error after 3 attempts
```

**Usage Examples:**

**Basic Function Retry:**

```javascript
const { retryWithBackoff } = require('./utils/retry');

async function fetchUserData(userId) {
  return retryWithBackoff(
    () => axios.get(`/api/users/${userId}`),
    { maxAttempts: 3, initialDelayMs: 50 }
  );
}
```

**Higher-Order Function:**

```javascript
const { withRetry } = require('./utils/retry');

const fetchUsers = withRetry(
  async () => axios.get('/api/users'),
  { maxAttempts: 5 }
);

// Usage
const users = await fetchUsers();
```

**Axios Interceptor:**

```javascript
const { setupAxiosRetry } = require('./utils/retry');

const axiosInstance = axios.create();
setupAxiosRetry(axiosInstance, {
  maxAttempts: 3,
  initialDelayMs: 100
});

// Automatically retries on 5xx errors
```

**Retryable Errors:**

Automatically retried:
- `ECONNREFUSED` - Connection refused
- `ECONNRESET` - Connection reset
- `ETIMEDOUT` - Timeout
- `408` - Request Timeout
- `429` - Too Many Requests
- `500` - Internal Server Error
- `502` - Bad Gateway
- `503` - Service Unavailable
- `504` - Gateway Timeout

Not retried:
- `400` - Bad Request (client error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found

### 3. Circuit Breaker Pattern (`server/utils/circuitBreaker.js`)

**Purpose:** Prevents cascading failures by blocking requests to failing services

**States:**

```
CLOSED        OPEN          HALF_OPEN     CLOSED
(normal)  → (failing)   → (testing)   → (recovered)
normal      blocked     limited try    all good
 ops        new reqs      to test
```

**State Transitions:**

| State | Condition | Action |
|-------|-----------|--------|
| CLOSED | ≥ failure threshold | → OPEN |
| OPEN | Timeout reached | → HALF_OPEN |
| HALF_OPEN | ≥ success threshold | → CLOSED |
| HALF_OPEN | Any failure | → OPEN |

**Configuration:**

```javascript
{
  failureThreshold: 5,      // Open after 5 failures
  successThreshold: 2,      // Close after 2 successes
  timeout: 60000,           // Wait 60s before trying again
  resetTimeout: 30000       // Reset failure counter after 30s
}
```

**Usage:**

```javascript
const { manager } = require('./utils/circuitBreaker');

// Get or create circuit breaker
const breaker = manager.getOrCreate('external-api', {
  failureThreshold: 5,
  timeout: 60000
});

// Execute through circuit breaker
async function callExternalAPI() {
  return manager.execute('external-api', 
    () => axios.get('https://external-service.com/api'),
    { failureThreshold: 5 }
  );
}

// Check status
const status = manager.getAllStatus();
console.log(status);
// {
//   "external-api": {
//     state: "CLOSED",
//     failureCount: 0,
//     successCount: 0,
//     lastFailureTime: null
//   }
// }
```

**Visual Example:**

```
Normal Operation (CLOSED):
┌─────────────┐
│   Request   │  → Service responding normally
│   Succeeds  │  → failureCount = 0
└─────────────┘

Service Failures Start (CLOSED):
┌─────────────┐
│   Request   │  → Service errors
│   Fails     │  → failureCount: 0 → 1 → 2 → 3 → 4 → 5 [TRIGGER]
└─────────────┘

Circuit Opens (OPEN):
┌──────────────┐     ┌──────────────┐
│   Request    │ ──→ │    BLOCKED   │
│   Received   │     │  No response │
└──────────────┘     └──────────────┘

Wait for Timeout (OPEN → HALF_OPEN):
Time ────────────── [60s passed] ──→
State: OPEN              State: HALF_OPEN
                        (allow 1 test request)

Test Request (HALF_OPEN):
┌──────────────┐
│ Test Request │  → Success? successCount++ → CLOSED
│   Attempts   │  → Fails? → OPEN (retry later)
└──────────────┘
```

### 4. Connection Pooling (`server/database/database.js`)

**Purpose:** Manage database connections efficiently

**PostgreSQL Pool Configuration:**

```javascript
pool: {
  max: 20,           // Maximum connections in pool
  min: 2,            // Minimum connections to maintain
  acquire: 30000,    // Time to acquire connection (30s)
  idle: 10000,       // Connection idle timeout (10s)
  evict: 1000        // Evict stale connections every 1s
}
```

**Environment Variables:**

```env
DB_POOL_MAX=20
DB_POOL_MIN=2
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000
```

**Pool Status Monitoring:**

```javascript
const { getPoolStatus } = require('./database/database');

const status = getPoolStatus();
console.log(status);
// PostgreSQL Connection Pool:
// {
//   size: 20,        // Current connections
//   available: 18,   // Ready to use
//   idle: 18,        // Idle connections
//   acquired: 2,     // In-use connections
//   waiting: 0       // Waiting for connection
// }
```

**Connection Lifecycle:**

```
Pool created with min=2 connections
                    ↓
Request → Check available connection
           Yes? Use it
           No?  Wait (max 30s) or create new (up to max=20)
                    ↓
Request completes → Connection returned to pool
                    ↓
Idle >10s? → Connection closed
Actively used? → Stays in pool
                    ↓
New request needs connection? → Reuse idle connection
```

### 5. Graceful Shutdown (`server/server.js`)

**Purpose:** Clean resource cleanup on termination

**Signals Handled:**

- `SIGTERM` - Container orchestrator shutdown (Docker, Kubernetes)
- `SIGINT` - Ctrl+C in terminal
- `SIGHUP` - Terminal closed
- `uncaughtException` - Unhandled errors
- `unhandledRejection` - Unhandled promise rejections

**Shutdown Sequence:**

```
[1] Signal received (SIGTERM/SIGINT/etc)
    ↓
[2] Stop accepting new requests
    ├─ Close HTTP server (active requests finish)
    └─ Set 30-second timeout
    ↓
[3] Close database connections
    ├─ PostgreSQL: Drain connection pool
    └─ SQLite: Close file handle
    ↓
[4] Print memory report
    ├─ Heap usage
    ├─ Memory growth
    └─ Leak detection results
    ↓
[5] Exit process (code 0 = success, 1 = error)
```

**Timeout Protection:**

```
[Start shutdown] ──→ 30 seconds ──→ [Force exit]
Active connections finish gracefully within timeout
If timeout exceeded, process force exits
```

**Console Output Example:**

```
^C
📋 Received SIGINT, starting graceful shutdown...
✅ HTTP server closed
✅ Database connections closed

📊 Memory Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Process Memory:
  RSS (Resident Set):  45MB
  Heap Used:          28MB / 62MB (45.1%)
  External:           2MB

System Memory:
  System Usage:       22%
  Free Memory:        8192MB
  Total Memory:       10240MB

Trends:
  Leak Detected:      No ✓
  Avg Growth Rate:    0.15MB per check

Measurements:       12 samples collected
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛑 Server shutdown complete
```

### 6. Memory Monitoring (`server/utils/monitoring.js`)

**Purpose:** Detect memory leaks and high memory usage

**Features:**
- ✅ Continuous memory snapshots
- ✅ Memory leak detection algorithm
- ✅ Threshold warnings
- ✅ Growth rate tracking
- ✅ Garbage collection forcing
- ✅ Detailed diagnostics

**Thresholds:**

```
WARNING:  80% of heap → console.warn()
CRITICAL: 90% of heap → console.error()
RESTART:  95% of heap → Suggest restart
```

**Leak Detection Algorithm:**

```
Collect 5 recent measurements
Calculate heap growth in each interval
If growth >5MB in ALL intervals AND average >3MB
  → Potential leak detected
Else
  → Normal memory usage
```

**Enable Monitoring:**

```env
# In .env
ENABLE_MEMORY_MONITORING=true
MEMORY_CHECK_INTERVAL=30000  # Check every 30 seconds
```

**Monitoring Output:**

```
📊 Memory Monitoring started (interval: 30000ms)

[30s later]
📊 Memory Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Process Memory:
  RSS (Resident Set):  45MB
  Heap Used:          28MB / 62MB (45.1%)
  External:           2MB
  
System Memory:
  System Usage:       22%
  Free Memory:        8192MB
  Total Memory:       10240MB

Trends:
  Leak Detected:      No ✓
  Avg Growth Rate:    0.15MB per check
  Recent Change:      +0.25MB

Measurements:       5 samples collected
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**High Memory Warning:**

```
⚠️  WARNING: Heap memory at 82.5%.
Current: 51MB / 62MB

[Time passes...]

🚨 CRITICAL: Heap memory at 91.3%!
Available actions:
  1) Restart service
  2) Increase memory limit
  3) Debug memory leaks

[Time passes...]

🔴 DANGER: Memory critically high.
Service may crash soon.
```

**Leak Detection Alert:**

```
⚠️  Potential memory leak detected!
Average growth: 5.42MB per measurement

Monitor for 5+ minutes
Check for circular references
Review event listeners
Consider heap dump analysis
```

---

## New Health Check Endpoints

### `GET /health/resilience` — Resilience Status

Shows Phase 3 features and their status.

```bash
curl http://localhost:5000/health/resilience
```

Response:

```json
{
  "status": "resilience-check",
  "timestamp": "2026-02-25T10:30:00.000Z",
  "features": {
    "errorBoundary": "✅ Enabled (React frontend)",
    "circuitBreaker": "✅ Enabled (external APIs)",
    "retryLogic": "✅ Enabled (exponential backoff)",
    "gracefulShutdown": "✅ Enabled (SIGTERM/SIGINT)",
    "memoryMonitoring": "⚪ Disabled"
  },
  "circuitBreakers": {
    "external-api": {
      "state": "CLOSED",
      "failureCount": 0,
      "successCount": 0
    }
  },
  "memory": {
    "heapUsed": "28MB",
    "heapTotal": "62MB",
    "heapPercent": "45.1%",
    "status": "HEALTHY"
  },
  "retry": {
    "maxAttempts": 3,
    "initialDelay": "100ms",
    "maxDelay": "10s",
    "backoffMultiplier": 2
  }
}
```

### `GET /health/memory` — Memory Diagnostics

Detailed memory analysis for leak detection.

```bash
curl http://localhost:5000/health/memory
```

Response:

```json
{
  "status": "memory-diagnostics",
  "timestamp": "2026-02-25T10:30:00.000Z",
  "current": {
    "process": { "rss": 47185920, "heapUsed": 29360128, ... },
    "heap": {
      "usagePercent": 0.451,
      "usedMB": 28,
      "totalMB": 62,
      "externalMB": 2
    }
  },
  "growth": {
    "heapMB": 0.25,
    "rssMB": -0.5
  },
  "leakDetected": false,
  "avgGrowthRate": "0.15MB per measurement",
  "measurements": 12,
  "recommendations": ["Memory usage healthy"]
}
```

---

## Configuration Reference

### Environment Variables (Phase 3)

**Memory Monitoring:**

```env
ENABLE_MEMORY_MONITORING=false          # Enable/disable (default: false)
MEMORY_CHECK_INTERVAL=30000             # Check every 30s (milliseconds)
MEMORY_LEAK_DETECTION=true              # Leak detection (default: true)
```

**Database Pooling:**

```env
DB_POOL_MAX=20                          # Max connections in pool
DB_POOL_MIN=2                           # Min connections to maintain
DB_POOL_ACQUIRE=30000                   # Time to acquire (ms)
DB_POOL_IDLE=10000                      # Idle timeout (ms)
```

**Retry Configuration:**

```env
RETRY_MAX_ATTEMPTS=3                    # Number of retries
RETRY_INITIAL_DELAY_MS=100              # Initial wait
RETRY_MAX_DELAY_MS=10000                # Max wait (10s)
RETRY_BACKOFF_MULTIPLIER=2              # Exponential multiplier
```

**Circuit Breaker:**

```env
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5     # Failures to open
CIRCUIT_BREAKER_SUCCESS_THRESHOLD=2     # Successes to close
CIRCUIT_BREAKER_TIMEOUT=60000           # Wait before retry (60s)
CIRCUIT_BREAKER_RESET_TIMEOUT=30000     # Reset counter (30s)
```

---

## Testing Phase 3 Features

### Test Error Boundary (Frontend)

```javascript
// In any component during development
throw new Error("Test error boundary");

// Should see error UI with recovery options
```

### Test Circuit Breaker

```bash
# In another terminal, stop the server
# Then make requests to trigger circuit breaker

curl http://localhost:5000/logs
# Response: Circuit breaker OPEN (blocked)

# Wait 60 seconds for HALF_OPEN state
# Circuit will attempt recovery

# Start server again
# Circuit closes automatically on success
```

### Test Retry Logic

```bash
# Simulate transient failures
# Server responds with 503 (Service Unavailable)

# Automatic retry kicks in:
# Attempt 1: Fails with 503
# Wait 100ms
# Attempt 2: Fails with 503
# Wait 200ms
# Attempt 3: Succeeds! (or throws after 3 attempts)
```

### Test Graceful Shutdown

```bash
# Terminal 1: Start server
npm run dev:server

# Terminal 2: Send shutdown signal
kill -SIGTERM <PID>

# Observe:
# 1. Active requests complete
# 2. Database connections close
# 3. Memory report printed
# 4. Process exits cleanly
```

### Test Memory Monitoring

```env
# In .env
ENABLE_MEMORY_MONITORING=true
MEMORY_CHECK_INTERVAL=5000
```

```bash
# Start server
npm run dev:server

# Check memory endpoint
curl http://localhost:5000/health/memory | python -m json.tool

# Watch memory grow (or stay stable):
watch -n 5 'curl -s http://localhost:5000/health/memory | grep heapPercent'
```

---

## Best Practices

### 1. Error Boundaries

```jsx
// ✅ GOOD: Wrap at route/page level
<ErrorBoundary>
  <Dashboard />
</ErrorBoundary>

// ✅ GOOD: Wrap risky third-party components
<ErrorBoundary>
  <ThirdPartyWidget />
</ErrorBoundary>

// ❌ BAD: Wrapping everything makes debugging harder
// Use multiple boundaries strategically
```

### 2. Circuit Breakers

```javascript
// ✅ GOOD: Use for external API calls
manager.execute('payment-api', () => callPaymentService());

// ✅ GOOD: Different thresholds for different services
getOrCreate('fast-api', { failureThreshold: 10 });
getOrCreate('critical-api', { failureThreshold: 3 });

// ❌ BAD: Using circuit breaker for local functions
// Only use for network/external calls
```

### 3. Retry Logic

```javascript
// ✅ GOOD: Retry transient failures
retryWithBackoff(() => fetchFromTemporaryAPI());

// ✅ GOOD: Custom config for specific needs
retryWithBackoff(fn, { maxAttempts: 5, initialDelayMs: 50 });

// ❌ BAD: Retrying non-idempotent operations like mutations
// Only retry safe operations (GET, HEAD, etc.)
```

### 4. Resource Management

```javascript
// ✅ GOOD: Close connections on shutdown
process.on('SIGTERM', async () => {
  await db.close();
  await cache.disconnect();
  process.exit(0);
});

// ✅ GOOD: Monitor resource pools
setInterval(() => {
  const status = getPoolStatus();
  if (status.waiting > 10) {
    console.warn('Connection pool overloaded');
  }
}, 30000);

// ❌ BAD: Ignoring resource leaks
// Monitor and fix connection/memory leaks
```

---

## Migration from Phase 2

### No Breaking Changes

Phase 3 is fully backward compatible with Phase 2. All existing functionality works unchanged.

### Optional Enhancements

1. **Enable Memory Monitoring** (production):
   ```env
   ENABLE_MEMORY_MONITORING=true
   ```

2. **Use Circuit Breakers** for external APIs (recommended):
   ```javascript
   const { manager } = require('./utils/circuitBreaker');
   await manager.execute('service-name', () => externalCall());
   ```

3. **Wrap Components with Error Boundary** (recommended):
   ```jsx
   <ErrorBoundary>
     <App />
   </ErrorBoundary>
   ```

---

## Monitoring Integration

### Docker/Kubernetes

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: api-visualizer
spec:
  containers:
  - name: app
    livenessProbe:
      httpGet:
        path: /health/live
        port: 5000
      initialDelaySeconds: 10
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /health/ready
        port: 5000
    lifecycle:
      preStop:
        exec:
          command: ["/bin/sh", "-c", "sleep 30"]
```

### Monitoring Services

```javascript
// Prometheus metrics example
const registry = require('prom-client').register;

// Export circuit breaker state
app.get('/metrics', (req, res) => {
  const cbStatus = manager.getAllStatus();
  const breakers = Object.entries(cbStatus).map(([name, status]) => {
    return `circuit_breaker_state{name="${name}",state="${status.state}"} 1`;
  });
  res.send(breakers.join('\n'));
});
```

---

## Troubleshooting

### "Circuit breaker is OPEN"

**Problem:** Requests blocked by circuit breaker

**Solution:**
1. Check if service is down: `curl http://localhost:5000/health/ready`
2. Wait for timeout period (default: 60s)
3. Circuit automatically retries (HALF_OPEN state)
4. Once service recovers, circuit closes

### High Memory Usage

**Problem:** Heap at 85%+

**Steps:**
1. Check memory endpoint: `curl http://localhost:5000/health/memory`
2. Enable monitoring: `ENABLE_MEMORY_MONITORING=true`
3. Look for leak patterns in measurements
4. Review recent code changes
5. Consider memory profiling tools

### Slow Response Times

**Problem:** Requests timing out

**Check:**
1. Are retries happening? (Check logs for "Retry attempt")
2. Database pool exhausted? `getPoolStatus()` -> waiting > 0
3. External service down? Check circuit breaker status
4. Memory pressure? High heap usage causing gc?

---

## What's Next: Phase 4

Phase 4 will focus on **Deployment**:

- PostgreSQL database setup
- Vercel deployment configuration
- Render deployment configuration
- Docker containerization
- CI/CD pipeline integration
- Performance benchmarking

---

## Files Added/Modified

### New Files
- ✅ `client/components/ErrorBoundary.jsx` - Error boundary component
- ✅ `server/utils/retry.js` - Retry logic with exponential backoff
- ✅ `server/utils/circuitBreaker.js` - Circuit breaker pattern
- ✅ `server/utils/monitoring.js` - Memory monitoring and leak detection
- ✅ `PHASE3.md` - This file

### Modified Files
- ✅ `client/App.jsx` - Wrapped with ErrorBoundary
- ✅ `server/server.js` - Added graceful shutdown + memory monitoring
- ✅ `server/database/database.js` - Added connection pooling
- ✅ `server/routes/health.routes.js` - Added resilience endpoints
- ✅ `.env` - Added Phase 3 configuration variables

---

## Summary

Phase 3 adds production-grade reliability:

| Feature | Before | After |
|---------|--------|-------|
| Render errors | Crash whole app | Graceful fallback ✅ |
| Network failures | Fail immediately | Automatic retry ✅ |
| Cascading failures | Take down everything | Circuit breaker ✅ |
| Shutdown cleanup | None | Graceful shutdown ✅ |
| Memory leaks | Undetected | Automatic detection ✅ |
| Connection pool | Direct connections | Optimized pool ✅ |
| Monitoring | Limited | Comprehensive ✅ |

**Status:** Phase 3 complete and production-ready.

---

## Quick Reference

```bash
# Enable memory monitoring
ENABLE_MEMORY_MONITORING=true npm run dev:server

# Check resilience features
curl http://localhost:5000/health/resilience

# Check memory status
curl http://localhost:5000/health/memory

# Test graceful shutdown
Ctrl+C  # or kill -SIGTERM <PID>
```

---

## Resources

- [Error Boundaries - React Docs](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Exponential Backoff](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [Connection Pooling](https://en.wikipedia.org/wiki/Connection_pool)
- [Graceful Shutdown](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/#handling-signals)
- [Memory Profiling in Node.js](https://nodejs.org/en/docs/guides/simple-profiling/)

