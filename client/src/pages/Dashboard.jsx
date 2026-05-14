import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { initializeSocket, onNewLog, disconnectSocket } from "../services/socket";
import FilterBar from "../components/FilterBar";
import AnalyticsSummary from "../components/AnalyticsSummary";
import ServiceSelector from "../components/ServiceSelector";
import AIInsights from "../components/AIInsights";
import { 
  Zap, Globe, Search, RefreshCw, Terminal, Activity, 
  ArrowRight, Share2, Download, ShieldCheck, Lock, Eye, AlertCircle, Sparkles
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeView, setActiveView] = useState("telemetry"); 
  const [showAI, setShowAI] = useState(true);
  const [selectedService, setSelectedService] = useState("");
  const [filters, setFilters] = useState({
    statusRange: null,
    method: null,
    route: ""
  });
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const unsubscribeRef = useRef(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedService) params.append("service", selectedService);
      if (filters.statusRange) params.append("statusRange", filters.statusRange);
      if (filters.method) params.append("method", filters.method);
      if (filters.route) params.append("route", filters.route);

      const res = await api.get(`/logs?${params.toString()}`);
      setLogs(res.data?.data || res.data);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/audit-logs');
      setAuditLogs(res.data?.data || res.data || []);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    }
  };

  const generateDemoData = async () => {
    setDemoLoading(true);
    try {
      const endpoints = ['/success', '/fail', '/slow', '/not-found', '/unauthorized', '/random', '/chain'];
      const apiKey = localStorage.getItem("apiKey");
      
      for (let i = 0; i < 15; i++) { // Generate more logs for AI detection
        const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
        fetch(`http://localhost:4000${ep}`, {
          headers: { 'x-api-key': apiKey }
        }).catch(() => {});
      }
      setTimeout(fetchLogs, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setDemoLoading(false), 800);
    }
  };

  useEffect(() => {
    initializeSocket("http://localhost:5000");
    unsubscribeRef.current = onNewLog(({ data: newLog }) => {
      setLogs((prev) => [newLog, ...prev.slice(0, 99)]);
    });
    fetchLogs();
    fetchAuditLogs();
    const interval = setInterval(fetchLogs, 8000);
    return () => {
      clearInterval(interval);
      if (unsubscribeRef.current) unsubscribeRef.current();
      disconnectSocket();
    };
  }, [filters, selectedService]);

  return (
    <div className="space-y-12 pb-20">
      {/* Top Controls / Dynamic Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 px-2">
         <div className="space-y-1">
            <div className="flex items-center gap-2">
               <div className="px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(0,242,255,0.1)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" /> Pulse Engine v4.2
               </div>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter">System <span className="neon-text-cyan italic underline decoration-neon-cyan/30 decoration-4 underline-offset-8">Intelligence</span></h1>
         </div>

         <div className="flex items-center gap-6">
            <div className="flex bg-white/[0.03] p-1.5 rounded-2xl border border-white/5 shadow-2xl">
               <button 
                 onClick={() => setActiveView("telemetry")}
                 className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                   activeView === "telemetry" ? "bg-neon-cyan text-black shadow-[0_0_20px_rgba(0,242,255,0.3)]" : "text-slate-500 hover:text-white"
                 }`}
               >
                 <Activity size={14} /> Telemetry
               </button>
               <button 
                 onClick={() => { setActiveView("security"); fetchAuditLogs(); }}
                 className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                   activeView === "security" ? "bg-neon-purple text-white shadow-[0_0_20px_rgba(157,0,255,0.3)]" : "text-slate-500 hover:text-white"
                 }`}
               >
                 <ShieldCheck size={14} /> Security Audits
               </button>
            </div>

            <button 
              onClick={() => setShowAI(!showAI)}
              className={`p-3 rounded-2xl border transition-all ${
                showAI ? 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan' : 'bg-white/[0.03] border-white/10 text-slate-500'
              }`}
            >
              <Sparkles size={18} />
            </button>

            <button 
              onClick={generateDemoData}
              disabled={demoLoading}
              className="px-6 py-3 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-neon-cyan hover:shadow-[0_0_20px_#00f2ff] transition-all duration-500 flex items-center gap-3"
            >
              <Zap size={14} className={demoLoading ? "animate-spin" : "fill-black"} />
              {demoLoading ? 'Processing...' : 'Ignite Traffic'}
            </button>
         </div>
      </div>

      <div className={`grid grid-cols-1 ${showAI ? 'xl:grid-cols-4' : ''} gap-8 transition-all duration-500`}>
        <div className={showAI ? 'xl:col-span-3 space-y-12' : 'space-y-12'}>
          {activeView === "telemetry" ? (
            <>
              <AnalyticsSummary logs={logs} />

              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-3">
                    <Terminal size={16} className="text-neon-cyan" /> Core Filtration Matrix
                  </h3>
                  <div className="flex gap-2">
                     <button className="p-2 rounded-xl bg-white/[0.03] border border-white/5 text-slate-500 hover:text-white transition-all"><Share2 size={14} /></button>
                     <button className="p-2 rounded-xl bg-white/[0.03] border border-white/5 text-slate-500 hover:text-white transition-all"><Download size={14} /></button>
                  </div>
                </div>
                
                <motion.div 
                  initial={{ y: 20, opacity: 0 }} 
                  animate={{ y: 0, opacity: 1 }}
                  className="glass-card p-6 flex flex-col lg:flex-row gap-6 items-center bg-white/[0.01]"
                >
                  <div className="w-full lg:w-80">
                    <ServiceSelector selectedService={selectedService} onServiceChange={setSelectedService} />
                  </div>
                  <div className="flex-grow w-full h-[50px] flex items-center">
                    <FilterBar onFilterChange={setFilters} currentFilters={filters} />
                  </div>
                </motion.div>
              </div>

              <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-3">
                    <Activity size={16} className="text-neon-pink" /> Live Telemetry Matrix
                  </h3>
                  <div className="text-[9px] font-black text-neon-cyan bg-neon-cyan/10 px-4 py-1.5 rounded-full border border-neon-cyan/20 tracking-widest shadow-[0_0_10px_rgba(0,242,255,0.05)]">
                    {logs.length} SPANS BUFFERED
                  </div>
                </div>

                <div className="glass-card overflow-hidden bg-white/[0.01]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/[0.02] text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] border-b border-white/5">
                          <th className="px-10 py-6">Trace Sequence</th>
                          <th className="px-10 py-6">Operation Map</th>
                          <th className="px-10 py-6 text-center">Method</th>
                          <th className="px-10 py-6">Response</th>
                          <th className="px-10 py-6">Latency</th>
                          <th className="px-10 py-6 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.01]">
                        <AnimatePresence mode="popLayout">
                          {logs.map((log) => (
                            <motion.tr
                              key={log.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                              onClick={() => navigate(`/logs/${log.id}`)}
                              className="group cursor-pointer transition-all duration-300"
                            >
                              <td className="px-10 py-6">
                                <div className="text-[10px] font-mono text-neon-cyan/60 group-hover:text-neon-cyan transition-colors">
                                  {log.traceId?.substring(0, 16)}...
                                </div>
                              </td>
                              <td className="px-10 py-6">
                                <div className="text-[11px] font-black text-slate-300 tracking-tight group-hover:text-white transition-colors">{log.route}</div>
                                <div className="text-[9px] text-slate-600 uppercase font-black tracking-widest">{log.serviceName}</div>
                              </td>
                              <td className="px-10 py-6 text-center">
                                 <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest border ${
                                   log.method === 'GET' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 
                                   log.method === 'POST' ? 'bg-neon-lime/10 text-neon-lime border-neon-lime/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                 }`}>
                                   {log.method}
                                 </span>
                              </td>
                              <td className="px-10 py-6">
                                <div className="flex items-center gap-3">
                                  <div className={`w-1.5 h-1.5 rounded-full ${log.statusCode >= 400 ? 'bg-neon-pink shadow-[0_0_10px_#ff007a]' : 'bg-neon-lime shadow-[0_0_10px_#bcff00]'}`} />
                                  <span className={`text-[11px] font-black ${log.statusCode >= 400 ? 'text-neon-pink' : 'text-neon-lime'}`}>
                                    {log.statusCode}
                                  </span>
                                </div>
                              </td>
                              <td className="px-10 py-6">
                                <div className="flex flex-col gap-1">
                                   <span className="text-[11px] font-black text-white">{log.duration}ms</span>
                                   <div className="w-20 h-0.5 bg-white/5 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full ${log.duration > 800 ? 'bg-neon-pink' : 'bg-neon-cyan'}`} 
                                        style={{ width: `${Math.min(log.duration / 10, 100)}%` }} 
                                      />
                                   </div>
                                </div>
                              </td>
                              <td className="px-10 py-6 text-right">
                                <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-700 group-hover:text-neon-cyan group-hover:border-neon-cyan/30 group-hover:bg-neon-cyan/10 transition-all duration-300">
                                   <ArrowRight size={16} />
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                  {logs.length === 0 && (
                    <div className="py-24 text-center flex flex-col items-center gap-6">
                      <div className="w-20 h-20 bg-white/[0.02] rounded-3xl flex items-center justify-center border border-white/5 relative">
                         <div className="absolute inset-0 bg-neon-cyan/5 rounded-3xl animate-ping" />
                         <Search size={32} className="text-slate-700" />
                      </div>
                      <div className="space-y-2">
                         <p className="text-white font-black text-sm uppercase tracking-widest">Listening for Telemetry...</p>
                         <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">Matrix connection established. Awaiting initial pulse.</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : (
            <section className="space-y-8">
               <div className="flex items-center justify-between px-2">
                  <div className="space-y-1">
                     <h3 className="text-xl font-black text-white flex items-center gap-3">
                        <ShieldCheck size={24} className="text-neon-purple" /> Security Audit Log
                     </h3>
                     <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Tracking sensitive data access and overrides</p>
                  </div>
                  <button 
                    onClick={fetchAuditLogs}
                    className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-slate-400 hover:text-neon-purple transition-all"
                  >
                    <RefreshCw size={18} />
                  </button>
               </div>

               <div className="glass-card overflow-hidden bg-white/[0.01] border-neon-purple/20 shadow-[0_0_30px_rgba(157,0,255,0.05)]">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="bg-white/[0.02] text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] border-b border-white/5">
                              <th className="px-10 py-6">Timestamp</th>
                              <th className="px-10 py-6">Action</th>
                              <th className="px-10 py-6">User Role</th>
                              <th className="px-10 py-6">Target Record</th>
                              <th className="px-10 py-6 text-right">Security Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.01]">
                           {auditLogs.length > 0 ? auditLogs.map((audit) => (
                              <tr key={audit.id} className="hover:bg-white/[0.02] transition-all">
                                 <td className="px-10 py-6">
                                    <div className="text-[11px] font-mono text-slate-400">{new Date(audit.createdAt).toLocaleString()}</div>
                                 </td>
                                 <td className="px-10 py-6">
                                    <div className="flex items-center gap-2">
                                       <div className={`w-2 h-2 rounded-full ${audit.action.includes('REVEAL') ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-neon-cyan'}`} />
                                       <span className="text-[10px] font-black text-white uppercase tracking-wider">{audit.action.replace(/_/g, ' ')}</span>
                                    </div>
                                 </td>
                                 <td className="px-10 py-6">
                                    <span className={`px-2 py-1 rounded text-[9px] font-black tracking-widest uppercase ${
                                      audit.userRole === 'ADMIN' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-500/10 text-slate-500'
                                    }`}>
                                       {audit.userRole}
                                    </span>
                                 </td>
                                 <td className="px-10 py-6">
                                    <button 
                                      onClick={() => navigate(`/logs/${audit.targetId}`)}
                                      className="text-[10px] font-mono text-neon-cyan hover:underline"
                                    >
                                       #REC-{audit.targetId}
                                    </button>
                                 </td>
                                 <td className="px-10 py-6 text-right">
                                    <span className="flex items-center justify-end gap-1.5 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                       <ShieldCheck size={14} /> Logged
                                    </span>
                                 </td>
                              </tr>
                           )) : (
                              <tr>
                                 <td colSpan="5" className="py-24 text-center">
                                    <div className="flex flex-col items-center gap-4 text-slate-500">
                                       <Lock size={32} className="opacity-20" />
                                       <p className="text-[10px] font-black uppercase tracking-widest">No Security Overrides Recorded</p>
                                    </div>
                                 </td>
                              </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>

               <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-4 items-start">
                  <AlertCircle className="text-amber-500 shrink-0" size={20} />
                  <div className="space-y-1">
                     <p className="text-amber-500 text-xs font-black uppercase tracking-widest">Compliance Notice</p>
                     <p className="text-slate-500 text-[10px] font-medium leading-relaxed">
                        This audit log tracks all administrative overrides and sensitive data reveals. Any attempt to bypass masking without proper role-based authorization will be automatically flagged for review.
                     </p>
                  </div>
               </div>
            </section>
          )}
        </div>

        {/* AI Intelligence Panel */}
        <AnimatePresence>
          {showAI && (
            <motion.div 
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="xl:col-span-1 border-l border-white/5 pl-8 hidden xl:block min-h-[600px]"
            >
              <AIInsights />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}