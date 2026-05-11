# 🚨PulseTrace API Failure Visualizer

> **Production-ready tool to monitor, visualize, and alert on API failures across multiple microservices**

[![Node.js Version](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)](.)

---

## 📋 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [API Endpoints](#-api-endpoints)
- [Development](#-development)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)

---

## ✨ Features

### 🎯 Real-Time Monitoring
- **Live Dashboard** - See API failures as they happen with WebSocket updates
- **Multi-Service Tracking** - Monitor logs from multiple APIs simultaneously
- **Animated UI** - Smooth transitions using Framer-motion animations
- **Instant Notifications** - Real-time alerts for critical issues

### 📊 Advanced Analytics
- **Interactive Charts** - Pie, bar, and custom charts using Recharts
- **Service Metrics** - Requests by method, status codes, and duration
- **Top Slow Routes** - Identify performance bottlenecks
- **Failure Rate Tracking** - Percentage breakdowns and trends

### ⚠️ Smart Alert System
- **3-Rule Alert Engine**:
  - 🔴 High Failure Rate (>20% in 5 minutes)
  - ⚡ Slow Endpoints (avg duration >2000ms)
  - 🔄 Frequent Errors (≥5 errors per route)
- **Severity Levels** - Critical (red) vs Warning (yellow)
- **Auto-Refresh** - Every 10 seconds with service filtering

### 🔍 Detailed Request Tracing
- **3-Tab Interface**:
  - Overview with key metrics
  - Full headers, params, and body details
  - Raw JSON for debugging
- **Copy CURL** - Export requests for easy testing
- **Color-Coded Duration** - Visual performance indicators

### 🏢 Multi-Service Support
- **Service Selector** - Switch between services instantly
- **Isolated View** - Filter all data by specific service
- **Global Overview** - See all services at once
- **Service Discovery** - Auto-detect all tracked services

### 🛡️ Production Ready
- **Environment Configuration** - Single `.env` file for all services
- **Database Abstraction** - SQLite for dev, PostgreSQL for production
- **Error Handling** - Comprehensive validation and error recovery
- **CORS Configured** - Secure cross-origin requests
- **Scalable Architecture** - Ready for microservices

---

## 🚀 Quick Start

### Prerequisites
```
Node.js ≥ 18.0.0
# 🚨 API Failure Visualizer

> **Production-ready tool to monitor, visualize, and alert on API failures across multiple microservices**

[![Node.js Version](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)](.)

---

## 📋 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [API Endpoints](#-api-endpoints)
- [Development](#-development)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)

---

## ✨ Features

### 🎯 Real-Time Monitoring
- **Live Dashboard** - See API failures as they happen with WebSocket updates
- **Multi-Service Tracking** - Monitor logs from multiple APIs simultaneously
- **Animated UI** - Smooth transitions using Framer-motion animations
- **Instant Notifications** - Real-time alerts for critical issues

### 📊 Advanced Analytics
- **Interactive Charts** - Pie, bar, and custom charts using Recharts
- **Service Metrics** - Requests by method, status codes, and duration
- **Top Slow Routes** - Identify performance bottlenecks
- **Failure Rate Tracking** - Percentage breakdowns and trends

### ⚠️ Smart Alert System
- **3-Rule Alert Engine**:
  - 🔴 High Failure Rate (>20% in 5 minutes)
  - ⚡ Slow Endpoints (avg duration >2000ms)
  - 🔄 Frequent Errors (≥5 errors per route)
- **Severity Levels** - Critical (red) vs Warning (yellow)
- **Auto-Refresh** - Every 10 seconds with service filtering

### 🔍 Detailed Request Tracing
- **3-Tab Interface**:
  - Overview with key metrics
  - Full headers, params, and body details
  - Raw JSON for debugging
- **Copy CURL** - Export requests for easy testing
- **Color-Coded Duration** - Visual performance indicators

### 🏢 Multi-Service Support
- **Service Selector** - Switch between services instantly
- **Isolated View** - Filter all data by specific service
- **Global Overview** - See all services at once
- **Service Discovery** - Auto-detect all tracked services

### 🛡️ Production Ready
- **Environment Configuration** - Single `.env` file for all services
- **Database Abstraction** - SQLite for dev, PostgreSQL for production
- **Error Handling** - Comprehensive validation and error recovery
- **CORS Configured** - Secure cross-origin requests
- **Scalable Architecture** - Ready for microservices

---

## 🚀 Quick Start

### Prerequisites
```
Node.js ≥ 18.0.0
npm ≥ 9.0.0
Git
```

### 1️⃣ Clone & Install
```bash
# Clone the repository
git clone https://github.com/GurleenKaurBali27/api-failure-visualizer.git
cd api-failure-visualizer

# Install all dependencies
npm run setup
```

### 2️⃣ Start Development (One Command!)
```bash
npm run dev
```

This starts:
- ✅ Backend Server (http://localhost:5000)
- ✅ React Frontend (http://localhost:5173)
- ✅ Test API (http://localhost:4000)

### 3️⃣ Open Dashboard
Navigate to: **http://localhost:5173**

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  React Frontend                     │
│  - Dashboard with Live Logs                         │
│  - Analytics & Insights                             │
│  - Request Detail View                              │
│  - Service Selector                                 │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP + WebSocket
                   │
┌──────────────────▼──────────────────────────────────┐
│               Express Backend                       │
│  - Log Storage (SQLite/PostgreSQL)                  │
│  - Real-time Updates (Socket.io)                    │
│  - REST API + WebSocket                             │
│  - Smart Alert Engine                               │
│  - Analytics Aggregation                            │
└──────────────────▲──────────────────────────────────┘
                   │ HTTP + Logs
                   │
┌──────────────────┴──────────────────────────────────┐
│            Tracker Middleware                       │
│  - Deployed in Your Services                        │
│  - Captures All HTTP Requests                       │
│  - Sends Logs to Backend                            │
│  - Non-blocking & Efficient                         │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
api-failure-visualizer/
├── package.json                 # Root orchestration (concurrently)
├── .env                         # Development configuration
├── .env.example                 # Template with all options
├── .env.production             # Production configuration template
├── .gitignore                  # Git ignore rules
├── SETUP.md                    # Setup & configuration guide
├── README.md                   # This file
│
├── /server                     # Express Backend (Port 5000)
│   ├── app.js                  # Express configuration
│   ├── server.js               # Entry point
│   ├── socket.js               # WebSocket setup
│   ├── models/
│   │   └── RequestLog.js        # Database model
│   ├── routes/
│   │   └── logs.routes.js       # API endpoints
│   └── database/
│       └── database.js          # Sequelize connection
│
├── /client                     # React Frontend (Port 5173)
│   ├── src/
│   │   ├── App.jsx             # Root component with routing
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # Main dashboard
│   │   │   ├── Analytics.jsx    # Analytics page
│   │   │   └── RequestDetailPage.jsx  # Detail view
│   │   ├── components/
│   │   │   ├── AlertsPanel.jsx       # Alert system
│   │   │   ├── FilterBar.jsx         # Filters
│   │   │   ├── ServiceSelector.jsx   # Service picker
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── api.js           # HTTP client
│   │   │   └── socket.js        # WebSocket client
│   │   └── styles/
│   │       └── *.css             # Component styles
│   └── vite.config.js            # Vite configuration
│
├── /testAPI                    # Test API Service (Port 4000)
│   ├── testAPI.js              # Entry point with test endpoints
│   └── package.json
│
├── /tracker                    # Request Tracking Middleware
│   ├── tracker.js              # Main middleware
│   ├── logger.js               # Local logging
│   └── sendLog.js              # Log transmission
│
└── test-multi-service.js        # Multi-service test script
```

---

## ⚙️ Configuration

### Single .env File for All Services

The project uses a single `.env` file at the root that all services read from:

**Key Variables:**
```env
NODE_ENV=development                    # Environment
SERVER_PORT=5000                        # Backend port
CLIENT_PORT=5173                        # Frontend port
TESTAPI_PORT=4000                       # Test API port
DATABASE_URL=sqlite://./database.db     # Database
VITE_API_URL=http://localhost:5000      # API endpoint
TRACKER_URL=http://localhost:5000       # Where to send logs
```

**View all options in [.env.example](.env.example)**

### Quick Configuration Changes

```bash
# Change backend port
SERVER_PORT=5001 npm run dev:server

# Use PostgreSQL
DATABASE_URL=postgresql://user:pass@host/db npm run dev:server

# Production build
NODE_ENV=production npm start
```

---

## 📡 API Endpoints

### Logs Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/logs` | Create new log |
| `GET` | `/logs` | List logs (with filtering) |
| `GET` | `/logs/:id` | Get specific log |
| `GET` | `/logs/errors` | Get error logs only |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/logs/stats` | Aggregate statistics |
| `GET` | `/logs/services` | List all services |
| `GET` | `/logs/alerts` | Get active alerts |

**All endpoints support `?service=SERVICE_NAME` for filtering**

---

## 🛠️ Development

### Scripts

```bash
# Start all services (development with hot-reload)
npm run dev

# Start individual services
npm run dev:server
npm run dev:client
npm run dev:testapi

# Build production versions
npm run build

# Production start
npm start

# Installation
npm run setup          # Install all dependencies
npm run reinstall      # Clean reinstall everything
```

### Testing Multi-Service Monitoring

```bash
# In one terminal: Start all services
npm run dev

# In another terminal: Run test script
node test-multi-service.js
```

---

## 🚀 Deployment

### Phase 2 & Beyond (In Progress)

The project is being developed in 5 phases:

1. ✅ **Phase 1: Usability** - Root setup with single command
2. 🔄 **Phase 2: Configuration** - Advanced env validation
3. 🔄 **Phase 3: Reliability** - Health checks, resilience
4. 🔄 **Phase 4: Deployment** - PostgreSQL, Vercel, Render, Heroku
5. ✅ **Phase 5: Presentation** - Landing page, demo mode

Each phase adds production-readiness features.

**See [Deployment Guide](DEPLOYMENT.md) for cloud deployment instructions** (Phase 4)

---

## 📦 Tech Stack

**Frontend:**
- React 18.2
- Vite (bundler)
- React Router 6
- Framer-motion (animations)
- Recharts (charting)
- Axios (HTTP client)
- Socket.io-client (real-time)

**Backend:**
- Node.js + Express 5
- Sequelize ORM
- SQLite3 / PostgreSQL
- Socket.io
- CORS

**Infrastructure:**
- Concurrently (parallel commands)
- Dotenv (configuration)
- Nodemon (hot-reload)

---

## 🎯 Key Features Deep Dive

### Real-Time Updates
WebSocket connection emits new logs instantly. Dashboard prepends logs and filters them based on current filters.

### Multi-Service Monitoring
Each log includes a `serviceName` field. All endpoints support service filtering with `?service=SERVICE_NAME`.

### Smart Alerts
Evaluates 3 rules every 10 seconds on recent logs (last 5 minutes). Returns severity levels and affected routes.

### Analytics
Aggregates statistics using Sequelize functions (COUNT, AVG, GROUP BY) for performance optimization.

---

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 💬 Support & Feedback

- 📖 **Documentation**: See [SETUP.md](SETUP.md) for detailed setup and configuration
- 🐛 **Issues**: Report bugs on [GitHub Issues](https://github.com/GurleenKaurBali27/api-failure-visualizer/issues)
- 💡 **Ideas**: Share feature requests and ideas

---

## 🎉 Acknowledgments

- Built with modern web technologies
- Inspired by production monitoring tools
- Community-driven development

---

## 📊 Stats

- **Lines of Code**: 5000+
- **Components**: 10+
- **API Endpoints**: 7+
- **Alert Rules**: 3+
- **Supported Services**: Unlimited

---

**Made with ❤️ for developers who want visibility into their APIs**

[![GitHub stars](https://img.shields.io/github/stars/GurleenKaurBali27/api-failure-visualizer.svg?style=social)](https://github.com/GurleenKaurBali27/api-failure-visualizer)
#   a p i - f a i l u r e - v i s u l a i z e r
