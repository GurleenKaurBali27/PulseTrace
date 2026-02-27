import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchLogDetail } from "../services/api";

/**
 * RequestDetailPage Component
 * Full-page view for detailed request information
 * Accessed via /logs/:id route
 */
export default function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadLogDetail();
  }, [id]);

  const loadLogDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchLogDetail(id);
      setLog(response.data || response);
    } catch (err) {
      console.error("Error loading log detail:", err);
      setError("Failed to load request details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContent}>
          <p style={{ fontSize: "18px", fontWeight: "bold" }}>⏳ Loading request details...</p>
        </div>
      </div>
    );
  }

  if (error || !log) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContent}>
          <h2>❌ Error</h2>
          <p>{error || "Request not found"}</p>
          <button
            onClick={() => navigate("/")}
            style={styles.primaryButton}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const details = typeof log.details === "string" ? JSON.parse(log.details) : log.details || {};
  const statusColor = log.statusCode >= 400 ? "#d32f2f" : log.statusCode >= 300 ? "#ff9800" : "#4caf50";
  const durationColor = log.duration > 2000 ? "#d32f2f" : log.duration > 500 ? "#fbc02d" : "#4caf50";

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button
          onClick={() => navigate("/")}
          style={styles.backButton}
          title="Back to Dashboard"
        >
          ← Back
        </button>
        <h1 style={styles.title}>Request Details</h1>
        <span style={{ ...styles.statusBadge, backgroundColor: statusColor }}>
          {log.statusCode}
        </span>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Overview Tab */}
        <div style={styles.tabButtonsContainer}>
          <button
            onClick={() => setActiveTab("overview")}
            style={{
              ...styles.tabButton,
              borderBottom: activeTab === "overview" ? "3px solid #0066cc" : "none",
              color: activeTab === "overview" ? "#0066cc" : "#666"
            }}
          >
            📋 Overview
          </button>
          <button
            onClick={() => setActiveTab("details")}
            style={{
              ...styles.tabButton,
              borderBottom: activeTab === "details" ? "3px solid #0066cc" : "none",
              color: activeTab === "details" ? "#0066cc" : "#666"
            }}
          >
            📝 Full Details
          </button>
          <button
            onClick={() => setActiveTab("raw")}
            style={{
              ...styles.tabButton,
              borderBottom: activeTab === "raw" ? "3px solid #0066cc" : "none",
              color: activeTab === "raw" ? "#0066cc" : "#666"
            }}
          >
            💻 Raw JSON
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div style={styles.tabContent}>
            <div style={styles.summaryGrid}>
              {/* Request ID */}
              <div style={styles.summaryItem}>
                <label style={styles.label}>Request ID</label>
                <code style={styles.code}>{log.requestId}</code>
              </div>

              {/* Method */}
              <div style={styles.summaryItem}>
                <label style={styles.label}>Method</label>
                <span style={{
                  ...styles.badge,
                  backgroundColor: log.method === "GET" ? "#cce5ff" : "#fff4cc"
                }}>
                  {log.method}
                </span>
              </div>

              {/* Route */}
              <div style={styles.summaryItem}>
                <label style={styles.label}>Route</label>
                <code style={styles.code}>{log.route}</code>
              </div>

              {/* Status Code */}
              <div style={styles.summaryItem}>
                <label style={styles.label}>Status Code</label>
                <span style={{ ...styles.badge, backgroundColor: statusColor, color: "#fff" }}>
                  {log.statusCode}
                </span>
              </div>

              {/* Duration */}
              <div style={styles.summaryItem}>
                <label style={styles.label}>Duration</label>
                <span style={{ ...styles.badge, backgroundColor: durationColor, color: "#fff" }}>
                  {log.duration}ms
                </span>
              </div>

              {/* Response Size */}
              <div style={styles.summaryItem}>
                <label style={styles.label}>Response Size</label>
                <span style={styles.code}>{log.responseSize} bytes</span>
              </div>

              {/* Timestamp */}
              <div style={{ ...styles.summaryItem, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Timestamp</label>
                <span style={styles.code}>
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Error (if exists) */}
              {log.error && (
                <div style={{ ...styles.summaryItem, gridColumn: "1 / -1" }}>
                  <label style={{ ...styles.label, color: "#d32f2f" }}>Error Message</label>
                  <div style={{ ...styles.codeBlock, backgroundColor: "#ffebee", color: "#c62828" }}>
                    {log.error}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Details Tab */}
        {activeTab === "details" && (
          <div style={styles.tabContent}>
            <div>
              {/* Headers */}
              {details.headers && Object.keys(details.headers).length > 0 && (
                <div style={styles.detailSection}>
                  <h3 style={styles.sectionTitle}>📨 Request Headers</h3>
                  <div style={styles.codeBlock}>
                    {Object.entries(details.headers).map(([key, value]) => (
                      <div key={key} style={styles.codeLine}>
                        <strong>{key}:</strong> {String(value)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Query Parameters */}
              {details.query && Object.keys(details.query).length > 0 && (
                <div style={styles.detailSection}>
                  <h3 style={styles.sectionTitle}>🔍 Query Parameters</h3>
                  <div style={styles.codeBlock}>
                    {Object.entries(details.query).map(([key, value]) => (
                      <div key={key} style={styles.codeLine}>
                        <strong>{key}:</strong> {String(value)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Request Body */}
              {log.requestBody && (
                <div style={styles.detailSection}>
                  <h3 style={styles.sectionTitle}>📤 Request Body</h3>
                  <pre style={styles.codeBlock}>
                    {typeof log.requestBody === "string"
                      ? log.requestBody
                      : JSON.stringify(log.requestBody, null, 2)}
                  </pre>
                </div>
              )}

              {/* Additional Details */}
              {details.ip && (
                <div style={styles.detailSection}>
                  <h3 style={styles.sectionTitle}>🌐 Network Information</h3>
                  <div style={styles.codeBlock}>
                    <div style={styles.codeLine}>
                      <strong>Client IP:</strong> {details.ip}
                    </div>
                    {details.userAgent && (
                      <div style={styles.codeLine}>
                        <strong>User Agent:</strong> {details.userAgent}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Raw JSON Tab */}
        {activeTab === "raw" && (
          <div style={styles.tabContent}>
            <pre style={styles.codeBlock}>
              {JSON.stringify(log, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f5f7fa",
    padding: "20px",
    fontFamily: "sans-serif"
  },
  loadingContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "40px",
    textAlign: "center"
  },
  errorContent: {
    maxWidth: "600px",
    margin: "50px auto",
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "40px",
    textAlign: "center",
    border: "1px solid #ddd"
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    maxWidth: "1200px",
    margin: "0 auto 30px",
    padding: "20px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
  },
  backButton: {
    backgroundColor: "#0066cc",
    color: "#fff",
    border: "none",
    padding: "10px 15px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    transition: "background-color 0.2s"
  },
  title: {
    flex: 1,
    fontSize: "24px",
    fontWeight: "bold",
    color: "#333",
    margin: 0
  },
  statusBadge: {
    padding: "8px 16px",
    borderRadius: "4px",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "16px"
  },
  content: {
    maxWidth: "1200px",
    margin: "0 auto",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    overflow: "hidden"
  },
  tabButtonsContainer: {
    display: "flex",
    borderBottom: "1px solid #e0e0e0",
    backgroundColor: "#f9f9f9"
  },
  tabButton: {
    flex: 1,
    padding: "15px",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
    textAlign: "center"
  },
  tabContent: {
    padding: "30px"
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px"
  },
  summaryItem: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  label: {
    fontSize: "12px",
    fontWeight: "bold",
    color: "#666",
    textTransform: "uppercase"
  },
  code: {
    fontFamily: "monospace",
    fontSize: "14px",
    padding: "8px 12px",
    backgroundColor: "#f5f5f5",
    borderRadius: "4px",
    wordBreak: "break-all"
  },
  badge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "bold",
    textAlign: "center",
    width: "fit-content"
  },
  codeBlock: {
    fontFamily: "monospace",
    fontSize: "13px",
    backgroundColor: "#f5f5f5",
    padding: "15px",
    borderRadius: "4px",
    overflow: "auto",
    maxHeight: "400px",
    border: "1px solid #e0e0e0"
  },
  codeLine: {
    padding: "4px 0",
    lineHeight: "1.6"
  },
  detailSection: {
    marginBottom: "25px"
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "10px",
    marginTop: 0
  },
  primaryButton: {
    backgroundColor: "#0066cc",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    marginTop: "20px",
    transition: "background-color 0.2s"
  }
};
