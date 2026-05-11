import { useState, useEffect } from "react";
import api from "../services/api";

export default function ServiceSelector({ selectedService, onServiceChange }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await api.get("/services");
      if (response.data && response.data.success) {
        setServices(response.data.services || []);
      }
    } catch (err) {
      console.error("Error fetching services:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: "15px" }}>
      <label
        htmlFor="service-select"
        style={{
          display: "block",
          fontSize: "12px",
          fontWeight: "600",
          color: "var(--text-muted)",
          marginBottom: "8px",
          textTransform: "uppercase",
          letterSpacing: "0.05em"
        }}
      >
        Service
      </label>
      <select
        id="service-select"
        value={selectedService}
        onChange={(e) => onServiceChange(e.target.value)}
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px 14px",
          border: "1px solid var(--border-color)",
          borderRadius: "8px",
          backgroundColor: "rgba(0,0,0,0.2)",
          color: "var(--text-main)",
          fontSize: "14px",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
          fontFamily: "inherit",
          outline: "none"
        }}
      >
        <option value="">All Services</option>
        {services.map((service) => (
          <option key={service} value={service}>
            {service}
          </option>
        ))}
      </select>
    </div>
  );
}
