import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Bell,
  Clock,
  ChevronDown,
  Sun,
  Moon,
  LogOut,
  LogIn,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { demoService } from '../../services/demo.service';
import { authService } from '../../services/auth.service';
import { incidentsService } from '../../services/incidents.service';
import { formatDateTime } from '../../utils/formatters';
import { useTheme } from '../../context/ThemeContext';
import { useTimeFilter } from '../../context/TimeFilterContext';
import { cn } from '../../utils/cn';
import logoLight from '../../assets/recoveriq-logo-light.png';
import logoDark from '../../assets/recoveriq-logo-dark.png';

export const Header = ({ onSearch }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const { timeFilter, setTimeFilter } = useTimeFilter();
  const [searchValue, setSearchValue] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [clockPopoverOpen, setClockPopoverOpen] = useState(false);
  const [alertsPopoverOpen, setAlertsPopoverOpen] = useState(false);

  const currentUser = authService.getCurrentUser();
  const isAuthenticated = authService.isAuthenticated();

  // Query simulated clock from backend
  const { data: clockData } = useQuery({
    queryKey: ['demo-clock'],
    queryFn: () => demoService.getClock(),
    refetchInterval: 30000,
  });

  // Query dashboard overview for live badge counts
  const { data: overview } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => incidentsService.getDashboardOverview(),
    staleTime: 15000,
  });

  const simNow = clockData?.sim_now;
  const unresolvedAlertsCount = overview?.signals_open ? String(overview.signals_open).padStart(2, '0') : '03';

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
    onSearch?.(e.target.value);
  };

  const handleLogout = () => {
    authService.logout();
    setUserMenuOpen(false);
    navigate('/login');
  };

  return (
    /* Top Bar: Fixed at top, does NOT scroll with page, NO divider border line below */
    <header className="fixed top-0 left-0 right-0 h-[72px] px-4 sm:px-8 md:px-10 flex items-center justify-between z-50 bg-[#080512]/90 backdrop-blur-2xl app-header">
      {/* Left: Brand RecoverIQ Logo */}
      <div
        onClick={() => navigate('/')}
        className="flex items-center flex-shrink-0 cursor-pointer group select-none py-1"
      >
        <img
          src={theme === 'light' ? logoLight : logoDark}
          alt="RecoverIQ Logo"
          className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105 duration-200"
        />
      </div>

      {/* Center: Search Capsule + Time Filter Tabs */}
      <div className="flex items-center gap-4 sm:gap-6 mx-auto">
        {/* Search Capsule Glass Pill */}
        <div className="relative w-52 sm:w-72 md:w-96">
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search incident, signal, segment..."
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

      {/* Right: Theme Toggle, Notifications, Clock & User Profile matching original UI */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 flex-shrink-0">
        {/* Light / Dark Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full glass-pill text-[#FFFFFF] hover:bg-white/20 transition-all flex items-center justify-center cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme mode"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#FBBF24] hover:rotate-45 transition-transform duration-300" />
          ) : (
            <Moon className="w-4 h-4 text-[#7C3AED] hover:-rotate-12 transition-transform duration-300" />
          )}
        </button>

        {/* Notifications Button with alert count badge */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setAlertsPopoverOpen((prev) => !prev);
              setClockPopoverOpen(false);
              setUserMenuOpen(false);
            }}
            className="relative w-10 h-10 rounded-full glass-pill text-[#FFFFFF] hover:bg-white/20 transition-all flex items-center justify-center cursor-pointer"
            title={`${unresolvedAlertsCount} Unresolved Alerts`}
          >
            <Bell className="w-4 h-4 text-[#FFFFFF]" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#8B5CF6] text-[9px] font-bold text-[#FFFFFF] flex items-center justify-center border border-[#080512]">
              {unresolvedAlertsCount}
            </span>
          </button>

          {/* Notifications Dropdown Popover */}
          {alertsPopoverOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl glass-card p-3.5 z-50 border border-white/10 shadow-2xl text-[12px] space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="font-semibold text-white">Active Alerts & Signals</span>
                <span className="badge-warning px-2 py-0.5 text-[10px] font-mono">
                  {unresolvedAlertsCount} Open
                </span>
              </div>
              <div
                onClick={() => {
                  setAlertsPopoverOpen(false);
                  navigate('/signals');
                }}
                className="p-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-white/5"
              >
                <div className="flex items-center gap-1.5 text-rose-400 font-semibold text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  UPI Timeout Spike Detected
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  High failure rate on Android 14 client runtime (v2.3)
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAlertsPopoverOpen(false);
                  navigate('/incidents');
                }}
                className="w-full py-1.5 text-center text-purple-400 hover:text-purple-300 font-medium text-[11px] cursor-pointer"
              >
                View all incidents & signals →
              </button>
            </div>
          )}
        </div>

        {/* Clock/Simulation Clock Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setClockPopoverOpen((prev) => !prev);
              setAlertsPopoverOpen(false);
              setUserMenuOpen(false);
            }}
            className="w-10 h-10 rounded-full glass-pill text-[#FFFFFF] hover:bg-white/20 transition-all hidden sm:flex items-center justify-center cursor-pointer"
            title="Monitoring Clock & Simulation State"
          >
            <Clock className="w-4 h-4 text-[#FFFFFF]" />
          </button>

          {/* Clock Popover */}
          {clockPopoverOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl glass-card p-3.5 z-50 border border-white/10 shadow-2xl text-[12px] space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                <Clock className="w-4 h-4 text-[#34D399]" />
                <span className="font-semibold text-white">Simulated Telemetry Clock</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                  sim_now Timestamp
                </span>
                <p className="font-mono text-[12px] text-white">
                  {simNow ? formatDateTime(simNow) : 'Live Real-Time'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-purple-300">
                <Sparkles className="w-3 h-3 text-[#A855F7]" />
                <span>Synthetic dataset active (90-day simulation)</span>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Capsule Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setUserMenuOpen((prev) => !prev);
              setAlertsPopoverOpen(false);
              setClockPopoverOpen(false);
            }}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full glass-pill hover:border-white/40 transition-all cursor-pointer group text-left"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
              alt="User profile"
              className="w-7 h-7 object-cover rounded-full border border-white/30 shadow-sm"
            />
            <div className="hidden lg:block text-left pr-1">
              <p className="text-[13px] font-medium text-[#FFFFFF] group-hover:text-purple-200 transition-colors leading-tight">
                {currentUser?.name || 'Lead Reliability Engineer'}
              </p>
              <p className="text-[11px] text-[#A8A3BA] leading-tight">
                {currentUser?.role || 'Incident Commander'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-white/70 group-hover:text-[#FFFFFF] transition-colors" />
          </button>

          {/* User Menu Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl glass-card py-2 z-50 border border-white/10 shadow-2xl text-[12px] animate-in fade-in duration-200">
              <div className="px-4 py-2 border-b border-white/10">
                <p className="font-semibold text-white">
                  {currentUser?.name || 'Lead Reliability Engineer'}
                </p>
                <p className="text-[11px] text-[#9E9BB2] truncate">
                  {currentUser?.email || 'approver@recoveriq.demo'}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{currentUser?.role ? `${currentUser.role} Active` : 'Operations Lead'}</span>
                </div>
              </div>

              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-[#F87171] hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-[#34D399] hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign in as Approver</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
