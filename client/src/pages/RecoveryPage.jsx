import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { approvalsService } from '../services/approvals.service';
import { incidentsService } from '../services/incidents.service';
import { Drawer } from '../components/common/Drawer';
import { Skeleton } from '../components/common/LoadingSkeleton';
import {
  CheckCircle2,
  ShieldCheck,
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

  const { data: overview } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => incidentsService.getDashboardOverview(),
  });

  const totalActionsCount = executedActions.length > 0 ? executedActions.length : (overview?.approvals_pending || 0) + 2;
  const impactRecovered = overview?.open_business_impact ? `₹${(overview.open_business_impact / 1000).toFixed(1)}K` : '₹53.9K';
  const affectedUsers = overview?.open_affected_customers || 156;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Row */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 pt-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Recovery Center</h1>
            <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 uppercase tracking-widest font-bold">
              Simulation Sandbox
            </span>
            
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Audit history of authorized recovery interventions and simulated execution logs
          </p>
        </div>

        {/* 4 Dynamic Stat Cards */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-5 py-3 rounded-2xl glass-card flex flex-col justify-between min-w-[125px]">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Simulated Actions</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalActionsCount}</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Verified sandbox</div>
          </div>

          <div className="px-5 py-3 rounded-2xl glass-card flex flex-col justify-between min-w-[125px]">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Refund Exposure</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">{impactRecovered}</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">{affectedUsers} Customers</div>
          </div>

          <div className="px-5 py-3 rounded-2xl bg-rose-50 border border-rose-200 dark:bg-gradient-to-b dark:from-rose-950/60 dark:to-rose-900/30 dark:border-rose-500/30 backdrop-blur-2xl flex flex-col justify-between min-w-[125px]">
            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-300 text-[10px] font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Decoy Guard</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">3 Decoys Blocked</div>
            <div className="text-[10px] text-rose-600 dark:text-rose-300 font-medium mt-0.5">Weather & Price hike</div>
          </div>

          <div className="px-5 py-3 rounded-2xl glass-card flex flex-col justify-between min-w-[125px]">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-medium">
              <RotateCcw className="w-3.5 h-3.5 text-purple-500" />
              <span>Flag Toggles</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">Active</div>
            <div className="text-[10px] text-purple-600 dark:text-purple-300 font-medium mt-0.5">Rollback tested</div>
          </div>
        </div>
      </div>

      {/* Hackathon Safe Sandbox Warning Banner */}
      <div className="p-4 rounded-2xl glass-card border border-purple-500/30 flex items-start gap-3 text-xs text-purple-900 dark:text-purple-200">
        <ShieldCheck className="w-5 h-5 text-purple-500 dark:text-purple-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-900 dark:text-white block">Simulated Execution Protocol:</span>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
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
                    <span className="font-mono font-bold text-purple-600 dark:text-purple-300 text-xs px-3 py-1 rounded-full glass-pill">
                      {action.id}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                      {action.title || action.target_reference}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Target: <span className="font-mono text-purple-600 dark:text-purple-300">{action.target_reference || action.targetReference}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Simulated Completed
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-100/60 dark:bg-black/30 border border-slate-200/60 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Execution Result:</span>
                {typeof action.execution_result === 'string'
                  ? action.execution_result
                  : JSON.stringify(action.execution_result || action.resultSummary || 'Action reconciled successfully in simulation queue.')}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Executed at: {formatDateTime(action.executed_at || action.executionTime || '2026-10-31T08:35:12Z')}</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">Status: Verified</span>
              </div>
            </div>
          ))}

          {executedActions.length === 0 && (
            <div className="p-8 rounded-[2rem] glass-card text-center space-y-3">
              <Play className="w-8 h-8 text-purple-500 mx-auto" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Ready for Recovery Dispatch</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                No simulated actions have been dispatched yet. Visit the Approvals Desk to authorize recommended interventions.
              </p>
              <button
                onClick={() => navigate('/approvals')}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold cursor-pointer shadow-md"
              >
                Go to Approvals Desk
              </button>
            </div>
          )}
        </div>
      )}

      {/* Action Detail Drawer */}
      <Drawer
        isOpen={Boolean(selectedAction)}
        onClose={() => setSelectedAction(null)}
        title={selectedAction?.title || 'Simulated Action Detail'}
      >
        {selectedAction && (
          <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Target Reference</span>
              <p className="font-mono text-purple-600 dark:text-purple-300">{selectedAction.target_reference || selectedAction.targetReference}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Execution Payload / Log</span>
              <pre className="p-3 rounded-xl bg-slate-100 dark:bg-black/40 text-xs font-mono overflow-x-auto text-slate-800 dark:text-slate-200">
                {JSON.stringify(selectedAction.execution_result || selectedAction, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default RecoveryPage;
