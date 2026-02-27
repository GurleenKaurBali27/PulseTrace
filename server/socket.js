const { Server } = require("socket.io");

/**
 * Initialize Socket.io for real-time log updates
 * @param {http.Server} httpServer - Express HTTP server instance
 * @returns {Server} Socket.io server instance
 */
function initializeSocketIO(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: [
        "http://localhost:3000",    // React dev server (configured port)
        "http://localhost:5173",    // Vite default dev server port
        "http://localhost:4000"     // Test API server (for Socket.io tests)
      ],
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ["websocket", "polling"]
  });

  // Connection event
  io.on("connection", (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Emit a new log to all connected clients
 * @param {Server} io - Socket.io server instance
 * @param {object} log - The log object created
 */
function emitNewLog(io, log) {
  if (!io) return;
  
  io.emit("new_log", {
    success: true,
    data: log
  });
}

/**
 * Emit updated filters/stats
 * @param {Server} io - Socket.io server instance
 * @param {string} eventName - Name of the event
 * @param {object} data - Data to emit
 */
function emitEvent(io, eventName, data) {
  if (!io) return;
  io.emit(eventName, data);
}

module.exports = {
  initializeSocketIO,
  emitNewLog,
  emitEvent
};
