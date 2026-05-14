# 🚀 Getting Started - Run Everything

Quick instructions to get the full API Failure Visualizer running with all improvements.

## Prerequisites

- Node.js 18+ installed
- npm installed
- Terminal/PowerShell access

## One-Command Setup (Recommended)

### Windows PowerShell

```powershell
# From root project directory
# Terminal 1: Run server
cd server; npm install; npm run dev

# Terminal 2: Run client (in new terminal)
cd client; npm install; npm run dev

# Open http://localhost:5173 in browser
# Click "🎬 Demo Mode" to show sample data
```

### macOS/Linux

```bash
# Terminal 1: Run server
cd server && npm install && npm run dev

# Terminal 2: Run client (in new terminal)
cd client && npm install && npm run dev

# Open http://localhost:5173 in browser
# Click "🎬 Demo Mode" to show sample data
```

---

## Step-by-Step Setup

### Step 1: Install Server Dependencies

```bash
cd server
npm install
```

**What gets installed:**
- Express.js - API framework
- Sequelize - Database ORM
- Zod - Input validation
- express-rate-limit - Rate limiting
- pg - PostgreSQL driver
- And more...

### Step 2: Verify Server Hardening

```bash
npm run verify
```

**Expected Output:**
```
✅ Test 1-10: All tests pass
🎉 All hardening features verified successfully!
```

### Step 3: Start Server

```bash
npm run dev
```

**Expected Output:**
```
✅ Server running on http://localhost:5000
✅ Database connected
📊 Health check available at http://localhost:5000/health
```

**Keep this terminal running!**

---

### Step 4: Open New Terminal - Install Client Dependencies

```bash
cd client
npm install
```

**What gets installed:**
- React 18 - UI framework
- Vite - Build tool
- Axios - HTTP client
- Socket.io - Real-time communication
- And more...

### Step 5: Verify Client Improvements

```bash
npm run verify
```

**Expected Output:**
```
✅ Test 1-6: All tests pass
🎉 All client-side improvements verified successfully!
```

### Step 6: Start Client Dev Server

```bash
npm run dev
```

**Expected Output:**
```
VITE v4.4.5  ready in 234 ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

---

## Test Everything Works

### 1. Open Dashboard

```
Open browser: http://localhost:5173
```

You should see:
- Dashboard header: "Request Tracker Dashboard"
- "🎬 Demo Mode" button (top right)
- Empty or real logs list

### 2. Test Demo Mode

Click the **"🎬 Demo Mode"** button:
- Button changes to gray "✕ Clear Demo"
- Blue banner appears: "🎬 Demo Mode Active"
- 5-10 sample logs appear in the table
- Each log has realistic failure data

### 3. Click on a Log Entry

Click any row to see:
- Full request/response details
- Error messages (if failed)
- Response body
- Duration and size

### 4. Clear Demo and Return to Real Logs

Click **"✕ Clear Demo"** button:
- Demo logs removed
- Real logs loaded (or empty if no real logs)
- Button returns to "🎬 Demo Mode"

### 5. Test Health Endpoint

```bash
# In another terminal or check browser Network tab
curl http://localhost:5000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-02-25T10:30:45.123Z",
  "uptime": 42.156
}
```

### 6. Test API Validation

```bash
# Invalid request (missing required field)
curl -X POST http://localhost:5000/logs \
  -H "Content-Type: application/json" \
  -d '{"statusCode":200}'
```

Response: 400 Bad Request with validation errors

---

## Verify All Components

### Server Verification

```bash
cd server
npm run verify
```

Expected:
- ✅ 10/10 tests pass
- Covers: dotenv, database, rate-limit, validation, health, etc.

### Client Verification

```bash
cd client
npm run verify
```

Expected:
- ✅ 6/6 tests pass
- Covers: Axios, demo mode, error boundary, dependencies

### Both at Once

```bash
cd server && npm run verify && cd ../client && npm run verify
```

Expected: 16/16 tests pass ✅

---

## Environment Configuration

### Server .env (if customizing)

```env
# Already configured, but can customize:
NODE_ENV=development
SERVER_PORT=5000
DATABASE_URL=sqlite://./database.db
SKIP_RATE_LIMIT=false
```

### Client .env.local (if needed)

```env
VITE_API_URL=http://localhost:5000
```

---

## Common Commands Reference

### Server Commands

```bash
cd server

npm run dev              # Start with auto-reload (nodemon)
npm start               # Start production
npm run verify          # Verify hardening (10 tests)
npm run test-demo       # Run demo script
npm run migrate         # Run database migrations
```

### Client Commands

```bash
cd client

npm run dev             # Start dev server with hot reload
npm run build           # Build for production
npm run preview         # Preview production build
npm run verify          # Verify improvements (6 tests)
```

---

## What's Running

### Server (Port 5000)

- Express API server
- Sequelize database access
- Health check endpoints
- Rate limiting middleware
- Request validation
- WebSocket support

**Endpoints:**
- `GET /health` - Simple health check
- `GET /logs` - Fetch all logs
- `POST /logs` - Create log (with rate limiting)
- `GET /health/live`, `/health/ready`, `/health/detailed`

### Client (Port 5173)

- React application (Vite)
- Hot module reloading
- Axios HTTP client
- Error boundary
- Demo mode generator
- Real-time updates (Socket.io)

**Features:**
- Dashboard view
- Request table with filtering
- Request detail modal
- Demo mode button
- Error handling

---

## Troubleshooting

### Issue: "Cannot connect to database"

**Solutions:**
1. Verify `DATABASE_URL` in `.env`
2. Ensure SQLite file can be written
3. Or use PostgreSQL with valid connection string

### Issue: "Port 5000 already in use"

**Solution:**
```bash
# Change port in .env
SERVER_PORT=5001

# Or kill existing process
# macOS/Linux:
lsof -ti:5000 | xargs kill -9

# Windows:
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
```

### Issue: "VITE_API_URL not working"

**Solution:**
1. Create `.env.local` in client directory
2. Set `VITE_API_URL=http://localhost:5000`
3. Restart client dev server
4. Check browser DevTools Network tab

### Issue: Demo Mode generates no logs

**Solutions:**
1. Verify server is running (`npm run dev` in server/)
2. Check browser console for errors
3. Verify API requests in DevTools Network tab
4. Try refreshing the page

### Issue: Rate limiting triggered immediately

**Solution:**
```bash
# In server .env
SKIP_RATE_LIMIT=true

# Restart server
npm run dev
```

---

## Next Steps

### For Development

1. ✅ Run everything as described above
2. ✅ Test demo mode to verify functionality
3. ✅ Check server health endpoint
4. ✅ Test API validation with curl

### For Deployment

1. Build client: `cd client && npm run build`
2. Verify server works: `cd server && npm start`
3. Set production `.env` with real `DATABASE_URL`
4. Use Docker for containerization
5. Deploy to Vercel (client) or Render (server)

### For Customization

- Edit `client/utils/demoData.js` to customize sample data
- Add more services in demo data
- Modify health check logic
- Extend API validation rules
- Add authentication headers

---

## Documentation Links

- [README.md](./README.md) - Project overview
- [IMPROVEMENTS_COMPLETE.md](./IMPROVEMENTS_COMPLETE.md) - Full details of all improvements
- [SERVER_HARDENING.md](./SERVER_HARDENING.md) - Server security details
- [CLIENT_IMPROVEMENTS.md](./CLIENT_IMPROVEMENTS.md) - Client enhancement details
- [HARDENING_QUICK_START.md](./HARDENING_QUICK_START.md) - Server quick reference
- [CLIENT_QUICK_REFERENCE.md](./CLIENT_QUICK_REFERENCE.md) - Client quick reference

---

## Summary

**Fully working API Failure Visualizer with:**

✅ Hardened server with rate limiting & validation  
✅ Refactored client with Axios & environment config  
✅ One-click demo mode for recruiters  
✅ Error boundary for crash prevention  
✅ All tests passing (16/16)  
✅ Production-ready code  

**Start now:**
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev

# Browser: http://localhost:5173
# Click: 🎬 Demo Mode
```

🎉 **Ready to show it off!**


