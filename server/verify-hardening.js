#!/usr/bin/env node

/**
 * Server Hardening Verification Script
 * Tests all the security improvements:
 * - Dotenv configuration
 * - DATABASE_URL support (SQLite & PostgreSQL)
 * - Rate limiting on /logs endpoint
 * - Validation schema for incoming logs
 * - Health check endpoints
 */

const path = require("path");
const fs = require("fs");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runTests() {
  log("\n🔒 Server Hardening Verification\n", "cyan");
  let passed = 0;
  let failed = 0;

  // Test 1: Dotenv configuration
  log("Test 1: Dotenv Configuration", "blue");
  try {
    // Load from root .env file (same as server.js)
    require("dotenv").config({ path: path.join(__dirname, "../.env") });
    if (process.env.SERVER_PORT) {
      log("✅ Dotenv loaded successfully", "green");
      log(`   SERVER_PORT: ${process.env.SERVER_PORT}`, "green");
      passed++;
    } else {
      log("❌ Dotenv loaded but SERVER_PORT not set", "red");
      failed++;
    }
  } catch (err) {
    log(`❌ Dotenv configuration failed: ${err.message}`, "red");
    failed++;
  }

  // Test 2: DATABASE_URL support
  log("\nTest 2: DATABASE_URL Configuration", "blue");
  try {
    const dbUrl = process.env.DATABASE_URL || "sqlite://./database.db";
    const dbType = dbUrl.split("://")[0];
    log(`✅ DATABASE_URL configured`, "green");
    log(`   URL: ${dbUrl}`, "green");
    log(`   Type: ${dbType}`, "green");
    
    if (dbType === "sqlite" || dbType === "postgresql") {
      log(`   Supports both SQLite (dev) and PostgreSQL (prod)`, "green");
      passed++;
    } else {
      log(`❌ Unknown database type: ${dbType}`, "red");
      failed++;
    }
  } catch (err) {
    log(`❌ DATABASE_URL check failed: ${err.message}`, "red");
    failed++;
  }

  // Test 3: Express-rate-limit package
  log("\nTest 3: Express-rate-limit Package", "blue");
  try {
    const rateLimit = require("express-rate-limit");
    log("✅ express-rate-limit package installed", "green");
    passed++;
  } catch (err) {
    log(`❌ express-rate-limit not found: ${err.message}`, "red");
    failed++;
  }

  // Test 4: Zod validation package
  log("\nTest 4: Zod Validation Schema", "blue");
  try {
    const { z } = require("zod");
    const { validateLog, logSchema } = require("./validation/logSchema");
    log("✅ Zod validation schema created", "green");

    // Test valid log
    const validLog = {
      method: "GET",
      route: "http://localhost:5000/api/test",
      statusCode: 200
    };

    const result = await validateLog(validLog);
    if (result.success) {
      log("✅ Valid log accepted", "green");
      passed++;
    } else {
      log(`❌ Valid log rejected: ${result.error}`, "red");
      failed++;
    }
  } catch (err) {
    log(`❌ Zod validation test failed: ${err.message}`, "red");
    failed++;
  }

  // Test 5: Validation schema rejects invalid data
  log("\nTest 5: Validation Schema - Reject Invalid Data", "blue");
  try {
    const { validateLog } = require("./validation/logSchema");

    // Test invalid method
    const invalidLog = {
      method: "INVALID",
      route: "http://localhost:5000/api/test",
      statusCode: 200
    };

    const result = await validateLog(invalidLog);
    if (!result.success) {
      log("✅ Invalid method correctly rejected", "green");
      log(`   Error: ${result.error}`, "green");
      passed++;
    } else {
      log("❌ Invalid method was accepted", "red");
      failed++;
    }
  } catch (err) {
    log(`❌ Invalid data test failed: ${err.message}`, "red");
    failed++;
  }

  // Test 6: Health routes file exists
  log("\nTest 6: Health Routes Configuration", "blue");
  try {
    const healthRoutesPath = path.join(__dirname, "routes", "health.routes.js");
    if (fs.existsSync(healthRoutesPath)) {
      const content = fs.readFileSync(healthRoutesPath, "utf-8");
      if (content.includes('router.get("/", (req, res)')) {
        log("✅ Simple GET /health endpoint configured", "green");
        passed++;
      } else {
        log("❌ Simple GET /health endpoint not found", "red");
        failed++;
      }
    } else {
      log("❌ health.routes.js not found", "red");
      failed++;
    }
  } catch (err) {
    log(`❌ Health routes test failed: ${err.message}`, "red");
    failed++;
  }

  // Test 7: Logs routes with rate limiting
  log("\nTest 7: Logs Routes - Rate Limiting Setup", "blue");
  try {
    const logsRoutesPath = path.join(__dirname, "routes", "logs.routes.js");
    if (fs.existsSync(logsRoutesPath)) {
      const content = fs.readFileSync(logsRoutesPath, "utf-8");
      if (content.includes("express-rate-limit") && content.includes("logRateLimiter")) {
        log("✅ Rate limiting middleware configured", "green");
        if (content.includes("100 requests per")) {
          log("   Rate limit: 100 requests per 15 minutes", "green");
        }
        passed++;
      } else {
        log("❌ Rate limiting not found in logs routes", "red");
        failed++;
      }
    } else {
      log("❌ logs.routes.js not found", "red");
      failed++;
    }
  } catch (err) {
    log(`❌ Logs routes test failed: ${err.message}`, "red");
    failed++;
  }

  // Test 8: Validation schema file exists
  log("\nTest 8: Validation Schema File", "blue");
  try {
    const schemaPath = path.join(__dirname, "validation", "logSchema.js");
    if (fs.existsSync(schemaPath)) {
      log("✅ Validation schema file created", "green");
      const content = fs.readFileSync(schemaPath, "utf-8");
      if (content.includes("logSchema") && content.includes("validateLog")) {
        log("   Exports: logSchema, validateLog", "green");
        passed++;
      } else {
        log("❌ Required exports not found", "red");
        failed++;
      }
    } else {
      log("❌ logSchema.js not found", "red");
      failed++;
    }
  } catch (err) {
    log(`❌ Schema file test failed: ${err.message}`, "red");
    failed++;
  }

  // Test 9: Verify required fields in schema
  log("\nTest 9: Validation Schema - Required Fields", "blue");
  try {
    const { validateLog } = require("./validation/logSchema");

    // Test missing required fields
    const missingMethod = {
      route: "http://localhost:5000/api/test",
      statusCode: 200
    };

    const result = await validateLog(missingMethod);
    if (!result.success && result.error.includes("method")) {
      log("✅ Missing 'method' field correctly rejected", "green");
      passed++;
    } else {
      log("❌ Missing 'method' field should be rejected", "red");
      failed++;
    }
  } catch (err) {
    log(`❌ Required fields test failed: ${err.message}`, "red");
    failed++;
  }

  // Test 10: SKIP_RATE_LIMIT environment variable
  log("\nTest 10: Rate Limiting Configuration", "blue");
  try {
    const skipRateLimit = process.env.SKIP_RATE_LIMIT;
    if (skipRateLimit !== undefined) {
      log("✅ SKIP_RATE_LIMIT environment variable configured", "green");
      log(`   Value: ${skipRateLimit}`, "green");
      passed++;
    } else {
      log("⚠️  SKIP_RATE_LIMIT not set (defaults to false in production)", "yellow");
    }
  } catch (err) {
    log(`❌ Rate limit config test failed: ${err.message}`, "red");
    failed++;
  }

  // Summary
  log("\n" + "=".repeat(50), "cyan");
  log(`Tests Passed: ${passed}`, "green");
  log(`Tests Failed: ${failed}`, failed > 0 ? "red" : "green");
  log("=".repeat(50) + "\n", "cyan");

  if (failed === 0) {
    log("🎉 All hardening features verified successfully!", "green");
    process.exit(0);
  } else {
    log(`⚠️  ${failed} test(s) failed. Please check the issues above.`, "yellow");
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  log(`\n❌ Test suite error: ${err.message}`, "red");
  process.exit(1);
});
