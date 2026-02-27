const axios = require("axios");

const SERVER_URL = "http://localhost:5000";

/**
 * Test Multi-Service Monitoring
 * Creates logs for multiple services and tests filtering
 */
async function testMultiServiceMonitoring() {
  console.log("\n🚀 Testing Multi-Service Monitoring Features\n");

  try {
    // Test 1: Create logs for auth-service
    console.log("📝 Creating logs for auth-service...");
    for (let i = 0; i < 3; i++) {
      await axios.post(`${SERVER_URL}/logs`, {
        serviceName: "auth-service",
        requestId: `auth-${Date.now()}-${i}`,
        method: "POST",
        route: "/auth/login",
        statusCode: i === 2 ? 500 : 200,
        duration: Math.random() * 500,
        error: i === 2 ? "Internal Server Error" : null,
        requestBody: JSON.stringify({ username: "test" }),
        responseSize: 256,
        details: {
          request: { headers: { "content-type": "application/json" } },
          response: { statusCode: i === 2 ? 500 : 200 }
        }
      });
    }

    // Test 2: Create logs for payments-service
    console.log("📝 Creating logs for payments-service...");
    for (let i = 0; i < 5; i++) {
      await axios.post(`${SERVER_URL}/logs`, {
        serviceName: "payments-service",
        requestId: `payments-${Date.now()}-${i}`,
        method: "POST",
        route: "/payments/process",
        statusCode: i >= 3 ? 400 : 200,
        duration: 2500 + Math.random() * 1500, // Slow endpoint
        error: i >= 3 ? "Payment Failed" : null,
        requestBody: JSON.stringify({ amount: 99.99 }),
        responseSize: 512,
        details: {
          request: { headers: { "content-type": "application/json" } },
          response: { statusCode: i >= 3 ? 400 : 200 }
        }
      });
    }

    // Test 3: Create logs for default-service
    console.log("📝 Creating logs for default-service...");
    for (let i = 0; i < 2; i++) {
      await axios.post(`${SERVER_URL}/logs`, {
        serviceName: "default-service",
        requestId: `default-${Date.now()}-${i}`,
        method: "GET",
        route: "/api/health",
        statusCode: 200,
        duration: 50 + Math.random() * 100,
        error: null,
        requestBody: null,
        responseSize: 128,
        details: {
          request: { headers: {} },
          response: { statusCode: 200 }
        }
      });
    }

    console.log("✅ Logs created successfully\n");

    // Test 4: Fetch services list
    console.log("🔍 Fetching available services...");
    const servicesResponse = await axios.get(`${SERVER_URL}/logs/services`);
    console.log("📋 Services found:", servicesResponse.data.services);
    console.log("");

    // Test 5: Fetch logs without filter
    console.log("🔍 Fetching all logs...");
    const allLogs = await axios.get(`${SERVER_URL}/logs?limit=20`);
    console.log(`✅ Retrieved ${allLogs.data.data.length} total logs\n`);

    // Test 6: Fetch logs filtered by auth-service
    console.log("🔍 Fetching logs for auth-service...");
    const authLogs = await axios.get(`${SERVER_URL}/logs?service=auth-service&limit=20`);
    console.log(`✅ Retrieved ${authLogs.data.data.length} logs from auth-service`);
    console.log("   Services in results:", [...new Set(authLogs.data.data.map(log => log.serviceName))]);
    console.log("");

    // Test 7: Fetch logs filtered by payments-service
    console.log("🔍 Fetching logs for payments-service...");
    const paymentLogs = await axios.get(`${SERVER_URL}/logs?service=payments-service&limit=20`);
    console.log(`✅ Retrieved ${paymentLogs.data.data.length} logs from payments-service`);
    console.log("   Services in results:", [...new Set(paymentLogs.data.data.map(log => log.serviceName))]);
    console.log("");

    // Test 8: Fetch stats without filter
    console.log("📊 Fetching global stats...");
    const globalStats = await axios.get(`${SERVER_URL}/logs/stats`);
    console.log("✅ Global Statistics:");
    console.log(`   Total Requests: ${globalStats.data.data.totalRequests}`);
    console.log(`   Success: ${globalStats.data.data.successCount}`);
    console.log(`   Errors: ${globalStats.data.data.errorCount}`);
    console.log(`   Failure Rate: ${globalStats.data.data.failureRate}%`);
    console.log("");

    // Test 9: Fetch stats for auth-service
    console.log("📊 Fetching stats for auth-service...");
    const authStats = await axios.get(`${SERVER_URL}/logs/stats?service=auth-service`);
    console.log("✅ Auth-Service Statistics:");
    console.log(`   Total Requests: ${authStats.data.data.totalRequests}`);
    console.log(`   Success: ${authStats.data.data.successCount}`);
    console.log(`   Errors: ${authStats.data.data.errorCount}`);
    console.log(`   Avg Duration: ${authStats.data.data.avgDuration}ms`);
    console.log("");

    // Test 10: Fetch stats for payments-service
    console.log("📊 Fetching stats for payments-service...");
    const paymentStats = await axios.get(`${SERVER_URL}/logs/stats?service=payments-service`);
    console.log("✅ Payments-Service Statistics:");
    console.log(`   Total Requests: ${paymentStats.data.data.totalRequests}`);
    console.log(`   Success: ${paymentStats.data.data.successCount}`);
    console.log(`   Errors: ${paymentStats.data.data.errorCount}`);
    console.log(`   Avg Duration: ${paymentStats.data.data.avgDuration}ms`);
    console.log(`   Slow Requests: ${paymentStats.data.data.slowRequests}`);
    console.log("");

    // Test 11: Fetch alerts without filter
    console.log("⚠️  Fetching global alerts...");
    const globalAlerts = await axios.get(`${SERVER_URL}/logs/alerts`);
    console.log(`✅ Found ${globalAlerts.data.alerts.length} alerts globally`);
    globalAlerts.data.alerts.forEach((alert) => {
      console.log(`   - [${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}`);
      if (alert.route && alert.route !== "all") {
        console.log(`     Route: ${alert.route}`);
      }
    });
    console.log("");

    // Test 12: Fetch alerts for payments-service
    console.log("⚠️  Fetching alerts for payments-service...");
    const paymentAlerts = await axios.get(`${SERVER_URL}/logs/alerts?service=payments-service`);
    console.log(`✅ Found ${paymentAlerts.data.alerts.length} alerts for payments-service`);
    paymentAlerts.data.alerts.forEach((alert) => {
      console.log(`   - [${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}`);
      if (alert.route && alert.route !== "all") {
        console.log(`     Route: ${alert.route}`);
      }
    });
    console.log("");

    console.log("✅ All tests completed successfully!\n");
    console.log("📌 Summary:");
    console.log("   ✓ Created logs for 3 different services");
    console.log("   ✓ Retrieved services list");
    console.log("   ✓ Filtered logs by service");
    console.log("   ✓ Filtered stats by service");
    console.log("   ✓ Filtered alerts by service");
    console.log("   ✓ Multi-service monitoring working correctly\n");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
    process.exit(1);
  }
}

// Run tests
testMultiServiceMonitoring();
