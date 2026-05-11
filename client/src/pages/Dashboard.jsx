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
    <div style={{ padding: "30px", maxWidth: "1600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: "0 0 8px 0", fontSize: "28px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "32px" }}>⚡</span> API Visualizer
          </h1>
          <div style={{ color: "var(--text-muted)", fontSize: "14px", display: "flex", alignItems: "center" }}>
            <span className="status-dot active"></span> Live Monitoring Active
          </div>
        </div>
        
        <button
          className="btn-primary"
          onClick={() => navigate("/analytics")}
        >
          📊 Analytics Dashboard
        </button>
      </div>

      {/* Alerts Panel */}
      <AlertsPanel selectedService={selectedService} />

      {/* Analytics Summary */}
      <AnalyticsSummary logs={logs} />

      {/* Controls Container */}
      <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <div style={{ width: "250px" }}>
            <ServiceSelector selectedService={selectedService} onServiceChange={handleServiceChange} />
          </div>
          <div style={{ flex: 1 }}>
             <FilterBar onFilterChange={handleFilterChange} currentFilters={filters} />
          </div>
        </div>
        
        <div style={{ color: "var(--text-muted)", fontSize: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {loading ? (
            <span>⏳ Synchronizing data...</span>
          ) : (
            <span>📊 Showing <strong>{logs?.length || 0}</strong> log(s)</span>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Route</th>
              <th>Method</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Size</th>
              <th>Time</th>
              <th style={{ width: "100px", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            <AnimatePresence>
              {logs?.map((log) => {
                const isError = log.statusCode >= 400;
                return (
                <motion.tr
                  key={log.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => navigate(`/logs/${log.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <td style={{ color: "var(--text-muted)", fontFamily: "monospace" }}>{log.serviceName || "default-service"}</td>
                  <td style={{ fontWeight: 500 }}>{log.route}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: `var(--method-${log.method.toLowerCase()}, rgba(255,255,255,0.1))`,
                        color: "white"
                      }}
                    >
                      {log.method}
                    </span>
                  </td>
                  <td>
                    <span 
                      className="badge"
                      style={{
                        backgroundColor: isError ? "var(--status-danger-bg)" : "var(--status-success-bg)",
                        color: isError ? "var(--status-danger)" : "var(--status-success)",
                        border: `1px solid ${isError ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)"}`
                      }}
                    >
                      {isError ? "🔴" : "🟢"} {log.statusCode}
                    </span>
                  </td>
                  <td
                    style={{
                      color: getDurationColor(log.duration) === "#d32f2f" ? "var(--status-danger)" : 
                             getDurationColor(log.duration) === "#fbc02d" ? "var(--status-warning)" : "var(--text-main)",
                      fontWeight: getDurationColor(log.duration) !== "#4caf50" ? "bold" : "normal"
                    }}
                  >
                    {log.duration}ms
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>{log.responseSize} B</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(generateCurlCommand(log));
                      }}
                      title="Copy CURL command"
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        color: "var(--text-main)",
                        border: "1px solid var(--border-color)",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "500",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                      }}
                    >
                      📋 Copy
                    </motion.button>
                  </td>
                </motion.tr>
              )})}
            </AnimatePresence>
          </tbody>
        </table>

        {logs?.length === 0 && !loading && (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }}>🔍</div>
            <p>No logs match your filters. Try adjusting your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}