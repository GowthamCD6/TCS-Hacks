import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  GitFork,
  FileCheck,
  FileText,
  Sparkles,
  PanelsTopLeft,
  Settings,
  LogOut,
  UploadCloud,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const navItems = [
  {
    name: 'Automation Center',
    path: '/',
    icon: LayoutGrid,
    tooltip: 'Automation Center (Dashboard)',
  },
  {
    name: 'AI Workflow & Incidents',
    path: '/incidents/INC-2026-084',
    icon: GitFork,
    tooltip: 'Incident Investigation Workspace',
  },
  {
    name: 'Approvals Desk',
    path: '/approvals',
    icon: FileCheck,
    tooltip: 'Pending Approvals (18)',
    badge: '18',
    badgeVariant: 'amber',
  },
  {
    name: 'Feedback Inbox',
    path: '/feedback',
    icon: FileText,
    tooltip: 'Multichannel Feedback Inbox',
  },
  {
    name: 'Emerging Signals & AI',
    path: '/signals',
    icon: Sparkles,
    tooltip: 'AI Signals & Autonomic Engine',
    badge: '03',
    badgeVariant: 'purple',
  },
  {
    name: 'Recovery Center',
    path: '/recovery',
    icon: PanelsTopLeft,
    tooltip: 'Recovery Sandbox & Actions',
  },
  {
    name: 'Data Ingestion',
    path: '/ingestion',
    icon: UploadCloud,
    tooltip: 'Data Ingestion Hub',
  },
  {
    name: 'Settings & Telemetry',
    path: '/incidents',
    icon: Settings,
    tooltip: 'Incidents Directory & Config',
  },
];

export const Sidebar = () => {
  return (
    <aside className="w-[76px] h-screen sticky top-0 z-40 flex flex-col justify-between py-6 px-3 glass-dock bg-[#090514]/90 backdrop-blur-2xl border-r border-white/[0.08] flex-shrink-0">
      {/* Top Section: App Logo + Nav Items */}
      <div className="flex flex-col items-center gap-6">
        {/* Brand Aperture Logo matching screenshot */}
        <NavLink
          to="/"
          className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-fuchsia-600 p-[1.5px] shadow-[0_0_24px_rgba(168,85,247,0.5)] transition-transform hover:scale-105 group relative"
          title="RecoverIQ OpsPilot"
        >
          <div className="w-full h-full rounded-[14px] bg-[#0c081a] flex items-center justify-center">
            {/* Concentric aperture rings */}
            <div className="w-7 h-7 rounded-full border border-purple-400/80 flex items-center justify-center relative">
              <div className="w-4 h-4 rounded-full border border-purple-300 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
              </div>
              <span className="absolute -top-0.5 w-1 h-1 rounded-full bg-purple-300" />
              <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-fuchsia-300" />
            </div>
          </div>
        </NavLink>

        {/* Vertical Icon Navigation Dock */}
        <nav className="flex flex-col items-center gap-3.5 w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 group cursor-pointer',
                    isActive
                      ? 'bg-gradient-to-tr from-purple-600 via-purple-700 to-indigo-600 text-white shadow-[0_0_22px_rgba(168,85,247,0.55)] border border-purple-400/50'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'w-5 h-5 transition-transform duration-200 group-hover:scale-110',
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                      )}
                    />

                    {/* Small Notification Badge matching image (e.g. 03 on Sparkles) */}
                    {item.badge && (
                      <span
                        className={cn(
                          'absolute -top-1 -right-1 text-[9px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#090514] shadow-md',
                          item.badgeVariant === 'purple' &&
                            'bg-purple-500 text-white shadow-[0_0_8px_rgba(168,85,247,0.7)]',
                          item.badgeVariant === 'amber' &&
                            'bg-amber-500 text-black font-extrabold shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Tooltip on hover */}
                    <div className="absolute left-14 px-3 py-1.5 rounded-xl bg-[#140c2a]/95 border border-purple-500/30 text-white text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-md">
                      {item.tooltip}
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: LogOut */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-200 group relative cursor-pointer"
          title="Exit Session"
          onClick={() => window.location.reload()}
        >
          <LogOut className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
          <div className="absolute left-14 px-3 py-1.5 rounded-xl bg-[#140c2a]/95 border border-purple-500/30 text-white text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-md">
            Logout / Reset
          </div>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
