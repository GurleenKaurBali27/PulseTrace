// Load environment variables from root .env file
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const http = require("http");
const sequelize = require("./database/database");
const app = require("./app");
const { initializeSocketIO } = require("./socket");
const { initializeConfig } = require("./config/validator");
const { startMonitoring, getDetailedReport } = require("./utils/monitoring");
const { runPendingMigrations } = require("./database/migrate");
const logsRouter = require("./routes/logs.routes");
const authRouter = require("./routes/auth.routes");
const orgRouter = require("./routes/org.routes");
require("./models"); // Register models and associations

let server;
let isShuttingDown = false;

/**
 * Graceful shutdown handler
 * Closes connections cleanly before exiting
 */
async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n📋 Received ${signal}, starting graceful shutdown...`);

  // Step 1: Stop accepting new requests
  if (server) {
    server.close(() => {
      console.log("✅ HTTP server closed");
    });
  }

  // Step 2: Close active connections (with timeout)
  const shutdownTimeout = setTimeout(() => {
    console.warn("⚠️  Graceful shutdown timeout, forcing exit");
    process.exit(1);
  }, 30000); // 30 second timeout

  // Step 3: Close database connections
  try {
    await sequelize.close();
    console.log("✅ Database connections closed");
  } catch (err) {
    console.error("❌ Error closing database:", err);
  }

  // Step 4: Print memory report before exit
  try {
    console.log(getDetailedReport());
  } catch (err) {
    // Ignore error in final report
  }

  clearTimeout(shutdownTimeout);
  console.log("🛑 Server shutdown complete");
  process.exit(0);
}

/**
 * Setup signal handlers for graceful shutdown
 */
function setupSignalHandlers() {
  // SIGTERM: Sent by container orchestrators
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

  // SIGINT: Ctrl+C in terminal
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  // SIGHUP: Terminal closed
  process.on("SIGHUP", () => gracefulShutdown("SIGHUP"));

  // Handle uncaught exceptions
  process.on("uncaughtException", (err) => {
    console.error("🚨 Uncaught Exception:", err);
    gracefulShutdown("uncaughtException");
  });

  // Handle unhandled rejections
  process.on("unhandledRejection", (reason, promise) => {
    console.error("🚨 Unhandled Rejection at:", promise, "reason:", reason);
    gracefulShutdown("unhandledRejection");
  });
}

async function startServer() {
  try {
    // Setup signal handlers first
    setupSignalHandlers();

    // 1. Validate configuration
    initializeConfig();

    // 2. Start memory monitoring (optional, disabled by default)
    if (process.env.ENABLE_MEMORY_MONITORING === "true") {
      const interval = parseInt(process.env.MEMORY_CHECK_INTERVAL || 30000);
      startMonitoring(interval);
      console.log(`📊 Memory monitoring enabled (interval: ${interval}ms)`);
    }

    // 3. Test database connection
    const connected = await sequelize.testConnection();
    if (!connected) {
      throw new Error("Failed to connect to database");
    }

    // 4. Run database migrations (or sync for development)
    if (process.env.NODE_ENV === "production" || process.env.ENABLE_MIGRATIONS === "true") {
      // Production: Use migrations
      const migrationResult = await runPendingMigrations();
      console.log(`📊 Migrations applied: ${migrationResult.applied}`);
    } else {
      // Development: Use Sequelize auto-sync for convenience
      await sequelize.sync();
      console.log("✅ Database tables synchronized (development mode)");
    }

    // 5. Create HTTP server and initialize Socket.io
    server = http.createServer(app);
    const io = initializeSocketIO(server);

    // Attach io instance to app for use in routes
    app.io = io;

    // 6. Start listening
    const PORT = process.env.SERVER_PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
      console.log("📡 WebSocket (Socket.io) enabled");
      console.log(`🔄 Graceful shutdown on SIGTERM/SIGINT enabled`);
      console.log();
    });

    // 7. Handle server errors
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      }
      throw err;
    });

  } catch (err) {
    console.error("\n❌ Server startup failed:", err.message);
    if (sequelize) {
      await sequelize.close().catch(() => {});
    }
    process.exit(1);
  }
}

startServer();
