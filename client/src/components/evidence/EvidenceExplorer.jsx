import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { EvidenceInjectionModal } from './EvidenceInjectionModal';
import {
  FileText,
  PlusCircle,
  CheckCircle,
  XCircle,
  MinusCircle,
  ShieldCheck,
} from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';

export const EvidenceExplorer = ({
  evidence = [],
  incidentId,
  onRefresh,
}) => {
  const [isInjectModalOpen, setIsInjectModalOpen] = useState(false);

  const getRelationBadge = (relation) => {
    switch (relation) {
      case 'supports':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle className="w-3 h-3" /> Supports
          </span>
        );
      case 'contradicts':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3 h-3" /> Contradicts
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-500/15 text-slate-300 border border-slate-500/30">
            <MinusCircle className="w-3 h-3" /> Neutral
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Evidence Explorer</h3>
            <p className="text-xs text-slate-400">
              Verified operational telemetry, code commits, and customer verbatims
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsInjectModalOpen(true)}
          className="gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          Inject Evidence
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {evidence.map((item) => (
          <Card key={item.id} className="p-4 sm:p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-purple-300">
                  {item.id}
                </span>
                <div className="flex items-center gap-2">
                  {getRelationBadge(item.relation)}
                  <span className="text-xs font-mono text-slate-400">
                    Relevance {item.relevanceScore}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold text-slate-200">{item.source}</span>
                {item.isVerified && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono">{formatDateTime(item.timestamp)}</span>
              {item.relatedRecord && (
                <span className="truncate max-w-[200px] text-purple-300/80 hover:text-purple-300 cursor-pointer">
                  {item.relatedRecord}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      <EvidenceInjectionModal
        isOpen={isInjectModalOpen}
        onClose={() => setIsInjectModalOpen(false)}
        incidentId={incidentId}
        onEvidenceInjected={() => {
          onRefresh?.();
        }}
      />
    </div>
  );
};

