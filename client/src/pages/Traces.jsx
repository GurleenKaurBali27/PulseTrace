import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ServiceMap from '../components/ServiceMap';
import { Activity, Clock, Layers, ArrowRight, Zap, ShieldAlert, Globe, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Traces = () => {
  const navigate = useNavigate();
  const [traces, setTraces] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tracesRes, mapRes] = await Promise.all([
          api.get('/logs/trace-timeline'),
          api.get('/logs/service-map')
        ]);
        setTraces(tracesRes.data.data);
        setDependencies(mapRes.data.data);
      } catch (err) {
        console.error("Error fetching trace data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-10 pb-20">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
            <Zap size={14} /> System Health: Operational
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">
            Distributed Tracing <span className="text-sky-500">.</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">Observe the heartbeat of your microservices ecosystem.</p>
        </div>
      </div>

      {/* Top Section: Map & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Service Map - The visual centerpiece */}
        <div className="lg:col-span-8 glass-card overflow-hidden group relative">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-purple-500/5 pointer-events-none" />
          <ServiceMap dependencies={dependencies} />
          <div className="absolute top-4 right-4 flex gap-2">
            <div className="px-3 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold text-slate-400 flex items-center gap-1">
              <Globe size={12} /> GLOBAL MESH
            </div>
          </div>
        </div>

        {/* Stats Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-8 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl group-hover:bg-sky-500/20 transition-all duration-500" />
            <Layers className="text-sky-400 mb-4" size={32} />
            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Active Traces</div>
            <div className="text-5xl font-black text-white">{traces.length}</div>
            <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '70%' }}
                className="h-full bg-gradient-to-r from-sky-400 to-indigo-500"
              />
            </div>
          </div>

          <div className="glass-card p-8 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all duration-500" />
            <Activity className="text-purple-400 mb-4" size={32} />
            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">System Load</div>
            <div className="text-5xl font-black text-white">Nominal</div>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <ShieldAlert size={12} /> 0 Critical bottlenecks detected
            </p>
          </div>
        </div>
      </div>

      {/* Trace List Table */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
            <Clock size={16} /> Live Trace Stream
          </h2>
          <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> SYNCED
          </div>
        </div>
        
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-white/5">
                <th className="px-8 py-5">Correlation ID</th>
                <th className="px-8 py-5">Topology</th>
                <th className="px-8 py-5">Latency</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence>
                {traces.map((trace, idx) => (
                  <motion.tr 
                    key={trace.traceId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                    className="group cursor-pointer"
                    onClick={() => navigate(`/traces/${trace.traceId}`)}
                  >
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs text-sky-400 font-bold">{trace.traceId.substring(0, 18)}...</span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Server size={10} /> Root: {trace.serviceName || 'gateway'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {[...Array(Math.min(trace.spanCount, 4))].map((_, i) => (
                            <div key={i} className="w-6 h-6 rounded-full bg-indigo-500/30 border border-slate-900 flex items-center justify-center text-[10px] font-bold">
                              {i === 3 ? '+' : ''}
                            </div>
                          ))}
                        </div>
                        <span className="text-sm font-medium">{trace.spanCount} hops</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-black text-white">{trace.totalDuration}ms</span>
                        <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-sky-400" style={{ width: `${Math.min(trace.totalDuration / 10, 100)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`badge-glow ${trace.maxStatus >= 400 ? 'badge-red' : 'badge-green'}`}>
                        {trace.maxStatus >= 400 ? 'Failure' : 'Success'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <motion.div 
                        whileHover={{ x: 5 }}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 group-hover:bg-sky-500/20 group-hover:border-sky-500/30 group-hover:text-sky-400 transition-all"
                      >
                        <ArrowRight size={18} />
                      </motion.div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {traces.length === 0 && !loading && (
            <div className="p-20 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-900 rounded-3xl mx-auto flex items-center justify-center border border-white/5">
                <Activity size={40} className="text-slate-700" />
              </div>
              <p className="text-slate-500 font-light max-w-xs mx-auto">No telemetry data detected. Ensure your services are using the PulseTrace middleware.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Traces;
