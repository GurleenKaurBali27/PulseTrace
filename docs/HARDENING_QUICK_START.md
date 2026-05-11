# Server Hardening - Quick Start Guide

## Installation Complete ✅

All server hardening features have been installed and configured.

## Verify Installation

```bash
cd server
node verify-hardening.js
```

**Expected Output:**
- ✅ Dotenv Configuration
- ✅ DATABASE_URL Configuration  
- ✅ Express-rate-limit Package
- ✅ Zod Validation Schema
- ✅ Health Routes Configuration
- ✅ Rate Limiting Setup
- ✅ All 10 tests passed

## Start the Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## Test All Features

### 1. Test Health Endpoint

```bash
curl http://localhost:5000/health
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2024-02-25T10:30:45.123Z",
  "uptime": 42.156
}
```

### 2. Test Valid Log Submission

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
    "duration": 150,
    "serviceName": "user-service",
    "createdAt": "2024-02-25T10:30:45.123Z"
  }
}
```

### 3. Test Validation - Missing Required Field

```bash
curl -X POST http://localhost:5000/logs \
  -H "Content-Type: application/json" \
  -d '{
    "statusCode": 200
  }'
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

**Note:** `method` and `route` are required fields

### 4. Test Validation - Invalid HTTP Method

```bash
curl -X POST http://localhost:5000/logs \
  -H "Content-Type: application/json" \
  -d '{
    "method": "INVALID",
    "route": "http://localhost:5000/api/test",
    "statusCode": 200
  }'
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "method must be a valid HTTP method...",
  "details": [...]
}
```

**Valid methods:** GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS

### 5. Test Validation - Invalid Status Code

```bash
curl -X POST http://localhost:5000/logs \
  -H "Content-Type: application/json" \
  -d '{
    "method": "GET",
    "route": "http://localhost:5000/api/test",
    "statusCode": 999
  }'
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "statusCode must be <= 599"
}
```

**Valid range:** 100-599

### 6. Test Rate Limiting

Submit 101+ requests within 15 minutes (will fail on the 101st):

```bash
# Submit requests in a loop
for i in {1..105}; do
  echo "Request $i"
  curl -X POST http://localhost:5000/logs \
    -H "Content-Type: application/json" \
    -d '{
      "method": "GET",
      "route": "http://localhost:5000/api/test",
      "statusCode": 200
    }'
  sleep 0.5
done
```

**Response on 101st request (429 Too Many Requests):**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Too many log submissions. Maximum 100 requests per 15 minutes.",
  "retryAfter": 897
}
```

### 7. Skip Rate Limiting in Development

Edit `.env`:
```env
NODE_ENV=development
SKIP_RATE_LIMIT=true
```

Then restart: `npm run dev`

Now you can submit unlimited requests (for testing).

### 8. Test All Systems - Demo Script

```bash
cd server
npm run dev &  # Start server in background
sleep 2
node test-hardening-demo.js
```

This will demonstrate all features with real examples.

## Switch Database (SQLite → PostgreSQL)

### Development (SQLite - Default)
```env
DATABASE_URL=sqlite://./database.db
```

```bash
npm run dev
```

### Production (PostgreSQL)

1. **Update .env:**
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/api_visualizer
   DB_POOL_MAX=20
   DB_POOL_MIN=5
   ```

2. **Start server:**
   ```bash
   npm start
   ```

Or inline:
```bash
DATABASE_URL=postgresql://user:pass@db.example.com:5432/api_visualizer npm start
```

## Configuration Summary

### Required Fields for Log Submission
```json
{
  "method": "GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS",
  "route": "http://example.com/api/endpoint",
  "statusCode": 100-599
}
```

### Optional Fields
```json
{
  "duration": 150,
  "requestBody": {...},
  "responseBody": {...},
  "errorMessage": "Error message",
  "serviceName": "service-name",
  "requestId": "req-123",
  "responseSize": 1024,
  "details": {...},
  "timestamp": 1708864265123
}
```

### Environment Variables

**Database:**
```env
DATABASE_URL=sqlite://./database.db
POSTGRES_DB=api_visualizer
POSTGRES_USER=dev
POSTGRES_PASSWORD=dev123
POSTGRES_PORT=5432
```

**Connection Pool:**
```env
DB_POOL_MAX=20
DB_POOL_MIN=2
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000
```

**Rate Limiting:**
```env
SKIP_RATE_LIMIT=false      # false = enabled, true = disabled
```

**Server:**
```env
NODE_ENV=development
SERVER_PORT=5000
```

## Troubleshooting

### Issue: "Cannot GET /health"
**Solution:** Make sure server is running with `npm run dev`

### Issue: Rate limit not working
**Solution:** Check `SKIP_RATE_LIMIT=true` in .env (disable it for production)

### Issue: Validation not working
**Solution:** Ensure required fields `method`, `route`, and `statusCode` are provided

### Issue: Database connection error
**Solution:** 
- For SQLite: Ensure write permissions in server directory
- For PostgreSQL: Check DATABASE_URL and PostgreSQL is running

### Issue: GET /health returns error
**Solution:** Check server logs - may indicate database connection issue

## Files Modified

- ✅ `server/validation/logSchema.js` - Created: Zod validation schema
- ✅ `server/routes/logs.routes.js` - Updated: Added rate limiting and validation
- ✅ `server/routes/health.routes.js` - Updated: Added GET /health endpoint
- ✅ `server/verify-hardening.js` - Created: Verification script
- ✅ `server/test-hardening-demo.js` - Created: Demo script
- ✅ `server/package.json` - Updated: Added dependencies
- ✅ `.env` - Updated: Added SKIP_RATE_LIMIT variable
- ✅ `SERVER_HARDENING.md` - Created: Complete documentation

## Next Steps

1. ✅ Review `SERVER_HARDENING.md` for detailed documentation
2. ✅ Run `node verify-hardening.js` to verify setup
3. ✅ Test endpoints with curl or Postman
4. ✅ Switch to PostgreSQL for production
5. ✅ Deploy with confidence

## Support

- Full documentation: [SERVER_HARDENING.md](./SERVER_HARDENING.md)
- Verification script: `npm run verify-hardening` (after adding to scripts)
- Demo script: `node server/test-hardening-demo.js`

---

**All security hardening features are now active and production-ready! 🔒**
