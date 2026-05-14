import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Activity, AlertCircle, 
  CheckCircle2, Clock, Zap, Globe, ShieldAlert
} from 'lucide-react';
import { motion } from 'framer-motion';

const AnalyticsSummary = ({ logs = [] }) => {
  const metrics = useMemo(() => {
    if (!logs.length) return {
      total: 0,
      failures: 0,
      rate: 0,
      avgLatency: 0,
      availability: 100,
      chartData: [],
      statusChartData: [],
      topFailing: []
    };

    const total = logs.length;
    const failures = logs.filter(l => l.statusCode >= 400).length;
    const rate = ((failures / total) * 100).toFixed(1);
    const avgLatency = Math.round(logs.reduce((acc, l) => acc + l.duration, 0) / total);
    
    // Group by time (mocking time buckets)
    const chartData = logs.slice(-20).map((l, i) => ({
      time: new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      total: Math.floor(Math.random() * 10) + 5,
      fail: Math.floor(Math.random() * 3)
    }));

    // Status code distribution
    const statusGroups = logs.reduce((acc, l) => {
      const code = l.statusCode;
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    }, {});

    const statusChartData = Object.entries(statusGroups).map(([code, count]) => ({
      name: `HTTP ${code}`,
      value: count,
      color: code >= 500 ? '#ff007a' : code >= 400 ? '#ffb000' : '#00f2ff'
    }));

    // Top Failing
    const failingRoutes = logs.filter(l => l.statusCode >= 400).reduce((acc, l) => {
      acc[l.route] = (acc[l.route] || 0) + 1;
      return acc;
    }, {});
    
    const topFailing = Object.entries(failingRoutes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([route, count]) => ({
        endpoint: route,
        count,
        errorRate: ((count / total) * 100).toFixed(1),
        method: logs.find(l => l.route === route)?.method || 'GET'
      }));

    return { total, failures, rate, avgLatency, availability: (100 - rate), chartData, statusChartData, topFailing };
  }, [logs]);

  return (
    <div className="space-y-8">
      {/* KPI Section - The Light + Dark Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Engine Throughput" 
          value={metrics.total} 
          trend="+12% VS PREV HR" 
          data={[{v: 30}, {v: 45}, {v: 35}, {v: 60}, {v: 55}, {v: 80}]}
          color="#00f2ff" 
          icon={<Zap className="text-neon-cyan" size={16} />}
          isLight={true} // LIGHT ELEMENT
        />
        <KPICard 
          title="System Failures" 
          value={metrics.failures} 
          trend="+4.2% VS PREV HR" 
          data={[{v: 5}, {v: 8}, {v: 12}, {v: 7}, {v: 15}, {v: 10}]}
          color="#ff007a" 
          isNegative 
          icon={<AlertCircle className="text-neon-pink" size={16} />}
        />
        <KPICard 
          title="Failure Velocity" 
          value={`${metrics.rate}%`} 
          trend="-1.5% VS PREV HR" 
          data={[{v: 2}, {v: 5}, {v: 3}, {v: 4}, {v: 6}, {v: 4}]}
          color="#bcff00" 
          icon={<Activity className="text-neon-lime" size={16} />}
          isLight={true} // LIGHT ELEMENT
        />
        <KPICard 
          title="Response Latency" 
          value={`${metrics.avgLatency}ms`} 
          trend="+20ms VS PREV HR" 
          data={[{v: 400}, {v: 600}, {v: 450}, {v: 800}, {v: 700}, {v: 900}]}
          color="#9d00ff" 
          icon={<Clock className="text-neon-purple" size={16} />}
        />
      </div>

      {/* Primary Intelligence Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-8 space-y-8 bg-white/[0.01]">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Telemetry Volume</h3>
              <p className="text-sm font-black text-white">Ingestion Matrix <span className="text-neon-cyan opacity-50 font-mono text-[10px]">REAL-TIME</span></p>
            </div>
            <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-slate-400 outline-none hover:bg-white/10 transition-all">
               <option>Last 60 Minutes</option>
               <option>Last 24 Hours</option>
            </select>
          </div>

          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={metrics.chartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFail" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff007a" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ff007a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#475569', fontSize: 10, fontWeight: 'bold'}}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#475569', fontSize: 10, fontWeight: 'bold'}}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#06080f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }}
                  itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
                />
                <Area type="monotone" dataKey="total" stroke="#00f2ff" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} />
                <Area type="monotone" dataKey="fail" stroke="#ff007a" fillOpacity={1} fill="url(#colorFail)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution - Neon Pie */}
        <div className="glass-card p-8 flex flex-col items-center bg-white/[0.01]">
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest w-full mb-8">HTTP Vector Analysis</h3>
           <div className="h-[240px] w-full relative min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={metrics.statusChartData}
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {metrics.statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#06080f', border: 'none', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '10px', color: '#fff', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-[10px] font-black text-slate-500 uppercase">Success Rate</span>
                 <span className="text-3xl font-black text-white">{metrics.availability}%</span>
              </div>
           </div>
           
           <div className="w-full mt-8 grid grid-cols-2 gap-4">
              {metrics.statusChartData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                   <span className="text-[10px] font-black text-slate-400 uppercase">{item.name}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Bottom Insights: Light Panels against Neon Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-8 space-y-8 bg-white/[0.01]">
           <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">High-Risk Endpoints</h3>
              <span className="badge-neon-red">Immediate Attention Required</span>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {metrics.topFailing.map((item, i) => (
                <div key={i} className="p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/5 space-y-4 hover:border-neon-pink/30 transition-all group">
                   <div className="flex justify-between items-start">
                      <div className="space-y-1">
                         <span className="text-[9px] font-black text-neon-pink bg-neon-pink/10 px-2 py-0.5 rounded uppercase tracking-widest">{item.method}</span>
                         <div className="text-[11px] font-black text-white group-hover:text-neon-pink transition-colors truncate max-w-[150px]">{item.endpoint}</div>
                      </div>
                      <div className="text-right">
                         <div className="text-xs font-black text-white">{item.count}</div>
                         <div className="text-[8px] font-bold text-slate-500 uppercase">Failures</div>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black">
                         <span className="text-slate-500">Risk Coefficient</span>
                         <span className="text-neon-pink">{item.errorRate}%</span>
                      </div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${item.errorRate}%` }}
                           className="h-full bg-neon-pink shadow-[0_0_8px_#ff007a]"
                         />
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Intelligence Alert - Light Cyber Style */}
        <div className="glass-card p-8 bg-white/[0.03] flex flex-col space-y-6">
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Alerts</h3>
           <div className="space-y-4 flex-grow">
              <AlertItem 
                title="Latency Spike" 
                desc="Service 'test-api' response time > 1200ms"
                time="2m ago"
                severity="critical"
              />
              <AlertItem 
                title="Auth Failures" 
                desc="Unusual 401 volume on /create-data"
                time="15m ago"
                severity="warning"
              />
              <AlertItem 
                title="Service Map Drift" 
                desc="New downstream dependency detected"
                time="1h ago"
                severity="info"
              />
           </div>
           <button className="neon-glow-btn w-full">
              Access Alert Matrix
           </button>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, trend, data, color, isNegative, icon, isLight }) => (
  <div className={`p-6 space-y-4 group transition-all duration-500 rounded-[2rem] border ${
    isLight 
      ? 'bg-white text-slate-900 border-white shadow-[0_20px_40px_rgba(255,255,255,0.05)]' 
      : 'bg-white/[0.03] text-white border-white/5 hover:border-white/10'
  }`}>
    <div className="flex justify-between items-start">
      <div className="space-y-1">
        <h4 className={`text-[10px] font-black uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{title}</h4>
        <div className={`text-3xl font-black tracking-tighter ${isLight ? 'text-black' : 'text-white'}`}>{value}</div>
      </div>
      <div className={`p-3 rounded-2xl ${isLight ? 'bg-slate-50' : 'bg-white/5'}`}>
        {icon}
      </div>
    </div>
    
    <div className="h-10 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <LineChart data={data}>
          <Line 
            type="monotone" 
            dataKey="v" 
            stroke={color} 
            strokeWidth={3} 
            dot={false} 
            animationDuration={2000}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>

    <div className="flex items-center gap-2">
      <span className={`flex items-center gap-1.5 text-[10px] font-black ${isNegative ? 'text-neon-pink' : 'text-neon-lime'}`}>
        {isNegative ? <TrendingDown size={14} /> : <TrendingUp size={14} />} {trend}
      </span>
    </div>
  </div>
);

const AlertItem = ({ title, desc, time, severity }) => (
  <div className="p-4 rounded-2xl bg-black/20 border border-white/5 space-y-1 group hover:border-white/10 transition-all">
     <div className="flex justify-between items-center">
        <span className={`text-[9px] font-black uppercase tracking-widest ${
           severity === 'critical' ? 'text-neon-pink' : severity === 'warning' ? 'text-neon-lime' : 'text-neon-cyan'
        }`}>{title}</span>
        <span className="text-[8px] font-bold text-slate-600">{time}</span>
     </div>
     <p className="text-[10px] font-bold text-slate-400 leading-relaxed">{desc}</p>
  </div>
);

export default AnalyticsSummary;
