import React from 'react';
import { cn } from '../../utils/cn';

export const Skeleton = ({ className = '', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={cn(
            'animate-pulse bg-white/5 rounded-xl border border-white/5',
            className
          )}
        />
      ))}
    </>
  );
};

