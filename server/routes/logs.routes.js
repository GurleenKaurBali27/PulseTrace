const express = require("express");
const router = express.Router();
const RequestLog = require("../models/RequestLog");
const { Op } = require("sequelize");
const sequelize = require("../database/database");
const rateLimit = require("express-rate-limit");
const { validateLog } = require("../validation/logSchema");
const maskingEngine = require("../utils/masking");
const { rbac, ROLES } = require("../middleware/rbac");
const AuditLog = require("../models/AuditLog");
const authenticate = require("../middleware/auth.middleware");

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
    // Prefer the library helper for IPv6-safe key generation when available
    try {
      const erl = require('express-rate-limit');
      if (typeof erl.ipKeyGenerator === 'function') {
        return erl.ipKeyGenerator(req);
      }
    } catch (e) {
      // fall back below
    }

    // Fallback: Use X-Forwarded-For for proxy support, then req.ip
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
    // 0. Validate API Key
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({ success: false, error: "API Key required (x-api-key)" });
    }

    const project = await Project.findOne({ where: { apiKey } });
    if (!project) {
      return res.status(401).json({ success: false, error: "Invalid API Key" });
    }

    // 1. Validate incoming data with Zod schema
    const validation = await validateLog(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: validation.error,
        details: validation.errors
      });
    }

    // SANITIZATION LAYER: Apply masking before DB storage and WS broadcast
    const sanitizedData = maskingEngine.sanitizeLog(validation.data);

    // Create log with sanitized data
    const log = await RequestLog.create({
      ...sanitizedData,
      projectId: project.id
    });

    // Emit sanitized log via WebSocket
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
 * GET /audit-logs - Retrieve all audit logs (Admin only)
 */
router.get("/audit-logs", authenticate, rbac(ROLES.ADMIN), async (req, res) => {
  try {
    const logs = await AuditLog.findAll({ order: [["createdAt", "DESC"]] });
    const sanitizedLogs = logs.map(log => maskingEngine.sanitizeLog(log.toJSON()));
    res.json({ success: true, data: sanitizedLogs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
router.get("/", authenticate, rbac('VIEW_METRICS'), async (req, res) => {
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

    const { Project } = require("../models");
    const where = {};
    const projectWhere = { OrganizationId: req.organization.id };

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
      include: [{
        model: Project,
        where: projectWhere,
        required: true,
        attributes: []
      }],
      order: [["createdAt", "DESC"]],
      limit: Math.min(parseInt(limit), 500),
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
router.get("/errors", authenticate, rbac('VIEW_METRICS'), async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const { Project } = require("../models");

    const logs = await RequestLog.findAll({
      where: {
        error: { [Op.not]: null }
      },
      include: [{
        model: Project,
        where: { OrganizationId: req.organization.id },
        required: true,
        attributes: []
      }],
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
router.get("/stats", authenticate, rbac('VIEW_METRICS'), async (req, res) => {
  try {
    const { service } = req.query;
    const { Project } = require("../models");

    const where = {};
    if (service) {
      where.serviceName = service;
    }
    
    const projectFilter = {
      model: Project,
      where: { OrganizationId: req.organization.id },
      required: true,
      attributes: []
    };

    // Total requests and success/error counts
    const totalRequests = await RequestLog.count({ 
      where, 
      include: [projectFilter] 
    });
    const successCount = await RequestLog.count({
      where: { ...where, statusCode: { [Op.lt]: 400 } },
      include: [projectFilter]
    });
    const errorCount = totalRequests - successCount;
    const failureRate = totalRequests > 0 ? ((errorCount / totalRequests) * 100).toFixed(2) : 0;

    // Average duration
    const avgDurationResult = await RequestLog.findOne({
      attributes: [[sequelize.fn("AVG", sequelize.col("duration")), "avgDuration"]],
      where,
      include: [projectFilter],
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
router.get("/services", authenticate, rbac('VIEW_METRICS'), async (req, res) => {
  try {
    const { Project } = require("../models");
    const services = await RequestLog.findAll({
      attributes: [
        [sequelize.fn("DISTINCT", sequelize.col("serviceName")), "serviceName"]
      ],
      include: [{
        model: Project,
        where: { OrganizationId: req.organization.id },
        required: true,
        attributes: []
      }],
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
router.get("/:id", authenticate, rbac('VIEW_METRICS'), async (req, res) => {
  try {
    const { Project } = require("../models");
    const log = await RequestLog.findOne({
      where: { id: req.params.id },
      include: [{
        model: Project,
        where: { OrganizationId: req.organization.id },
        required: true
      }]
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        error: "Log not found"
      });
    }

    const isRevealRequested = req.query.reveal === 'true';
    let responseData = log.toJSON();

    // AUDIT LOGGING: If admin requests to reveal sensitive data
    if (isRevealRequested && req.userRole === ROLES.ADMIN) {
      await AuditLog.create({
        userRole: req.userRole,
        action: 'REVEAL_SENSITIVE_DATA',
        targetId: req.params.id,
        metadata: { path: req.originalUrl }
      });
      // In a real system, you might fetch unmasked data from a vault here
      // For this implementation, we acknowledge the reveal request
      responseData._isRevealed = true;
    }

    res.json({
      success: true,
      data: responseData
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
router.get("/alerts", authenticate, rbac('VIEW_METRICS'), async (req, res) => {
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
    const { Project } = require("../models");
    const recentLogs = await RequestLog.findAll({
      where,
      include: [{
        model: Project,
        where: { OrganizationId: req.organization.id },
        required: true,
        attributes: []
      }],
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

/**
 * GET /logs/traces/:traceId - Retrieve all spans for a specific trace
 */
router.get("/traces/:traceId", authenticate, rbac('VIEW_METRICS'), async (req, res) => {
  try {
    const { traceId } = req.params;
    const { Project } = require("../models");
    const spans = await RequestLog.findAll({
      where: { traceId },
      include: [{
        model: Project,
        where: { OrganizationId: req.organization.id },
        required: true,
        attributes: []
      }],
      order: [["createdAt", "ASC"]]
    });

    res.json({
      success: true,
      data: spans
    });
  } catch (error) {
    console.error("Error fetching trace:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /logs/service-map - Build service dependency map
 */
router.get("/service-map", async (req, res) => {
  try {
    // Find all unique pairs of (parentService, childService)
    // We can infer this from spans that have a parentSpanId
    const logs = await RequestLog.findAll({
      where: {
        parentSpanId: { [Op.not]: null }
      },
      attributes: ["serviceName", "parentSpanId", "traceId"],
      raw: true
    });

    // To find the parent service name, we need to look up the parent span
    // This is inefficient if done per log, so let's do a join or aggregate
    const parentSpanIds = logs.map(l => l.parentSpanId);
    const parentSpans = await RequestLog.findAll({
      where: {
        spanId: { [Op.in]: parentSpanIds }
      },
      attributes: ["spanId", "serviceName"],
      raw: true
    });

    const parentSpanMap = parentSpans.reduce((acc, s) => {
      acc[s.spanId] = s.serviceName;
      return acc;
    }, {});

    const dependencies = [];
    const seen = new Set();

    logs.forEach(log => {
      const parentService = parentSpanMap[log.parentSpanId];
      if (parentService && parentService !== log.serviceName) {
        const key = `${parentService}->${log.serviceName}`;
        if (!seen.has(key)) {
          dependencies.push({
            from: parentService,
            to: log.serviceName
          });
          seen.add(key);
        }
      }
    });

    res.json({
      success: true,
      data: dependencies
    });
  } catch (error) {
    console.error("Error fetching service map:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /logs/trace-timeline - Get list of unique traces with high-level stats
 */
router.get("/trace-timeline", async (req, res) => {
  try {
    const { limit = 50, offset = 0, service } = req.query;

    const where = {
      traceId: { [Op.not]: null }
    };
    if (service) {
      where.serviceName = service;
    }

    // Get unique traces by selecting the root span (requestDepth: 0)
    // or just aggregate all spans grouped by traceId
    const traces = await RequestLog.findAll({
      attributes: [
        "traceId",
        [sequelize.fn("MIN", sequelize.col("createdAt")), "startTime"],
        [sequelize.fn("MAX", sequelize.col("createdAt")), "endTime"],
        [sequelize.fn("COUNT", sequelize.col("id")), "spanCount"],
        [sequelize.fn("SUM", sequelize.col("duration")), "totalDuration"],
        [sequelize.fn("MAX", sequelize.col("statusCode")), "maxStatus"]
      ],
      where,
      group: ["traceId"],
      order: [[sequelize.fn("MIN", sequelize.col("createdAt")), "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      raw: true
    });

    res.json({
      success: true,
      data: traces
    });
  } catch (error) {
    console.error("Error fetching trace timeline:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /audit-logs - Retrieve system security audit logs
 */
router.get("/security/audits", rbac('VIEW_AUDITS'), async (req, res) => {
  try {
    const audits = await AuditLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    res.json({ success: true, data: audits });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;