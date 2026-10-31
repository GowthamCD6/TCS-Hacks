import React, { useState } from 'react';
import { Search, Bell, Clock, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Header = ({ onSearch }) => {
  const [timeFilter, setTimeFilter] = useState('today');
  const [searchValue, setSearchValue] = useState('');

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <header className="h-20 px-6 sm:px-10 flex items-center justify-between sticky top-0 z-40 bg-[#080512]/75 backdrop-blur-xl border-b border-white/[0.05]">
      {/* Left: Brand Logo & Title matching OpsPilot in screenshot */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 p-[1.5px] shadow-[0_0_18px_rgba(168,85,247,0.45)] flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-[#0c081a] flex items-center justify-center">
            <div className="w-4 h-4 rounded-full border border-purple-400 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]" />
            </div>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-extrabold text-lg sm:text-xl text-white tracking-tight">OpsPilot</span>
          <span className="text-[10px] font-mono uppercase text-purple-400/80 font-bold tracking-widest hidden md:inline">
            RecoverIQ
          </span>
        </div>
      </div>

      {/* Center: Search Capsule + Time Filter Tabs centered under the Aurora beam */}
      <div className="flex items-center gap-3 sm:gap-4 mx-auto">
        {/* Search Input Capsule */}
        <div className="relative w-44 sm:w-64 md:w-80">
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search"
            className="w-full pl-4 pr-10 py-2 text-xs sm:text-sm bg-[#160d2e]/80 border border-white/10 rounded-full text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all"
          />
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4 text-purple-300" />
          </div>
        </div>

        {/* Time Filter Tabs Capsule centered in top bar */}
        <div className="hidden sm:flex items-center p-1 rounded-full bg-[#130b26]/90 border border-white/10 text-xs font-medium backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          {['today', '7days', '30days'].map((filter) => (
            <button
              type="button"
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={cn(
                'px-4 py-1.5 rounded-full transition-all duration-200 capitalize cursor-pointer text-xs',
                timeFilter === filter
                  ? 'bg-gradient-to-r from-purple-600/70 to-indigo-600/80 text-white shadow-[0_0_12px_rgba(168,85,247,0.45)] border border-purple-400/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              {filter === 'today' ? 'Today' : filter === '7days' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Notifications, Clock & User Profile matching screenshot */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 flex-shrink-0">
        {/* Notifications Button with '03' badge */}
        <button
          type="button"
          className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#150d2c]/80 border border-white/10 hover:border-purple-400/40 hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all flex items-center justify-center backdrop-blur-xl shadow-md cursor-pointer"
          title="3 Unresolved Alerts"
        >
          <Bell className="w-4 h-4 text-purple-300" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-[9px] font-bold text-white flex items-center justify-center border border-[#080512] shadow-[0_0_8px_rgba(168,85,247,0.8)]">
            03
          </span>
        </button>

        {/* Clock/History Button */}
        <button
          type="button"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#150d2c]/80 border border-white/10 hover:border-purple-400/40 hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all hidden sm:flex items-center justify-center backdrop-blur-xl shadow-md cursor-pointer"
          title="Recent Workflow Logs"
        >
          <Clock className="w-4 h-4 text-slate-400 hover:text-purple-300" />
        </button>

        {/* User profile capsule pill */}
        <div className="flex items-center gap-2 sm:gap-2.5 px-2.5 py-1.5 rounded-full bg-[#150d2c]/80 border border-white/10 hover:border-purple-400/30 transition-all cursor-pointer backdrop-blur-xl shadow-md group">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
            alt="Liam Anderson"
            className="w-7 h-7 object-cover rounded-full border border-purple-400/40"
          />
          <div className="hidden lg:block text-left pr-1">
            <p className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors leading-tight">
              Liam Anderson
            </p>
            <p className="text-[10px] text-slate-400 leading-tight">Operations Manager</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-colors" />
        </div>
      </div>
    </header>
  );
};

export default Header;
