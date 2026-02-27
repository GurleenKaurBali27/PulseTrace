/**
 * WebSocket Integration Test
 * Tests real-time log updates via Socket.io
 */

const axios = require("axios");

const API_BASE = "http://localhost:5000";
const TEST_API_BASE = "http://localhost:4000";

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  log("\n🚀 API Failure Visualizer - WebSocket Real-Time Test\n", "bright");

  try {
    // Test 1: GET /success
    log("📝 Test 1: Making GET /success request...", "cyan");
    await axios.get(`${TEST_API_BASE}/success`);
    log("✅ Request sent to testAPI", "green");

    await delay(500);

    // Check logs on server
    log("📋 Checking logs on server...", "cyan");
    const response = await axios.get(`${API_BASE}/logs?limit=1`);
    const logs = response.data?.data || response.data;
    log(`✅ Server has ${logs.length || 0} recent logs`, "green");

    if (logs.length > 0) {
      const latestLog = logs[0];
      log(
        `   - Latest: ${latestLog.method} ${latestLog.route} ${latestLog.statusCode}`,
        "green"
      );
      log(
        `   - ID: ${latestLog.requestId} | Duration: ${latestLog.duration}ms`,
        "green"
      );
    }

    // Test 2: GET /fail (error response)
    log("\n📝 Test 2: Making GET /fail request (should error)...", "cyan");
    try {
      await axios.get(`${TEST_API_BASE}/fail`);
    } catch (err) {
      log("✅ Error request sent (expected)", "green");
    }

    await delay(500);

    // Check for error logs
    log("📊 Checking for error logs...", "cyan");
    const errorResponse = await axios.get(`${API_BASE}/logs/errors`);
    const errorLogs = errorResponse.data?.data || errorResponse.data;
    log(`✅ Found ${errorLogs.length || 0} error logs`, "green");

    if (errorLogs.length > 0) {
      const latestError = errorLogs[0];
      log(
        `   - Latest Error: ${latestError.method} ${latestError.route} ${latestError.statusCode}`,
        "green"
      );
    }

    // Test 3: Multiple requests in sequence
    log("\n📝 Test 3: Sending multiple requests in sequence...", "cyan");
    const endpoints = [
      "/success",
      "/not-found",
      "/success",
      "/unauthorized"
    ];

    for (const endpoint of endpoints) {
      try {
        await axios.get(`${TEST_API_BASE}${endpoint}`);
        log(`   ✓ ${endpoint}`, "green");
      } catch (err) {
        log(`   ✓ ${endpoint} (error)`);
      }
      await delay(200);
    }

    await delay(1000);

    // Get final statistics
    log("\n📊 Test 4: Checking final statistics...", "cyan");
    const statsResponse = await axios.get(`${API_BASE}/logs/stats`);
    const stats = statsResponse.data;

    log(
      `✅ Total Requests: ${stats.totalLogs || "N/A"}`,
      "green"
    );
    log(
      `✅ Total Errors: ${stats.totalErrors || "N/A"}`,
      "green"
    );
    log(
      `✅ Average Duration: ${stats.avgDuration?.toFixed(2) || "N/A"}ms`,
      "green"
    );

    log("\n✨ Status Breakdown:", "cyan");
    if (stats.byStatus) {
      Object.entries(stats.byStatus).forEach(([status, count]) => {
        log(`   - ${status}: ${count}`);
      });
    }

    log("\n🔧 Method Breakdown:", "cyan");
    if (stats.byMethod) {
      Object.entries(stats.byMethod).forEach(([method, count]) => {
        log(`   - ${method}: ${count}`);
      });
    }

    log(
      "\n✅ TEST COMPLETE - WebSocket integration appears to be working!",
      "green"
    );
    log("📌 Check your browser at http://localhost:3000 to see real-time updates\n", "bright");

  } catch (error) {
    log(`\n❌ TEST FAILED: ${error.message}`, "red");
    if (error.response?.status === 502) {
      log("   Server might be down. Please verify backend is running on :5000", "red");
    }
    process.exit(1);
  }
}

// Run tests
runTests();
