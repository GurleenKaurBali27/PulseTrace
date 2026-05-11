import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
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
      const url = serviceParam ? `/stats?service=${serviceParam}` : "/stats";
      const response = await api.get(url);
      
      if (response.data && response.data.success) {
        setStats(response.data.data);
      } else {
        throw new Error(response.data?.error || "Failed to fetch stats");
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError(err.response?.data?.error || err.message || "Failed to load analytics data");
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
    { name: "Success", value: stats.successCount || 0, fill: "#10B981" },
    { name: "Errors", value: stats.errorCount || 0, fill: "#EF4444" }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: "var(--bg-panel)",
          backdropFilter: "blur(12px)",
          border: "1px solid var(--border-color)",
          padding: "12px",
          borderRadius: "8px",
          boxShadow: "var(--shadow-md)"
        }}>
          <p style={{ color: "var(--text-main)", margin: "0 0 8px 0", fontWeight: 600 }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color || entry.fill, margin: 0, fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: entry.color || entry.fill }}></span>
              {entry.name}: <span style={{ fontWeight: 700, color: "var(--text-main)" }}>{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

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
      <motion.div 
        className="metrics-grid"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants} className="metric-card">
          <div className="metric-label">Total Requests</div>
          <div className="metric-value">{stats.totalRequests || 0}</div>
        </motion.div>

        <motion.div variants={itemVariants} className="metric-card success">
          <div className="metric-label">Successful Requests</div>
          <div className="metric-value" style={{ color: "var(--status-success)" }}>{stats.successCount || 0}</div>
        </motion.div>

        <motion.div variants={itemVariants} className="metric-card error">
          <div className="metric-label">Failed Requests</div>
          <div className="metric-value" style={{ color: "var(--status-danger)" }}>{stats.errorCount || 0}</div>
        </motion.div>

        <motion.div variants={itemVariants} className="metric-card warning">
          <div className="metric-label">Failure Rate</div>
          <div className="metric-value" style={{ color: stats.failureRate > 20 ? "var(--status-danger)" : "var(--status-warning)" }}>{stats.failureRate || 0}%</div>
        </motion.div>

        <motion.div variants={itemVariants} className="metric-card info">
          <div className="metric-label">Average Duration</div>
          <div className="metric-value" style={{ color: "var(--status-info)" }}>{stats.avgDuration || 0}ms</div>
        </motion.div>

        <motion.div variants={itemVariants} className="metric-card">
          <div className="metric-label">Slow Requests (&gt;2s)</div>
          <div className="metric-value">{stats.slowRequests || 0}</div>
        </motion.div>
      </motion.div>

      {/* Charts Section */}
      <motion.div 
        className="charts-wrapper"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
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
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {successErrorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Requests by Method Bar Chart */}
        {stats.requestsByMethod && stats.requestsByMethod.length > 0 && (
          <div className="chart-container">
            <h2>Requests by Method</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.requestsByMethod} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="method" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="count" name="Requests" radius={[6, 6, 0, 0]}>
                  {stats.requestsByMethod.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`var(--method-${entry.method.toLowerCase()}, var(--accent-primary))`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Slow Routes Bar Chart */}
        {stats.topSlowRoutes && stats.topSlowRoutes.length > 0 && (
          <div className="chart-container">
            <h2>Top Slow Routes (by avg duration)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topSlowRoutes} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis 
                  dataKey="route" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80}
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  label={{ value: "Avg Duration (ms)", angle: -90, position: "insideLeft", fill: "var(--text-muted)", dx: -10 }} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-muted)' }}
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="avgDuration" fill="var(--status-warning)" name="Avg Duration (ms)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      {/* Status Code Breakdown */}
      {stats.requestsByStatus && stats.requestsByStatus.length > 0 && (
        <motion.div 
          className="breakdown-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <h2>Status Code Breakdown</h2>
          <div className="status-breakdown">
            {stats.requestsByStatus.map((item) => {
              const isError = item.statusCode >= 400;
              return (
              <div key={item.statusCode} className="status-item">
                <span 
                  className="status-code"
                  style={{
                    backgroundColor: isError ? "var(--status-danger-bg)" : "var(--status-success-bg)",
                    color: isError ? "var(--status-danger)" : "var(--status-success)",
                    border: `1px solid ${isError ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)"}`
                  }}
                >
                  {isError ? "🔴" : "🟢"} {item.statusCode}
                </span>
                <span className="status-count">{item.count} requests</span>
              </div>
            )})}
          </div>
        </motion.div>
      )}
    </div>
  );
}
