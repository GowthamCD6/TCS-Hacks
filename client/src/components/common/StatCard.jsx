import React from 'react';
import { cn } from '../../utils/cn';

export const StatCard = ({
  label,
  value,
  subtext,
  icon,
  trend,
  highlight = 'none',
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 relative border border-white/5',
        onClick && 'cursor-pointer hover:border-purple-500/30 hover:scale-[1.01]',
        highlight === 'purple' && 'border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]',
        highlight === 'emerald' && 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
        highlight === 'amber' && 'border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]',
        highlight === 'rose' && 'border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.15)]',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
        {icon && (
          <div className="p-2 rounded-xl bg-white/5 text-purple-300 border border-white/10">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2.5 my-1">
        <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{value}</span>
        {trend && (
          <span
            className={cn(
              'text-xs font-semibold px-1.5 py-0.5 rounded-md',
              trend.positive
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-rose-500/10 text-rose-400'
            )}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
  );
};

