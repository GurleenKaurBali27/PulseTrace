import { useState } from "react";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FilterBar({ onFilterChange, currentFilters }) {
  const [searchInput, setSearchInput] = useState("");

  const statusRanges = [
    { label: "All", value: null },
    { label: "2xx Success", value: "2xx" },
    { label: "4xx Client", value: "4xx" },
    { label: "5xx Server", value: "5xx" }
  ];

  const methods = [
    { label: "All", value: null },
    { label: "GET", value: "GET" },
    { label: "POST", value: "POST" },
    { label: "PUT", value: "PUT" },
    { label: "DELETE", value: "DELETE" }
  ];

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    onFilterChange({ ...currentFilters, route: value });
  };

  const handleClear = () => {
    setSearchInput("");
    onFilterChange({ statusRange: null, method: null, route: "" });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full">
      {/* Search Input */}
      <div className="relative flex-grow min-w-[280px]">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input
          type="text"
          placeholder="Filter by route operation..."
          value={searchInput}
          onChange={handleSearch}
          className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:border-sky-500/50 outline-none transition-all placeholder:text-slate-600"
        />
        <AnimatePresence>
          {searchInput && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-500"
            >
              <X size={14} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-4">
        {/* Status Filter */}
        <div className="flex items-center gap-2 p-1 bg-black/20 border border-white/10 rounded-xl">
           <div className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-white/5">Status</div>
           <div className="flex gap-1 pr-1">
             {statusRanges.map((range) => (
               <button
                 key={range.label}
                 onClick={() => onFilterChange({ ...currentFilters, statusRange: range.value })}
                 className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                   currentFilters.statusRange === range.value 
                     ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' 
                     : 'text-slate-500 hover:text-slate-300'
                 }`}
               >
                 {range.label}
               </button>
             ))}
           </div>
        </div>

        {/* Method Filter */}
        <div className="flex items-center gap-2 p-1 bg-black/20 border border-white/10 rounded-xl">
           <div className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-white/5">Method</div>
           <div className="flex gap-1 pr-1">
             {methods.map((m) => (
               <button
                 key={m.label}
                 onClick={() => onFilterChange({ ...currentFilters, method: m.value })}
                 className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                   currentFilters.method === m.value 
                     ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                     : 'text-slate-500 hover:text-slate-300'
                 }`}
               >
                 {m.label}
               </button>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}
