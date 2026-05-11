#!/usr/bin/env node

/**
 * Startup Verification Script
 * Validates all services are properly configured before starting
 * Run with: node verify-startup.js
 */

require("dotenv").config();

const chalk = require("chalk"); // Will add to package.json
const axios = require("axios");
const path = require("path");
const fs = require("fs");

console.clear();
console.log(chalk.bold.cyan("\n🔍 API Failure Visualizer - Startup Verification\n"));

const checks = [];

/**
 * File system checks
 */
function checkFileSystem() {
  console.log(chalk.bold("📁 File System Checks"));
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const requiredFiles = [
    ".env",
    "server/app.js",
    "server/server.js",
    "client/App.jsx",
    "testAPI/testAPI.js",
  ];

  requiredFiles.forEach((file) => {
    const exists = fs.existsSync(path.join(__dirname, file));
    const status = exists ? chalk.green("✓") : chalk.red("✗");
    console.log(`  ${status} ${file.padEnd(30)}`);
    checks.push({ name: `File: ${file}`, passed: exists });
  });
  console.log();
}

/**
 * Environment variable checks
 */
function checkEnvironmentVariables() {
  console.log(chalk.bold("🌍 Environment Variables"));
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const envVars = {
    "NODE_ENV": process.env.NODE_ENV,
    "SERVER_PORT": process.env.SERVER_PORT,
    "CLIENT_PORT": process.env.CLIENT_PORT,
    "TESTAPI_PORT": process.env.TESTAPI_PORT,
    "DATABASE_URL": process.env.DATABASE_URL ? "***configured***" : "❌ missing",
    "VITE_API_URL": process.env.VITE_API_URL,
    "TRACKER_URL": process.env.TRACKER_URL,
  };

  Object.entries(envVars).forEach(([key, value]) => {
    const exists = !!value && value !== "❌ missing";
    const status = exists ? chalk.green("✓") : chalk.red("✗");
    console.log(`  ${status} ${key.padEnd(20)}: ${value || chalk.red("missing")}`);
    checks.push({ name: `Env: ${key}`, passed: exists });
  });
  console.log();
}

/**
 * Port availability checks
 */
async function checkPorts() {
  console.log(chalk.bold("🔌 Port Availability"));
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const ports = {
    "SERVER_PORT (5000)": parseInt(process.env.SERVER_PORT) || 5000,
    "CLIENT_PORT (5173)": parseInt(process.env.CLIENT_PORT) || 5173,
    "TESTAPI_PORT (4000)": parseInt(process.env.TESTAPI_PORT) || 4000,
  };

  for (const [name, port] of Object.entries(ports)) {
    const available = await isPortAvailable(port);
    const status = available ? chalk.green("✓") : chalk.yellow("⚠");
    const msg = available
      ? "Available"
      : "In use (may cause startup issues)";
    console.log(`  ${status} ${name.padEnd(25)}: ${msg}`);
    checks.push({ name: `Port: ${name}`, passed: available });
  }
  console.log();
}

/**
 * Helper: Check if port is available
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const net = require("net");
    const server = net.createServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
}

/**
 * Node modules checks
 */
function checkNodeModules() {
  console.log(chalk.bold("📦 Node Modules"));
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const packages = [
    { dir: ".", name: "root scripts" },
    { dir: "server", name: "server dependencies" },
    { dir: "client", name: "client dependencies" },
    { dir: "testAPI", name: "test API dependencies" },
  ];

  packages.forEach(({ dir, name }) => {
    const nmPath = path.join(__dirname, dir, "node_modules");
    const exists = fs.existsSync(nmPath);
    const status = exists ? chalk.green("✓") : chalk.red("✗");
    console.log(`  ${status} ${name.padEnd(30)}`);
    checks.push({ name: `node_modules: ${name}`, passed: exists });
  });
  console.log();
}

/**
 * Database checks
 */
async function checkDatabase() {
  console.log(chalk.bold("🗄️  Database"));
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const dbUrl = process.env.DATABASE_URL || "sqlite://./database.db";
  const isSQLite = dbUrl.startsWith("sqlite://");
  const isPostgres = dbUrl.startsWith("postgresql://");

  if (isSQLite) {
    const dbPath = dbUrl.replace("sqlite://", "");
    const exists = fs.existsSync(dbPath);
    const status = exists ? chalk.green("✓") : chalk.yellow("⚠");
    const msg = exists
      ? "Exists (will sync tables)"
      : "Will be created on startup";
    console.log(`  ${status} SQLite: ${dbPath}`);
    console.log(`         ${msg}`);
    checks.push({ name: "Database: SQLite file", passed: true });
  } else if (isPostgres) {
    console.log(chalk.yellow("  ⚠ PostgreSQL configured"));
    console.log("     Connection will be tested on startup");
    checks.push({ name: "Database: PostgreSQL", passed: true });
  } else {
    console.log(chalk.red("  ✗ Invalid DATABASE_URL format"));
    checks.push({ name: "Database: Format", passed: false });
  }
  console.log();
}

/**
 * Print summary
 */
function printSummary() {
  console.log(chalk.bold("📊 Verification Summary"));
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const passed = checks.filter((c) => c.passed).length;
  const total = checks.length;
  const percentage = Math.round((passed / total) * 100);

  console.log(`  Passed: ${chalk.green(passed)}/${total} (${percentage}%)\n`);

  if (percentage === 100) {
    console.log(chalk.green.bold("  ✓ All checks passed! Ready to start."));
    console.log("\n  Next steps:");
    console.log("    npm run dev      # Start all services");
    console.log("    npm run dev:*    # Start specific service\n");
  } else {
    console.log(chalk.yellow.bold("  ⚠ Some checks failed. Please review:"));
    checks
      .filter((c) => !c.passed)
      .forEach((c) => {
        console.log(`    - ${c.name}`);
      });
    console.log();
  }
}

/**
 * Run all checks
 */
async function runChecks() {
  try {
    checkFileSystem();
    checkEnvironmentVariables();
    checkNodeModules();
    await checkPorts();
    await checkDatabase();
    printSummary();
  } catch (err) {
    console.error(chalk.red("Error during verification:"), err);
    process.exit(1);
  }
}

runChecks();
