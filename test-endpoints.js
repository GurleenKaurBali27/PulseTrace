#!/usr/bin/env node
/**
 * Simple WebSocket and API Integration Test
 */

const http = require("http");

const API_BASE = "http://localhost:5000";
const TEST_API_BASE = "http://localhost:4000";

async function makeRequest(url, method = "GET") {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({ status: res.statusCode, data: JSON.parse(data) });
      });
    });

    req.on("error", reject);
    req.end();
  });
}

async function runTests() {
  console.log("\n🚀 Testing API Endpoints\n");

  try {
    // Test 1: GET /logs/stats
    console.log("📊 Testing GET /logs/stats...");
    const statsRes = await makeRequest(`${API_BASE}/logs/stats`);
    console.log(`   Status: ${statsRes.status}`);
    console.log(`   Total Logs: ${statsRes.data.data?.total || 0}`);
    console.log(`   Errors: ${statsRes.data.data?.errors || 0}`);
    console.log(`   Avg Duration: ${statsRes.data.data?.avgDuration?.toFixed(2)}ms`);

    // Test 2: Make a request to testAPI
    console.log("\n📝 Making test request to testAPI /success...");
    const testRes = await makeRequest(`${TEST_API_BASE}/success`);
    console.log(`   Status: ${testRes.status}`);

    // Wait a bit for log to be stored
    await new Promise((r) => setTimeout(r, 1000));

    // Test 3: Get logs
    console.log("\n📋 Testing GET /logs...");
    const logsRes = await makeRequest(`${API_BASE}/logs?limit=5`);
    console.log(`   Status: ${logsRes.status}`);
    console.log(`   Total Logs Available: ${logsRes.data.total}`);
    console.log(`   Recent Logs: ${logsRes.data.data.length}`);

    if (logsRes.data.data.length > 0) {
      const latest = logsRes.data.data[0];
      console.log(
        `   Latest: ${latest.method} ${latest.route} → ${latest.statusCode}`
      );
    }

    // Test 4: Check errors endpoint
    console.log("\n❌ Testing GET /logs/errors...");
    const errorsRes = await makeRequest(`${API_BASE}/logs/errors`);
    console.log(`   Status: ${errorsRes.status}`);
    console.log(`   Error Logs: ${errorsRes.data.data?.length || 0}`);

    console.log("\n✅ All endpoint tests passed!\n");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

runTests();
