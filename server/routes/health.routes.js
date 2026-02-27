/**
 * Health Check Routes
 * Provides health status endpoints for monitoring and orchestration
 */

const express = require("express");
const sequelize = require("../database/database");
const router = express.Router();

/**
 * GET /health - Simple health check
 * Returns 200 and current timestamp
 */
router.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * GET /health/live - Liveness probe
 * Returns 200 if service is running (basic checks)
 */
router.get("/live", (req, res) => {
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

/**
 * GET /health/ready - Readiness probe
 * Returns 200 only if all critical systems are ready
 */
router.get("/ready", async (req, res) => {
  const checks = {
    database: false,
    environment: false,
  };

  try {
    // Check database connection
    await sequelize.authenticate();
    checks.database = true;
  } catch (err) {
    console.error("Database health check failed:", err.message);
  }

  // Check required environment variables
  checks.environment = !!(
    process.env.SERVER_PORT &&
    process.env.DATABASE_URL &&
    process.env.VITE_API_URL
  );

  const allHealthy = Object.values(checks).every((v) => v === true);

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? "ready" : "not-ready",
    timestamp: new Date().toISOString(),
    checks,
    environment: process.env.NODE_ENV,
  });
});

/**
 * GET /health/detailed - Full system status
 * Comprehensive health information for diagnostics
 */
router.get("/detailed", async (req, res) => {
  const startTime = Date.now();
  const checks = {
    database: { status: "unknown", latency: null, error: null },
    configuration: { status: "unknown", error: null },
    memory: { rss: 0, heapUsed: 0, heapTotal: 0 },
    uptime: process.uptime(),
  };

  // Database check with latency measurement
  try {
    const dbStart = Date.now();
    await sequelize.authenticate();
    checks.database.status = "healthy";
    checks.database.latency = Date.now() - dbStart;
  } catch (err) {
    checks.database.status = "unhealthy";
    checks.database.error = err.message;
  }

  // Configuration check
  const requiredEnvVars = [
    "SERVER_PORT",
    "DATABASE_URL",
    "VITE_API_URL",
    "NODE_ENV",
  ];
  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

  checks.configuration.status = missingVars.length === 0 ? "valid" : "invalid";
  if (missingVars.length > 0) {
    checks.configuration.error = `Missing: ${missingVars.join(", ")}`;
  }

  // Memory usage
  const mem = process.memoryUsage();
  checks.memory = {
    rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
  };

  const isHealthy =
    checks.database.status === "healthy" &&
    checks.configuration.status === "valid";

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    checks,
    environment: process.env.NODE_ENV,
    diagnosticTime: `${Date.now() - startTime}ms`,
  });
});

/**
 * GET /health - Summary endpoint
 * Quick health check with minimal info
 */
router.get("/", (req, res) => {
  const healthy = process.env.DATABASE_URL && process.env.SERVER_PORT;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "error",
    service: "api-failure-visualizer",
  });
});

/**
 * GET /health/resilience - Phase 3 resilience features
 * Shows circuit breaker status, retry configuration, and resource monitoring
 */
router.get("/resilience", (req, res) => {
  try {
    const { manager } = require("../utils/circuitBreaker");
    const { getStatus: getMemoryStatus } = require("../utils/monitoring");

    const mem = process.memoryUsage();
    const heapPercent = (mem.heapUsed / mem.heapTotal) * 100;

    res.status(200).json({
      status: "resilience-check",
      timestamp: new Date().toISOString(),
      features: {
        errorBoundary: "✅ Enabled (React frontend)",
        circuitBreaker: "✅ Enabled (external APIs)",
        retryLogic: "✅ Enabled (exponential backoff)",
        gracefulShutdown: "✅ Enabled (SIGTERM/SIGINT)",
        memoryMonitoring: process.env.ENABLE_MEMORY_MONITORING === "true" ? "✅ Enabled" : "⚪ Disabled",
      },
      circuitBreakers: manager.getAllStatus(),
      memory: {
        heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
        heapPercent: `${heapPercent.toFixed(1)}%`,
        status:
          heapPercent > 90
            ? "CRITICAL"
            : heapPercent > 80
            ? "WARNING"
            : "HEALTHY",
      },
      retry: {
        maxAttempts: 3,
        initialDelay: "100ms",
        maxDelay: "10s",
        backoffMultiplier: 2,
      },
    });
  } catch (err) {
    res.status(503).json({
      status: "resilience-check-failed",
      error: err.message,
    });
  }
});

/**
 * GET /health/memory - Detailed memory diagnostics
 * For debugging memory leaks and performance issues
 */
router.get("/memory", (req, res) => {
  try {
    const { getStatus: getMemoryStatus } = require("../utils/monitoring");
    const status = getMemoryStatus();

    res.status(200).json({
      status: "memory-diagnostics",
      timestamp: new Date().toISOString(),
      current: status.current,
      growth: status.growth,
      leakDetected: status.leakDetected,
      avgGrowthRate: `${status.avgGrowthRate.toFixed(2)}MB per measurement`,
      measurements: status.measurements,
      recommendations:
        status.leakDetected
          ? [
              "Memory leak suspected",
              "Monitor for 5+ minutes",
              "Check for circular references",
              "Review event listeners",
            ]
          : ["Memory usage healthy"],
    });
  } catch (err) {
    res.status(503).json({
      status: "memory-check-failed",
      error: err.message,
    });
  }
});

module.exports = router;
