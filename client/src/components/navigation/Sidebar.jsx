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
    tooltip: 'Automation Center',
  },
  {
    name: 'AI Workflow & Incidents',
    path: '/incidents/INC-2026-084',
    icon: GitFork,
    tooltip: 'Workflow Map & Case',
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
    tooltip: 'Feedback Inbox',
  },
  {
    name: 'Emerging Signals & AI',
    path: '/signals',
    icon: Sparkles,
    tooltip: 'AI Signals',
    badge: '03',
    badgeVariant: 'purple',
  },
  {
    name: 'Recovery Center',
    path: '/recovery',
    icon: PanelsTopLeft,
    tooltip: 'Recovery Sandbox',
  },
  {
    name: 'Data Ingestion',
    path: '/ingestion',
    icon: UploadCloud,
    tooltip: 'Ingestion Hub',
  },
  {
    name: 'Incidents Index',
    path: '/incidents',
    icon: Settings,
    tooltip: 'Incidents Directory',
  },
];

export const Sidebar = () => {
  return (
    /* Fixed vertically centered dock on the left: width 84px, Icons centered vertically */
    <aside className="fixed left-4 sm:left-6 top-1/2 -translate-y-1/2 z-50 w-[84px] flex flex-col items-center py-3 px-2 glass-dock shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
      <nav className="flex flex-col items-center gap-2.5 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 group cursor-pointer',
                  isActive
                    ? 'glass-dock-icon-active'
                    : 'glass-dock-icon text-[#9E9BB2] hover:text-[#FFFFFF]'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-transform duration-200 group-hover:scale-105',
                      isActive ? 'text-white' : 'text-[#9E9BB2] group-hover:text-white'
                    )}
                  />

                  {/* Notification Badge */}
                  {item.badge && (
                    <span
                      className={cn(
                        'absolute -top-1 -right-1 text-[9px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#0B0B12] shadow-sm',
                        item.badgeVariant === 'purple' &&
                          'bg-[#8B5CF6] text-white',
                        item.badgeVariant === 'amber' &&
                          'bg-[#FBBF24] text-black font-extrabold'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Tooltip on hover */}
                  <div className="absolute left-14 px-3 py-1.5 rounded-xl bg-[#141220] border border-white/10 text-white text-[12px] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg backdrop-blur-md">
                    {item.tooltip}
                  </div>
                </>
              )}
            </NavLink>
          );
        })}

        {/* Delicate Divider */}
        <div className="w-6 h-[1px] bg-white/10 my-0.5" />

        {/* Bottom Circular Logout Button */}
        <button
          type="button"
          className="w-11 h-11 rounded-full flex items-center justify-center text-[#9E9BB2] hover:text-[#F87171] hover:bg-white/5 transition-all duration-200 group relative cursor-pointer"
          title="Exit Session"
          onClick={() => window.location.reload()}
        >
          <LogOut className="w-5 h-5 transition-transform duration-200 group-hover:scale-105" />
          <div className="absolute left-14 px-3 py-1.5 rounded-xl bg-[#141220] border border-white/10 text-white text-[12px] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg backdrop-blur-md">
            Logout / Reset
          </div>
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
