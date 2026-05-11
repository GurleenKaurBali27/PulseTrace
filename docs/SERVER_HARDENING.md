# Server Hardening Guide

This document details all security and validation improvements implemented to harden the API Failure Visualizer server.

## Features Implemented

### 1. **Dotenv Configuration** ✅

**Status:** Already configured in `server/server.js`

The server loads environment variables from a `.env` file at startup using `dotenv`.

```javascript
// Automatically loaded at the top of server.js
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
```

**Benefits:**
- Secure environment variable management
- Different configurations per environment (dev/staging/prod)
- No hardcoded credentials in source code

---

### 2. **DATABASE_URL Support** ✅

**Status:** Fully configured in `server/database/database.js`

Switch between SQLite (development) and PostgreSQL (production) using the `DATABASE_URL` environment variable.

#### SQLite (Development)
```env
DATABASE_URL=sqlite://./database.db
```

#### PostgreSQL (Production)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/api_visualizer
```

**Configuration in database.js:**
```javascript
const dbUrl = process.env.DATABASE_URL || "sqlite://./database.db";
const dbType = dbUrl.split("://")[0];

if (dbType === "postgresql") {
  // PostgreSQL configuration with connection pooling
  sequelizeConfig = {
    dialect: "postgres",
    pool: {
      max: 20,           // Max connections
      min: 2,            // Min connections
      acquire: 30000,    // Connection acquisition timeout
      idle: 10000        // Idle connection timeout
    }
  };
} else if (dbType === "sqlite") {
  // SQLite configuration
  sequelizeConfig = {
    dialect: "sqlite",
    storage: "./database.db"
  };
}
```

**Related Environment Variables:**
```env
# Database Connection
DATABASE_URL=sqlite://./database.db

# PostgreSQL Specific (when using PostgreSQL)
POSTGRES_DB=api_visualizer
POSTGRES_USER=dev
POSTGRES_PASSWORD=dev123
POSTGRES_PORT=5432

# Connection Pool Settings
DB_POOL_MAX=20         # Maximum connections
DB_POOL_MIN=2          # Minimum connections
DB_POOL_ACQUIRE=30000  # Acquire timeout (ms)
DB_POOL_IDLE=10000     # Idle timeout (ms)
```

**Switching Databases:**

*Development (SQLite):*
```bash
DATABASE_URL=sqlite://./database.db npm run dev
```

*Production (PostgreSQL):*
```bash
DATABASE_URL=postgresql://user:pass@db.example.com:5432/api_visualizer npm start
```

---

### 3. **Rate Limiting on /api/logs** ✅

**Status:** Implemented in `server/routes/logs.routes.js`

Prevents spam and DDoS attacks on the log submission endpoint.

**Configuration:**
- **Limit:** 100 requests per IP
- **Window:** 15 minutes
- **Status Code:** 429 (Too Many Requests)

**Implementation:**
```javascript
const logRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                    // 100 requests per windowMs
  message: "Too many logs created from this IP, please try again later.",
  statusCode: 429,
  keyGenerator: (req) => {
    // Support for proxies and load balancers
    return (req.headers["x-forwarded-for"] || req.ip || "unknown")
      .split(",")[0]
      .trim();
  }
});

router.post("/", logRateLimiter, async (req, res) => {
  // Handle log creation
});
```

**Response on Rate Limit Exceeded:**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Too many log submissions. Maximum 100 requests per 15 minutes.",
  "retryAfter": 45
}
```

**Skip Rate Limiting in Development:**
```env
# In .env file
NODE_ENV=development
SKIP_RATE_LIMIT=true
```

---

### 4. **GET /health Endpoint** ✅

**Status:** Implemented in `server/routes/health.routes.js`

Simple health check endpoint that returns 200 status and current timestamp.

**Endpoint:** `GET /health`

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2024-02-25T10:30:45.123Z",
  "uptime": 3456.78
}
```

**Additional Health Endpoints:**

- **GET /health/live** - Liveness probe (service running?)
- **GET /health/ready** - Readiness probe (all systems ready?)
- **GET /health/detailed** - Full system diagnostics

**Usage in Containers:**
Docker health checks can use this endpoint:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1
```

---

### 5. **Request Validation with Zod** ✅

**Status:** Implemented in `server/validation/logSchema.js`

Validates incoming logs from the tracker before saving to the database.

**Required Fields:**
- `method` - HTTP method (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
- `route` - API endpoint route (valid URL)
- `statusCode` - HTTP status code (100-599)

**Optional Fields:**
- `duration` - Request duration in milliseconds (default: 0)
- `requestBody` - Request payload (default: null)
- `responseBody` - Response payload (default: null)
- `errorMessage` - Error message if failed (default: null)
- `serviceName` - Service name (default: "unknown-service")
- `requestId` - Request identifier (default: null)
- `responseSize` - Response size in bytes (default: 0)
- `details` - Additional metadata object (default: {})
- `timestamp` - Unix timestamp (default: current time)

**Schema Definition:**
```javascript
const logSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]),
  route: z.string()
    .min(1, "route cannot be empty")
    .max(500)
    .url("route must be a valid URL"),
  statusCode: z.number()
    .int()
    .min(100)
    .max(599),
  duration: z.number().int().min(0).optional().default(0),
  serviceName: z.string().min(1).max(100).optional().default("unknown-service"),
  // ... other fields
});
```

**Valid Request Example:**
```javascript
POST /logs
Content-Type: application/json

{
  "method": "GET",
  "route": "http://localhost:5000/api/users",
  "statusCode": 200,
  "duration": 125,
  "serviceName": "user-service"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Log created successfully",
  "data": {
    "id": 1,
    "method": "GET",
    "route": "http://localhost:5000/api/users",
    "statusCode": 200,
    "duration": 125,
    "serviceName": "user-service",
    "createdAt": "2024-02-25T10:30:45.123Z"
  }
}
```

**Invalid Request Example (Missing Required Field):**
```javascript
POST /logs
Content-Type: application/json

{
  // Missing 'method' and 'route'
  "statusCode": 200
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "Required",
  "details": [
    {
      "path": "method",
      "message": "Required"
    },
    {
      "path": "route",
      "message": "Required"
    }
  ]
}
```

**Validation Examples:**

```javascript
const { validateLog } = require("./validation/logSchema");

// Valid log
const result = await validateLog({
  method: "POST",
  route: "http://api.example.com/login",
  statusCode: 401,
  duration: 250,
  errorMessage: "Invalid credentials"
});
// Returns: { success: true, data: {...} }

// Invalid HTTP method
const invalid = await validateLog({
  method: "INVALID",
  route: "http://api.example.com/test",
  statusCode: 200
});
// Returns: { success: false, error: "Invalid option: expected one of..." }

// Invalid status code
const badStatus = await validateLog({
  method: "GET",
  route: "http://api.example.com/test",
  statusCode: 999
});
// Returns: { success: false, error: "statusCode must be <= 599" }
```

---

## Verification

Run the hardening verification script to test all features:

```bash
cd server
node verify-hardening.js
```

**Expected Output:**
```
🔒 Server Hardening Verification

Test 1: Dotenv Configuration
✅ Dotenv loaded successfully

Test 2: DATABASE_URL Configuration
✅ DATABASE_URL configured (supports SQLite & PostgreSQL)

Test 3: Express-rate-limit Package
✅ express-rate-limit package installed

Test 4: Zod Validation Schema
✅ Valid log accepted

Test 5: Validation Schema - Reject Invalid Data
✅ Invalid method correctly rejected

Test 6: Health Routes Configuration
✅ Simple GET /health endpoint configured

Test 7: Logs Routes - Rate Limiting Setup
✅ Rate limiting middleware configured

Test 8: Validation Schema File
✅ Validation schema file created

Test 9: Validation Schema - Required Fields
✅ Missing 'method' field correctly rejected

Test 10: Rate Limiting Configuration
✅ SKIP_RATE_LIMIT environment variable configured

==================================================
Tests Passed: 10
Tests Failed: 0
==================================================

🎉 All hardening features verified successfully!
```

---

## Testing Endpoints

### Test Health Endpoint
```bash
curl -X GET http://localhost:5000/health
```

### Test Rate Limiting (Submit 101+ logs within 15 minutes to trigger)
```bash
for i in {1..105}; do
  curl -X POST http://localhost:5000/logs \
    -H "Content-Type: application/json" \
    -d '{
      "method": "GET",
      "route": "http://localhost:5000/api/test",
      "statusCode": 200
    }'
done
```

### Test Validation - Valid Log
```bash
curl -X POST http://localhost:5000/logs \
  -H "Content-Type: application/json" \
  -d '{
    "method": "GET",
    "route": "http://localhost:5000/api/users",
    "statusCode": 200,
    "duration": 150,
    "serviceName": "user-service"
  }'
```

### Test Validation - Invalid Log (Missing Required Fields)
```bash
curl -X POST http://localhost:5000/logs \
  -H "Content-Type: application/json" \
  -d '{
    "duration": 150
  }'
```

---

## Environment Configuration

**Key Variables for Hardening:**

```env
# Server & Dotenv
NODE_ENV=development
SERVER_PORT=5000

# Database Selection
DATABASE_URL=sqlite://./database.db
# For PostgreSQL: DATABASE_URL=postgresql://user:pass@localhost:5432/api_visualizer

# Connection Pool (PostgreSQL)
DB_POOL_MAX=20
DB_POOL_MIN=2
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000

# Rate Limiting
# Default: false (rate limiting enabled)
# Set to true in dev to skip rate limiting for testing
SKIP_RATE_LIMIT=false

# PostgreSQL Credentials (if using PostgreSQL)
POSTGRES_DB=api_visualizer
POSTGRES_USER=dev
POSTGRES_PASSWORD=dev123
POSTGRES_PORT=5432
```

---

## Production Deployment

### Switching to PostgreSQL in Production

1. **Update DATABASE_URL:**
   ```bash
   export DATABASE_URL="postgresql://user:secure_password@db.example.com:5432/api_visualizer"
   ```

2. **Configure Connection Pool:**
   ```bash
   export DB_POOL_MAX=20
   export DB_POOL_MIN=5
   export DB_POOL_ACQUIRE=30000
   ```

3. **Enable Rate Limiting:**
   ```bash
   export SKIP_RATE_LIMIT=false  # Keep rate limiting enabled
   ```

4. **Start Server:**
   ```bash
   npm start
   ```

### Docker Deployment

```dockerfile
# Dockerfile already configured to support both databases
FROM node:18-alpine
ENV DATABASE_URL=postgresql://user:pass@postgres:5432/api_visualizer
ENV SKIP_RATE_LIMIT=false
RUN npm install
CMD ["npm", "start"]
```

---

## Security Best Practices

✅ **Implemented:**
- Environment variable validation with dotenv
- Database credentials stored in .env (not in code)
- Rate limiting to prevent DDoS/spam
- Input validation with Zod to prevent injection attacks
- Health checks for service availability
- Connection pooling for database efficiency
- Support for both SQLite (dev) and PostgreSQL (prod)

📋 **Additional Recommendations:**
- Use HTTPS in production
- Implement authentication/authorization
- Add CORS validation for allowed origins
- Monitor rate limit metrics
- Set up database backups
- Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- Enable database SSL/TLS connections
- Implement request signing (HMAC/JWT)
- Add request/response logging for audit trails
- Set up APM monitoring (DataDog, New Relic, etc.)

---

## Troubleshooting

### Rate Limiting Not Working
**Problem:** Logs are being accepted beyond the 100 request limit

**Solution:**
- Check `SKIP_RATE_LIMIT` environment variable
- Verify middleware is applied to the POST route
- Check for proxy headers (X-Forwarded-For)

### Database Connection Errors
**Problem:** Cannot connect to PostgreSQL

**Solution:**
- Verify `DATABASE_URL` format
- Check PostgreSQL credentials
- Ensure database is running and accessible
- Review connection pool settings

### Validation Errors
**Problem:** Valid logs are being rejected

**Solution:**
- Verify all required fields are present (method, route, statusCode)
- Check HTTP method is uppercase
- Ensure route is a valid URL
- Verify statusCode is between 100-599

### Health Endpoint Not Responding
**Problem:** 404 error on /health

**Solution:**
- Verify server is running (`npm run dev`)
- Check routes are mounted in app.js
- Ensure SERVER_PORT is correct

---

## Files Modified/Created

**Created:**
- `server/validation/logSchema.js` - Zod validation schema
- `server/verify-hardening.js` - Verification script

**Modified:**
- `server/routes/logs.routes.js` - Added rate limiting and validation
- `server/routes/health.routes.js` - Added simple /health endpoint
- `server/package.json` - Added express-rate-limit and zod
- `.env` - Added SKIP_RATE_LIMIT configuration

---

## Support

For issues or questions:
1. Run `node server/verify-hardening.js` to verify setup
2. Check logs: `tail -f server.log`
3. Review environment variables: `npm run dev -- --env`
4. Check database connection: `curl http://localhost:5000/health/ready`
