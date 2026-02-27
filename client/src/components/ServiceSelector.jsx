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
      const baseURL = api.defaults.baseURL;
      const response = await fetch(`${baseURL.replace("/logs", "")}/logs/services`);
      if (!response.ok) throw new Error("Failed to fetch services");
      const data = await response.json();
      if (data.success) {
        setServices(data.services || []);
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
          color: "#666",
          marginBottom: "6px",
          textTransform: "uppercase",
          letterSpacing: "0.5px"
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
          padding: "10px 12px",
          border: "1px solid #ddd",
          borderRadius: "6px",
          backgroundColor: "white",
          color: "#333",
          fontSize: "14px",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
          fontFamily: "inherit"
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
