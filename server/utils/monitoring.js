/**
 * Memory Monitoring & Leak Detection
 * Tracks memory usage, warns on high usage, and detects potential leaks
 */

const os = require("os");

/**
 * Memory threshold configuration
 */
const THRESHOLDS = {
  WARNING: 0.8, // 80% of heap
  CRITICAL: 0.9, // 90% of heap
  RESTART_THRESHOLD: 0.95, // 95% - suggest restart
};

/**
 * Memory monitor stats
 */
const stats = {
  measurements: [],
  maxMeasurements: 60, // Keep last 60 measurements
  warnings: [],
  leakDetected: false,
  averageGrowthRate: 0,
};

/**
 * Collect memory snapshot
 */
function collectSnapshot() {
  const mem = process.memoryUsage();
  const total = os.totalmem();
  const free = os.freemem();

  return {
    timestamp: Date.now(),
    process: {
      rss: mem.rss, // Resident set size
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
      arrayBuffers: mem.arrayBuffers,
    },
    system: {
      totalMemoryMB: Math.round(total / 1024 / 1024),
      freeMemoryMB: Math.round(free / 1024 / 1024),
      usagePercent: Math.round(((total - free) / total) * 100),
    },
    heap: {
      usagePercent: mem.heapTotal > 0 ? mem.heapUsed / mem.heapTotal : 0,
      usedMB: Math.round(mem.heapUsed / 1024 / 1024),
      totalMB: Math.round(mem.heapTotal / 1024 / 1024),
      externalMB: Math.round(mem.external / 1024 / 1024),
    },
  };
}

/**
 * Start memory monitoring
 * @param {number} intervalMs - Check interval in milliseconds (default: 30s)
 */
function startMonitoring(intervalMs = 30000) {
  console.log("📊 Memory Monitoring started (interval: " + intervalMs + "ms)");

  const interval = setInterval(() => {
    const snapshot = collectSnapshot();
    stats.measurements.push(snapshot);

    // Keep only recent measurements
    if (stats.measurements.length > stats.maxMeasurements) {
      stats.measurements.shift();
    }

    // Check for memory leaks
    detectMemoryLeak(snapshot);

    // Check thresholds
    checkThresholds(snapshot);
  }, intervalMs);

  // Don't keep the interval reference in event loop for graceful shutdown
  if (interval.unref) {
    interval.unref();
  }

  return interval;
}

/**
 * Detect potential memory leaks
 * Analyzes growth trend over time
 */
function detectMemoryLeak(currentSnapshot) {
  if (stats.measurements.length < 5) return;

  // Calculate average growth rate (rate of increase)
  const recent = stats.measurements.slice(-5);
  const heapGrowth = [];

  for (let i = 1; i < recent.length; i++) {
    const growth = recent[i].heap.usedMB - recent[i - 1].heap.usedMB;
    heapGrowth.push(growth);
  }

  const avgGrowth = heapGrowth.reduce((a, b) => a + b, 0) / heapGrowth.length;
  stats.averageGrowthRate = avgGrowth;

  // If consistently growing >5MB per measurement, potential leak
  const potentialLeak =
    heapGrowth.every((g) => g > 5) && avgGrowth > 3;

  if (potentialLeak && !stats.leakDetected) {
    stats.leakDetected = true;
    console.warn(
      `⚠️  Potential memory leak detected! ` +
        `Average growth: ${avgGrowth.toFixed(2)}MB per measurement`
    );
  } else if (!potentialLeak && stats.leakDetected) {
    stats.leakDetected = false;
    console.log("✅ Memory growth normalized, leak risk reduced");
  }
}

/**
 * Check memory thresholds and warn
 */
function checkThresholds(snapshot) {
  const heapUsage = snapshot.heap.usagePercent;
  const systemUsage = snapshot.system.usagePercent;

  // Check heap thresholds
  if (heapUsage >= THRESHOLDS.CRITICAL) {
    console.error(
      `🚨 CRITICAL: Heap memory at ${(heapUsage * 100).toFixed(1)}%! ` +
        `Available actions: 1) Restart service 2) Increase memory limit 3) Debug memory leaks`
    );

    if (heapUsage >= THRESHOLDS.RESTART_THRESHOLD) {
      console.error(
        "🔴 DANGER: Memory critically high. Service may crash soon."
      );
    }
  } else if (heapUsage >= THRESHOLDS.WARNING) {
    console.warn(
      `⚠️  WARNING: Heap memory at ${(heapUsage * 100).toFixed(1)}%. ` +
        `Current: ${snapshot.heap.usedMB}MB / ${snapshot.heap.totalMB}MB`
    );
  }

  // Check system thresholds (less critical, but worth noting)
  if (systemUsage >= 90) {
    console.warn(`⚠️  System memory at ${systemUsage}%`);
  }
}

/**
 * Get current memory status
 */
function getStatus() {
  const current = collectSnapshot();
  const previous = stats.measurements[stats.measurements.length - 2];

  const growth = previous
    ? {
        heapMB: current.heap.usedMB - previous.heap.usedMB,
        rssMB: (current.process.rss - previous.process.rss) / 1024 / 1024,
      }
    : null;

  return {
    current,
    growth,
    leakDetected: stats.leakDetected,
    avgGrowthRate: stats.averageGrowthRate,
    measurements: stats.measurements.length,
    thresholds: THRESHOLDS,
  };
}

/**
 * Force garbage collection (if available)
 * Only works if V8 code is exposed via --expose-gc flag
 */
function forceGarbageCollection() {
  if (global.gc) {
    try {
      global.gc();
      console.log("🗑️  Manual garbage collection triggered");
      return true;
    } catch (err) {
      console.error("Failed to trigger GC:", err);
      return false;
    }
  } else {
    console.warn(
      "⚠️  Garbage collection not available. Start with: node --expose-gc server.js"
    );
    return false;
  }
}

/**
 * Kill process gracefully if memory critical
 * @param {Object} options - Configuration
 */
function setupMemoryPressureHandler(options = {}) {
  const criticalThreshold = options.criticalThreshold || THRESHOLDS.RESTART_THRESHOLD;
  const checkInterval = options.checkInterval || 60000; // 1 minute

  setInterval(() => {
    const mem = process.memoryUsage();
    const heapUsage = mem.heapUsed / mem.heapTotal;

    if (heapUsage >= criticalThreshold) {
      console.error(`🛑 Memory pressure critical (${(heapUsage * 100).toFixed(1)}%). Initiating graceful shutdown...`);
      process.exit(1); // Will trigger graceful shutdown handlers
    }
  }, checkInterval);
}

/**
 * Get detailed memory report
 */
function getDetailedReport() {
  const status = getStatus();
  const mem = status.current.process;
  const heap = status.current.heap;

  return `
📊 Memory Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Process Memory:
  RSS (Resident Set):  ${Math.round(mem.rss / 1024 / 1024)}MB
  Heap Used:          ${heap.usedMB}MB / ${heap.totalMB}MB (${(heap.usagePercent * 100).toFixed(1)}%)
  External:           ${heap.externalMB}MB
  
System Memory:
  System Usage:       ${status.current.system.usagePercent}%
  Free Memory:        ${status.current.system.freeMemoryMB}MB
  Total Memory:       ${status.current.system.totalMemoryMB}MB

Trends:
  Leak Detected:      ${status.leakDetected ? "YES ⚠️" : "No ✓"}
  Avg Growth Rate:    ${status.avgGrowthRate.toFixed(2)}MB per check
  Recent Change:      ${status.growth ? `${status.growth.heapMB > 0 ? "+" : ""}${status.growth.heapMB.toFixed(2)}MB` : "N/A"}

Measurements:       ${status.measurements} samples collected
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `;
}

module.exports = {
  startMonitoring,
  getStatus,
  getDetailedReport,
  collectSnapshot,
  forceGarbageCollection,
  setupMemoryPressureHandler,
  THRESHOLDS,
};
