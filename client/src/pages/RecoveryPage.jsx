import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { approvalsService } from '../services/approvals.service';
import { Drawer } from '../components/common/Drawer';
import { Skeleton } from '../components/common/LoadingSkeleton';
import {
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  RotateCcw,
  AlertTriangle,
  Play,
  ArrowUpRight,
} from 'lucide-react';
import { formatDateTime } from '../utils/formatters';

export const RecoveryPage = () => {
  const navigate = useNavigate();
  const [selectedAction, setSelectedAction] = useState(null);

  const { data: executedActions = [], isLoading } = useQuery({
    queryKey: ['executed-recovery-actions'],
    queryFn: () => approvalsService.getExecutedActions(),
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Row matching OpsPilot theme */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 pt-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Recovery Center</h1>
            <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-widest font-bold">
              Simulation Sandbox
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Audit history of authorized recovery interventions and simulated execution logs
          </p>
        </div>

        {/* 4 Stat Cards */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-5 py-3 rounded-2xl glass-card flex flex-col justify-between min-w-[125px]">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Simulated Actions</span>
            </div>
            <div className="text-2xl font-black text-white mt-1">12</div>
            <div className="text-[10px] text-emerald-400 font-medium mt-0.5">Verified sandbox</div>
          </div>

          <div className="px-5 py-3 rounded-2xl glass-card flex flex-col justify-between min-w-[125px]">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Refund Exposure</span>
            </div>
            <div className="text-2xl font-black text-white mt-1 font-mono">₹4.82L</div>
            <div className="text-[10px] text-emerald-400 font-medium mt-0.5">850 Customers</div>
          </div>

          <div className="px-5 py-3 rounded-2xl bg-gradient-to-b from-rose-950/60 to-rose-900/30 border border-rose-500/30 backdrop-blur-2xl shadow-[0_12px_35px_rgba(0,0,0,0.6)] flex flex-col justify-between min-w-[125px]">
            <div className="flex items-center gap-1.5 text-rose-300 text-[10px] font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Decoy Guard</span>
            </div>
            <div className="text-2xl font-black text-white mt-1">120 Blocked</div>
            <div className="text-[10px] text-rose-300 font-medium mt-0.5">Reversed orders</div>
          </div>

          <div className="px-5 py-3 rounded-2xl glass-card flex flex-col justify-between min-w-[125px]">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
              <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
              <span>Flag Toggles</span>
            </div>
            <div className="text-2xl font-black text-white mt-1">02 Active</div>
            <div className="text-[10px] text-purple-300 font-medium mt-0.5">Rollback tested</div>
          </div>
        </div>
      </div>

      {/* Hackathon Safe Sandbox Warning Banner */}
      <div className="p-4 rounded-2xl glass-card border border-purple-500/30 flex items-start gap-3 text-xs text-purple-200">
        <ShieldCheck className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-white block">Simulated Execution Protocol:</span>
          <p className="text-slate-300 leading-relaxed">
            All refunds, customer SMS dispatches, and feature flag changes listed here are safely simulated inside the RecoverIQ execution sandbox for hackathon evaluation. No production funds or live customer devices were modified.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" count={3} />
        </div>
      ) : (
        <div className="space-y-4">
          {executedActions.map((action) => (
            <div
              key={action.id}
              onClick={() => setSelectedAction(action)}
              className="p-6 rounded-[2rem] glass-card transition-all hover:scale-[1.005] cursor-pointer space-y-3 hover:border-purple-400/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-300 text-xs px-3 py-1 rounded-full glass-pill">
                      {action.id}
                    </span>
                    <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {action.executionStatus}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-3 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                      {action.actionType.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mt-2">{action.title}</h3>
                  <p className="text-xs text-slate-300 line-clamp-1">{action.resultSummary}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    Execution Timestamp
                  </span>
                  <span className="font-mono text-xs text-slate-300">
                    {formatDateTime(action.executionTime)}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between text-xs text-slate-400 font-mono">
                <span>Incident Reference: {action.incidentId}</span>
                <span className="text-purple-300 font-semibold">{action.targetReference}</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Simulation Verified
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Detail Drawer */}
      <Drawer
        isOpen={!!selectedAction}
        onClose={() => setSelectedAction(null)}
        title={selectedAction?.title || 'Action Inspection'}
        description={`Audit ID: ${selectedAction?.id}`}
      >
        {selectedAction && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2 text-xs">
              <span className="font-bold block text-sm">Sandbox Result Summary</span>
              <p className="text-slate-200 leading-relaxed">{selectedAction.resultSummary}</p>
            </div>

            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                Execution Metadata
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-2xl glass-pill text-xs">
                  <span className="text-slate-400">Target Cohort Reference</span>
                  <span className="font-mono text-purple-300 font-bold">{selectedAction.targetReference}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl glass-pill text-xs">
                  <span className="text-slate-400">Approval State</span>
                  <span className="font-bold text-white capitalize">{selectedAction.approvalStatus}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl glass-pill text-xs">
                  <span className="text-slate-400">Execution Status</span>
                  <span className="font-bold text-emerald-400 capitalize">{selectedAction.executionStatus}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl glass-pill text-xs">
                  <span className="text-slate-400">Timestamp</span>
                  <span className="font-mono text-white">{formatDateTime(selectedAction.executionTime)}</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate(`/incidents/${selectedAction.incidentId}`)}
                className="w-full py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_18px_rgba(168,85,247,0.4)] cursor-pointer"
              >
                Inspect Incident {selectedAction.incidentId} <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default RecoveryPage;
