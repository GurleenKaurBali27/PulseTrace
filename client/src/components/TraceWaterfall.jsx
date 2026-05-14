import React from "react";
import { motion } from "framer-motion";
import { ChevronRight, ChevronDown, Server, Cpu, AlertCircle, CheckCircle2 } from "lucide-react";

const TraceWaterfall = ({ spans }) => {
  if (!spans || spans.length === 0) return (
    <div className="glass-card p-20 text-center flex flex-col items-center gap-4">
      <AlertCircle size={48} className="text-slate-700" />
      <p className="text-slate-500 font-medium">Telemetry data missing for this sequence.</p>
    </div>
  );

  // Calculate global start and end times
  const minTime = Math.min(...spans.map(s => new Date(s.createdAt).getTime()));
  const maxTime = Math.max(...spans.map(s => new Date(s.createdAt).getTime() + s.duration));
  const totalDuration = maxTime - minTime;

  // Organize spans into a tree structure
  const buildTree = (parentId = null) => {
    return spans
      .filter(s => s.parentSpanId === parentId)
      .map(s => ({
        ...s,
        children: buildTree(s.spanId)
      }));
  };

  const tree = buildTree(null);

  const SpanRow = ({ span, depth = 0 }) => {
    const [isOpen, setIsOpen] = React.useState(true);
    const startTime = new Date(span.createdAt).getTime();
    const leftOffset = ((startTime - minTime) / totalDuration) * 100;
    const width = (span.duration / totalDuration) * 100;
    const isError = span.statusCode >= 400;

    return (
      <div className="group">
        <div 
          className="flex items-center py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors relative"
          style={{ paddingLeft: `${depth * 24}px` }}
        >
          {/* Label Section */}
          <div className="flex items-center w-[350px] min-w-[350px] z-10">
            {span.children && span.children.length > 0 ? (
              <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="mr-2 p-1 rounded-md hover:bg-white/10 text-slate-500 hover:text-white transition-all"
              >
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <div className="w-6" />
            )}
            
            <div className={`flex items-center gap-2 overflow-hidden`}>
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                isError ? 'bg-red-500/20 text-red-400' : 'bg-sky-500/20 text-sky-400'
              }`}>
                {span.method}
              </span>
              <span className="text-xs font-bold text-slate-200 truncate max-w-[180px]" title={span.route}>
                {span.route.split('/').pop() || '/'}
              </span>
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter bg-slate-900 px-1 rounded border border-white/5">
                {span.serviceName}
              </span>
            </div>
            
            <div className="ml-auto pr-4">
              {isError ? (
                <AlertCircle size={14} className="text-red-500" />
              ) : (
                <CheckCircle2 size={14} className="text-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          </div>

          {/* Timeline Bar Section */}
          <div className="flex-grow relative h-8 flex items-center">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex justify-between pointer-events-none opacity-5">
              {[...Array(5)].map((_, i) => <div key={i} className="w-px h-full bg-white" />)}
            </div>

            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: `${Math.max(width, 0.5)}%`, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`relative h-2.5 rounded-full ${
                isError 
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                  : 'bg-gradient-to-r from-sky-400 to-indigo-500 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
              }`}
              style={{ left: `${leftOffset}%` }}
            >
              {/* Duration Label */}
              <div className="absolute top-full mt-1 left-0 text-[9px] font-bold text-slate-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0 duration-300">
                {span.duration}ms
              </div>
              
              {/* Hover Glow Effect */}
              <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
            </motion.div>
          </div>
        </div>

        {isOpen && span.children && span.children.map(child => (
          <SpanRow key={child.spanId} span={child} depth={depth + 1} />
        ))}
      </div>
    );
  };

  return (
    <div className="glass-card overflow-hidden border-white/[0.05]">
      <div className="flex bg-white/[0.02] border-b border-white/[0.05] p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
        <div className="w-[350px] min-w-[350px]">Service & Operation Topology</div>
        <div className="flex-grow text-center">Execution Timeline ({totalDuration}ms)</div>
      </div>
      <div className="p-2 max-h-[700px] overflow-y-auto overflow-x-hidden">
        {tree.map(rootSpan => (
          <SpanRow key={rootSpan.spanId} span={rootSpan} />
        ))}
      </div>
      <div className="bg-black/40 p-3 flex justify-center gap-6 border-t border-white/[0.05]">
        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase">
          <div className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_5px_rgba(56,189,248,0.8)]" /> Active Span
        </div>
        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase">
          <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]" /> Fault Detected
        </div>
        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase">
          <div className="w-2 h-2 rounded-full bg-slate-800" /> Latency Threshold
        </div>
      </div>
    </div>
  );
};

export default TraceWaterfall;
