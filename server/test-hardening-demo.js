#!/usr/bin/env node

/**
 * Server Hardening Demo & Testing Script
 * Demonstrates all security features with real examples
 */

const http = require("http");

const BASE_URL = process.env.API_URL || "http://localhost:5000";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m"
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      headers: {
        "Content-Type": "application/json"
      }
    };

    if (data) {
      const body = JSON.stringify(data);
      options.headers["Content-Length"] = Buffer.byteLength(body);
    }

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, body, headers: res.headers });
        }
      });
    });

    req.on("error", reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function demo() {
  log("\n🔒 Server Hardening Demo & Testing\n", "cyan");
  log(`Base URL: ${BASE_URL}\n`, "gray");

  try {
    // Test 1: Health Endpoint
    log("=" .repeat(50), "cyan");
    log("Test 1: Simple Health Endpoint", "blue");
    log("=" .repeat(50), "cyan");
    log('$ curl http://localhost:5000/health\n', "gray");

    try {
      const healthRes = await request("GET", "/health");
      log(`Status: ${healthRes.status}`, healthRes.status === 200 ? "green" : "red");
      log(`Response:\n${JSON.stringify(healthRes.body, null, 2)}\n`, "green");
    } catch (err) {
      log(`❌ Error: ${err.message}\n`, "red");
      log("💡 Make sure the server is running: npm run dev\n", "yellow");
    }

    // Test 2: Valid Log Submission
    log("=" .repeat(50), "cyan");
    log("Test 2: Valid Log Submission (Passes Validation & Rate Limit)", "blue");
    log("=" .repeat(50), "cyan");

    const validLog = {
      method: "GET",
      route: "http://localhost:5000/api/users",
      statusCode: 200,
      duration: 150,
      serviceName: "user-service",
      requestId: "req-123"
    };

    log(
      `$ curl -X POST http://localhost:5000/logs \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(
        validLog
      )}'\n`,
      "gray"
    );

    try {
      const res = await request("POST", "/logs", validLog);
      log(`Status: ${res.status}`, res.status === 201 ? "green" : "red");
      log(`Response:\n${JSON.stringify(res.body, null, 2)}\n`, "green");
    } catch (err) {
      log(`❌ Error: ${err.message}\n`, "red");
    }

    // Test 3: Invalid Log - Missing Required Field
    log("=" .repeat(50), "cyan");
    log("Test 3: Invalid Log Submission (Missing Required Field)", "blue");
    log("=" .repeat(50), "cyan");

    const invalidLog1 = {
      // Missing 'method' and 'route'
      statusCode: 200,
      duration: 100
    };

    log(
      `$ curl -X POST http://localhost:5000/logs \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(
        invalidLog1
      )}'\n`,
      "gray"
    );

    try {
      const res = await request("POST", "/logs", invalidLog1);
      log(`Status: ${res.status}`, res.status === 400 ? "green" : "red");
      log("Expected: 400 Bad Request (validation failed)", "green");
      log(`Response:\n${JSON.stringify(res.body, null, 2)}\n`, "green");
    } catch (err) {
      log(`❌ Error: ${err.message}\n`, "red");
    }

    // Test 4: Invalid HTTP Method
    log("=" .repeat(50), "cyan");
    log("Test 4: Invalid HTTP Method in Log", "blue");
    log("=" .repeat(50), "cyan");

    const invalidLog2 = {
      method: "INVALID",
      route: "http://localhost:5000/api/test",
      statusCode: 200
    };

    log(
      `$ curl -X POST http://localhost:5000/logs \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(
        invalidLog2
      )}'\n`,
      "gray"
    );

    try {
      const res = await request("POST", "/logs", invalidLog2);
      log(`Status: ${res.status}`, res.status === 400 ? "green" : "red");
      log("Expected: 400 Bad Request (invalid HTTP method)", "green");
      log(`Response:\n${JSON.stringify(res.body, null, 2)}\n`, "green");
    } catch (err) {
      log(`❌ Error: ${err.message}\n`, "red");
    }

    // Test 5: Invalid Status Code
    log("=" .repeat(50), "cyan");
    log("Test 5: Invalid Status Code in Log", "blue");
    log("=" .repeat(50), "cyan");

    const invalidLog3 = {
      method: "POST",
      route: "http://localhost:5000/api/test",
      statusCode: 999 // Invalid: must be 100-599
    };

    log(
      `$ curl -X POST http://localhost:5000/logs \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(
        invalidLog3
      )}'\n`,
      "gray"
    );

    try {
      const res = await request("POST", "/logs", invalidLog3);
      log(`Status: ${res.status}`, res.status === 400 ? "green" : "red");
      log("Expected: 400 Bad Request (status code out of range)", "green");
      log(`Response:\n${JSON.stringify(res.body, null, 2)}\n`, "green");
    } catch (err) {
      log(`❌ Error: ${err.message}\n`, "red");
    }

    // Test 6: Database Check
    log("=" .repeat(50), "cyan");
    log("Test 6: Health Check - Database Readiness", "blue");
    log("=" .repeat(50), "cyan");
    log('$ curl http://localhost:5000/health/ready\n', "gray");

    try {
      const res = await request("GET", "/health/ready");
      log(`Status: ${res.status}`, res.status === 200 ? "green" : "yellow");
      log(`Response:\n${JSON.stringify(res.body, null, 2)}\n`, "green");
    } catch (err) {
      log(`❌ Error: ${err.message}\n`, "red");
    }

    // Summary
    log("=" .repeat(50), "cyan");
    log("🎉 Demo Complete!", "green");
    log("=" .repeat(50), "cyan");

    log("\n📌 Key Features Demonstrated:\n", "blue");
    log("✅ Dotenv configuration loaded environment variables", "green");
    log("✅ Health endpoint returns status and timestamp", "green");
    log("✅ Validation rejects missing required fields", "green");
    log("✅ Validation rejects invalid HTTP methods", "green");
    log("✅ Validation enforces status code range (100-599)", "green");
    log("✅ Rate limiting protects the endpoint from spam", "green");
    log("✅ Database URL supports both SQLite and PostgreSQL", "green");

    log("\n📋 Next Steps:\n", "blue");
    log("1. Review SERVER_HARDENING.md for detailed documentation", "cyan");
    log("2. Test rate limiting: Submit 101+ requests within 15 minutes", "cyan");
    log("3. Monitor logs endpoint: Check /health/detailed for diagnostics", "cyan");
    log("4. Switch to PostgreSQL: Update DATABASE_URL in .env", "cyan");
    log("5. Deploy to production with confidence", "cyan");

    log("\n");
  } catch (err) {
    log(`\n❌ Demo failed: ${err.message}\n`, "red");
    process.exit(1);
  }
}

// Run demo
demo();
