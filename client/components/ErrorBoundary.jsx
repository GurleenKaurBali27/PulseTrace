import React from "react";

/**
 * Error Boundary Component
 * Catches React component rendering errors and displays fallback UI
 * Prevents entire app from crashing due to component errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for monitoring
    console.error("🚨 Error Boundary caught:", error);
    console.error("Error Info:", errorInfo);

    // Store full error info for debugging
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Send error to monitoring service (optional)
    if (process.env.REACT_APP_ERROR_TRACKING_URL) {
      this.reportErrorToService(error, errorInfo);
    }
  }

  reportErrorToService = (error, errorInfo) => {
    try {
      fetch(process.env.REACT_APP_ERROR_TRACKING_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: error?.toString(),
          stack: errorInfo?.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }),
      }).catch((err) => {
        console.error("Failed to report error:", err);
      });
    } catch (err) {
      console.error("Error reporting error:", err);
    }
  };

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            backgroundColor: "#f5f5f5",
          }}
        >
          <div
            style={{
              maxWidth: "600px",
              width: "90%",
              backgroundColor: "#fff",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              padding: "40px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>
              😞
            </div>

            <h1
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: "10px",
              }}
            >
              Something Went Wrong
            </h1>

            <p
              style={{
                color: "#6b7280",
                fontSize: "16px",
                marginBottom: "20px",
              }}
            >
              The application encountered an unexpected error. Our team has been
              notified.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details
                style={{
                  marginBottom: "20px",
                  padding: "15px",
                  backgroundColor: "#f3f4f6",
                  borderRadius: "4px",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <summary style={{ fontWeight: "bold", marginBottom: "10px" }}>
                  Error Details (Development Only)
                </summary>
                <pre
                  style={{
                    overflow: "auto",
                    fontSize: "12px",
                    color: "#d32f2f",
                    marginTop: "10px",
                  }}
                >
                  {this.state.error?.toString()}
                  {"\n\n"}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            {this.state.errorCount > 1 && (
              <div
                style={{
                  padding: "10px",
                  backgroundColor: "#fef3c7",
                  border: "1px solid #f59e0b",
                  borderRadius: "4px",
                  marginBottom: "20px",
                  color: "#92400e",
                  fontSize: "14px",
                }}
              >
                ⚠️ Multiple errors detected ({this.state.errorCount} total).
                Persistent issues may require a page reload.
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                onClick={this.resetError}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Try Again
              </button>

              <button
                onClick={() => window.location.href = "/"}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e5e7eb",
                  color: "#1f2937",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Go Home
              </button>

              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#f3f4f6",
                  color: "#1f2937",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Reload Page
              </button>
            </div>

            <p style={{ marginTop: "20px", fontSize: "12px", color: "#9ca3af" }}>
              Error ID: {Date.now()}
              {this.state.errorCount > 1 && ` | Count: ${this.state.errorCount}`}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
