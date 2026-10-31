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
    <header className="h-[68px] px-6 sm:px-10 flex items-center justify-between sticky top-0 z-40 bg-[#0B0B12]/80 backdrop-blur-[16px] border-b border-white/[0.08]">
      {/* Left: Brand Aperture Logo & OpsPilot text */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8B5CF6] to-[#6D28D9] p-[1.5px] shadow-[0_0_14px_rgba(139,92,246,0.4)] flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-[#0E0C17] flex items-center justify-center">
            <div className="w-4 h-4 rounded-full border border-[#8B5CF6] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FFFFFF]" />
            </div>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-[20px] text-[#FFFFFF] tracking-tight">OpsPilot</span>
          <span className="text-[10px] font-mono uppercase text-[#A8A3BA] font-medium tracking-wider hidden md:inline">
            RecoverIQ
          </span>
        </div>
      </div>

      {/* Center: Search Capsule + Time Filter Tabs */}
      <div className="flex items-center gap-3 sm:gap-4 mx-auto">
        {/* Search Capsule Glass Pill */}
        <div className="relative w-48 sm:w-64 md:w-80">
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search"
            className="w-full pl-4 pr-10 py-2 text-[13px] bg-[rgba(32,27,51,0.65)] border border-white/[0.08] rounded-full text-[#FFFFFF] placeholder-[#706C82] focus:outline-none focus:border-[rgba(168,85,247,0.35)] backdrop-blur-[16px] transition-all"
          />
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#9E9BB2]">
            <Search className="w-4 h-4 text-[#A8A3BA]" />
          </div>
        </div>

        {/* Time Filter Capsule Glass Pill */}
        <div className="hidden sm:flex items-center p-1 rounded-full bg-[rgba(32,27,51,0.65)] border border-white/[0.08] backdrop-blur-[16px] text-[13px]">
          {['today', '7days', '30days', 'custom'].map((filter) => (
            <button
              type="button"
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={cn(
                'px-4 py-1 rounded-full transition-all duration-200 capitalize cursor-pointer text-[13px]',
                timeFilter === filter
                  ? 'glass-pill-active font-medium'
                  : 'text-[#9E9BB2] hover:text-[#FFFFFF]'
              )}
            >
              {filter === 'today' ? 'Today' : filter === '7days' ? '7 Days' : filter === '30days' ? '30 Days' : 'Custom'}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Notifications, Clock & User Profile matching screenshot */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Notifications Button with '03' badge */}
        <button
          type="button"
          className="relative w-9 h-9 rounded-full bg-[rgba(32,27,51,0.65)] border border-white/[0.08] hover:bg-white/[0.08] text-[#9E9BB2] hover:text-[#FFFFFF] transition-all flex items-center justify-center backdrop-blur-[16px] cursor-pointer"
          title="3 Unresolved Alerts"
        >
          <Bell className="w-4 h-4 text-[#A8A3BA]" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#8B5CF6] text-[9px] font-bold text-[#FFFFFF] flex items-center justify-center border border-[#0B0B12]">
            03
          </span>
        </button>

        {/* Clock/History Button */}
        <button
          type="button"
          className="w-9 h-9 rounded-full bg-[rgba(32,27,51,0.65)] border border-white/[0.08] hover:bg-white/[0.08] text-[#9E9BB2] hover:text-[#FFFFFF] transition-all hidden sm:flex items-center justify-center backdrop-blur-[16px] cursor-pointer"
          title="Recent Logs"
        >
          <Clock className="w-4 h-4 text-[#A8A3BA]" />
        </button>

        {/* User profile capsule pill */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[rgba(32,27,51,0.65)] border border-white/[0.08] hover:border-[rgba(168,85,247,0.35)] transition-all cursor-pointer backdrop-blur-[16px] group">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
            alt="Liam Anderson"
            className="w-7 h-7 object-cover rounded-full border border-white/10"
          />
          <div className="hidden lg:block text-left pr-1">
            <p className="text-[13px] font-medium text-[#FFFFFF] group-hover:text-[#A855F7] transition-colors leading-tight">
              Liam Anderson
            </p>
            <p className="text-[11px] text-[#706C82] leading-tight">Operations Manager</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[#9E9BB2] group-hover:text-[#FFFFFF] transition-colors" />
        </div>
      </div>
    </header>
  );
};

export default Header;
