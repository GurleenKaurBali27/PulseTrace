/**
 * Configuration Validator
 * Validates environment variables and configuration on startup
 * Ensures all required variables are set and have valid values
 */

const path = require("path");
const fs = require("fs");

// Define required and optional configuration schema
const CONFIG_SCHEMA = {
  required: [
    "NODE_ENV",
    "SERVER_PORT",
    "DATABASE_URL",
    "VITE_API_URL",
    "TRACKER_URL",
  ],
  optional: [
    "LOG_LEVEL",
    "CORS_ORIGINS",
    "MAX_CONNECTIONS",
    "REQUEST_TIMEOUT",
    "STATS_CACHE_TTL",
    "JSON_PRETTY_PRINT",
    "FEATURE_REALTIME",
    "FEATURE_ALERTS",
    "FEATURE_MULTISERVICE",
    "FEATURE_ANALYTICS",
  ],
  validators: {
    NODE_ENV: (val) => {
      const valid = ["development", "staging", "production", "test"];
      if (!valid.includes(val)) {
        throw new Error(
          `NODE_ENV must be one of: ${valid.join(", ")}, got: ${val}`
        );
      }
      return true;
    },
    SERVER_PORT: (val) => {
      const port = parseInt(val);
      if (isNaN(port) || port < 1 || port > 65535) {
        throw new Error(
          `SERVER_PORT must be a valid port (1-65535), got: ${val}`
        );
      }
      return true;
    },
    DATABASE_URL: (val) => {
      if (!val || val.trim() === "") {
        throw new Error("DATABASE_URL cannot be empty");
      }
      // Validate format (sqlite:// or postgresql://)
      if (!val.match(/^(sqlite|postgresql):\/\//i)) {
        throw new Error(
          `DATABASE_URL must start with sqlite:// or postgresql://, got: ${val}`
        );
      }
      return true;
    },
    LOG_LEVEL: (val) => {
      const valid = ["debug", "info", "warn", "error"];
      if (val && !valid.includes(val)) {
        throw new Error(
          `LOG_LEVEL must be one of: ${valid.join(", ")}, got: ${val}`
        );
      }
      return true;
    },
    MAX_CONNECTIONS: (val) => {
      if (val) {
        const num = parseInt(val);
        if (isNaN(num) || num < 1) {
          throw new Error(`MAX_CONNECTIONS must be a positive number, got: ${val}`);
        }
      }
      return true;
    },
    REQUEST_TIMEOUT: (val) => {
      if (val) {
        const num = parseInt(val);
        if (isNaN(num) || num < 1000) {
          throw new Error(
            `REQUEST_TIMEOUT must be >= 1000ms, got: ${val}`
          );
        }
      }
      return true;
    },
  },
};

/**
 * Validate configuration
 * @throws {Error} If validation fails
 * @returns {Object} Validation result with warnings/errors
 */
function validateConfig() {
  const errors = [];
  const warnings = [];
  const config = {};

  // Check required variables
  CONFIG_SCHEMA.required.forEach((key) => {
    const value = process.env[key];
    if (!value || value.trim() === "") {
      errors.push(`Missing required environment variable: ${key}`);
    } else {
      config[key] = value;
    }
  });

  // Check optional variables and apply validators
  CONFIG_SCHEMA.optional.forEach((key) => {
    const value = process.env[key];
    if (value) {
      config[key] = value;
    }
  });

  // Run custom validators
  Object.entries(CONFIG_SCHEMA.validators).forEach(([key, validator]) => {
    try {
      const value = process.env[key];
      if (value !== undefined && value !== "") {
        validator(value);
      }
    } catch (err) {
      errors.push(err.message);
    }
  });

  // Environment-specific checks
  if (process.env.NODE_ENV === "production") {
    if (!process.env.DATABASE_URL?.startsWith("postgresql://")) {
      warnings.push(
        "⚠️  Production environment detected but using SQLite. Consider PostgreSQL for production."
      );
    }
    if (process.env.CORS_ORIGINS?.includes("localhost")) {
      warnings.push(
        "⚠️  Production environment has localhost in CORS_ORIGINS"
      );
    }
  }

  // Platform-specific warnings
  if (process.env.DEPLOYMENT_PLATFORM === "vercel") {
    if (!process.env.DATABASE_URL?.startsWith("postgresql://")) {
      warnings.push(
        "ℹ️  Vercel deployment benefits from PostgreSQL. SQLite may have issues on serverless."
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    config,
  };
}

/**
 * Log configuration details (safe - no secrets)
 * @param {Object} config Configuration object
 */
function logConfiguration(config) {
  console.log("\n📋 Configuration Loaded:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const safeConfig = {
    "Environment": config.NODE_ENV,
    "Port": config.SERVER_PORT,
    "Database Type": config.DATABASE_URL?.split("://")[0].toUpperCase(),
    "API URL": config.VITE_API_URL,
    "Log Level": config.LOG_LEVEL || "info",
    "Cache TTL": config.STATS_CACHE_TTL || "300s",
    "Features": [
      process.env.FEATURE_REALTIME === "true" && "✓ Real-time",
      process.env.FEATURE_ALERTS === "true" && "✓ Alerts",
      process.env.FEATURE_MULTISERVICE === "true" && "✓ Multi-service",
      process.env.FEATURE_ANALYTICS === "true" && "✓ Analytics",
    ]
      .filter(Boolean)
      .join(" | "),
  };

  Object.entries(safeConfig).forEach(([key, value]) => {
    if (value) {
      console.log(`  ${key.padEnd(16)}: ${value}`);
    }
  });

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

/**
 * Initialize and validate config on startup
 * @throws {Error} If critical validation fails
 */
function initializeConfig() {
  const result = validateConfig();

  if (result.warnings.length > 0) {
    result.warnings.forEach((warning) => {
      console.warn(warning);
    });
  }

  if (!result.valid) {
    console.error("\n❌ Configuration Validation Failed:");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    result.errors.forEach((error) => {
      console.error(`  ✗ ${error}`);
    });
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    throw new Error("Configuration validation failed. See errors above.");
  }

  logConfiguration(result.config);
  return result;
}

module.exports = {
  validateConfig,
  initializeConfig,
  logConfiguration,
  CONFIG_SCHEMA,
};
