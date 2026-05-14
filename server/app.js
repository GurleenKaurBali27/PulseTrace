const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

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
  allowedHeaders: ["Content-Type", "Authorization", "x-trace-id", "x-span-id", "x-org-id", "x-api-key"],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Routes
const logRoutes = require("./routes/logs.routes");
const authRoutes = require("./routes/auth.routes");
const orgRoutes = require("./routes/org.routes");
const intelligenceRoutes = require("./routes/intelligence.routes");
const healthRoutes = require("./routes/health.routes");

app.use("/auth", authRoutes);
app.use("/orgs", orgRoutes);
app.use("/intelligence", intelligenceRoutes);
app.use("/logs", logRoutes);
app.use("/health", healthRoutes);

module.exports = app;