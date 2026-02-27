const { Sequelize } = require("sequelize");
const path = require("path");

/**
 * Database Configuration
 * Supports SQLite (development) and PostgreSQL (production)
 * Includes connection pooling for improved performance
 */

// Determine database type from environment
const dbUrl = process.env.DATABASE_URL || "sqlite://./database.db";
const dbType = dbUrl.split("://")[0];

let sequelizeConfig = {
  logging: process.env.LOG_LEVEL === "debug" ? console.log : false,
  define: {
    timestamps: true,
    underscored: false,
  },
};

// Configure based on database type
if (dbType === "postgresql") {
  // PostgreSQL configuration (production)
  sequelizeConfig = {
    ...sequelizeConfig,
    dialect: "postgres",
    dialectOptions: {
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    },
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || 20), // Maximum connections
      min: parseInt(process.env.DB_POOL_MIN || 2), // Minimum connections
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || 30000), // Time to acquire connection
      idle: parseInt(process.env.DB_POOL_IDLE || 10000), // Connection idle timeout
      evict: 1000, // Evict stale connections
    },
    // Connection URL from environment
    url: dbUrl,
  };
} else if (dbType === "sqlite") {
  // SQLite configuration (development/testing)
  const dbPath = dbUrl.replace("sqlite://", "");
  sequelizeConfig = {
    ...sequelizeConfig,
    dialect: "sqlite",
    storage: path.resolve(dbPath),
    pool: {
      max: 5,
      min: 1,
      acquire: 30000,
      idle: 10000,
    },
  };
} else {
  throw new Error(`Unknown database type: ${dbType}. Use sqlite:// or postgresql://`);
}

const sequelize = new Sequelize(sequelizeConfig);

/**
 * Get connection pool status
 */
function getPoolStatus() {
  if (dbType === "postgresql" && sequelize.connectionManager?.pool) {
    const pool = sequelize.connectionManager.pool;
    return {
      type: "PostgreSQL Connection Pool",
      size: pool.size,
      available: pool.size - (pool.acquired?.length || 0),
      idle: pool.idle?.length || 0,
      acquired: pool.acquired?.length || 0,
      waiting: pool.waitQueue?.length || 0,
    };
  } else if (dbType === "sqlite") {
    return {
      type: "SQLite (File-based)",
      connections: "Single (file-based)",
      status: "Connected",
    };
  }
  return { type: "Unknown", status: "Unknown" };
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection successful");
    const status = getPoolStatus();
    console.log("📊 Connection Pool Status:", status);
    return true;
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    return false;
  }
}

// Export with utilities
module.exports = sequelize;
module.exports.testConnection = testConnection;
module.exports.getPoolStatus = getPoolStatus;
module.exports.Sequelize = Sequelize;
