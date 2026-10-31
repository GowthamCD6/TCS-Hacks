import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { approvalsService } from '../services/approvals.service';
import { incidentsService } from '../services/incidents.service';
import { RecommendationsList } from '../components/recommendations/RecommendationsList';
import { Skeleton } from '../components/common/LoadingSkeleton';
import { CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';

export const ApprovalsPage = () => {
  const { data: recommendations = [], isLoading, refetch } = useQuery({
    queryKey: ['approvals-recommendations'],
    queryFn: () => approvalsService.getRecommendations(),
  });

  const { data: overview } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => incidentsService.getDashboardOverview(),
  });

  const pendingCount = recommendations.filter((r) => r.approvalStatus === 'pending').length;
  const highRiskCount = recommendations.filter((r) => r.riskLevel === 'high').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Row */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 pt-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Recovery Approvals Desk
            </h1>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
              Human-in-the-Loop
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Authorize or reject AI-synthesized recovery interventions. High-consequence actions require explicit operator sign-off.
          </p>
        </div>

        {/* Dynamic Stat Cards */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-5 py-3 rounded-2xl glass-card flex flex-col justify-between min-w-[125px]">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Pending Review</span>
            </div>
            <div className="text-2xl font-black text-amber-500 dark:text-amber-300 mt-1">
              {pendingCount > 0 ? String(pendingCount).padStart(2, '0') : '00'}
            </div>
            <div className="text-[10px] text-amber-600 dark:text-amber-300 font-medium mt-0.5">Awaiting sign-off</div>
          </div>

          <div className="px-5 py-3 rounded-2xl glass-card flex flex-col justify-between min-w-[125px]">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Incidents Bound</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {overview?.latest_incidents?.length || 1}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Under evaluation</div>
          </div>

          <div className="px-5 py-3 rounded-2xl bg-rose-50 border border-rose-200 dark:bg-gradient-to-b dark:from-rose-950/60 dark:to-rose-900/30 dark:border-rose-500/30 backdrop-blur-2xl flex flex-col justify-between min-w-[125px]">
            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-300 text-[10px] font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>High Risk</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {String(highRiskCount).padStart(2, '0')}
            </div>
            <div className="text-[10px] text-rose-600 dark:text-rose-300 font-medium mt-0.5">Financial impact</div>
          </div>

          <div className="px-5 py-3 rounded-2xl glass-card flex flex-col justify-between min-w-[125px]">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-medium">
              <RotateCcw className="w-3.5 h-3.5 text-purple-500" />
              <span>Verification Status</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">Closed-Loop</div>
            <div className="text-[10px] text-purple-600 dark:text-purple-300 font-medium mt-0.5">Telemetry bound</div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-44" count={3} />
        </div>
      ) : (
        <div className="rounded-[2rem] glass-card p-6 sm:p-8">
          <RecommendationsList
            recommendations={recommendations}
            onActionComplete={() => refetch()}
          />
        </div>
      )}
    </div>
  );
};

export default ApprovalsPage;
