/**
 * AnalyticsSummary Component
 * Displays key metrics and statistics about API requests
 */

export default function AnalyticsSummary({ logs = [] }) {
  // Calculate metrics
  const metrics = calculateMetrics(logs);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📊 Analytics Overview</h2>
      
      <div style={styles.gridContainer}>
        {/* Total Requests Card */}
        <MetricCard
          title="Total Requests"
          value={metrics.totalRequests}
          icon="📈"
          color="#4CAF50"
          subtitle="All API calls tracked"
        />

        {/* Error Rate Card */}
        <MetricCard
          title="Error Rate"
          value={`${metrics.errorRate.toFixed(1)}%`}
          icon="⚠️"
          color={metrics.errorRate > 20 ? "#FF6B6B" : "#FFA500"}
          subtitle={`${metrics.errorCount} errors out of ${metrics.totalRequests}`}
        />

        {/* Average Response Time Card */}
        <MetricCard
          title="Avg Response Time"
          value={`${metrics.avgDuration.toFixed(0)}ms`}
          icon="⏱️"
          color="#2196F3"
          subtitle={`Min: ${metrics.minDuration}ms | Max: ${metrics.maxDuration}ms`}
        />

        {/* Success Rate Card */}
        <MetricCard
          title="Success Rate"
          value={`${metrics.successRate.toFixed(1)}%`}
          icon="✅"
          color="#8BC34A"
          subtitle={`${metrics.successCount} successful requests`}
        />

        {/* Most Used Method Card */}
        <MetricCard
          title="Most Used Method"
          value={metrics.mostUsedMethod || "N/A"}
          icon="🔀"
          color="#9C27B0"
          subtitle={`${metrics.methodCounts[metrics.mostUsedMethod] || 0} requests`}
        />

        {/* Slowest Endpoint Card */}
        <MetricCard
          title="Slowest Endpoint"
          value={metrics.slowestEndpoint || "N/A"}
          icon="🐌"
          color="#FF9800"
          subtitle={`${metrics.slowestEndpointTime}ms average`}
        />
      </div>

      {/* Detailed Stats Section */}
      <div style={styles.detailsSection}>
        <div style={styles.detailsBox}>
          <h3>📌 Status Code Breakdown</h3>
          <div style={styles.statsList}>
            {Object.entries(metrics.statusCounts)
              .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
              .map(([code, count]) => (
                <div key={code} style={styles.statItem}>
                  <span style={{ fontWeight: "bold" }}>{code}:</span>
                  <span style={{ marginLeft: "10px" }}>{count} requests</span>
                  <span style={{ marginLeft: "10px", color: "#666", fontSize: "12px" }}>
                    ({((count / metrics.totalRequests) * 100).toFixed(1)}%)
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div style={styles.detailsBox}>
          <h3>🔀 HTTP Methods Used</h3>
          <div style={styles.statsList}>
            {Object.entries(metrics.methodCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([method, count]) => (
                <div key={method} style={styles.statItem}>
                  <span style={{ fontWeight: "bold", color: getMethodColor(method) }}>
                    {method}:
                  </span>
                  <span style={{ marginLeft: "10px" }}>{count} requests</span>
                  <span style={{ marginLeft: "10px", color: "#666", fontSize: "12px" }}>
                    ({((count / metrics.totalRequests) * 100).toFixed(1)}%)
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Metric Card Component
 */
function MetricCard({ title, value, icon, color, subtitle }) {
  return (
    <div style={{ ...styles.card, borderLeftColor: color }}>
      <div style={styles.cardHeader}>
        <span style={styles.icon}>{icon}</span>
        <h3 style={styles.cardTitle}>{title}</h3>
      </div>
      <div style={{ ...styles.cardValue, color }}>{value}</div>
      <p style={styles.cardSubtitle}>{subtitle}</p>
    </div>
  );
}

/**
 * Calculate all metrics from logs array
 */
function calculateMetrics(logs) {
  const totalRequests = logs.length;

  if (totalRequests === 0) {
    return {
      totalRequests: 0,
      errorCount: 0,
      errorRate: 0,
      successCount: 0,
      successRate: 0,
      avgDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      statusCounts: {},
      methodCounts: {},
      mostUsedMethod: null,
      slowestEndpoint: null,
      slowestEndpointTime: 0
    };
  }

  // Count errors (4xx and 5xx)
  const errorCount = logs.filter((log) => log.statusCode >= 400).length;
  const successCount = totalRequests - errorCount;
  const errorRate = (errorCount / totalRequests) * 100;
  const successRate = (successCount / totalRequests) * 100;

  // Calculate response time metrics
  const durations = logs.map((log) => log.duration);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / totalRequests;
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);

  // Count by status code
  const statusCounts = {};
  logs.forEach((log) => {
    statusCounts[log.statusCode] = (statusCounts[log.statusCode] || 0) + 1;
  });

  // Count by HTTP method
  const methodCounts = {};
  logs.forEach((log) => {
    methodCounts[log.method] = (methodCounts[log.method] || 0) + 1;
  });

  // Get most used method
  const mostUsedMethod = Object.keys(methodCounts).reduce((a, b) =>
    methodCounts[a] > methodCounts[b] ? a : b
  );

  // Calculate average duration by endpoint
  const endpointDurations = {};
  logs.forEach((log) => {
    if (!endpointDurations[log.route]) {
      endpointDurations[log.route] = [];
    }
    endpointDurations[log.route].push(log.duration);
  });

  const endpointAvgDurations = Object.entries(endpointDurations).map(
    ([endpoint, times]) => ({
      endpoint,
      avgTime: times.reduce((a, b) => a + b, 0) / times.length
    })
  );

  const slowestEndpointObj = endpointAvgDurations.reduce((a, b) =>
    a.avgTime > b.avgTime ? a : b
  );

  return {
    totalRequests,
    errorCount,
    errorRate,
    successCount,
    successRate,
    avgDuration,
    minDuration,
    maxDuration,
    statusCounts,
    methodCounts,
    mostUsedMethod,
    slowestEndpoint: slowestEndpointObj.endpoint,
    slowestEndpointTime: slowestEndpointObj.avgTime.toFixed(0)
  };
}

/**
 * Get color for HTTP method
 */
function getMethodColor(method) {
  const colors = {
    GET: "#0066cc",
    POST: "#cc8800",
    PUT: "#cc6600",
    DELETE: "#cc0000",
    PATCH: "#008800"
  };
  return colors[method] || "#666";
}

const styles = {
  container: {
    marginBottom: "30px"
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "20px",
    color: "#333"
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "15px",
    marginBottom: "30px"
  },
  card: {
    backgroundColor: "white",
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "20px",
    borderLeft: "4px solid #2196F3",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "default"
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: "10px"
  },
  icon: {
    fontSize: "28px",
    marginRight: "10px"
  },
  cardTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#666",
    margin: 0
  },
  cardValue: {
    fontSize: "32px",
    fontWeight: "bold",
    margin: "10px 0",
    color: "#2196F3"
  },
  cardSubtitle: {
    fontSize: "12px",
    color: "#999",
    margin: "5px 0 0 0"
  },
  detailsSection: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px"
  },
  detailsBox: {
    backgroundColor: "#f9f9f9",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    padding: "20px"
  },
  statsList: {
    marginTop: "15px"
  },
  statItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #eee"
  }
};
