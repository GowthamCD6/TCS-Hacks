import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { approvalsService } from '../services/approvals.service';
import { RecommendationsList } from '../components/recommendations/RecommendationsList';
import { Skeleton } from '../components/common/LoadingSkeleton';
import { CheckCircle2, ShieldCheck, AlertTriangle, RotateCcw } from 'lucide-react';

export const ApprovalsPage = () => {
  const { data: recommendations = [], isLoading, refetch } = useQuery({
    queryKey: ['approvals-recommendations'],
    queryFn: () => approvalsService.getRecommendations(),
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Row matching OpsPilot design */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 pt-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Recovery Approvals Desk
            </h1>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Human-in-the-Loop
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Authorize or reject AI-synthesized recovery interventions. High-consequence actions require explicit operator sign-off.
          </p>
        </div>

        {/* 4 Stat Cards */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-5 py-3 rounded-2xl glass-card flex flex-col justify-between min-w-[125px]">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Pending Review</span>
            </div>
            <div className="text-2xl font-black text-amber-300 mt-1">18</div>
            <div className="text-[10px] text-amber-300 font-medium mt-0.5">Awaiting sign-off</div>
          </div>

          <div className="px-5 py-3 rounded-2xl glass-card flex flex-col justify-between min-w-[125px]">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Authorized</span>
            </div>
            <div className="text-2xl font-black text-white mt-1">42</div>
            <div className="text-[10px] text-emerald-400 font-medium mt-0.5">Dispatched</div>
          </div>

          <div className="px-5 py-3 rounded-2xl bg-gradient-to-b from-rose-950/60 to-rose-900/30 border border-rose-500/30 backdrop-blur-2xl shadow-[0_12px_35px_rgba(0,0,0,0.6)] flex flex-col justify-between min-w-[125px]">
            <div className="flex items-center gap-1.5 text-rose-300 text-[10px] font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>High Risk</span>
            </div>
            <div className="text-2xl font-black text-white mt-1">04</div>
            <div className="text-[10px] text-rose-300 font-medium mt-0.5">Financial impact</div>
          </div>

          <div className="px-5 py-3 rounded-2xl glass-card flex flex-col justify-between min-w-[125px]">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
              <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
              <span>Avg Approval SLA</span>
            </div>
            <div className="text-2xl font-black text-white mt-1">12m</div>
            <div className="text-[10px] text-purple-300 font-medium mt-0.5">Response speed</div>
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
