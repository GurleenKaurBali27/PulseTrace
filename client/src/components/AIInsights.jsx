import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, AlertTriangle, TrendingUp, Zap, ChevronRight, 
  Lightbulb, ShieldAlert, Cpu, MessageSquare, Send, X
} from "lucide-react";
import api from "../services/api";

export default function AIInsights() {
  const [incidents, setIncidents] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [queryResults, setQueryResults] = useState(null);
  const [isQuerying, setIsQuerying] = useState(false);

  useEffect(() => {
    fetchIntelligence();
  }, []);

  const fetchIntelligence = async () => {
    try {
      setLoading(true);
      const projectId = localStorage.getItem("activeProjectId"); // Assuming this exists or using a default
      const res = await api.get('/intelligence/incidents', {
        headers: { 'x-project-id': projectId || 'default' }
      });
      setIncidents(res.data.incidents || []);
      setClusters(res.data.clusters || []);
    } catch (err) {
      console.error("Intelligence fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!query) return;
    setIsQuerying(true);
    try {
      const projectId = localStorage.getItem("activeProjectId");
      const res = await api.post('/intelligence/query', { query }, {
        headers: { 'x-project-id': projectId || 'default' }
      });
      setQueryResults(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="space-y-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20">
            <Sparkles size={20} className="text-neon-cyan" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Incident Intelligence</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Real-time Anomaly Analysis</p>
          </div>
        </div>
        <button onClick={fetchIntelligence} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <Zap size={16} className="text-slate-500 hover:text-neon-cyan" />
        </button>
      </div>

      {/* NLQ Input */}
      <form onSubmit={handleQuery} className="relative">
        <MessageSquare size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input 
          type="text" 
          placeholder="Ask Pulse AI (e.g. 'Show slow requests from auth')"
          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-xs text-white focus:outline-none focus:border-neon-cyan/40 transition-all"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-neon-cyan hover:scale-110 transition-transform">
          {isQuerying ? <Cpu size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>

      {/* Query Results Overlay */}
      <AnimatePresence>
        {queryResults && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 rounded-2xl bg-neon-cyan/5 border border-neon-cyan/20 space-y-4"
          >
            <div className="flex items-center justify-between">
               <span className="text-[10px] font-black text-neon-cyan uppercase tracking-widest">Query Results ({queryResults.length})</span>
               <button onClick={() => setQueryResults(null)}><X size={14} className="text-slate-500" /></button>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
               {queryResults.map(log => (
                 <div key={log.id} className="text-[10px] font-mono text-slate-300 p-2 rounded bg-black/20 border border-white/5">
                    <span className="text-neon-cyan">{log.method}</span> {log.route} - <span className={log.statusCode >= 400 ? 'text-neon-pink' : 'text-neon-lime'}>{log.statusCode}</span>
                 </div>
               ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-grow space-y-6 overflow-y-auto pr-2 custom-scrollbar">
        {/* Active Incidents */}
        {incidents.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Detected Anomalies</h4>
            {incidents.map((incident, i) => (
              <motion.div 
                key={i}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-4 group hover:bg-rose-500/10 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">{incident.type}</div>
                      <div className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Confidence {Math.round(incident.confidence * 100)}%</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-500 text-[8px] font-black uppercase tracking-widest border border-rose-500/30">Critical</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{incident.summary}</p>
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
                   <div className="flex items-center gap-2 text-[9px] font-black text-neon-cyan uppercase tracking-widest">
                      <Lightbulb size={12} /> Root Cause Analysis
                   </div>
                   <p className="text-[10px] text-slate-500 leading-normal">{incident.suggestedFix}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Error Clusters */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Error Patterns</h4>
          {clusters.map((cluster) => (
            <div key={cluster.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-neon-cyan/30 transition-all space-y-3">
               <div className="flex items-center justify-between">
                  <div className="text-[11px] font-black text-white truncate max-w-[150px]">{cluster.serviceName} Degradation</div>
                  <div className="text-[10px] font-black text-neon-cyan">{cluster.count} Events</div>
               </div>
               <div className="font-mono text-[9px] text-slate-500 truncate bg-black/40 p-2 rounded border border-white/5">
                  {cluster.pattern}
               </div>
               <div className="flex items-center justify-between pt-1">
                  <div className="flex -space-x-2">
                     {[1,2,3].map(i => <div key={i} className="w-5 h-5 rounded-full border border-[#06080f] bg-slate-800" />)}
                  </div>
                  <button className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white flex items-center gap-1">
                     View Cluster <ChevronRight size={10} />
                  </button>
               </div>
            </div>
          ))}

          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-4">
              <Cpu size={32} className="text-slate-800 animate-pulse" />
              <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">AI Engine Initializing...</p>
            </div>
          )}

          {!loading && incidents.length === 0 && clusters.length === 0 && (
            <div className="py-12 text-center space-y-3">
               <ShieldAlert size={32} className="text-slate-800 mx-auto" />
               <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-relaxed px-4">
                 System Stability Nominal. No Anomaly Patterns Detected.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
