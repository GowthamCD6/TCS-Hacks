import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { approvalsService } from '../services/approvals.service';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Drawer } from '../components/common/Drawer';
import { Skeleton } from '../components/common/LoadingSkeleton';
import {
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Recovery Center</h1>
            <Badge variant="simulated">Hackathon Sandbox</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Audit history of authorized recovery interventions and simulated execution logs
          </p>
        </div>
      </div>

      {/* Hackathon Safe Sandbox Warning Banner */}
      <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-start gap-3 text-xs text-purple-200">
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
            <Card
              key={action.id}
              interactive
              onClick={() => setSelectedAction(action)}
              className="p-5 border border-purple-500/25 bg-[#140d28]/90 hover:border-purple-400/50 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-300 text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10">
                      {action.id}
                    </span>
                    <Badge variant="status" value={action.executionStatus}>
                      {action.executionStatus}
                    </Badge>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      {action.actionType.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white mt-1">{action.title}</h3>
                  <p className="text-xs text-slate-300 line-clamp-1">{action.resultSummary}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    Execution SLA
                  </span>
                  <span className="font-mono text-xs text-slate-300">
                    {formatDateTime(action.executionTime)}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between text-xs text-slate-400 font-mono">
                <span>Incident: {action.incidentId}</span>
                <span className="text-purple-300">{action.targetReference}</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Simulation Verified
                </span>
              </div>
            </Card>
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
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2 text-xs">
              <span className="font-bold block text-sm">Sandbox Result Summary</span>
              <p className="text-slate-200 leading-relaxed">{selectedAction.resultSummary}</p>
            </div>

            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                Execution Metadata
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
                  <span className="text-slate-400">Target Cohort Reference</span>
                  <span className="font-mono text-purple-300 font-bold">{selectedAction.targetReference}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
                  <span className="text-slate-400">Approval State</span>
                  <span className="font-bold text-white capitalize">{selectedAction.approvalStatus}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
                  <span className="text-slate-400">Execution Status</span>
                  <span className="font-bold text-emerald-400 capitalize">{selectedAction.executionStatus}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
                  <span className="text-slate-400">Timestamp</span>
                  <span className="font-mono text-white">{formatDateTime(selectedAction.executionTime)}</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => navigate(`/incidents/${selectedAction.incidentId}`)}
              >
                Inspect Incident {selectedAction.incidentId} <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
export default RecoveryPage;

