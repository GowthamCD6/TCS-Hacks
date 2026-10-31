import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { signalsService } from '../services/signals.service';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/LoadingSkeleton';
import {
  Sparkles,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Clock,
  Layers,
  Activity,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const SignalsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: signals = [], isLoading } = useQuery({
    queryKey: ['signals'],
    queryFn: () => signalsService.getSignals(),
  });

  const investigateMutation = useMutation({
    mutationFn: (signalId) => signalsService.investigateSignal(signalId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['signals'] });
      navigate(`/incidents/${data.incidentId}`);
    },
  });

  const handleInvestigate = (signalId) => {
    investigateMutation.mutate(signalId);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Emerging Signals</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time anomaly detection identifying potential CX degradation before full-scale incident escalation
          </p>
        </div>
      </div>

      {/* Epistemological Distinction Banner */}
      <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/25 flex items-start gap-3 text-xs text-slate-300">
        <HelpCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-white block">Signal Lifecycle Rigor:</span>
          <p className="leading-relaxed">
            An <strong>Emerging Signal</strong> represents an anomalous complaint frequency increase. It is NOT yet a confirmed root cause. Investigation through the Root Cause Court is required before assigning operational causality.
          </p>
        </div>
      </div>

      {/* Signals Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          <Skeleton className="h-44" count={3} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {signals.map((signal) => {
            const isPromoted = signal.status === 'promoted_to_incident';

            return (
              <Card
                key={signal.id}
                className={`p-5 sm:p-6 transition-all border ${
                  signal.severity === 'critical'
                    ? 'border-purple-500/40 bg-[#160f2e]/90 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                    : 'border-white/10 bg-[#120d22]/80'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-purple-300 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                        {signal.id}
                      </span>
                      <Badge variant="severity" value={signal.severity}>
                        {signal.severity}
                      </Badge>
                      <Badge variant="status" value={signal.status}>
                        {signal.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white mt-1">{signal.label}</h3>
                    <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                      {signal.description}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                      Volume Anomaly Spike
                    </span>
                    <span className="text-2xl font-black text-rose-400 font-mono">
                      +{signal.increasePercent}%
                    </span>
                  </div>
                </div>

                {/* Metrics Breakdown Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 my-3 border-y border-white/5 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-mono">Current Volume</span>
                    <span className="font-extrabold text-white text-sm">{signal.currentVolume} complaints</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-mono">Historical Baseline</span>
                    <span className="font-semibold text-slate-300 text-sm">{signal.baselineVolume} complaints</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-mono">Observation Window</span>
                    <span className="font-semibold text-purple-300 font-mono text-sm">{signal.timeWindow}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-mono">Detector Confidence</span>
                    <span className="font-bold text-emerald-400 font-mono text-sm">
                      {(signal.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Tags and CTA */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400">Affected Segments:</span>
                    {signal.affectedSegments.map((seg) => (
                      <span
                        key={seg}
                        className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-purple-200 font-medium text-[11px]"
                      >
                        {seg}
                      </span>
                    ))}
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={investigateMutation.isPending}
                    onClick={() => handleInvestigate(signal.id)}
                    className="gap-1.5"
                  >
                    <span>{isPromoted ? 'View Incident Workspace' : 'Launch Deep Investigation'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default SignalsPage;
