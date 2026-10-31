import React from 'react';
import { cn } from '../../utils/cn';
import { getSeverityBadgeClass, getStatusBadgeClass } from '../../utils/formatters';

export const Badge = ({
  children,
  variant = 'neutral',
  value = '',
  className = '',
  size = 'sm',
}) => {
  let styleClasses = 'bg-white/5 text-slate-300 border border-white/10';

  if (variant === 'severity' && value) {
    styleClasses = getSeverityBadgeClass(value);
  } else if (variant === 'status' && value) {
    styleClasses = getStatusBadgeClass(value);
  } else if (variant === 'glow-purple') {
    styleClasses = 'bg-purple-500/20 text-purple-200 border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.3)]';
  } else if (variant === 'glow-emerald') {
    styleClasses = 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]';
  } else if (variant === 'simulated') {
    styleClasses = 'bg-violet-950/80 text-violet-300 border border-violet-500/30 text-[10px] tracking-wide font-mono uppercase';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm font-medium';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium transition-colors',
        sizeClasses,
        styleClasses,
        className
      )}
    >
      {variant === 'status' && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      )}
      {children}
    </span>
  );
};

