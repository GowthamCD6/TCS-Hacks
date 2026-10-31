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
    /* Top Bar: Fixed at top, does NOT scroll with page, NO divider border line below */
    <header className="fixed top-0 left-0 right-0 h-[72px] px-6 sm:px-10 flex items-center justify-between z-50 bg-[#080512]/90 backdrop-blur-2xl">
      {/* Left: Brand Aperture Logo & OpsPilot text */}
      <div className="flex items-center gap-3.5 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8B5CF6] to-[#6D28D9] p-[1.5px] shadow-[0_0_16px_rgba(139,92,246,0.6)] flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-[#080512] flex items-center justify-center">
            <div className="w-4 h-4 rounded-full border border-purple-400 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FFFFFF]" />
            </div>
          </div>
        </div>
        <span className="font-semibold text-[22px] text-[#FFFFFF] tracking-tight">OpsPilot</span>
      </div>

      {/* Center: Search Capsule + Time Filter Tabs */}
      <div className="flex items-center gap-4 sm:gap-6 mx-auto">
        {/* Search Capsule Glass Pill */}
        <div className="relative w-56 sm:w-72 md:w-96">
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search"
            className="w-full pl-5 pr-11 py-2.5 text-[13px] glass-pill text-[#FFFFFF] placeholder-[#9E9BB2] focus:outline-none focus:border-white/40 transition-all"
          />
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-white/70">
            <Search className="w-4 h-4 text-white/80" />
          </div>
        </div>

        {/* Time Filter Capsule Glass Pill */}
        <div className="hidden sm:flex items-center p-1 rounded-full glass-pill text-[13px]">
          {['today', '7days', '30days', 'custom'].map((filter) => (
            <button
              type="button"
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={cn(
                'px-4 py-1.5 rounded-full transition-all duration-200 capitalize cursor-pointer text-[13px]',
                timeFilter === filter
                  ? 'glass-pill-active font-medium'
                  : 'text-white/70 hover:text-[#FFFFFF]'
              )}
            >
              {filter === 'today' ? 'Today' : filter === '7days' ? '7 Days' : filter === '30days' ? '30 Days' : 'Custom'}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Notifications, Clock & User Profile matching screenshot */}
      <div className="flex items-center gap-3.5 flex-shrink-0">
        {/* Notifications Button with '03' badge */}
        <button
          type="button"
          className="relative w-10 h-10 rounded-full glass-pill text-[#FFFFFF] hover:bg-white/20 transition-all flex items-center justify-center cursor-pointer"
          title="3 Unresolved Alerts"
        >
          <Bell className="w-4 h-4 text-[#FFFFFF]" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#8B5CF6] text-[9px] font-bold text-[#FFFFFF] flex items-center justify-center border border-[#080512]">
            03
          </span>
        </button>

        {/* Clock/History Button */}
        <button
          type="button"
          className="w-10 h-10 rounded-full glass-pill text-[#FFFFFF] hover:bg-white/20 transition-all hidden sm:flex items-center justify-center cursor-pointer"
          title="Recent Logs"
        >
          <Clock className="w-4 h-4 text-[#FFFFFF]" />
        </button>

        {/* User profile capsule pill */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full glass-pill hover:border-white/40 transition-all cursor-pointer group">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
            alt="Liam Anderson"
            className="w-7 h-7 object-cover rounded-full border border-white/30 shadow-sm"
          />
          <div className="hidden lg:block text-left pr-1">
            <p className="text-[13px] font-medium text-[#FFFFFF] group-hover:text-purple-200 transition-colors leading-tight">
              Liam Anderson
            </p>
            <p className="text-[11px] text-[#A8A3BA] leading-tight">Operations Manager</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-white/70 group-hover:text-[#FFFFFF] transition-colors" />
        </div>
      </div>
    </header>
  );
};

export default Header;
