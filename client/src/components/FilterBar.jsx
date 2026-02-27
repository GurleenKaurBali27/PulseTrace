import { useState } from "react";

export default function FilterBar({ onFilterChange, currentFilters }) {
  const [searchInput, setSearchInput] = useState("");

  const statusRanges = [
    { label: "All Status", value: null },
    { label: "2xx Success", value: "2xx" },
    { label: "4xx Client Errors", value: "4xx" },
    { label: "5xx Server Errors", value: "5xx" }
  ];

  const methods = [
    { label: "All Methods", value: null },
    { label: "GET", value: "GET" },
    { label: "POST", value: "POST" },
    { label: "PUT", value: "PUT" },
    { label: "DELETE", value: "DELETE" },
    { label: "PATCH", value: "PATCH" }
  ];

  const handleStatusChange = (range) => {
    onFilterChange({ ...currentFilters, statusRange: range });
  };

  const handleMethodChange = (method) => {
    onFilterChange({ ...currentFilters, method });
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    onFilterChange({ ...currentFilters, route: value });
  };

  const handleClearFilters = () => {
    setSearchInput("");
    onFilterChange({ statusRange: null, method: null, route: "" });
  };

  const hasActiveFilters = currentFilters.statusRange || currentFilters.method || currentFilters.route;

  return (
    <div style={styles.container}>
      {/* Search Bar */}
      <div style={styles.section}>
        <label style={styles.label}>🔍 Search by Route:</label>
        <input
          type="text"
          placeholder="e.g., /api/users, /login"
          value={searchInput}
          onChange={handleSearch}
          style={styles.searchInput}
        />
      </div>

      {/* Status Code Filter */}
      <div style={styles.section}>
        <label style={styles.label}>📊 Filter by Status:</label>
        <div style={styles.buttonGroup}>
          {statusRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => handleStatusChange(range.value)}
              style={{
                ...styles.filterButton,
                ...(currentFilters.statusRange === range.value
                  ? styles.filterButtonActive
                  : styles.filterButtonInactive)
              }}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* HTTP Method Filter */}
      <div style={styles.section}>
        <label style={styles.label}>🔀 Filter by Method:</label>
        <div style={styles.buttonGroup}>
          {methods.map((method) => (
            <button
              key={method.value}
              onClick={() => handleMethodChange(method.value)}
              style={{
                ...styles.filterButton,
                ...(currentFilters.method === method.value
                  ? styles.filterButtonActive
                  : styles.filterButtonInactive),
                ...getMethodColor(method.value)
              }}
            >
              {method.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <button onClick={handleClearFilters} style={styles.clearButton}>
          ✕ Clear All Filters
        </button>
      )}
    </div>
  );
}

function getMethodColor(method) {
  const colors = {
    GET: { color: "#0066cc" },
    POST: { color: "#cc8800" },
    PUT: { color: "#cc6600" },
    DELETE: { color: "#cc0000" },
    PATCH: { color: "#008800" }
  };
  return colors[method] || {};
}

const styles = {
  container: {
    backgroundColor: "#f9f9f9",
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "20px"
  },
  section: {
    marginBottom: "15px"
  },
  label: {
    display: "block",
    fontWeight: "bold",
    marginBottom: "8px",
    fontSize: "14px",
    color: "#333"
  },
  searchInput: {
    width: "100%",
    maxWidth: "400px",
    padding: "8px 12px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "14px",
    fontFamily: "sans-serif"
  },
  buttonGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px"
  },
  filterButton: {
    padding: "8px 16px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    backgroundColor: "white",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    transition: "all 0.2s",
    whiteSpace: "nowrap"
  },
  filterButtonActive: {
    backgroundColor: "#007bff",
    color: "white",
    border: "1px solid #0056b3"
  },
  filterButtonInactive: {
    color: "#666"
  },
  clearButton: {
    backgroundColor: "#ff4444",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    transition: "background-color 0.2s"
  }
};
