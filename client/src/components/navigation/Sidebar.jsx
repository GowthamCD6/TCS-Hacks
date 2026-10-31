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
    tooltip: 'Pending Approvals',
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
    /* Fixed vertically centered dock on the left - DOES NOT SCROLL when page scrolls */
    <aside className="fixed left-3 sm:left-5 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center p-2 rounded-3xl bg-[#120b26]/85 backdrop-blur-2xl border border-white/[0.09] shadow-[0_16px_40px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.12)]">
      {/* Vertical Icon Navigation Dock matching exact screenshot */}
      <nav className="flex flex-col items-center gap-2.5">
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
                    ? 'bg-gradient-to-tr from-purple-600 via-purple-700 to-indigo-600 text-white shadow-[0_0_24px_rgba(168,85,247,0.6)] border border-purple-400/50'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.08] border border-transparent'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-transform duration-200 group-hover:scale-110',
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-100'
                    )}
                  />

                  {/* Small Notification Badge matching image (e.g. 03 on Sparkles) */}
                  {item.badge && (
                    <span
                      className={cn(
                        'absolute -top-1 -right-1 text-[9px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#090514] shadow-md',
                        item.badgeVariant === 'purple' &&
                          'bg-purple-500 text-white shadow-[0_0_8px_rgba(168,85,247,0.8)]',
                        item.badgeVariant === 'amber' &&
                          'bg-amber-500 text-black font-extrabold shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Tooltip on hover */}
                  <div className="absolute left-14 px-3 py-1.5 rounded-xl bg-[#140c2a]/95 border border-purple-500/30 text-white text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-[0_8px_24px_rgba(0,0,0,0.7)] backdrop-blur-md">
                    {item.tooltip}
                  </div>
                </>
              )}
            </NavLink>
          );
        })}

        {/* Divider */}
        <div className="w-6 h-[1px] bg-white/10 my-0.5" />

        {/* Bottom Logout Button */}
        <button
          type="button"
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-300 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/30 transition-all duration-200 group relative cursor-pointer"
          title="Exit Session"
          onClick={() => window.location.reload()}
        >
          <LogOut className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
          <div className="absolute left-14 px-3 py-1.5 rounded-xl bg-[#140c2a]/95 border border-purple-500/30 text-white text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-[0_8px_24px_rgba(0,0,0,0.7)] backdrop-blur-md">
            Logout / Reset
          </div>
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
