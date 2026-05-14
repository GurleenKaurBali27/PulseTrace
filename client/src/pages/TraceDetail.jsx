import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import TraceWaterfall from '../components/TraceWaterfall';
import { Clock, Info, Shield, Zap, LayoutDashboard, Share2, Download, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const TraceDetail = () => {
  const { traceId } = useParams();
  const navigate = useNavigate();
  const [spans, setSpans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrace = async () => {
      try {
        const res = await api.get(`/logs/traces/${traceId}`);
        setSpans(res.data.data);
      } catch (err) {
        console.error("Error fetching trace detail:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrace();
  }, [traceId]);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
      <p className="text-slate-400 font-medium animate-pulse">Analyzing trace topography...</p>
    </div>
  );

  const totalDuration = spans.length > 0 ? 
    Math.max(...spans.map(s => new Date(s.createdAt).getTime() + s.duration)) - 
    Math.min(...spans.map(s => new Date(s.createdAt).getTime())) : 0;

  const errorCount = spans.filter(s => s.statusCode >= 400).length;

  return (
    <div className="space-y-10 pb-20">
      <div className="max-w-[1600px] mx-auto space-y-10">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-3">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-2 text-xs font-black text-sky-400 uppercase tracking-[0.2em]"
            >
              <Zap size={14} className="fill-sky-400" />
              Trace Detailed Analysis
            </motion.div>
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-4xl font-black font-mono tracking-tighter text-white"
            >
              {traceId.substring(0, 8)}<span className="text-slate-700">...</span>{traceId.substring(traceId.length - 8)}
            </motion.h1>
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-wrap gap-4 text-sm"
            >
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400">
                <Clock size={14} className="text-sky-400" /> <span className="font-bold text-slate-200">{totalDuration}ms</span> <span className="text-[10px]">TOTAL</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400">
                <Shield size={14} className="text-purple-400" /> <span className="font-bold text-slate-200">{spans.length}</span> <span className="text-[10px]">SPANS</span>
              </div>
              {errorCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                  <AlertCircle size={14} /> <span className="font-bold">{errorCount}</span> <span className="text-[10px]">ERRORS</span>
                </div>
              )}
            </motion.div>
          </div>
          
          <div className="flex gap-3">
            <button className="glass-btn"><Share2 size={18} /></button>
            <button className="glass-btn"><Download size={18} /></button>
            <button 
              onClick={() => navigate('/traces')}
              className="glass-btn-primary"
            >
              Back to Mesh
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Main Waterfall Viewer */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3 space-y-6"
          >
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Layers size={20} className="text-sky-400" />
                Execution Waterfall
              </h3>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Scroll to explore spans
              </div>
            </div>
            <TraceWaterfall spans={spans} />
          </motion.div>

          {/* Detailed Sidebar Metrics */}
          <motion.aside 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Metadata Card */}
            <div className="glass-card p-6 space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Info size={64} />
              </div>
              
              <h3 className="text-sm font-black uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-400" /> Metadata
              </h3>
              
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Gateway Service</span>
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <Server size={14} className="text-sky-400" /> {spans[0]?.serviceName || 'unknown'}
                  </span>
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Max Request Depth</span>
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap size={14} className="text-purple-400" /> {Math.max(...spans.map(s => s.requestDepth || 0))} levels
                  </span>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Root Endpoint</span>
                    <span className="font-mono text-sky-400">{spans[0]?.route || '/'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions / Integration */}
            <div className="glass-card p-6 bg-indigo-600/5 border-indigo-500/20">
              <h4 className="text-xs font-black text-indigo-400 uppercase mb-3">Developer Tools</h4>
              <div className="space-y-2">
                <button className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all flex items-center justify-between group">
                  Copy Correlation ID
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </button>
                <button className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all flex items-center justify-between group">
                  Open in Analytics
                  <LayoutDashboard size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </button>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
};

export default TraceDetail;
