const express = require("express");
const router = express.Router();
const intelligence = require("../utils/intelligence");
const authenticate = require("../middleware/auth.middleware");
const { rbac } = require("../middleware/rbac");
const { RequestLog } = require("../models");

router.use(authenticate);

// GET /intelligence/incidents - Get AI detected incidents
router.get("/incidents", rbac('VIEW_METRICS'), async (req, res) => {
  try {
    const projectId = req.headers['x-project-id'];
    if (!projectId) return res.status(400).json({ error: "Project ID required" });

    const anomalies = await intelligence.detectLatencyAnomalies(projectId);
    const clusters = await intelligence.clusterErrors(projectId);

    res.json({
      success: true,
      incidents: anomalies ? [anomalies] : [],
      clusters
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /intelligence/query - Execute Natural Language Query
router.post("/query", rbac('VIEW_METRICS'), async (req, res) => {
  try {
    const { query } = req.body;
    const projectId = req.headers['x-project-id'];
    
    const filter = intelligence.mapNLToQuery(query);
    filter.where.projectId = projectId;
    filter.limit = 50;
    filter.order = [['createdAt', 'DESC']];

    const logs = await RequestLog.findAll(filter);

    res.json({
      success: true,
      queryExecuted: filter.where,
      data: logs
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
