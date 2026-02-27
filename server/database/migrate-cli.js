#!/usr/bin/env node

/**
 * Database Migration CLI
 * Usage: node database/migrate-cli.js <command>
 * 
 * Commands:
 *   up     - Run pending migrations
 *   down   - Rollback last migration
 *   status - Show migration status
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const sequelize = require("./database");
const {
  runPendingMigrations,
  listMigrations,
  getPendingMigrations,
} = require("./migrate");

const command = process.argv[2] || "up";

async function runMigrations() {
  try {
    switch (command) {
      case "up":
        console.log("Running pending migrations...\n");
        await runPendingMigrations();
        break;

      case "down":
        console.log("Rollback not yet implemented");
        process.exit(1);
        break;

      case "status":
        console.log();
        await listMigrations();
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.log("\nUsage: npm run migrate <command>");
        console.log("Commands:");
        console.log("  up     - Run pending migrations");
        console.log("  down   - Rollback last migration");
        console.log("  status - Show migration status");
        process.exit(1);
    }

    // Close connection
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err.message);
    await sequelize.close().catch(() => {});
    process.exit(1);
  }
}

runMigrations();
