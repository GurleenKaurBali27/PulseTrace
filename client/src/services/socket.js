/**
 * Socket.io service for real-time log updates
 * Handles WebSocket connections to the visualizer server
 */

// Socket.io instance
let socket = null;
let io = null;

// Try to import socket.io-client dynamically
async function loadSocketIO() {
  if (io) return io;

  try {
    // Try to load from npm/bundler
    const module = await import("socket.io-client");
    io = module.default || module.io;
    return io;
  } catch (err) {
    console.warn("socket.io-client not found via import, trying CDN...");
    // Try to use global io if loaded from CDN
    if (typeof window !== "undefined" && window.io) {
      io = window.io;
      return io;
    }
    throw new Error(
      "socket.io-client not available. Install with: npm install socket.io-client"
    );
  }
}

/**
 * Initialize Socket.io connection to the server
 * @param {string} serverUrl - Server URL (default: http://localhost:5000)
 * @returns {Promise<Socket>} Socket instance
 */
export async function initializeSocket(serverUrl = "http://localhost:5000") {
  if (socket) {
    return socket;
  }

  try {
    const ioModule = await loadSocketIO();

    socket = ioModule(serverUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ["websocket", "polling"]
    });

    // Connection events
    socket.on("connect", () => {
      console.log("✅ Connected to server via WebSocket");
    });

    socket.on("disconnect", (reason) => {
      console.log(`⚠️  Disconnected from server: ${reason}`);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ WebSocket connection error:", error);
    });

    return socket;
  } catch (err) {
    console.error("Failed to initialize Socket.io:", err);
    // Return a mock socket that doesn't emit anything
    return {
      on: () => {},
      off: () => {},
      emit: () => {},
      disconnect: () => {}
    };
  }
}

/**
 * Get the current socket instance
 * @returns {Socket} Socket instance
 */
export function getSocket() {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    return {
      on: () => {},
      off: () => {},
      emit: () => {},
      disconnect: () => {}
    };
  }
  return socket;
}

/**
 * Listen for new logs
 * @param {Function} callback - Function to call when new log arrives
 * @returns {Function} Unsubscribe function
 */
export function onNewLog(callback) {
  const s = getSocket();
  s.on("new_log", callback);

  // Return unsubscribe function
  return () => {
    s.off("new_log", callback);
  };
}

/**
 * Disconnect the socket
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default {
  initializeSocket,
  getSocket,
  onNewLog,
  disconnectSocket
};
