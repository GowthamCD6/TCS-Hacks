import React, { useState } from 'react';
import { kpisService } from '../../services/kpis.service';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Activity, RefreshCw, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatDateTime } from '../../utils/formatters';

export const KPIMonitoringView = ({ kpis = [], onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    try {
      await kpisService.refreshMeasurements();
      onRefresh?.();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'target_met':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Target Met
          </span>
        );
      case 'improving':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" /> Improving
          </span>
        );
      case 'at_risk':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> At Risk
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-300 border border-slate-500/30">
            Not Yet Verified
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Post-Recovery KPI Telemetry & Verification</h3>
            <p className="text-xs text-slate-400">
              Continuously validating operational and customer recovery metrics against baseline targets
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleRefreshClick}
          isLoading={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Measurements
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.id} className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-white">{kpi.metricName}</h4>
                <span className="text-[11px] text-slate-400 font-mono">
                  Window: {kpi.monitoringWindow}
                </span>
              </div>
              {getStatusBadge(kpi.status)}
            </div>

            {/* Metric Comparison Numbers */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Baseline</span>
                <span className="text-sm font-semibold text-slate-300">
                  {kpi.baseline}
                  {kpi.unit}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Current Telemetry</span>
                <span className="text-base font-extrabold text-purple-300 font-mono">
                  {kpi.currentValue}
                  {kpi.unit}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Target SLA</span>
                <span className="text-sm font-bold text-emerald-400">
                  &lt; {kpi.target}
                  {kpi.unit}
                </span>
              </div>
            </div>

            {/* Mini Trend Line Chart */}
            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kpi.history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit={kpi.unit} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#120d24',
                      borderColor: 'rgba(168,85,247,0.3)',
                      borderRadius: '10px',
                      color: '#f8fafc',
                      fontSize: '11px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#a855f7"
                    strokeWidth={2.5}
                    dot={{ fill: '#c084fc', r: 3 }}
                    name="Current Telemetry"
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                    name="Target Goal"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5 font-mono">
              <span>Timestamp: {formatDateTime(kpi.measurementTimestamp)}</span>
              <span className="capitalize text-emerald-400 font-semibold">Trend: {kpi.trend}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
