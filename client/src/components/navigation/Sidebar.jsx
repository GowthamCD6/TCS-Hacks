import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  GitFork,
  MessageSquare,
  ShieldAlert,
  CheckCircle2,
  RotateCcw,
  UploadCloud,
  Settings,
  LogOut,
  Layers,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const navItems = [
  { name: 'Automation Center', path: '/', icon: LayoutGrid },
  { name: 'Incident Workspace', path: '/incidents/INC-2026-084', icon: GitFork },
  { name: 'Feedback Inbox', path: '/feedback', icon: MessageSquare },
  { name: 'Emerging Signals', path: '/signals', icon: Layers, badge: '03', badgeVariant: 'purple' },
  { name: 'Incidents Cases', path: '/incidents', icon: ShieldAlert, badge: '01', badgeVariant: 'rose' },
  { name: 'Pending Approvals', path: '/approvals', icon: CheckCircle2, badge: '18', badgeVariant: 'amber' },
  { name: 'Recovery Center', path: '/recovery', icon: RotateCcw },
  { name: 'Data Ingestion', path: '/ingestion', icon: UploadCloud },
];

export const Sidebar = () => {
  return (
    <aside className="w-20 lg:w-64 h-screen sticky top-0 z-40 flex flex-col justify-between p-3 lg:p-5 glass-panel border-r border-purple-500/20 bg-[#090614]/95">
      <div>
        {/* Brand identity matching OpsPilot / RecoverIQ orbit circle */}
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center shadow-[0_0_24px_rgba(168,85,247,0.55)] border border-purple-300/30 flex-shrink-0">
            <span className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            </span>
          </div>
          <div className="hidden lg:block">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white tracking-tight">RecoverIQ</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                v2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Autonomous CX Recovery</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={item.name}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3.5 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all group relative',
                    isActive
                      ? 'bg-gradient-to-r from-purple-600/35 to-indigo-600/25 text-white border border-purple-500/45 shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center transition-all',
                        isActive
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40 shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                          : 'group-hover:bg-white/5 text-slate-400 group-hover:text-white'
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                    </div>

                    <span className="hidden lg:inline-block flex-1 truncate text-xs font-semibold">
                      {item.name}
                    </span>

                    {item.badge && (
                      <span
                        className={cn(
                          'hidden lg:inline-flex items-center justify-center text-[10px] font-bold px-2 py-0.5 rounded-full font-mono',
                          item.badgeVariant === 'rose' &&
                            'bg-rose-500/20 text-rose-300 border border-rose-500/40',
                          item.badgeVariant === 'amber' &&
                            'bg-amber-500/20 text-amber-300 border border-amber-500/40',
                          item.badgeVariant === 'purple' &&
                            'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer bottom settings and logout */}
      <div className="space-y-2 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between px-2 text-slate-400">
          <button
            type="button"
            title="Settings"
            className="p-2 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Logout"
            className="p-2 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
