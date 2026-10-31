import React from 'react';
import { cn } from '../../utils/cn';

export const Card = ({
  children,
  className = '',
  glow = 'none',
  interactive = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'glass-panel rounded-2xl p-5 relative overflow-hidden',
        interactive && 'glass-panel-hover cursor-pointer',
        glow === 'purple' && 'neon-glow-purple',
        glow === 'emerald' && 'neon-glow-emerald',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
