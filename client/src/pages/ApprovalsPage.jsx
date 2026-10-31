import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { approvalsService } from '../services/approvals.service';
import { RecommendationsList } from '../components/recommendations/RecommendationsList';
import { Skeleton } from '../components/common/LoadingSkeleton';

export const ApprovalsPage = () => {
  const { data: recommendations = [], isLoading, refetch } = useQuery({
    queryKey: ['approvals-recommendations'],
    queryFn: () => approvalsService.getRecommendations(),
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Recovery Approvals Desk
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Human-in-the-Loop
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Authorize or reject AI-synthesized recovery interventions. High-consequence actions require explicit operator sign-off.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-44" count={3} />
        </div>
      ) : (
        <RecommendationsList
          recommendations={recommendations}
          onActionComplete={() => refetch()}
        />
      )}
    </div>
  );
};
export default ApprovalsPage;
