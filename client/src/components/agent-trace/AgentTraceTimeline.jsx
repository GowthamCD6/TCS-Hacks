import React from 'react';
import { Card } from '../common/Card';
import { Cpu, CheckCircle2, Clock } from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';

export const AgentTraceTimeline = ({ steps = [] }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Autonomous Agent Execution Trace</h3>
          <p className="text-xs text-slate-400">
            Step-by-step reasoning audit trail, tool invocations, and evidential inputs
          </p>
        </div>
      </div>

      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-purple-500 before:via-indigo-500 before:to-purple-900/40">
        {steps.map((step) => (
          <div key={step.stepNumber} className="relative group">
            {/* Timeline node icon */}
            <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-[#160f2e] border-2 border-purple-400 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.5)] z-10">
              <span className="text-[10px] font-bold text-white font-mono">{step.stepNumber}</span>
            </div>

            <Card className="p-4 sm:p-5 border border-white/10 hover:border-purple-500/30 transition-all bg-[#130d24]/90 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{step.agentName}</span>
                  <span className="text-xs font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    {step.toolName}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    {step.durationMs}ms
                  </span>
                  <span>{formatDateTime(step.timestamp)}</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-semibold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {step.status}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-200 mb-1">{step.action}</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Input Context</span>
                  <p className="text-slate-300 leading-relaxed font-mono text-[11px]">{step.inputSummary}</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/15 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-purple-300 block">Agent Output / Reasoning</span>
                  <p className="text-purple-200 leading-relaxed font-mono text-[11px]">{step.outputSummary}</p>
                </div>
              </div>

              {step.evidenceReferences?.length > 0 && (
                <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Referenced Evidence:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {step.evidenceReferences.map((ref) => (
                      <span
                        key={ref}
                        className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px] font-mono text-purple-300"
                      >
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};
