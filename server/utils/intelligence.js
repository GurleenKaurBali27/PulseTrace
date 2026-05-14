/**
 * PulseTrace Intelligence Engine
 * AI-powered anomaly detection, clustering, and NLQ mapping
 */

const stringSimilarity = require('string-similarity');
const { Op } = require('sequelize');
const { RequestLog, Project } = require('../models');
const ss = require('simple-statistics');

class IntelligenceEngine {
  constructor() {
    this.confidenceThreshold = 0.75;
  }

  /**
   * Detect anomalies in latency for a specific project/service
   */
  async detectLatencyAnomalies(projectId, serviceName = null) {
    const where = { projectId };
    if (serviceName) where.serviceName = serviceName;

    const logs = await RequestLog.findAll({
      where,
      limit: 200,
      order: [['createdAt', 'DESC']],
      attributes: ['duration', 'createdAt']
    });

    if (logs.length < 20) return null;

    const latencies = logs.map(l => l.duration);
    const mean = ss.mean(latencies);
    const stdDev = ss.standardDeviation(latencies);

    // Filter recent logs (last 10 mins)
    const recentLogs = logs.filter(l => (new Date() - new Date(l.createdAt)) < 600000);
    const spikes = recentLogs.filter(l => l.duration > (mean + 2 * stdDev));

    if (spikes.length > 3) {
      return {
        type: 'LATENCY_REGRESSION',
        severity: 'CRITICAL',
        summary: `Detected significant latency spike in ${serviceName || 'project'}.`,
        details: `Average latency is ${Math.round(mean)}ms, but recent requests are peaking at ${Math.max(...spikes.map(s => s.duration))}ms.`,
        confidence: 0.92,
        affectedService: serviceName,
        suggestedFix: "Check for database connection pool exhaustion or a recent deployment bottleneck."
      };
    }

    return null;
  }

  /**
   * Cluster similar error logs
   */
  async clusterErrors(projectId) {
    const errorLogs = await RequestLog.findAll({
      where: { 
        projectId,
        statusCode: { [Op.gte]: 400 }
      },
      limit: 100,
      order: [['createdAt', 'DESC']]
    });

    if (errorLogs.length < 5) return [];

    const clusters = [];
    const processedIds = new Set();

    for (let i = 0; i < errorLogs.length; i++) {
      if (processedIds.has(errorLogs[i].id)) continue;

      const cluster = [errorLogs[i]];
      processedIds.add(errorLogs[i].id);

      for (let j = i + 1; j < errorLogs.length; j++) {
        if (processedIds.has(errorLogs[j].id)) continue;

        const similarity = stringSimilarity.compareTwoStrings(
          errorLogs[i].error || errorLogs[i].route,
          errorLogs[j].error || errorLogs[j].route
        );

        if (similarity > 0.8) {
          cluster.push(errorLogs[j]);
          processedIds.add(errorLogs[j].id);
        }
      }

      if (cluster.length > 2) {
        clusters.push({
          id: `cluster-${Math.random().toString(36).substring(7)}`,
          pattern: errorLogs[i].error || errorLogs[i].route,
          count: cluster.length,
          lastSeen: cluster[0].createdAt,
          severity: cluster[0].statusCode >= 500 ? 'HIGH' : 'MEDIUM',
          serviceName: cluster[0].serviceName
        });
      }
    }

    return clusters;
  }

  /**
   * Map Natural Language query to Sequelize filter
   */
  mapNLToQuery(query) {
    const q = query.toLowerCase();
    const filter = { where: {} };

    // Detect Service
    const serviceMatch = q.match(/from ([\w-]+) service/i) || q.match(/service ([\w-]+)/i);
    if (serviceMatch) filter.where.serviceName = serviceMatch[1];

    // Detect Failures
    if (q.includes('fail') || q.includes('error') || q.includes('broken')) {
      filter.where.statusCode = { [Op.gte]: 400 };
    }

    // Detect Slow
    if (q.includes('slow') || q.includes('latency') || q.includes('long time')) {
      filter.where.duration = { [Op.gt]: 800 };
    }

    // Detect Time
    if (q.includes('yesterday')) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      filter.where.createdAt = { [Op.gte]: yesterday };
    }

    return filter;
  }
}

module.exports = new IntelligenceEngine();
