import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchLogDetail } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Activity, Clock, Globe, ShieldAlert, Code2, 
  Database, HardDrive, Cpu, Terminal, Copy, Check, Eye, EyeOff, ShieldCheck, Lock, Shield
} from "lucide-react";

/**
 * Specialized component to render masked/sensitive data with indicators
 */
const MaskedValue = ({ value }) => {
  if (typeof value !== 'string') return <span>{String(value)}</span>;

  // Pattern: @@MASKED:TYPE:REDACTED@@
  const maskedRegex = /@@MASKED:(.*?):(.*?)@@/g;
  const redactedKeyRegex = /@@REDACTED_KEY:(.*?)@@/g;

  if (value.match(maskedRegex)) {
    return (
      <span className="inline-flex items-center gap-2 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 group relative cursor-help">
        <Lock size={10} className="opacity-70" />
        <span className="font-mono text-[10px] font-bold">{value.replace(maskedRegex, '$2')}</span>
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-slate-900 text-[8px] font-black uppercase text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 shadow-2xl z-50">
           {value.replace(maskedRegex, '$1')} REDACTED
        </span>
      </span>
    );
  }

  if (value.match(redactedKeyRegex)) {
    return (
      <span className="inline-flex items-center gap-2 px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
        <Shield size={10} className="opacity-70" />
        <span className="font-mono text-[10px] font-black uppercase tracking-widest">SENSITIVE DATA</span>
      </span>
    );
  }

  return <span>{value}</span>;
};

export default function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadLogDetail();
  }, [id]);

  const loadLogDetail = async (reveal = false) => {
    try {
      if (!reveal) setLoading(true);
      // Mocking admin role for demo reveal
      const headers = reveal ? { 'x-user-role': 'admin' } : {};
      const response = await fetchLogDetail(`${id}${reveal ? '?reveal=true' : ''}`, { headers });
      setLog(response.data || response);
    } catch (err) {
      console.error("Error loading log detail:", err);
      setError("Failed to load request details.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="w-10 h-10 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
      <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Decoding Telemetry...</p>
    </div>
  );

  if (error || !log) return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
      <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center border border-rose-500/20">
         <ShieldAlert size={40} className="text-rose-500" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-black text-white">Telemetry Not Found</h2>
        <p className="text-slate-500 text-sm">The requested correlation ID does not exist in the active buffer.</p>
      </div>
      <button onClick={() => navigate("/")} className="glass-btn px-8">Back to Overview</button>
    </div>
  );

  const details = typeof log.details === "string" ? JSON.parse(log.details) : log.details || {};

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate("/")}
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-white">Request Detail</h1>
              <span className={`badge-glow ${log.statusCode >= 400 ? 'badge-red' : 'badge-green'}`}>
                {log.statusCode}
              </span>
              {log._isRevealed && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-widest">
                  <ShieldCheck size={12} /> Data Reveal Active
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
               <span className="flex items-center gap-1.5"><Terminal size={14} /> {log.requestId}</span>
               <span className="flex items-center gap-1.5"><Clock size={14} /> {new Date(log.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {!log._isRevealed && (
           <button 
             onClick={() => loadLogDetail(true)}
             className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all group"
           >
             <Eye size={16} className="group-hover:scale-110 transition-transform" /> Reveal Sensitive Info
           </button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Quick Insights */}
        <div className="xl:col-span-1 space-y-6">
          <div className="glass-card p-6 space-y-6">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Overview</h3>
             <div className="space-y-4">
                <InfoItem label="Method" value={log.method} color={log.method === 'GET' ? 'text-sky-400' : 'text-emerald-400'} />
                <InfoItem label="Service" value={log.serviceName} />
                <InfoItem label="Duration" value={`${log.duration}ms`} color={log.duration > 1000 ? 'text-rose-400' : 'text-emerald-400'} />
                <InfoItem label="Route" value={log.route} isCode />
                <InfoItem label="IP Address" value={<MaskedValue value={details.ip || 'Localhost'} />} />
             </div>
          </div>

          <div className="glass-card p-6 space-y-4">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Correlation</h3>
             <div className="space-y-2">
                <div className="text-[10px] text-slate-600 font-bold uppercase mb-2">Trace ID</div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 group">
                   <code className="text-[11px] font-mono text-sky-400 truncate pr-4">{log.traceId || 'N/A'}</code>
                   <button onClick={() => copyToClipboard(log.traceId)} className="text-slate-500 hover:text-white shrink-0">
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                   </button>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Dynamic Data tabs */}
        <div className="xl:col-span-2 space-y-6">
          <div className="glass-card overflow-hidden flex flex-col min-h-[600px]">
             {/* Tabs Header */}
             <div className="flex border-b border-white/5 bg-white/[0.01]">
                <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Activity size={16} />} label="Context" />
                <TabButton active={activeTab === 'headers'} onClick={() => setActiveTab('headers')} icon={<Code2 size={16} />} label="Headers" />
                <TabButton active={activeTab === 'body'} onClick={() => setActiveTab('body')} icon={<Database size={16} />} label="Payload" />
                <TabButton active={activeTab === 'raw'} onClick={() => setActiveTab('raw')} icon={<Terminal size={16} />} label="Raw JSON" />
             </div>

             <div className="p-8 flex-grow">
                <AnimatePresence mode="wait">
                   <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                   >
                      {activeTab === 'overview' && (
                        <div className="space-y-8">
                           {log.error && (
                             <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3">
                                <div className="flex items-center gap-2 text-rose-500 text-xs font-black uppercase tracking-widest">
                                   <ShieldAlert size={16} /> Exception Detected
                                </div>
                                <pre className="text-sm font-mono text-rose-400 overflow-x-auto whitespace-pre-wrap">
                                   <MaskedValue value={log.error} />
                                </pre>
                             </div>
                           )}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <DataBlock title="System Agent" value={<MaskedValue value={details.userAgent || 'Unknown'} />} />
                              <DataBlock title="Response Size" value={`${log.responseSize} bytes`} />
                           </div>
                        </div>
                      )}

                      {activeTab === 'headers' && (
                        <div className="space-y-4">
                           {Object.entries(details.headers || {}).map(([key, val]) => (
                             <div key={key} className="flex justify-between items-start gap-4 p-3 rounded-xl hover:bg-white/[0.02] transition-all">
                                <span className="text-[11px] font-mono text-slate-500 shrink-0">{key}</span>
                                <span className="text-[11px] font-mono text-sky-400 break-all text-right">
                                   <MaskedValue value={val} />
                                </span>
                             </div>
                           ))}
                        </div>
                      )}

                      {activeTab === 'body' && (
                        <div className="h-full">
                           <pre className="p-6 rounded-2xl bg-black/40 border border-white/5 font-mono text-xs text-slate-300 overflow-auto max-h-[500px]">
                              {JSON.stringify(log.requestBody || {}, null, 2).split('\n').map((line, i) => (
                                <div key={i}><MaskedValue value={line} /></div>
                              ))}
                           </pre>
                        </div>
                      )}

                      {activeTab === 'raw' && (
                        <div className="h-full">
                           <pre className="p-6 rounded-2xl bg-black/40 border border-white/5 font-mono text-xs text-sky-400 overflow-auto max-h-[500px]">
                              {JSON.stringify(log, null, 2)}
                           </pre>
                        </div>
                      )}
                   </motion.div>
                </AnimatePresence>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const InfoItem = ({ label, value, color = "text-white", isCode = false }) => (
  <div className="flex justify-between items-center text-xs">
    <span className="text-slate-500 font-bold uppercase tracking-wider">{label}</span>
    <span className={`${color} font-black ${isCode ? 'font-mono bg-white/5 px-2 py-1 rounded' : ''}`}>{value}</span>
  </div>
);

const TabButton = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
      active ? 'border-rose-500 text-white bg-rose-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'
    }`}
  >
    {icon} {label}
  </button>
);

const DataBlock = ({ title, value }) => (
  <div className="space-y-2">
     <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{title}</div>
     <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs font-bold text-slate-300 break-all">
        {value}
     </div>
  </div>
);
