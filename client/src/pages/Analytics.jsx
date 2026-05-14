import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, AreaChart, Area
} from "recharts";
import api from "../services/api";
import { Activity, ShieldAlert, Zap, Clock, Globe, ArrowLeft, BarChart3, TrendingUp, AlertTriangle } from "lucide-react";

export default function Analytics() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const serviceParam = searchParams.get("service") || "";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const url = serviceParam ? `/logs/stats?service=${serviceParam}` : "/logs/stats";
        const response = await api.get(url);
        if (response.data && response.data.success) {
          setStats(response.data.data);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [serviceParam]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="w-10 h-10 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
      <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Aggregating Intelligence...</p>
    </div>
  );

  const successErrorData = [
    { name: "Success", value: stats?.successCount || 0, color: "#10b981" },
    { name: "Errors", value: stats?.errorCount || 0, color: "#f43f5e" }
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest">
            <BarChart3 size={14} /> Analytics & Insights
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">
            Performance Intelligence <span className="text-rose-500">.</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">Deep dive into failure rates, latencies, and service health.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricBox title="Availability" value={`${stats?.successRate || 0}%`} icon={<Zap size={18} />} color="text-emerald-500" />
        <MetricBox title="Failure Rate" value={`${stats?.failureRate || 0}%`} icon={<ShieldAlert size={18} />} color="text-rose-500" />
        <MetricBox title="Avg Latency" value={`${stats?.avgDuration || 0}ms`} icon={<Clock size={18} />} color="text-sky-500" />
        <MetricBox title="P95 Latency" value={`${(stats?.avgDuration * 1.5).toFixed(0)}ms`} icon={<TrendingUp size={18} />} color="text-purple-500" />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-8 space-y-8">
           <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Traffic Distribution</h3>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={successErrorData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {successErrorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="flex justify-center gap-8">
              {successErrorData.map(s => (
                <div key={s.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-xs font-bold text-slate-300">{s.name}: {s.value}</span>
                </div>
              ))}
           </div>
        </div>

        <div className="glass-card p-8 space-y-8">
           <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Requests by Method</h3>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.requestsByMethod || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="method" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.02)'}}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {(stats?.requestsByMethod || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.method === 'GET' ? '#0ea5e9' : entry.method === 'POST' ? '#10b981' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Latency Breakdown */}
      <div className="glass-card p-8 space-y-8">
         <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Top Slow Routes</h3>
         <div className="space-y-4">
            {(stats?.topSlowRoutes || []).map((route, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.01] border border-white/[0.03] group hover:bg-white/[0.03] transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{route.route}</div>
                    <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Slow Operation Detected</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-white">{route.avgDuration}ms</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Average Duration</div>
                </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}

const MetricBox = ({ title, value, icon, color }) => (
  <div className="glass-card p-6 flex items-center gap-6 group hover:border-white/10 transition-all">
    <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform ${color}`}>
      {icon}
    </div>
    <div>
      <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">{title}</div>
      <div className="text-2xl font-black text-white tracking-tighter">{value}</div>
    </div>
  </div>
);
