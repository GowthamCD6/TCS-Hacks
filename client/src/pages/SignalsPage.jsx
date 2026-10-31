import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { signalsService } from '../services/signals.service';
import { Skeleton } from '../components/common/LoadingSkeleton';
import {


  ArrowRight,
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,

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
      {/* Top Banner Row matching screenshot */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 pt-1">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Emerging Signals
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time anomaly detection identifying potential CX degradation before full-scale incident escalation
          </p>
        </div>

        {/* 4 Stat Cards in rounded glass pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-5 py-3 rounded-2xl glass-card flex flex-col justify-between min-w-[125px]">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span>Active Signals</span>
            </div>
            <div className="text-2xl font-black text-white mt-1">04</div>
            <div className="text-[10px] text-purple-300 font-medium mt-0.5">Monitoring</div>
          </div>

          <div className="px-5 py-3 rounded-2xl glass-card flex flex-col justify-between min-w-[125px]">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Confidence</span>
            </div>
            <div className="text-2xl font-black text-white mt-1">94%</div>
            <div className="text-[10px] text-emerald-400 font-medium mt-0.5">Peak anomaly</div>
          </div>

          <div className="px-5 py-3 rounded-2xl bg-gradient-to-b from-rose-950/60 to-rose-900/30 border border-rose-500/30 backdrop-blur-2xl shadow-[0_12px_35px_rgba(0,0,0,0.6)] flex flex-col justify-between min-w-[125px]">
            <div className="flex items-center gap-1.5 text-rose-300 text-[10px] font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Critical Spike</span>
            </div>
            <div className="text-2xl font-black text-white mt-1">+340%</div>
            <div className="text-[10px] text-rose-300 font-medium mt-0.5">UPI Gateway</div>
          </div>

          <div className="px-5 py-3 rounded-2xl glass-card flex flex-col justify-between min-w-[125px]">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
              <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
              <span>Observation</span>
            </div>
            <div className="text-2xl font-black text-white mt-1">2h Window</div>
            <div className="text-[10px] text-purple-300 font-medium mt-0.5">Sliding range</div>
          </div>
        </div>
      </div>

      {/* Epistemological Distinction Banner */}
      <div className="p-4 rounded-2xl glass-card border border-purple-500/25 flex items-start gap-3 text-xs text-slate-300">
        <HelpCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-white block">Signal Lifecycle Rigor:</span>
          <p className="leading-relaxed">
            An <strong>Emerging Signal</strong> represents an anomalous complaint frequency increase. It is NOT yet a confirmed root cause. Scientific investigation through the Root Cause Court is required before assigning operational causality.
          </p>
        </div>
      </div>

      {/* Signals Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          <Skeleton className="h-44" count={3} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {signals.map((signal) => {
            const isPromoted = signal.status === 'promoted_to_incident';

            return (
              <div
                key={signal.id}
                className={`p-6 rounded-[2rem] glass-card transition-all ${
                  signal.severity === 'critical'
                    ? 'border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.25)]'
                    : 'border-white/[0.08]'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-purple-300 px-3 py-1 rounded-full glass-pill">
                        {signal.id}
                      </span>
                      <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {signal.severity}
                      </span>
                      <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {signal.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mt-2">{signal.label}</h3>
                    <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                      {signal.description}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                      Volume Anomaly Spike
                    </span>
                    <span className="text-3xl font-black text-rose-400 font-mono">
                      +{signal.increasePercent}%
                    </span>
                  </div>
                </div>

                {/* Metrics Breakdown Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 my-4 border-y border-white/[0.06] text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-mono">Current Volume</span>
                    <span className="font-extrabold text-white text-base">{signal.currentVolume} complaints</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-mono">Historical Baseline</span>
                    <span className="font-semibold text-slate-300 text-base">{signal.baselineVolume} complaints</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-mono">Observation Window</span>
                    <span className="font-semibold text-purple-300 font-mono text-base">{signal.timeWindow}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-mono">Detector Confidence</span>
                    <span className="font-bold text-emerald-400 font-mono text-base">
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
                        className="px-3 py-1 rounded-full glass-pill text-purple-200 font-medium text-xs"
                      >
                        {seg}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => handleInvestigate(signal.id)}
                    disabled={investigateMutation.isPending}
                    className="px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-purple-400/40 cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <span>{isPromoted ? 'View Incident Workspace' : 'Launch Deep Investigation'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SignalsPage;
