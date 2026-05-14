import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Clock, 
  AlertCircle, 
  Globe, 
  Server, 
  Users, 
  Bell, 
  Settings,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const [collapsed, setCollapsed] = React.useState(false);

  const menuItems = [
    { name: 'Overview', icon: <LayoutDashboard size={18} />, path: '/' },
    { name: 'Timeline', icon: <Clock size={18} />, path: '/traces' },
    { name: 'Errors', icon: <AlertCircle size={18} />, path: '/analytics' },
    { name: 'Endpoints', icon: <Globe size={18} />, path: '#' },
    { name: 'Status Codes', icon: <Server size={18} />, path: '#' },
    { name: 'Clients', icon: <Users size={18} />, path: '#' },
    { name: 'Alerts', icon: <Bell size={18} />, path: '#' },
    { name: 'Settings', icon: <Settings size={18} />, path: '#' },
  ];

  return (
    <motion.aside 
      animate={{ width: collapsed ? 80 : 260 }}
      className="h-screen bg-white/[0.02] backdrop-blur-3xl border-r border-white/5 flex flex-col sticky top-0 z-[60]"
    >
      {/* Brand Icon - Neon Accent */}
      <div className="h-24 flex items-center px-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
             <div className="w-4 h-4 bg-black rounded-sm rotate-45" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tighter text-white">PULSE<span className="text-neon-cyan italic">TRACE</span></span>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">v4.0 Core Engine</span>
            </div>
          )}
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-grow px-4 space-y-1.5">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-4 px-4 py-3 rounded-2xl transition-all relative group
              ${isActive 
                ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'}
            `}
          >
            {({ isActive }) => (
              <>
                <div className={`transition-all duration-300 ${isActive ? 'scale-110' : ''} ${collapsed ? 'mx-auto' : ''}`}>
                  {React.cloneElement(item.icon, { 
                    className: isActive ? 'text-neon-cyan' : 'text-current' 
                  })}
                </div>
                {!collapsed && (
                  <span className={`text-[11px] font-black uppercase tracking-wider transition-all ${isActive ? 'translate-x-1' : ''}`}>
                    {item.name}
                  </span>
                )}
                {isActive && (
                  <motion.div 
                    layoutId="activeGlow" 
                    className="absolute right-2 w-1 h-1 rounded-full bg-neon-cyan shadow-[0_0_10px_#00f2ff]" 
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Control Group - Cyber Light Style */}
      {!collapsed && (
        <div className="p-6 mx-4 mb-6 rounded-3xl bg-white/[0.03] border border-white/5 space-y-4">
           <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Network Status</span>
              <div className="flex items-center gap-1.5">
                 <div className="w-1 h-1 rounded-full bg-neon-lime animate-pulse shadow-[0_0_8px_#bcff00]" />
                 <span className="text-[9px] font-bold text-neon-lime uppercase tracking-widest">Live</span>
              </div>
           </div>
           <button className="w-full py-3 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-neon-cyan transition-all duration-500">
              Diagnostic Mode
           </button>
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="p-4 border-t border-white/5">
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-3 rounded-2xl hover:bg-white/5 text-slate-600 transition-all group"
        >
          {collapsed ? <ChevronRight size={18} className="group-hover:text-neon-cyan" /> : <ChevronLeft size={18} className="group-hover:text-neon-cyan" />}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
