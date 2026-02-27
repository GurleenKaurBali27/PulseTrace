const express = require("express");
const cors = require("cors");

const app = express();

/**
 * CORS Configuration
 * Allows requests from:
 * - React client: http://localhost:3000 (Vite dev server configured port)
 * - Vite default: http://localhost:5173 (for flexibility)
 * - Test API: http://localhost:4000 (generates tracked requests)
 */
const corsOptions = {
  origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:4000"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
const logRoutes = require("./routes/logs.routes");
const healthRoutes = require("./routes/health.routes");

app.use("/logs", logRoutes);
app.use("/health", healthRoutes);

module.exports = app;