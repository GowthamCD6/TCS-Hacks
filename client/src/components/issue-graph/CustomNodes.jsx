import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '../../utils/cn';

export const WorkflowNode = ({ data, selected }) => {
  const badgeClasses = {
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    rose: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  };

  const categoryGlow = {
    fact: 'border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]',
    hypothesis: 'border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.25)]',
    action: 'border-pink-500/40 shadow-[0_0_20px_rgba(236,72,153,0.25)]',
    outcome: 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.25)]',
  };

  return (
    <div
      className={cn(
        'w-64 glass-panel rounded-2xl p-4 transition-all duration-200 relative bg-[#150f2b]/90 border',
        categoryGlow[data.category] || 'border-purple-500/30',
        selected && 'ring-2 ring-purple-400 border-purple-400 scale-[1.02]'
      )}
    >
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-purple-400 border-2 border-[#080612]" />

      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
          {data.category}
        </span>
        {data.badge && (
          <span
            className={cn(
              'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
              badgeClasses[data.badgeColor || 'purple']
            )}
          >
            {data.badge}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between my-1">
        <h4 className="text-sm font-bold text-white tracking-tight">{data.title}</h4>
        {data.count !== undefined && (
          <span className="text-lg font-black text-purple-200 ml-2">{data.count}</span>
        )}
      </div>

      {data.subtitle && (
        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
          {data.subtitle}
        </p>
      )}

      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-purple-400 border-2 border-[#080612]" />
    </div>
  );
};
