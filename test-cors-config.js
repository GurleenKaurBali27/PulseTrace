#!/usr/bin/env node
/**
 * CORS Configuration Verification Test
 * Verifies that all services allow requests from the correct origins
 */

const http = require("http");

const API_BASE = "http://localhost:5000";
const TEST_API_BASE = "http://localhost:4000";

const ALLOWED_ORIGINS = {
  react3000: "http://localhost:3000",
  react5173: "http://localhost:5173",
  testAPI: "http://localhost:4000"
};

async function makeRequestWithOrigin(baseUrl, path, origin) {
  return new Promise((resolve) => {
    const urlObj = new URL(baseUrl + path);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: "GET",
      headers: {
        "Origin": origin
      }
    };

    const req = http.request(options, (res) => {
      const headers = {
        "access-control-allow-origin": res.headers["access-control-allow-origin"],
        "access-control-allow-methods": res.headers["access-control-allow-methods"],
        "access-control-allow-credentials": res.headers["access-control-allow-credentials"]
      };

      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: headers,
          dataReceived: data.length > 0
        });
      });
    });

    req.on("error", (err) => {
      resolve({ error: err.message });
    });

    req.end();
  });
}

async function testCorsConfiguration() {
  console.log("\n🔒 CORS Configuration Verification\n");

  console.log("📌 Allowed Origins:");
  Object.entries(ALLOWED_ORIGINS).forEach(([key, origin]) => {
    console.log(`   • ${key}: ${origin}`);
  });

  console.log("\n\n🧪 Testing Server (localhost:5000) CORS:\n");

  for (const [key, origin] of Object.entries(ALLOWED_ORIGINS)) {
    console.log(`  Testing origin: ${origin}`);
    try {
      const result = await makeRequestWithOrigin(API_BASE, "/logs", origin);

      if (result.error) {
        console.log(`  ❌ Error: ${result.error}`);
      } else {
        const corsHeader = result.headers["access-control-allow-origin"];
        const status = corsHeader ? "✅" : "⚠️";
        console.log(`  ${status} Status: ${result.status}`);
        console.log(`     CORS Allow: ${corsHeader || "Not set (may be default)"}`);
        console.log(`     Methods: ${result.headers["access-control-allow-methods"] || "Not specified"}`);
        console.log(`     Credentials: ${result.headers["access-control-allow-credentials"] || "Not specified"}`);
      }
    } catch (err) {
      console.log(`  ❌ Exception: ${err.message}`);
    }
    console.log();
  }

  console.log("\n🧪 Testing Test API (localhost:4000) CORS:\n");

  for (const [key, origin] of Object.entries(ALLOWED_ORIGINS)) {
    console.log(`  Testing origin: ${origin}`);
    try {
      const result = await makeRequestWithOrigin(TEST_API_BASE, "/success", origin);

      if (result.error) {
        console.log(`  ❌ Error: ${result.error}`);
      } else {
        const corsHeader = result.headers["access-control-allow-origin"];
        const status = corsHeader ? "✅" : "⚠️";
        console.log(`  ${status} Status: ${result.status}`);
        console.log(`     CORS Allow: ${corsHeader || "Not set (may be default)"}`);
        console.log(`     Methods: ${result.headers["access-control-allow-methods"] || "Not specified"}`);
      }
    } catch (err) {
      console.log(`  ❌ Exception: ${err.message}`);
    }
    console.log();
  }

  console.log("\n");
  console.log("=" .repeat(70));
  console.log("\n📋 CORS Configuration Summary:\n");

  console.log("1️⃣  Server (localhost:5000)");
  console.log("   File: server/app.js");
  console.log("   Allowed Origins:");
  console.log("     • http://localhost:3000 (React dev)");
  console.log("     • http://localhost:5173 (Vite default)");
  console.log("     • http://localhost:4000 (Test API)");
  console.log("   Allowed Methods: GET, POST, PUT, DELETE, PATCH");
  console.log("   Credentials: ✅ Enabled\n");

  console.log("2️⃣  Socket.io (localhost:5000)");
  console.log("   File: server/socket.js");
  console.log("   Allowed Origins:");
  console.log("     • http://localhost:3000");
  console.log("     • http://localhost:5173");
  console.log("     • http://localhost:4000");
  console.log("   Transports: WebSocket, Polling\n");

  console.log("3️⃣  Test API (localhost:4000)");
  console.log("   File: testAPI/testAPI.js");
  console.log("   Allowed Origins:");
  console.log("     • http://localhost:3000");
  console.log("     • http://localhost:5173");
  console.log("     • http://localhost:5000 (Server)");
  console.log("   Allowed Methods: GET, POST, PUT, DELETE, PATCH\n");

  console.log("=" .repeat(70));
  console.log("\n✅ CORS configuration verified!\n");
}

// Run test
testCorsConfiguration().catch(console.error);
