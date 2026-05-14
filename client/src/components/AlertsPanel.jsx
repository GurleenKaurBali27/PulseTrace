import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { ShieldAlert, Zap, AlertTriangle, Clock, X } from "lucide-react";

export default function AlertsPanel({ selectedService = "" }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = async () => {
    try {
      const url = selectedService ? `/logs/alerts?service=${selectedService}` : "/logs/alerts";
      const response = await api.get(url);
      if (response.data && response.data.success) {
        setAlerts(response.data.alerts || []);
      }
    } catch (err) {
      console.error("Error fetching alerts:", err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, [selectedService]);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-2">
        <ShieldAlert size={16} className="text-rose-500" />
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-rose-500/80">Critical Notifications</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative overflow-hidden group p-5 rounded-[1.5rem] border backdrop-blur-xl transition-all duration-300 ${
                alert.severity === 'critical' 
                  ? 'bg-rose-500/5 border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.05)]' 
                  : 'bg-amber-500/5 border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]'
              }`}
            >
              {/* Alert Glow */}
              <div className={`absolute -right-4 -top-4 w-16 h-16 blur-2xl opacity-20 ${
                alert.severity === 'critical' ? 'bg-rose-500' : 'bg-amber-500'
              }`} />

              <div className="flex items-start gap-4">
                <div className={`mt-1 p-2 rounded-xl border flex items-center justify-center ${
                  alert.severity === 'critical' 
                    ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' 
                    : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                }`}>
                  {alert.type === 'error_rate' ? <ShieldAlert size={18} /> : alert.type === 'performance' ? <Zap size={18} /> : <AlertTriangle size={18} />}
                </div>

                <div className="flex-grow space-y-1">
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      alert.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'
                    }`}>
                      {alert.type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                      <Clock size={10} /> {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm font-black text-white leading-tight">{alert.message}</div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {alert.route && alert.route !== 'all' && (
                      <span className="px-2 py-0.5 rounded-lg bg-black/40 border border-white/5 text-[10px] font-mono text-slate-400">
                        {alert.route}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-lg bg-black/40 border border-white/5 text-[10px] font-bold text-slate-200">
                      Value: {alert.value}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
