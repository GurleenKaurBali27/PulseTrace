import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Server, Globe, Cpu } from 'lucide-react';

const ServiceMap = ({ dependencies }) => {
  const services = useMemo(() => {
    const nodes = new Set();
    dependencies.forEach(d => {
      nodes.add(d.from);
      nodes.add(d.to);
    });
    return Array.from(nodes);
  }, [dependencies]);

  const nodePositions = useMemo(() => {
    const positions = {};
    const radius = 140;
    const centerX = 350; // SVG width is larger now
    const centerY = 200;

    services.forEach((service, i) => {
      const angle = (i / services.length) * 2 * Math.PI - Math.PI / 2;
      positions[service] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });
    return positions;
  }, [services]);

  return (
    <div className="relative w-full h-[450px] bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden group">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.08)_0%,transparent_70%)]" />
      <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-700" 
           style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

      <div className="absolute top-8 left-8 space-y-1">
        <h3 className="text-white text-xl font-black tracking-tighter flex items-center gap-2">
          <Globe className="text-sky-400" size={20} />
          Service Topology
        </h3>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Microservices Mesh</p>
      </div>

      <svg width="700" height="400" className="mx-auto overflow-visible relative z-10">
        <defs>
          <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#818cf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Connections with animated particles */}
        {dependencies.map((dep, i) => {
          const from = nodePositions[dep.from];
          const to = nodePositions[dep.to];
          if (!from || !to) return null;

          return (
            <React.Fragment key={`dep-${i}`}>
              <motion.path
                d={`M ${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${(from.y + to.y) / 2 - 20}, ${to.x} ${to.y}`}
                fill="none"
                stroke="url(#edgeGradient)"
                strokeWidth="1.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, delay: i * 0.2 }}
              />
              {/* Particle animation along path */}
              <motion.circle
                r="3"
                fill="#38bdf8"
                filter="url(#glow)"
                initial={{ offsetDistance: "0%", opacity: 0 }}
                animate={{ offsetDistance: "100%", opacity: [0, 1, 1, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.5, ease: "linear" }}
                style={{ offsetPath: `path("M ${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${(from.y + to.y) / 2 - 20}, ${to.x} ${to.y}")` }}
              />
            </React.Fragment>
          );
        })}

        {/* Nodes */}
        {services.map((service, i) => {
          const pos = nodePositions[service];
          return (
            <motion.g
              key={service}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: i * 0.1 }}
              whileHover={{ scale: 1.1 }}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r="32"
                className="fill-slate-900 stroke-white/10"
                style={{ filter: 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.2))' }}
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r="24"
                className="fill-sky-500/5 stroke-sky-500/20"
              />
              <text
                x={pos.x}
                y={pos.y + 45}
                textAnchor="middle"
                className="fill-slate-400 text-[9px] font-black uppercase tracking-widest pointer-events-none"
              >
                {service}
              </text>
              <foreignObject x={pos.x - 10} y={pos.y - 10} width="20" height="20">
                <div className="flex items-center justify-center w-full h-full text-sky-400">
                  <Cpu size={14} />
                </div>
              </foreignObject>
            </motion.g>
          );
        })}
      </svg>

      {services.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-4">
          <Server size={48} className="animate-pulse" />
          <p className="text-xs font-bold uppercase tracking-[0.3em]">Awaiting Cluster Data</p>
        </div>
      )}
    </div>
  );
};

export default ServiceMap;
