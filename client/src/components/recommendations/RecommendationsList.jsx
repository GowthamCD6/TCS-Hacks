import React, { useState } from 'react';
import { approvalsService } from '../../services/approvals.service';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  Sparkles,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const RecommendationsList = ({
  recommendations = [],
  onActionComplete,
}) => {
  const [selectedRec, setSelectedRec] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

  const handleApproveClick = (rec) => {
    setSelectedRec(rec);
    setIsConfirmOpen(true);
  };

  const handleRejectClick = (rec) => {
    setSelectedRec(rec);
    setIsRejectOpen(true);
  };

  const executeApproval = async () => {
    if (!selectedRec) return;
    setIsProcessing(true);
    try {
      const action = await approvalsService.approveRecommendation(selectedRec.id);
      setExecutionResult(action);
      onActionComplete?.();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeRejection = async () => {
    if (!selectedRec || !rejectReason) return;
    setIsProcessing(true);
    try {
      await approvalsService.rejectRecommendation(selectedRec.id, rejectReason);
      setIsRejectOpen(false);
      setRejectReason('');
      onActionComplete?.();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Ranked Recovery Recommendations</h3>
          <p className="text-xs text-slate-400">
            AI-synthesized interventions requiring human authorization before simulated execution
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec, idx) => {
          const isPending = rec.approvalStatus === 'pending';
          const isApproved = rec.approvalStatus === 'approved';
          const isRejected = rec.approvalStatus === 'rejected';

          return (
            <Card
              key={rec.id}
              className={`p-5 transition-all space-y-4 border ${
                isApproved
                  ? 'border-emerald-500/30 bg-[#101c1c]/40'
                  : isRejected
                  ? 'border-rose-500/30 bg-[#200e16]/40'
                  : 'border-purple-500/30 bg-[#160f2e]/90'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-bold text-white text-xs font-mono">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-white">{rec.title}</h4>
                      <Badge variant="simulated">Simulated Action</Badge>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-3xl">
                      {rec.rationale}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      isApproved
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : isRejected
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending Authorization'}
                  </span>
                </div>
              </div>

              {/* Metrics Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 border-y border-white/5 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Customer Benefit</span>
                  <span className="font-semibold text-emerald-300">{rec.expectedCustomerBenefit}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Estimated Cost</span>
                  <span className="font-bold text-white font-mono">{formatCurrency(rec.estimatedCost)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Time to Recover</span>
                  <span className="font-semibold text-purple-300 font-mono">{rec.implementationTimeMinutes} min</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Operational Risk</span>
                  <span className="font-bold uppercase text-amber-400">{rec.riskLevel}</span>
                </div>
              </div>

              {/* Rejection notice and alternative */}
              {isRejected && rec.rejectionReason && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-1">
                  <span className="font-bold text-rose-300">Rejection Reason:</span>
                  <p className="text-rose-200">{rec.rejectionReason}</p>
                  {rec.alternativeAction && (
                    <p className="text-purple-300 pt-1 font-semibold">{rec.alternativeAction}</p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {isPending && (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRejectClick(rec)}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject Action
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApproveClick(rec)}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Authorize & Execute Simulation
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setExecutionResult(null);
        }}
        title={executionResult ? 'Simulated Recovery Executed' : 'Confirm Consequential Action'}
        description={
          executionResult
            ? 'The recovery intervention was simulated inside the sandbox environment.'
            : 'Review operational parameters before dispatching simulated recovery command.'
        }
      >
        {executionResult ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>Simulation Completed Successfully</span>
              </div>
              <p className="text-slate-200 leading-relaxed">{executionResult.resultSummary}</p>
              <div className="font-mono text-[11px] text-emerald-400">
                Action Ref: {executionResult.id} • Target: {executionResult.targetReference}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/20 text-xs text-purple-200">
              Post-intervention telemetry monitoring is now tracking recovery KPIs.
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                onClick={() => {
                  setIsConfirmOpen(false);
                  setExecutionResult(null);
                }}
              >
                Close & Check KPIs
              </Button>
            </div>
          </div>
        ) : (
          selectedRec && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
                <h4 className="font-bold text-white text-sm">{selectedRec.title}</h4>
                <p className="text-slate-300">{selectedRec.rationale}</p>
                <div className="pt-2 flex items-center justify-between font-mono text-purple-300">
                  <span>Est. Cost: {formatCurrency(selectedRec.estimatedCost)}</span>
                  <span>Execution SLA: ~{selectedRec.implementationTimeMinutes} minutes</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Hackathon Safe Guard:</strong> All dispatched refunds and feature-flags are simulated in-memory and logged for jury verification.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <Button variant="ghost" onClick={() => setIsConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={executeApproval} isLoading={isProcessing}>
                  Confirm & Execute Simulation
                </Button>
              </div>
            </div>
          )
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title="Reject Recovery Recommendation"
        description="Provide a justification for the rejection to prompt alternative AI synthesis."
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Rejection Rationale
            </label>
            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Risk of database lock contention too high during active peak hours..."
              className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-400"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <Button variant="ghost" onClick={() => setIsRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={executeRejection}
              isLoading={isProcessing}
              disabled={!rejectReason}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

