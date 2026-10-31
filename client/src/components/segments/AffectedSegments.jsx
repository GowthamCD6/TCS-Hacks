import React from 'react';
import { Card } from '../common/Card';
import { Users, BarChart2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const AffectedSegments = ({ segments = [] }) => {
  const chartData = segments.map((s) => ({
    name: s.segmentName.split(' ')[0] + ' ' + (s.segmentName.split(' ')[1] || ''),
    issueRate: s.issueRate,
    comparisonRate: s.comparisonRate,
    lift: s.liftRatio,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Affected Customer Segments</h3>
          <p className="text-xs text-slate-400">
            Cohort specificity and statistical lift across client runtime dimensions
          </p>
        </div>
      </div>

      {/* Cohort Comparative Chart */}
      <Card className="p-5">
        <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-purple-400" />
          Issue Rate vs Baseline Cohort (%)
        </h4>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#120d24',
                  borderColor: 'rgba(168,85,247,0.3)',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="issueRate" fill="#a855f7" radius={[6, 6, 0, 0]} name="Target Cohort Rate" />
              <Bar dataKey="comparisonRate" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Baseline Comparison" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Segment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {segments.map((seg) => (
          <Card key={seg.id} className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-purple-300">
                {seg.dimension}
              </span>
              <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                {seg.liftRatio}x Lift
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white">{seg.segmentName}</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {seg.affectedCount?.toLocaleString()} affected of {seg.totalPopulation?.toLocaleString()} active users
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Cohort Issue Rate</span>
                <span className="font-bold text-purple-300 text-sm">{seg.issueRate}%</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Baseline Rate</span>
                <span className="font-semibold text-slate-300 text-sm">{seg.comparisonRate}%</span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-400 bg-white/[0.02] p-2 rounded-lg border border-white/5">
              Significance: <span className="text-emerald-400 font-semibold">{seg.statisticalSignificance}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
