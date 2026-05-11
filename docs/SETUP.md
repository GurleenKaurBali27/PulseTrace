# 🚀 API Failure Visualizer - Setup Guide

## Phase 1: Usability (Root Setup)

This guide covers the root-level setup to make the entire project runnable with a single command.

---

## ✅ Prerequisites

- **Node.js** ≥ 18.0.0 ([Download](https://nodejs.org))
- **npm** ≥ 9.0.0 (usually included with Node.js)
- **Git** (for cloning the repository)

Verify your versions:
```bash
node --version
npm --version
```

---

## 📦 Project Structure

```
api-failure-visualizer/
├── package.json              # Root orchestration (concurrently runs all services)
├── .env                       # Environment configuration (development)
├── .env.example              # Template .env file
├── /server                   # Express backend (Port 5000)
│   ├── package.json
│   ├── server.js
│   └── ...
├── /client                   # React frontend (Port 5173)
│   ├── package.json
│   ├── vite.config.js
│   └── ...
└── /testAPI                  # Test API service (Port 4000)
    ├── package.json
    ├── testAPI.js
    └── ...
```

---

## 🚀 Quick Start (One Command)

### Step 1: Install Dependencies

```bash
# From the root directory
npm run setup
```

This command:
- Installs root dependencies (concurrently)
- Installs server dependencies
- Installs client dependencies
- Installs testAPI dependencies

### Step 2: Configure Environment (Already Done!)

A `.env` file is already created with development defaults. No configuration needed for local development.

### Step 3: Start All Services

```bash
# From the root directory
npm run dev
```

This runs:
- **Backend Server** on `http://localhost:5000`
- **React Frontend** on `http://localhost:5173`
- **Test API** on `http://localhost:4000`

All three services start simultaneously with proper colors and prefixes to distinguish logs.

---

## 🎯 Available Commands

### Development Mode (Recommended)
```bash
npm run dev              # Start all services with hot-reload (using nodemon/vite)
npm run dev:server      # Start only server
npm run dev:client      # Start only React client
npm run dev:testapi     # Start only test API
```

### Production Mode
```bash
npm start               # Build and run production versions
npm run build          # Build all services
npm run build:client   # Build React client only
```

### Utility Commands
```bash
npm run setup          # Install all dependencies
npm run clean          # Remove all node_modules
npm run reinstall      # Clean install everything
npm run test          # Run tests on server and client
```

---

## 📝 Environment Configuration

### Using the .env File

The project uses a single `.env` file at the root that all services read from:

**How it works:**
1. Each service (server, client, testAPI) loads the root `.env` file on startup
2. Services use sensible defaults if a variable is missing
3. Environment variables can be overridden via command line

**Example - Change the backend port:**
```bash
SERVER_PORT=5001 npm run dev:server
```

### Key Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode (development/production) |
| `SERVER_PORT` | `5000` | Backend server port |
| `CLIENT_PORT` | `5173` | Frontend dev server port |
| `TESTAPI_PORT` | `4000` | Test API port |
| `DATABASE_URL` | `sqlite://./database.db` | Database connection string |
| `VITE_API_URL` | `http://localhost:5000` | Frontend API endpoint |
| `TRACKER_URL` | `http://localhost:5000` | Where test API sends logs |
| `TRACKER_SERVICE_NAME` | `test-api` | Service identifier for test API |

### Complete Variable List

See [.env.example](.env.example) for all 50+ available configuration options including:
- Server configuration
- Client configuration
- Database settings
- Logging levels
- Feature flags
- CORS origins
- And more!

---

## 🔌 Accessing the Application

Once all services are running, access them at:

- **Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:5000/logs
- **Analytics**: http://localhost:5173/analytics
- **Test API**: http://localhost:4000

---

## 🧪 Testing Multi-Service Monitoring

The system is ready for testing with multiple services:

```bash
# Terminal 1: Run the main command (all services start)
npm run dev

# Terminal 2: In project root, run the test script
node test-multi-service.js
```

This creates logs from multiple services and tests filtering, stats, and alerts.

---

## 🐛 Troubleshooting

### Port Already in Use

If you get "Port X already in use" error:

```bash
# Change the port in .env
SERVER_PORT=5001 npm run dev:server

# Or kill the process using that port
# On Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# On macOS/Linux:
lsof -i :5000
kill -9 <PID>
```

### Module Not Found Error

```bash
# Reinstall dependencies
npm run reinstall
```

### Database Issues

```bash
# To reset the database, simply delete it:
rm database.db     # On Windows: del database.db

# Then restart:
npm run dev
```

### Can't Connect to Backend

Check that:
1. Backend is running on http://localhost:5000
2. `VITE_API_URL` in .env is set correctly
3. CORS is properly configured

---

## 📚 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│           React Frontend (Port 5173)                │
│  - Dashboard with live logs                         │
│  - Analytics with Recharts                          │
│  - Request detail page                              │
│  - Service selector for multi-service monitoring    │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP + WebSocket
                   │
┌──────────────────▼──────────────────────────────────┐
│     Express Backend (Port 5000)                     │
│  - Log storage (SQLite)                             │
│  - WebSocket real-time updates                      │
│  - REST API endpoints                               │
│  - Alert evaluation                                 │
│  - Analytics aggregation                            │
└──────────────────▲──────────────────────────────────┘
                   │ HTTP + Logs
                   │
┌──────────────────┴──────────────────────────────────┐
│      Test API (Port 4000)                           │
│  - Generates test requests                          │
│  - Tracks all requests via middleware               │
│  - Sends logs to backend                            │
│  - Multiple service simulation                      │
└─────────────────────────────────────────────────────┘
```

---

## 📋 Phase 1 Checklist

- ✅ Root `package.json` with concurrently orchestration
- ✅ `.env` file with sensible defaults
- ✅ `.env.example` with complete documentation
- ✅ Each service configured to read from root `.env`
- ✅ `npm run setup` to install all dependencies
- ✅ `npm run dev` to start all services (single command)
- ✅ Proper port configuration via environment variables
- ✅ Service name configuration for multi-service monitoring

---

## 🎯 Next Steps (Phase 2: Configuration)

The next phase will focus on:
- Advanced environment configuration
- Production .env setup
- Secrets management
- Configuration validation

---

## 💡 Tips & Best Practices

1. **Keep .env file local**: Never commit `.env` to git (it's in .gitignore)
2. **Use .env.example**: Keep this updated for new team members
3. **Environment-specific files**: Create `.env.production` for prod values
4. **Validate on startup**: Each service logs its configuration on startup
5. **Check logs**: Look for 🚀 and ✅ indicators confirming services started

---

## ❓ FAQ

**Q: Can I run services individually?**
A: Yes! Use `npm run dev:server`, `npm run dev:client`, or `npm run dev:testapi`

**Q: How do I deploy this?**
A: See the Deployment phase (Phase 4) - we'll cover Vercel, Render, and Heroku

**Q: Can I change ports?**
A: Yes! Update the PORT variables in `.env` and restart

**Q: Is the database persistent?**
A: Yes! SQLite database is stored in `./database.db` and persists between restarts

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review [.env.example](.env.example) for configuration options
3. Check service logs for specific error messages
4. Verify all three services are running in the terminal output

---

**Status**: ✅ Phase 1 (Usability) Complete
