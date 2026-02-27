/**
 * Logger service for the Tracker middleware
 * Provides structured logging with different levels: info, warn, error
 */

const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "logs");
const LOG_FILE = path.join(LOG_DIR, "tracker.log");

// Create logs directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Format log message with timestamp and level
 * @param {string} level - Log level (INFO, WARN, ERROR)
 * @param {string} message - Log message
 * @returns {string} Formatted log string
 */
function formatLog(level, message) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}`;
}

/**
 * Write log to file
 * @param {string} logMessage - Formatted log message
 * @param {object} data - Additional data to log
 */
function writeLog(logMessage, data = null) {
  const fullMessage = data ? `${logMessage}\n${JSON.stringify(data, null, 2)}\n` : `${logMessage}\n`;
  
  fs.appendFile(LOG_FILE, fullMessage, (err) => {
    if (err) {
      console.error("Failed to write to log file:", err);
    }
  });
}

const logger = {
  /**
   * Info level logging
   */
  info: (message, data = null) => {
    const logMessage = formatLog("INFO", message);
    console.log(logMessage);
    writeLog(logMessage, data);
  },

  /**
   * Warning level logging
   */
  warn: (message, data = null) => {
    const logMessage = formatLog("WARN", message);
    console.warn(logMessage);
    writeLog(logMessage, data);
  },

  /**
   * Error level logging
   */
  error: (message, error = null) => {
    const logMessage = formatLog("ERROR", message);
    console.error(logMessage);
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error;
    writeLog(logMessage, errorData);
  }
};

module.exports = logger;
