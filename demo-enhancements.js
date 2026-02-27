#!/usr/bin/env node
/**
 * Simple test to send requests and display new features
 */

const http = require("http");
const { setTimeout } = require("timers/promises");

async function makeRequest(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: "localhost",
      port: 4000,
      path,
      method: "GET"
    };

    const req = http.request(options, (res) => {
      res.on("data", () => {});
      res.on("end", () => resolve(res.statusCode));
    });

    req.on("error", () => resolve(0));
    req.end();
  });
}

async function runDemo() {
  console.log("\n🎬 Visual Enhancements Demo\n");
  console.log("Sending test requests to trigger animations...\n");

  const tests = [
    { path: "/success", desc: "Quick success (no color)" },
    { path: "/slow", desc: "Slow request (yellow, >500ms)" },
    { path: "/success", desc: "Quick success again" },
    { path: "/fail", desc: "Server error" },
    { path: "/success", desc: "Quick success (should be green)" }
  ];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    const start = Date.now();
    const status = await makeRequest(test.path);
    const duration = Date.now() - start;

    console.log(`${i + 1}. ${test.path}`);
    console.log(`   Description: ${test.desc}`);
    console.log(`   Status: ${status}, Duration: ${duration}ms`);
    console.log(`   → Duration color: ${duration > 2000 ? "🔴 Red (>2s)" : duration > 500 ? "🟡 Yellow (>500ms)" : "🟢 Green (<500ms)"}\n`);

    if (i < tests.length - 1) {
      await setTimeout(400);
    }
  }

  console.log("✅ Demo complete!");
  console.log("\n📋 New Features Added:");
  console.log("   1. Animated row slide-in (framer-motion)");
  console.log("   2. Copy CURL button on each row");
  console.log("   3. Duration color coding:");
  console.log("      - 🟢 Green: <500ms");
  console.log("      - 🟡 Yellow: 500ms - 2s");
  console.log("      - 🔴 Red: >2s\n");
}

runDemo();
