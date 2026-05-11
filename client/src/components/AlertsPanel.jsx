import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import "../styles/AlertsPanel.css";

export default function AlertsPanel({ selectedService = "" }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const url = selectedService ? `/alerts?service=${selectedService}` : "/alerts";
      const response = await api.get(url);
      
      if (response.data && response.data.success) {
        setAlerts(response.data.alerts || []);
      }
    } catch (err) {
      console.error("Error fetching alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch alerts on mount and set auto-refresh interval
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [selectedService]);

  // Don't render anything if no alerts
  if (alerts.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="alerts-panel">
      <AnimatePresence mode="popLayout">
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            layout
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={`alert-card alert-${alert.severity}`}
          >
            {/* Severity Badge */}
            <div className={`severity-badge badge-${alert.severity}`}>
              {alert.severity === "critical" ? "🔴" : "⚠️"}
              {alert.severity.toUpperCase()}
            </div>

            {/* Alert Content */}
            <div className="alert-content">
              <div className="alert-message">{alert.message}</div>
              {alert.route && alert.route !== "all" && (
                <div className="alert-route">
                  <span className="label">Route:</span> {alert.route}
                </div>
              )}
              {alert.value && (
                <div className="alert-value">
                  <span className="label">Value:</span> {alert.value}
                </div>
              )}
              <div className="alert-time">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </div>
            </div>

            {/* Alert Icon */}
            <div className="alert-type-icon">
              {alert.type === "error_rate" && "📊"}
              {alert.type === "performance" && "⚡"}
              {alert.type === "repeated_errors" && "🔄"}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
