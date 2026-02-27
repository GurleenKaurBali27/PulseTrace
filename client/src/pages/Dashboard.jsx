import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { initializeSocket, onNewLog, disconnectSocket } from "../services/socket";
import FilterBar from "../components/FilterBar";
import AnalyticsSummary from "../components/AnalyticsSummary";
import AlertsPanel from "../components/AlertsPanel";
import ServiceSelector from "../components/ServiceSelector";

/**
 * Generate a CURL command from log data
 */
function generateCurlCommand(log) {
  let curl = `curl -X ${log.method} "http://localhost:4000${log.route}"`;

  // Add request body if present
  if (log.requestBody) {
    try {
      const bodyStr = typeof log.requestBody === 'string' ? log.requestBody : JSON.stringify(log.requestBody);
      curl += ` -H "Content-Type: application/json" -d '${bodyStr}'`;
    } catch (e) {
      // Fail silently if body parsing fails
    }
  }

  return curl;
}

/**
 * Get duration color based on milliseconds
 */
function getDurationColor(ms) {
  if (ms > 2000) return "#d32f2f"; // Red for >2s
  if (ms > 500) return "#fbc02d";  // Yellow for >500ms
  return "#4caf50";                // Green for normal
}

/**
 * Copy text to clipboard
 */
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    console.log("✅ Copied to clipboard");
  });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [filters, setFilters] = useState({
    statusRange: null,
    method: null,
    route: ""
  });
  const [loading, setLoading] = useState(false);
  const unsubscribeRef = useRef(null);

  // Build query parameters from filters and service
  const buildQueryParams = () => {
    const params = new URLSearchParams();

    if (selectedService) {
      params.append("service", selectedService);
    }

    if (filters.statusRange) {
      params.append("statusRange", filters.statusRange);
    }

    if (filters.method) {
      params.append("method", filters.method);
    }

    if (filters.route) {
      params.append("route", filters.route);
    }

    return params.toString();
  };

  // Fetch logs with filters
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const queryParams = buildQueryParams();
      const url = `/logs${queryParams ? "?" + queryParams : ""}`;
      const res = await api.get(url);
      setLogs(res.data?.data || res.data);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initialize Socket.io connection
    const socket = initializeSocket("http://localhost:5000");

    // Listen for new logs from the server
    unsubscribeRef.current = onNewLog(({ data: newLog }) => {
      console.log("📨 New log received via WebSocket:", newLog.route);
      
      // Check if the new log matches the current filters
      if (matchesFilters(newLog, filters)) {
        // Prepend new log to the list
        setLogs((prevLogs) => [newLog, ...prevLogs]);
      }
    });

    // Fetch logs immediately when filters or service change
    fetchLogs();

    // Also set up periodic sync every 5 seconds for consistency
    const interval = setInterval(fetchLogs, 5000);

    // Cleanup
    return () => {
      clearInterval(interval);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [filters, selectedService]);

  // Helper function to check if a log matches current filters
  const matchesFilters = (log, currentFilters) => {
    // Check status range filter
    if (currentFilters.statusRange) {
      const range = currentFilters.statusRange.toLowerCase();
      const code = log.statusCode;
      const inRange =
        (range === "2xx" && code >= 200 && code < 300) ||
        (range === "3xx" && code >= 300 && code < 400) ||
        (range === "4xx" && code >= 400 && code < 500) ||
        (range === "5xx" && code >= 500 && code < 600);
      if (!inRange) return false;
    }

    // Check method filter
    if (currentFilters.method && log.method !== currentFilters.method) {
      return false;
    }

    // Check route search filter
    if (currentFilters.route) {
      if (!log.route.toLowerCase().includes(currentFilters.route.toLowerCase())) {
        return false;
      }
    }

    return true;
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleServiceChange = (service) => {
    setSelectedService(service);
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ margin: 0 }}>🚀 API Failure Visualizer</h1>
        <button
          onClick={() => navigate("/analytics")}
          style={{
            padding: "10px 16px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#1976D2")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#2196F3")}
        >
          📊 Analytics & Insights
        </button>
      </div>

      {/* Alerts Panel */}
      <AlertsPanel selectedService={selectedService} />

      {/* Analytics Summary */}
      <AnalyticsSummary logs={logs} />

      {/* Service Selector */}
      <div style={{ maxWidth: "250px" }}>
        <ServiceSelector selectedService={selectedService} onServiceChange={handleServiceChange} />
      </div>

      {/* Filter Bar */}
      <FilterBar onFilterChange={handleFilterChange} currentFilters={filters} />

      {/* Results Info */}
      <div style={{ marginBottom: "15px", color: "#666", fontSize: "14px" }}>
        {loading ? (
          <span>⏳ Loading...</span>
        ) : (
          <span>📊 Showing {logs?.length || 0} log(s)</span>
        )}
      </div>

      {/* Table */}
      <table border="1" cellPadding="10" width="100%" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#f5f5f5" }}>
            <th>Service</th>
            <th>Route</th>
            <th>Method</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Size</th>
            <th>Time</th>
            <th style={{ width: "80px", textAlign: "center" }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          <AnimatePresence>
            {logs?.map((log) => (
              <motion.tr
                key={log.id}
                layout
                initial={{ opacity: 0, x: -50, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, x: 50, height: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                onClick={() => navigate(`/logs/${log.id}`)}
                style={{
                  cursor: "pointer",
                  backgroundColor: "white",
                  transition: "background-color 0.2s",
                  borderBottom: "1px solid #ddd"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f9f9f9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "white";
                }}
              >
                <td style={{ fontSize: "12px", color: "#666", fontFamily: "monospace" }}>{log.serviceName || "default-service"}</td>
                <td>{log.route}</td>
                <td>
                  <span
                    style={{
                      backgroundColor:
                        log.method === "GET"
                          ? "#cce5ff"
                          : log.method === "POST"
                          ? "#fff4cc"
                          : log.method === "PUT"
                          ? "#ffe6cc"
                          : log.method === "DELETE"
                          ? "#ffcccc"
                          : "#f0f0f0",
                      padding: "4px 8px",
                      borderRadius: "3px",
                      minWidth: "45px",
                      display: "inline-block",
                      textAlign: "center",
                      fontWeight: "bold",
                      fontSize: "12px"
                    }}
                  >
                    {log.method}
                  </span>
                </td>
                <td
                  style={{
                    color: log.statusCode >= 400 ? "red" : "green",
                    fontWeight: "bold"
                  }}
                >
                  {log.statusCode >= 400 ? "❌" : "✅"} {log.statusCode}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    color: getDurationColor(log.duration),
                    fontWeight: "bold",
                    backgroundColor: getDurationColor(log.duration) === "#d32f2f" ? "#ffebee" : getDurationColor(log.duration) === "#fbc02d" ? "#fffde7" : "transparent"
                  }}
                >
                  {log.duration}ms
                </td>
                <td style={{ textAlign: "right" }}>{log.responseSize} B</td>
                <td style={{ fontSize: "12px", color: "#666" }}>
                  {new Date(log.createdAt).toLocaleTimeString()}
                </td>
                <td style={{ textAlign: "center" }}>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(generateCurlCommand(log));
                    }}
                    title="Copy CURL command"
                    style={{
                      backgroundColor: "#0066cc",
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "bold",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#0052a3";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#0066cc";
                    }}
                  >
                    📋 Copy
                  </motion.button>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>

      {logs?.length === 0 && !loading && (
        <p style={{ textAlign: "center", color: "#999", marginTop: "20px" }}>
          No logs match your filters. Try adjusting your search criteria.
        </p>
      )}
    </div>
  );
}