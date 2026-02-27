// Load environment variables from root .env file
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");
const tracker = require("../tracker/tracker");

const app = express();

// Get configuration from environment variables
const SERVER_PORT = process.env.TESTAPI_PORT || 4000;
const TRACKER_URL = process.env.TRACKER_URL || "http://localhost:5000";
const SERVICE_NAME = process.env.TRACKER_SERVICE_NAME || "test-api";
const CORS_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:5173,http://localhost:5000").split(",");

// CORS Configuration - Allow requests from configured origins
const corsOptions = {
  origin: CORS_ORIGINS,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

/**
 * TRACKER MIDDLEWARE
 * This middleware intercepts all requests and logs them to the visualization server
 * It captures: method, route, status code, duration, errors, request body, and response size
 */
app.use(tracker({ serverUrl: TRACKER_URL, serviceName: SERVICE_NAME }));

// ============= TEST ENDPOINTS =============

/**
 * GET /success - Returns a successful response
 */
app.get("/success", (req, res) => {
  res.status(200).json({
    message: "Success API working",
    timestamp: new Date()
  });
});

/**
 * GET /fail - Returns a server error (500)
 */
app.get("/fail", (req, res) => {
  res.status(500).json({
    message: "Something broke",
    error: "Internal Server Error"
  });
});

/**
 * GET /slow - Simulates a slow API response
 */
app.get("/slow", async (req, res) => {
  const duration = parseInt(req.query.duration) || 2000;
  await new Promise((resolve) => setTimeout(resolve, duration));
  res.status(200).json({
    message: "Slow endpoint completed",
    duration: `${duration}ms`
  });
});

/**
 * POST /echo - Echo back the request body
 */
app.post("/echo", (req, res) => {
  res.status(200).json({
    received: req.body,
    timestamp: new Date()
  });
});

/**
 * GET /random - Random response status (for testing various scenarios)
 * Query: ?fail=50 (50% chance of failure)
 */
app.get("/random", (req, res) => {
  const failChance = parseInt(req.query.fail) || 20; // Default 20% fail rate
  const random = Math.random() * 100;

  if (random < failChance) {
    res.status(500).json({
      message: "Random failure occurred",
      failChance
    });
  } else {
    res.status(200).json({
      message: "Random success",
      failChance
    });
  }
});

/**
 * GET /not-found - Returns a 404 error
 */
app.get("/not-found", (req, res) => {
  res.status(404).json({
    message: "Resource not found"
  });
});

/**
 * GET /unauthorized - Returns a 401 error
 */
app.get("/unauthorized", (req, res) => {
  res.status(401).json({
    message: "Unauthorized access"
  });
});

/**
 * POST /create-data - Simulates creating data
 */
app.post("/create-data", (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      message: "Missing required fields: name, email"
    });
  }

  res.status(201).json({
    message: "Data created successfully",
    id: Math.random().toString(36).substr(2, 9),
    data: { name, email }
  });
});

// ============= ERROR HANDLING =============

/**
 * 404 handler for undefined routes
 */
app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    message: "Internal server error",
    error: err.message
  });
});

// ============= SERVER STARTUP =============

app.listen(SERVER_PORT, () => {
  console.log(`\n🚀 Test API running on http://localhost:${SERVER_PORT}`);
  console.log(`📦 Service: ${SERVICE_NAME}`);
  console.log(`📊 Tracking enabled - Logs being sent to ${TRACKER_URL}\n`);
  console.log("🌍 Environment: " + process.env.NODE_ENV);
  console.log("\n Available endpoints:");
  console.log("  GET  /success           - Returns success response");
  console.log("  GET  /fail              - Returns 500 error");
  console.log("  GET  /slow              - Simulates slow response");
  console.log("  POST /echo              - Echo request body");
  console.log("  GET  /random            - Random success/failure");
  console.log("  GET  /not-found         - Returns 404");
  console.log("  GET  /unauthorized      - Returns 401");
  console.log("  POST /create-data       - Create data with validation");
  console.log("\n");
});