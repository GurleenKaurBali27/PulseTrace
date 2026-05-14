import { useState, useEffect } from "react";
import api from "../services/api";
import { Server, ChevronDown } from "lucide-react";

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
    <div className="relative group w-full">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors">
        <Server size={18} />
      </div>
      <select
        id="service-select"
        value={selectedService}
        onChange={(e) => onServiceChange(e.target.value)}
        disabled={loading}
        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-10 text-sm font-bold text-white focus:border-sky-500/50 outline-none appearance-none transition-all cursor-pointer hover:bg-black/30"
      >
        <option value="" className="bg-slate-900">All Cluster Services</option>
        {services.map((service) => (
          <option key={service} value={service} className="bg-slate-900">
            {service.toUpperCase()}
          </option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
        <ChevronDown size={16} />
      </div>
    </div>
  );
}
