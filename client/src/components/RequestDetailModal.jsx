import { useState, useEffect } from "react";
import { fetchLogDetail } from "../services/api";

export default function RequestDetailModal({ logId, onClose }) {
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("request");

  useEffect(() => {
    loadLogDetail();
  }, [logId]);

  const loadLogDetail = async () => {
    try {
      setLoading(true);
      const data = await fetchLogDetail(logId);
      setLog(data.data || data);
    } catch (error) {
      console.error("Error loading log detail:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.modalOverlay}>
        <div style={styles.modalContent}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!log) {
    return (
      <div style={styles.modalOverlay}>
        <div style={styles.modalContent}>
          <p>Failed to load log details</p>
          <button onClick={onClose} style={styles.closeBtn}>
            Close
          </button>
        </div>
      </div>
    );
  }

  const details = typeof log.details === "string" ? JSON.parse(log.details) : log.details;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2>Request Details</h2>
          <span
            style={{
              ...styles.statusBadge,
              backgroundColor: log.statusCode >= 400 ? "#ff4444" : "#44ff44"
            }}
          >
            {log.statusCode}
          </span>
          <button onClick={onClose} style={styles.closeBtn}>
            ✕
          </button>
        </div>

        {/* Summary */}
        <div style={styles.summary}>
          <div>
            <strong>Method:</strong> {log.method}
          </div>
          <div>
            <strong>Route:</strong> {log.route}
          </div>
          <div>
            <strong>Duration:</strong> {log.duration}ms
          </div>
          <div>
            <strong>Request ID:</strong> <code>{log.requestId}</code>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab("request")}
            style={{
              ...styles.tab,
              borderBottom: activeTab === "request" ? "3px solid #007bff" : "none"
            }}
          >
            Request
          </button>
          <button
            onClick={() => setActiveTab("response")}
            style={{
              ...styles.tab,
              borderBottom: activeTab === "response" ? "3px solid #007bff" : "none"
            }}
          >
            Response
          </button>
          <button
            onClick={() => setActiveTab("raw")}
            style={{
              ...styles.tab,
              borderBottom: activeTab === "raw" ? "3px solid #007bff" : "none"
            }}
          >
            Raw JSON
          </button>
        </div>

        {/* Content */}
        <div style={styles.tabContent}>
          {activeTab === "request" && details && (
            <div>
              <h3>Request Headers</h3>
              <pre style={styles.codeBlock}>
                {JSON.stringify(details.request?.headers || {}, null, 2)}
              </pre>

              {details.request?.query && Object.keys(details.request.query).length > 0 && (
                <>
                  <h3>Query Parameters</h3>
                  <pre style={styles.codeBlock}>
                    {JSON.stringify(details.request.query, null, 2)}
                  </pre>
                </>
              )}

              {details.request?.body && (
                <>
                  <h3>Request Body</h3>
                  <pre style={styles.codeBlock}>
                    {JSON.stringify(details.request.body, null, 2)}
                  </pre>
                </>
              )}

              {details.request?.ip && (
                <div>
                  <strong>Client IP:</strong> {details.request.ip}
                </div>
              )}

              {details.request?.userAgent && (
                <div>
                  <strong>User Agent:</strong> {details.request.userAgent}
                </div>
              )}
            </div>
          )}

          {activeTab === "response" && details && (
            <div>
              <h3>Response Headers</h3>
              <pre style={styles.codeBlock}>
                {JSON.stringify(details.response?.headers || {}, null, 2)}
              </pre>

              <h3>Response Body</h3>
              <pre style={styles.codeBlock}>
                {typeof details.response?.body === "string"
                  ? details.response.body
                  : JSON.stringify(details.response?.body || {}, null, 2)}
              </pre>

              <div>
                <strong>Response Size:</strong> {details.response?.size} bytes
              </div>
            </div>
          )}

          {activeTab === "raw" && (
            <pre style={styles.codeBlock}>{JSON.stringify(log, null, 2)}</pre>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: "8px",
    maxWidth: "900px",
    width: "90%",
    maxHeight: "85vh",
    overflowY: "auto",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
    padding: "20px"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #ddd",
    paddingBottom: "15px",
    marginBottom: "15px"
  },
  statusBadge: {
    padding: "5px 10px",
    borderRadius: "5px",
    color: "white",
    fontWeight: "bold",
    marginRight: "10px"
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#666"
  },
  summary: {
    backgroundColor: "#f5f5f5",
    padding: "15px",
    borderRadius: "5px",
    marginBottom: "15px"
  },
  tabs: {
    display: "flex",
    borderBottom: "1px solid #ddd",
    marginBottom: "15px"
  },
  tab: {
    padding: "10px 20px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    color: "#666"
  },
  tabContent: {
    maxHeight: "calc(85vh - 300px)",
    overflowY: "auto"
  },
  codeBlock: {
    backgroundColor: "#f5f5f5",
    border: "1px solid #ddd",
    borderRadius: "5px",
    padding: "10px",
    overflowX: "auto",
    fontSize: "12px",
    fontFamily: "monospace",
    marginBottom: "15px"
  }
};
