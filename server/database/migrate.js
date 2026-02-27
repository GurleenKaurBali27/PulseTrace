/**
 * Database Migration Runner
 * Handles database schema versioning and upgrades
 */

const fs = require("fs");
const path = require("path");
const sequelize = require("../database/database");

/**
 * Migrations metadata table
 * Tracks which migrations have been applied
 */
const MIGRATIONS_TABLE = "sequelize_migrations";

/**
 * Initialize migrations table
 */
async function initMigrationsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await sequelize.query(query);
    console.log(`✅ Migrations table ready`);
  } catch (err) {
    console.error(`❌ Failed to create migrations table:`, err.message);
    throw err;
  }
}

/**
 * Get applied migrations
 */
async function getAppliedMigrations() {
  try {
    const migrations = await sequelize.query(
      `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY applied_at ASC`,
      { type: sequelize.QueryTypes.SELECT }
    );
    return migrations.map((m) => m.name);
  } catch (err) {
    console.error("Failed to fetch migrations:", err.message);
    return [];
  }
}

/**
 * Record migration as applied
 */
async function recordMigration(name) {
  try {
    await sequelize.query(
      `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES (?)`,
      { replacements: [name] }
    );
  } catch (err) {
    throw new Error(`Failed to record migration ${name}: ${err.message}`);
  }
}

/**
 * Get pending migrations
 */
async function getPendingMigrations() {
  const migrationsDir = path.join(__dirname, "migrations");

  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".js"))
    .sort();

  const applied = await getAppliedMigrations();
  return files.filter((f) => !applied.includes(f));
}

/**
 * Run a single migration
 */
async function runMigration(migrationFile, up = true) {
  const migrationPath = path.join(__dirname, "migrations", migrationFile);

  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Migration file not found: ${migrationFile}`);
  }

  const migration = require(migrationPath);
  const direction = up ? "up" : "down";

  if (!migration[direction]) {
    throw new Error(`Migration ${migrationFile} does not have ${direction} function`);
  }

  try {
    console.log(`⏳ Running migration: ${migrationFile} (${direction})`);
    await migration[direction](sequelize.queryInterface, sequelize.Sequelize);
    console.log(`✅ Migration completed: ${migrationFile}`);

    if (up) {
      await recordMigration(migrationFile);
    }
  } catch (err) {
    console.error(`❌ Migration failed: ${migrationFile}`);
    throw err;
  }
}

/**
 * Run all pending migrations
 */
async function runPendingMigrations() {
  try {
    await initMigrationsTable();

    const pending = await getPendingMigrations();

    if (pending.length === 0) {
      console.log("✅ Database is up to date (no pending migrations)");
      return { applied: 0, pending: 0 };
    }

    console.log(`\n📋 Found ${pending.length} pending migration(s):`);
    pending.forEach((m) => console.log(`   - ${m}`));
    console.log();

    for (const migration of pending) {
      await runMigration(migration, true);
    }

    console.log(`\n✅ Successfully applied ${pending.length} migration(s)\n`);
    return { applied: pending.length, pending: 0 };
  } catch (err) {
    console.error("\n❌ Migration failed:", err.message);
    throw err;
  }
}

/**
 * List all migrations and their status
 */
async function listMigrations() {
  const migrationsDir = path.join(__dirname, "migrations");

  if (!fs.existsSync(migrationsDir)) {
    console.log("No migrations directory found");
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".js"))
    .sort();

  const applied = await getAppliedMigrations();

  console.log("\n📋 Migration Status");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  files.forEach((file) => {
    const status = applied.includes(file) ? "✅ APPLIED" : "⏳ PENDING";
    const timestamp = applied.includes(file) ? " (run)" : " (not run)";
    console.log(`  ${status.padEnd(12)} ${file}`);
  });

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const appliedCount = applied.length;
  const totalCount = files.length;
  console.log(`Total: ${appliedCount}/${totalCount} applied`);
}

module.exports = {
  runPendingMigrations,
  runMigration,
  getPendingMigrations,
  getAppliedMigrations,
  listMigrations,
  initMigrationsTable,
};
