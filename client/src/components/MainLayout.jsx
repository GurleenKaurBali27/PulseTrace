import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Bell, User, Calendar, RefreshCw, ChevronDown, 
  LogOut, Settings, Shield, Building2, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "{}"));
  const [orgs, setOrgs] = useState([]);
  const [activeOrg, setActiveOrg] = useState(null);
  const [isOrgOpen, setIsOrgOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    fetchOrgs();
  }, []);

  const fetchOrgs = async () => {
    try {
      const res = await api.get('/orgs');
      setOrgs(res.data.data);
      const currentOrgId = localStorage.getItem("activeOrgId");
      const current = res.data.data.find(o => o.org.id === currentOrgId);
      if (current) setActiveOrg(current);
      else if (res.data.data.length > 0) switchOrg(res.data.data[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const switchOrg = (membership) => {
    localStorage.setItem("activeOrgId", membership.org.id);
    setActiveOrg(membership);
    setIsOrgOpen(false);
    window.location.reload(); // Refresh to update all data context
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="flex bg-[#06080f] min-h-screen font-sans selection:bg-neon-cyan/30 text-slate-200">
      <Sidebar />
      
      <main className="flex-grow flex flex-col min-w-0">
        <header className="h-20 border-b border-white/[0.05] flex items-center justify-between px-10 bg-[#06080f]/80 backdrop-blur-3xl sticky top-0 z-50">
          <div className="flex items-center gap-10">
            {/* Organization Switcher */}
            <div className="relative">
               <button 
                onClick={() => setIsOrgOpen(!isOrgOpen)}
                className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-all group"
               >
                  <Building2 size={16} className="text-neon-cyan" />
                  <div className="text-left">
                     <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Active Org</div>
                     <div className="text-xs font-black text-white">{activeOrg?.org?.name || "Select Org"}</div>
                  </div>
                  <ChevronDown size={14} className={`text-slate-500 transition-transform ${isOrgOpen ? 'rotate-180' : ''}`} />
               </button>

               <AnimatePresence>
                  {isOrgOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 mt-3 w-64 bg-[#0d111a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 p-2"
                    >
                       {orgs.map((m) => (
                         <button 
                          key={m.org.id}
                          onClick={() => switchOrg(m)}
                          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group"
                         >
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 flex items-center justify-center text-neon-cyan font-black text-xs">
                                  {m.org.name[0]}
                               </div>
                               <div className="text-left">
                                  <div className="text-xs font-bold text-white">{m.org.name}</div>
                                  <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{m.role}</div>
                               </div>
                            </div>
                            {activeOrg?.org?.id === m.org.id && <Check size={14} className="text-neon-cyan" />}
                         </button>
                       ))}
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden xl:flex items-center gap-3 px-5 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] font-black uppercase tracking-widest text-slate-400">
               <Shield size={14} className="text-neon-lime" />
               <span>Trust Score: 98%</span>
            </div>

            <div className="h-8 w-px bg-white/5" />

            <div className="relative">
               <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 pl-2 group"
               >
                  <div className="text-right hidden sm:block">
                     <div className="text-xs font-black text-white group-hover:text-neon-cyan transition-colors">{user.name}</div>
                     <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{activeOrg?.role || 'User'}</div>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-neon-cyan text-xs font-black group-hover:border-neon-cyan/50 transition-all overflow-hidden">
                     {user.avatar ? <img src={user.avatar} alt="Avatar" /> : user.name?.substring(0, 2).toUpperCase()}
                  </div>
               </button>

               <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full right-0 mt-3 w-56 bg-[#0d111a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 p-2"
                    >
                       <div className="p-3 border-b border-white/5 mb-1">
                          <div className="text-xs font-black text-white">{user.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
                       </div>
                       <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all">
                          <Settings size={14} /> <span className="text-[10px] font-black uppercase tracking-widest">Settings</span>
                       </button>
                       <button 
                        onClick={logout}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-500/10 text-rose-400 transition-all"
                       >
                          <LogOut size={14} /> <span className="text-[10px] font-black uppercase tracking-widest">Sign Out</span>
                       </button>
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="p-10 max-w-[1800px] mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
