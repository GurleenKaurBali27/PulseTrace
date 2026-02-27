# CORS Configuration Documentation

## Overview
CORS (Cross-Origin Resource Sharing) has been configured across all services to allow secure cross-origin requests between the React client, WebSocket server, and Test API.

## Configuration Details

### 1. Main API Server (localhost:5000)
**File:** `server/app.js`

```javascript
const corsOptions = {
  origin: [
    "http://localhost:3000",    // React dev server (configured)
    "http://localhost:5173",    // Vite default dev server
    "http://localhost:4000"     // Test API server
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

**Allowed Origins:**
- ✅ `http://localhost:3000` - React development server (Vite configured port)
- ✅ `http://localhost:5173` - Vite default development port
- ✅ `http://localhost:4000` - Test API server

**Allowed Methods:** GET, POST, PUT, DELETE, PATCH, OPTIONS

**Credentials:** Enabled (allows cookies and auth headers)

---

### 2. WebSocket Server (Socket.io) (localhost:5000)
**File:** `server/socket.js`

```javascript
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:3000",    // React dev server
      "http://localhost:5173",    // Vite default dev server
      "http://localhost:4000"     // Test API server
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"]
});
```

**Allowed Origins:** Same as main API server

**Transports:** 
- WebSocket (primary)
- HTTP Long-Polling (fallback)

---

### 3. Test API Server (localhost:4000)
**File:** `testAPI/testAPI.js`

```javascript
const corsOptions = {
  origin: [
    "http://localhost:3000",    // React client
    "http://localhost:5173",    // Vite default
    "http://localhost:5000"     // Visualization server
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: true
};

app.use(cors(corsOptions));
```

**Allowed Origins:**
- ✅ `http://localhost:3000` - React client
- ✅ `http://localhost:5173` - Vite default
- ✅ `http://localhost:5000` - Visualization server

---

## Security Features

✅ **Specific Origin Whitelisting**
- Only explicitly defined origins are allowed
- More secure than `*` (all origins)

✅ **Credentials Support**
- Cookies and auth headers are supported
- Required for authentication workflows

✅ **Method Restrictions**
- Only necessary HTTP methods are allowed
- Prevents unintended operations

✅ **Header Filtering**
- Only required headers are allowed
- Content-Type and Authorization supported

---

## Request Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    React Client                            │
│                 (localhost:3000 or 5173)                   │
└──────────────┬──────────────────────────┬──────────────────┘
               │                          │
        HTTP Requests              WebSocket
               │                          │
               ▼                          ▼
         ┌──────────────┐          ┌──────────────┐
         │  API Server  │          │ Socket.io    │
         │ (localhost   │◄────────►│ (localhost   │
         │    :5000)    │          │    :5000)    │
         └──────────────┘          └──────────────┘
               ▲
               │
        Tracked Requests
               │
         ┌──────────────┐
         │  Test API    │
         │ (localhost   │
         │    :4000)    │
         └──────────────┘
         + Tracker Middleware
         + Request Capture
         + Log Transmission
```

---

## Environment-Specific Configuration

### Development
- ✅ Multiple ports supported (3000, 5173, 4000)
- ✅ Flexible for different development workflows
- ✅ Full credentials and header support

### Production Notes
**To update for production:**

1. **Update `server/app.js`:**
```javascript
origin: [
  "https://yourdomain.com",
  "https://www.yourdomain.com"
]
```

2. **Update `server/socket.js`:**
```javascript
origin: [
  "https://yourdomain.com"
]
```

3. **Update `testAPI/testAPI.js`:**
```javascript
origin: [
  "https://yourdomain.com",
  "https://api.yourdomain.com"
]
```

---

## Testing CORS Configuration

Run the CORS verification test:
```bash
node test-cors-config.js
```

**Expected Output:**
```
  Testing origin: http://localhost:3000
  ✅ Status: 200
     CORS Allow: http://localhost:3000
     Credentials: true

  Testing origin: http://localhost:5173
  ✅ Status: 200
     CORS Allow: http://localhost:5173
     Credentials: true

  Testing origin: http://localhost:4000
  ✅ Status: 200
     CORS Allow: http://localhost:4000
     Credentials: true
```

---

## Common Issues & Solutions

### Issue: CORS allows specific origin but browser still blocks requests
**Solution:** Ensure the exact origin (including protocol and port) matches. For example:
- ❌ `http://localhost:3000/` (with trailing slash)
- ✅ `http://localhost:3000` (no trailing slash)

### Issue: Credentials not being sent with requests
**Solution:** In client code, ensure requests include credentials:
```javascript
axios.get("/logs", { withCredentials: true })
```

### Issue: Socket.io connection fails from specific origin
**Solution:** Verify that Socket.io CORS in `server/socket.js` includes the origin and matches the API server CORS.

---

## Package Dependencies

- **`cors`** - CORS middleware for Express
- **`socket.io`** - WebSocket library (includes CORS support)
- **`axios`** - HTTP client (React) - use `withCredentials: true`
- **`socket.io-client`** - WebSocket client (React)

---

## Summary

✅ **Server CORS** - Configured to accept requests from all dev origins + credentials  
✅ **Socket.io CORS** - Configured to accept WebSocket connections from all origins  
✅ **Test API CORS** - Configured to accept requests from client and server  
✅ **Credentials Enabled** - Authentication headers supported across all services  
✅ **Method Restrictions** - Only necessary HTTP methods allowed  
✅ **Production Ready** - Easy to update origins for deployment  

All services are properly configured for secure cross-origin communication!
