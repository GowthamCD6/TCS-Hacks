import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Scale, CheckCircle2, XCircle, HelpCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../utils/cn';

export const RootCauseCourt = ({ hypotheses = [] }) => {
  const [expandedHypothesisId, setExpandedHypothesisId] = useState(
    hypotheses[0]?.id || ''
  );

  const getVerdictBadge = (verdict) => {
    switch (verdict) {
      case 'supported':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Supported
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5 text-rose-400" /> Rejected
          </span>
        );
      case 'untested':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-300 border border-slate-500/30">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" /> Untested (Telemetry Missing)
          </span>
        );
      case 'inconclusive':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Inconclusive
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Root Cause Court</h3>
            <p className="text-xs text-slate-400">
              Rigorous causal hypothesis testing against 5 evidential dimensions & decoy elimination
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {hypotheses.map((hyp) => {
          const isExpanded = expandedHypothesisId === hyp.id;
          const isPrimary = hyp.status === 'primary_cause';

          return (
            <Card
              key={hyp.id}
              className={cn(
                'transition-all duration-200 border',
                isPrimary ? 'border-purple-500/40 bg-[#160f2e]/90 shadow-[0_0_20px_rgba(168,85,247,0.15)]' : 'border-white/5 bg-[#120d22]/70'
              )}
            >
              {/* Hypothesis Header Bar */}
              <div
                className="flex flex-wrap items-center justify-between gap-4 cursor-pointer"
                onClick={() => setExpandedHypothesisId(isExpanded ? '' : hyp.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-purple-300">
                      {hyp.id}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-white">{hyp.title}</h4>
                      {isPrimary && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-200 border border-purple-400/30 uppercase tracking-wide">
                          Primary Cause
                        </span>
                      )}
                      {hyp.status === 'disproven' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                          Disproven Decoy
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 max-w-2xl">{hyp.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-mono">Likelihood</span>
                    <span
                      className={cn(
                        'text-base font-extrabold font-mono',
                        hyp.likelihoodScore >= 0.8
                          ? 'text-purple-300'
                          : hyp.likelihoodScore <= 0.2
                          ? 'text-rose-400'
                          : 'text-amber-300'
                      )}
                    >
                      {(hyp.likelihoodScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded Hypothesis Tests Table */}
              {isExpanded && (
                <div className="mt-6 pt-5 border-t border-white/10 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {hyp.tests?.map((test) => (
                      <div
                        key={test.id}
                        className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200 tracking-wide">
                            {test.name}
                          </span>
                          {getVerdictBadge(test.verdict)}
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">{test.explanation}</p>

                        {/* Evidential Citations */}
                        {test.supportingEvidence?.length > 0 && (
                          <div className="text-[11px] text-emerald-400/90 flex items-center gap-1.5">
                            <span className="font-semibold">Supporting:</span>
                            <span>{test.supportingEvidence.join(', ')}</span>
                          </div>
                        )}

                        {test.contradictingEvidence?.length > 0 && (
                          <div className="text-[11px] text-rose-400/90 flex items-center gap-1.5">
                            <span className="font-semibold">Contradicting:</span>
                            <span>{test.contradictingEvidence.join(', ')}</span>
                          </div>
                        )}

                        {test.missingEvidence && test.missingEvidence.length > 0 && (
                          <div className="text-[11px] text-amber-400/90 flex items-center gap-1.5">
                            <span className="font-semibold">Missing:</span>
                            <span>{test.missingEvidence.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

