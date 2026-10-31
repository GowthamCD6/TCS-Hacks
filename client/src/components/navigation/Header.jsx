import React, { useState } from 'react';
import { Search, Bell, Clock, ShieldCheck, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Header = ({ onSearch }) => {
  const [timeFilter, setTimeFilter] = useState('today');
  const [searchValue, setSearchValue] = useState('');

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <header className="h-20 px-6 flex items-center justify-between border-b border-purple-500/15 glass-panel sticky top-0 z-30 bg-[#080614]/85 backdrop-blur-xl">
      {/* Search Input matching screenshot glowing capsule */}
      <div className="relative w-72 sm:w-96">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4 text-purple-400" />
        </div>
        <input
          type="text"
          value={searchValue}
          onChange={handleSearchChange}
          placeholder="Search feedback, incident, customer ID..."
          className="w-full pl-10 pr-12 py-2 text-sm bg-white/5 border border-purple-500/30 rounded-full text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <kbd className="hidden sm:inline-block text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-400 border border-white/10">
            /
          </kbd>
        </div>
      </div>

      {/* Middle & Right Section: Time Filter, Notification, Profile */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Time filters pill group */}
        <div className="hidden md:flex items-center p-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium">
          {['today', '7days', '30days'].map((filter) => (
            <button
              type="button"
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={cn(
                'px-3.5 py-1.5 rounded-full transition-all duration-200 capitalize',
                timeFilter === filter
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)] font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              {filter === 'today' ? 'Today' : filter === '7days' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>

        {/* Hackathon Simulation Mode Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          <span className="font-mono text-[11px]">TCS AI Sandbox Mode</span>
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="relative p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          title="3 Unresolved Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-[9px] font-bold text-white flex items-center justify-center border border-[#080612]">
            03
          </span>
        </button>

        {/* User profile dropdown matching screenshot */}
        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-white/10 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5 shadow-md">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
              alt="Liam Anderson"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">
              Liam Anderson
            </p>
            <p className="text-[10px] text-slate-400">Operations Manager</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
        </div>
      </div>
    </header>
  );
};
