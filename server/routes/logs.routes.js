const express = require("express");
const router = express.Router();
const RequestLog = require("../models/RequestLog");
const { Op } = require("sequelize");
const sequelize = require("../database/database");
const rateLimit = require("express-rate-limit");
const { validateLog } = require("../validation/logSchema");

/**
 * Rate limiter for POST /logs endpoint
 * Prevents spam by limiting to 100 requests per 15 minutes per IP
 */
const logRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many logs created from this IP, please try again later.",
  statusCode: 429,
  keyGenerator: (req) => {
    // Use X-Forwarded-For for proxy support, fallback to req.ip
    return (req.headers["x-forwarded-for"] || req.ip || "unknown").split(",")[0].trim();
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Rate limit exceeded",
      message: "Too many log submissions. Maximum 100 requests per 15 minutes.",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  },
  skip: (req) => {
    // Skip rate limiting in development for testing
    return process.env.NODE_ENV === "development" && process.env.SKIP_RATE_LIMIT === "true";
  }
});

/**
 * POST /logs - Save a new request log
 * Expects: { method, route, statusCode, duration?, requestBody?, responseBody?, errorMessage?, serviceName?, requestId?, responseSize?, details?, timestamp? }
 * Required fields: method, route, statusCode
 */
router.post("/", logRateLimiter, async (req, res) => {
  try {
    // Validate incoming data with Zod schema
    const validation = await validateLog(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: validation.error,
        details: validation.errors
      });
    }

    // Create log with validated data
    const log = await RequestLog.create(validation.data, {
      validate: true // Ensure Sequelize validation is also applied
    });

    // Emit new log via WebSocket to all connected clients
    if (req.app.io) {
      req.app.io.emit("new_log", {
        success: true,
        data: log
      });
    }

    res.status(201).json({ 
      success: true, 
      message: "Log created successfully",
      data: log 
    });
  } catch (error) {
    console.error("Error creating log:", error);
    res.status(400).json({
      success: false,
      error: "Failed to create log",
      message: error.message,
      details: error.errors ? error.errors.map((e) => e.message) : []
    });
  }
});

/**
 * GET /logs - Retrieve all logs with optional filtering
 * Query params:
 * - limit: number of logs to retrieve (default: 100)
 * - offset: pagination offset (default: 0)
 * - status: filter by exact status code (e.g., 500)
 * - statusRange: filter by status code range (e.g., '4xx' or '5xx')
 * - method: filter by HTTP method (GET, POST, etc.)
 * - route: search logs by route URL (case-insensitive substring match)
 * - search: alias for route filter
 * - service: filter by service name (e.g., 'auth-service')
 */
router.get("/", async (req, res) => {
  try {
    const {
      limit = 100,
      offset = 0,
      status,
      statusRange,
      method,
      route,
      search,
      service
    } = req.query;

    const where = {};

    // Filter by service name
    if (service) {
      where.serviceName = service;
    }

    // Filter by exact status code
    if (status) {
      where.statusCode = parseInt(status);
    }

    // Filter by status code range (4xx, 5xx, 2xx, etc.)
    if (statusRange) {
      const range = statusRange.toLowerCase();
      if (range === "4xx") {
        where.statusCode = { [Op.gte]: 400, [Op.lte]: 499 };
      } else if (range === "5xx") {
        where.statusCode = { [Op.gte]: 500, [Op.lte]: 599 };
      } else if (range === "2xx") {
        where.statusCode = { [Op.gte]: 200, [Op.lte]: 299 };
      } else if (range === "3xx") {
        where.statusCode = { [Op.gte]: 300, [Op.lte]: 399 };
      }
    }

    // Filter by HTTP method
    if (method) {
      where.method = method.toUpperCase();
    }

    // Filter by route URL (case-insensitive substring)
    const routeFilter = route || search;
    if (routeFilter) {
      where.route = {
        [Op.like]: `%${routeFilter}%`
      };
    }

    const { count, rows } = await RequestLog.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: Math.min(parseInt(limit), 500), // Max 500 to prevent large responses
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      total: count,
      limit: Math.min(parseInt(limit), 500),
      offset: parseInt(offset),
      data: rows
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /logs/errors - Get only failed requests
 */
router.get("/errors", async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const logs = await RequestLog.findAll({
      where: {
        error: {
          [Op.not]: null
        }
      },
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error("Error fetching error logs:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /logs/stats - Get aggregate statistics using Sequelize aggregation
 * Query params:
 * - service: filter stats by service name (optional)
 */
router.get("/stats", async (req, res) => {
  try {
    const { service } = req.query;

    const where = {};
    if (service) {
      where.serviceName = service;
    }

    // Total requests and success/error counts
    const totalRequests = await RequestLog.count({ where });
    const successCount = await RequestLog.count({
      where: { ...where, statusCode: { [Op.lt]: 400 } }
    });
    const errorCount = totalRequests - successCount;
    const failureRate = totalRequests > 0 ? ((errorCount / totalRequests) * 100).toFixed(2) : 0;

    // Average duration
    const avgDurationResult = await RequestLog.findOne({
      attributes: [[avg("duration"), "avgDuration"]],
      where,
      raw: true
    });
    const avgDuration = avgDurationResult?.avgDuration ? parseFloat(avgDurationResult.avgDuration).toFixed(2) : 0;

    // Slow requests (duration > 2000ms)
    const slowRequests = await RequestLog.count({
      where: { ...where, duration: { [Op.gt]: 2000 } }
    });

    // Requests grouped by method
    const byMethod = await RequestLog.findAll({
      attributes: [
        "method",
        [sequelize.fn("COUNT", sequelize.col("*")), "count"]
      ],
      where,
      group: ["method"],
      raw: true
    });
    const requestsByMethod = byMethod.map((item) => ({
      method: item.method,
      count: parseInt(item.count)
    }));

    // Requests grouped by status code
    const byStatus = await RequestLog.findAll({
      attributes: [
        "statusCode",
        [sequelize.fn("COUNT", sequelize.col("*")), "count"]
      ],
      where,
      group: ["statusCode"],
      order: [["statusCode", "ASC"]],
      raw: true
    });
    const requestsByStatus = byStatus.map((item) => ({
      statusCode: item.statusCode,
      count: parseInt(item.count)
    }));

    // Top 5 slowest routes by average duration
    const slowRoutes = await RequestLog.findAll({
      attributes: [
        "route",
        [sequelize.fn("COUNT", sequelize.col("*")), "count"],
        [sequelize.fn("AVG", sequelize.col("duration")), "avgDuration"]
      ],
      where,
      group: ["route"],
      order: [[sequelize.fn("AVG", sequelize.col("duration")), "DESC"]],
      limit: 5,
      raw: true
    });
    const topSlowRoutes = slowRoutes.map((item) => ({
      route: item.route,
      count: parseInt(item.count),
      avgDuration: parseFloat(item.avgDuration).toFixed(2)
    }));

    res.json({
      success: true,
      data: {
        totalRequests,
        successCount,
        errorCount,
        failureRate: parseFloat(failureRate),
        avgDuration: parseFloat(avgDuration),
        slowRequests,
        requestsByMethod,
        requestsByStatus,
        topSlowRoutes
      }
    });
  } catch (error) {
    console.error("Error calculating stats:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /logs/services - Get list of distinct service names from logs
 */
router.get("/services", async (req, res) => {
  try {
    const services = await RequestLog.findAll({
      attributes: [
        [sequelize.fn("DISTINCT", sequelize.col("serviceName")), "serviceName"]
      ],
      raw: true,
      order: [["serviceName", "ASC"]]
    });

    const serviceNames = services
      .map((s) => s.serviceName)
      .filter((name) => name); // Filter out null/undefined

    res.json({
      success: true,
      services: serviceNames
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /logs/:id - Retrieve a specific log by ID with full details
 */
router.get("/:id", async (req, res) => {
  try {
    const log = await RequestLog.findByPk(req.params.id);

    if (!log) {
      return res.status(404).json({
        success: false,
        error: "Log not found"
      });
    }

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error("Error fetching log:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /logs/alerts - Evaluate alert rules and return active alerts
 * Query params:
 * - service: filter alerts by service name (optional)
 * Rules:
 * - High Failure Rate: >20% in last 5 minutes
 * - Slow Endpoint: avg duration > 2000ms
 * - Frequent Errors: same route has >= 5 errors recently
 */
router.get("/alerts", async (req, res) => {
  try {
    const { service } = req.query;
    const alerts = [];
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const where = {
      createdAt: {
        [Op.gte]: fiveMinutesAgo
      }
    };

    if (service) {
      where.serviceName = service;
    }

    // Get recent logs (last 5 minutes)
    const recentLogs = await RequestLog.findAll({
      where,
      raw: true
    });

    if (recentLogs.length === 0) {
      return res.json({ success: true, alerts: [] });
    }

    const totalRecent = recentLogs.length;
    const errorRecent = recentLogs.filter((log) => log.statusCode >= 400).length;

    // RULE 1: High Failure Rate (>20% in last 5 minutes)
    const failureRate = (errorRecent / totalRecent) * 100;
    if (failureRate > 20) {
      const alertId = `error_rate_${Date.now()}`;
      alerts.push({
        id: alertId,
        type: "error_rate",
        severity: failureRate > 50 ? "critical" : "warning",
        message: "High API failure rate detected",
        route: "all",
        value: `${failureRate.toFixed(2)}%`,
        timestamp: new Date()
      });
    }

    // RULE 2 & 3: Analyze by route
    const routeAggregates = {};
    recentLogs.forEach((log) => {
      if (!routeAggregates[log.route]) {
        routeAggregates[log.route] = {
          route: log.route,
          durations: [],
          errorCount: 0,
          totalCount: 0
        };
      }
      routeAggregates[log.route].durations.push(log.duration);
      routeAggregates[log.route].totalCount += 1;
      if (log.statusCode >= 400) {
        routeAggregates[log.route].errorCount += 1;
      }
    });

    // Check each route for rules 2 and 3
    Object.values(routeAggregates).forEach((routeData) => {
      // RULE 2: Slow Endpoint (avg duration > 2000ms)
      const avgDuration =
        routeData.durations.reduce((a, b) => a + b, 0) /
        routeData.durations.length;

      if (avgDuration > 2000) {
        const alertId = `perf_${routeData.route}_${Date.now()}`;
        alerts.push({
          id: alertId,
          type: "performance",
          severity: avgDuration > 5000 ? "critical" : "warning",
          message: "Slow endpoint detected",
          route: routeData.route,
          value: `${avgDuration.toFixed(0)}ms`,
          timestamp: new Date()
        });
      }

      // RULE 3: Frequent Errors (same route has >= 5 errors recently)
      if (routeData.errorCount >= 5) {
        const alertId = `errors_${routeData.route}_${Date.now()}`;
        alerts.push({
          id: alertId,
          type: "repeated_errors",
          severity: routeData.errorCount > 10 ? "critical" : "warning",
          message: `Frequent errors on endpoint (${routeData.errorCount} errors)`,
          route: routeData.route,
          value: `${routeData.errorCount} errors`,
          timestamp: new Date()
        });
      }
    });

    res.json({
      success: true,
      alerts: alerts
    });
  } catch (error) {
    console.error("Error evaluating alerts:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;