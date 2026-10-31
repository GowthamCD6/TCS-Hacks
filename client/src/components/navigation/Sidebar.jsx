import React from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  ShieldAlert,
  Radio,
  CheckSquare,
  Inbox,
  PlayCircle,
  UploadCloud,
  FlaskConical,
  LogOut,
} from 'lucide-react';
import { incidentsService } from '../../services/incidents.service';
import { authService } from '../../services/auth.service';
import { cn } from '../../utils/cn';

export const Sidebar = () => {
  // Query live counts for dynamic badges
  const { data: overview } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => incidentsService.getDashboardOverview(),
    staleTime: 10000,
  });

  const approvalsPending = overview?.approvals_pending || 0;
  const signalsOpen = overview?.signals_open || 0;

  const navItems = [
    {
      name: 'Overview',
      path: '/',
      icon: LayoutDashboard,
      tooltip: 'Recovery Overview',
    },
    {
      name: 'Incidents',
      path: '/incidents',
      icon: ShieldAlert,
      tooltip: 'Incident Cases',
    },
    {
      name: 'Signals',
      path: '/signals',
      icon: Radio,
      tooltip: 'Emerging Signals & Decoys',
      badge: signalsOpen > 0 ? String(signalsOpen).padStart(2, '0') : null,
      badgeColor: 'bg-[#8B5CF6]',
    },
    {
      name: 'Approvals',
      path: '/approvals',
      icon: CheckSquare,
      tooltip: 'Pending Approvals Desk',
      badge: approvalsPending > 0 ? String(approvalsPending).padStart(2, '0') : null,
      badgeColor: 'bg-[#FBBF24] text-black',
    },
    {
      name: 'Feedback',
      path: '/feedback',
      icon: Inbox,
      tooltip: 'Feedback Inbox',
    },
    {
      name: 'Recovery',
      path: '/recovery',
      icon: PlayCircle,
      tooltip: 'Simulated Recovery Actions',
    },
    {
      name: 'Ingestion',
      path: '/ingestion',
      icon: UploadCloud,
      tooltip: 'Data Ingestion Hub',
    },
    {
      name: 'Simulation Test',
      path: '/simulation-test',
      icon: FlaskConical,
      tooltip: 'Planted Fault Simulation Test',
    },
  ];

  return (
    <aside className="fixed left-3 sm:left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center">
      <nav
        aria-label="Main Navigation"
        className="flex flex-col items-center gap-2 sm:gap-2.5 py-2 px-1"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-200 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/60',
                  isActive
                    ? 'glass-dock-icon-active text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                    : 'glass-dock-icon text-[#9E9BB2] hover:text-[#FFFFFF]'
                )
              }
              aria-label={item.tooltip}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110',
                      isActive ? 'text-white' : 'text-[#FFFFFF]'
                    )}
                  />

                  {/* Notification Badge if count > 0 */}
                  {item.badge && (
                    <span
                      className={cn(
                        'absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center border border-[#080512]',
                        item.badgeColor || 'bg-[#8B5CF6] text-white'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Visible Tooltip on Hover and Focus */}
                  <div className="absolute left-14 px-3 py-1.5 rounded-xl glass-card text-[#FFFFFF] text-[12px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus:opacity-100 pointer-events-none transition-all duration-150 transform -translate-x-2 group-hover:translate-x-0 shadow-xl border border-white/10 z-50">
                    {item.tooltip}
                  </div>
                </>
              )}
            </NavLink>
          );
        })}

        {/* Separator */}
        <div className="w-5 h-[1px] bg-white/10 my-1" />

        {/* Quick Log out */}
        <button
          type="button"
          onClick={() => {
            authService.logout();
            window.location.href = '/login';
          }}
          className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-[#706C82] hover:text-[#F87171] hover:bg-white/5 transition-all duration-200 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400"
          aria-label="Log Out"
        >
          <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5 group-hover:scale-110 transition-transform" />
          <div className="absolute left-14 px-3 py-1.5 rounded-xl glass-card text-[#F87171] text-[12px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus:opacity-100 pointer-events-none transition-all duration-150 shadow-xl border border-red-500/20 z-50">
            Sign out
          </div>
        </button>
      </nav>
    </aside>
  );
};
