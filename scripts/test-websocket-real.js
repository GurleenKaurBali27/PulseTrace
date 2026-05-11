#!/usr/bin/env node
/**
 * WebSocket Real-Time Log Test
 * Connects to Socket.io server and listens for new log events
 */

const io = require("socket.io-client");
const http = require("http");

const API_BASE = "http://localhost:5000";
const TEST_API_BASE = "http://localhost:4000";

let receivedLogs = [];
let socket = null;

function makeRequest(url, method = "GET") {
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

async function runTest() {
  console.log("\n🔌 WebSocket Real-Time Log Test\n");

  // Connect to WebSocket server
  console.log("📡 Connecting to WebSocket server...");
  socket = io(API_BASE, {
    transports: ["websocket", "polling"],
    reconnection: true
  });

  return new Promise(async (resolve) => {
    socket.on("connect", async () => {
      console.log("✅ Connected to WebSocket server\n");

      // Listen for new log events
      socket.on("new_log", (event) => {
        console.log(`📨 New log received via WebSocket:`);
        console.log(`   Method: ${event.data.method}`);
        console.log(`   Route: ${event.data.route}`);
        console.log(`   Status: ${event.data.statusCode}`);
        console.log(`   Duration: ${event.data.duration}ms\n`);
        receivedLogs.push(event.data);
      });

      // Send test requests
      console.log("🚀 Sending test requests...\n");

      try {
        // Test 1: /success
        console.log("1️⃣  GET /success");
        await makeRequest(`${TEST_API_BASE}/success`);
        await new Promise((r) => setTimeout(r, 500));

        // Test 2: /fail (error)
        console.log("2️⃣  GET /fail (expect error)");
        try {
          await makeRequest(`${TEST_API_BASE}/fail`);
        } catch (e) {
          console.log("   (error caught)");
        }
        await new Promise((r) => setTimeout(r, 500));

        // Test 3: /not-found
        console.log("3️⃣  GET /not-found (404)");
        try {
          await makeRequest(`${TEST_API_BASE}/not-found`);
        } catch (e) {}
        await new Promise((r) => setTimeout(r, 500));

        // Wait to receive all WebSocket events
        await new Promise((r) => setTimeout(r, 2000));

        console.log(`\n📊 WebSocket Test Results:`);
        console.log(`   Received ${receivedLogs.length} log events via WebSocket`);

        if (receivedLogs.length > 0) {
          console.log(`\n   Logs received:`);
          receivedLogs.forEach((log, i) => {
            console.log(
              `   ${i + 1}. ${log.method} ${log.route} → ${log.statusCode}`
            );
          });
        }

        if (receivedLogs.length >= 3) {
          console.log("\n✅ WebSocket real-time updates working correctly!");
        } else {
          console.log(
            "\n⚠️  Warning: Expected 3+ WebSocket events but received",
            receivedLogs.length
          );
        }

        socket.disconnect();
        resolve();
      } catch (err) {
        console.error("❌ Error:", err.message);
        socket.disconnect();
        resolve();
      }
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error.message);
      resolve();
    });

    // Timeout after 15 seconds
    setTimeout(() => {
      console.log("\n⏱️  Test timeout reached");
      socket.disconnect();
      resolve();
    }, 15000);
  });
}

runTest().then(() => process.exit(0));
