import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, Zap, Github, Globe } from "lucide-react";
import api from "../services/api";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    orgName: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/signup";
      const res = await api.post(endpoint, formData);
      
      if (res.data.success) {
        localStorage.setItem("token", res.data.accessToken);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        
        if (res.data.org) {
          localStorage.setItem("activeOrgId", res.data.org.id);
        }
        if (res.data.project) {
          localStorage.setItem("activeProjectId", res.data.project.id);
          localStorage.setItem("apiKey", res.data.project.apiKey);
        }
        
        if (res.data.orgs && res.data.orgs.length > 0) {
          const firstOrg = res.data.orgs[0];
          localStorage.setItem("activeOrgId", firstOrg.org.id);
          if (firstOrg.projects && firstOrg.projects.length > 0) {
            localStorage.setItem("activeProjectId", firstOrg.projects[0].id);
            localStorage.setItem("apiKey", firstOrg.projects[0].apiKey);
          }
        }
        
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#06080f] px-4 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-neon-cyan/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-neon-pink/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card p-10 space-y-8 relative z-10 border-white/10"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-white/[0.03] border border-white/10 mb-4">
             <Zap size={32} className="text-neon-cyan fill-neon-cyan/20" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter">
            {isLogin ? "Welcome Back" : "Ignite Your Pulse"}
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
            Enterprise API Telemetry & Security
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative group">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-neon-cyan transition-colors" />
                <input 
                  type="text" 
                  required
                  placeholder="John Doe"
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-neon-cyan/50 transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative group">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-neon-cyan transition-colors" />
              <input 
                type="email" 
                required
                placeholder="john@example.com"
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-neon-cyan/50 transition-all"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
            <div className="relative group">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-neon-cyan transition-colors" />
              <input 
                type="password" 
                required
                placeholder="••••••••"
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-neon-cyan/50 transition-all"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Organization Name</label>
              <input 
                type="text" 
                placeholder="Acme Corp"
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-sm text-white focus:outline-none focus:border-neon-cyan/50 transition-all"
                value={formData.orgName}
                onChange={(e) => setFormData({...formData, orgName: e.target.value})}
              />
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-black text-[11px] uppercase tracking-[0.2em] py-4 rounded-2xl hover:bg-neon-cyan hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all duration-500 disabled:opacity-50"
          >
            {loading ? "Verifying..." : (isLogin ? "Sign In" : "Get Started")}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
          <div className="relative flex justify-center text-[9px] uppercase font-black tracking-widest"><span className="bg-[#06080f] px-4 text-slate-600">Or continue with</span></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <button className="flex items-center justify-center gap-3 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-slate-300 text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.05] transition-all">
              <Github size={16} /> GitHub
           </button>
           <button className="flex items-center justify-center gap-3 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-slate-300 text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.05] transition-all">
              <Globe size={16} /> Google
           </button>
        </div>

        <p className="text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest">
          {isLogin ? "New to PulseTrace?" : "Already have an account?"}{" "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-neon-cyan hover:underline transition-all"
          >
            {isLogin ? "Create Account" : "Sign In"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
