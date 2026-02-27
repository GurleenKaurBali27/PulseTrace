import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";
import api from "../services/api";
import "../styles/Analytics.css";

export default function Analytics() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const serviceParam = searchParams.get("service") || "";

  useEffect(() => {
    fetchStats();
  }, [serviceParam]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const baseURL = api.defaults.baseURL;
      const baseStatsUrl = `${baseURL.replace("/logs", "")}/logs/stats`;
      const url = serviceParam ? `${baseStatsUrl}?service=${serviceParam}` : baseStatsUrl;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.error || "Failed to fetch stats");
      }
    } catch (err) {
      setError(err.message || "Failed to load analytics data");
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="analytics-header">
          <button className="back-button" onClick={() => navigate("/")}>
            ← Back to Dashboard
          </button>
          <h1>Analytics & Insights</h1>
        </div>
        <div className="loading">Loading analytics data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-container">
        <div className="analytics-header">
          <button className="back-button" onClick={() => navigate("/")}>
            ← Back to Dashboard
          </button>
          <h1>Analytics & Insights</h1>
        </div>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchStats} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="analytics-container">
        <div className="analytics-header">
          <button className="back-button" onClick={() => navigate("/")}>
            ← Back to Dashboard
          </button>
          <h1>Analytics & Insights</h1>
        </div>
        <div className="no-data">No analytics data available</div>
      </div>
    );
  }

  // Data for pie chart (Success vs Errors)
  const successErrorData = [
    { name: "Success", value: stats.successCount || 0, fill: "#4caf50" },
    { name: "Errors", value: stats.errorCount || 0, fill: "#d32f2f" }
  ];

  return (
    <div className="analytics-container">
      {/* Header with back button */}
      <div className="analytics-header">
        <button className="back-button" onClick={() => navigate("/")}>
          ← Back to Dashboard
        </button>
        <h1>Analytics & Insights</h1>
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Requests</div>
          <div className="metric-value">{stats.totalRequests || 0}</div>
        </div>

        <div className="metric-card success">
          <div className="metric-label">Successful Requests</div>
          <div className="metric-value">{stats.successCount || 0}</div>
        </div>

        <div className="metric-card error">
          <div className="metric-label">Failed Requests</div>
          <div className="metric-value">{stats.errorCount || 0}</div>
        </div>

        <div className="metric-card warning">
          <div className="metric-label">Failure Rate</div>
          <div className="metric-value">{stats.failureRate || 0}%</div>
        </div>

        <div className="metric-card info">
          <div className="metric-label">Average Duration</div>
          <div className="metric-value">{stats.avgDuration || 0}ms</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Slow Requests (&gt;2s)</div>
          <div className="metric-value">{stats.slowRequests || 0}</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-wrapper">
        {/* Success vs Errors Pie Chart */}
        {(stats.successCount > 0 || stats.errorCount > 0) && (
          <div className="chart-container">
            <h2>Success vs Errors</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={successErrorData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {successErrorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Requests by Method Bar Chart */}
        {stats.requestsByMethod && stats.requestsByMethod.length > 0 && (
          <div className="chart-container">
            <h2>Requests by Method</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.requestsByMethod}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="method" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2196F3" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Slow Routes Bar Chart */}
        {stats.topSlowRoutes && stats.topSlowRoutes.length > 0 && (
          <div className="chart-container">
            <h2>Top Slow Routes (by avg duration)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topSlowRoutes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="route" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80}
                />
                <YAxis label={{ value: "Avg Duration (ms)", angle: -90, position: "insideLeft" }} />
                <Tooltip formatter={(value) => `${value}ms`} />
                <Bar dataKey="avgDuration" fill="#FF9800" name="Avg Duration (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Status Code Breakdown */}
      {stats.requestsByStatus && stats.requestsByStatus.length > 0 && (
        <div className="breakdown-section">
          <h2>Status Code Breakdown</h2>
          <div className="status-breakdown">
            {stats.requestsByStatus.map((item) => (
              <div key={item.statusCode} className="status-item">
                <span className={`status-code status-${item.statusCode}`}>
                  {item.statusCode}
                </span>
                <span className="status-count">{item.count} requests</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
