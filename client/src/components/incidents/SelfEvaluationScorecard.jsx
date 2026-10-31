import React from 'react';
import { Card } from '../common/Card';
import { Award, Check } from 'lucide-react';

export const SelfEvaluationScorecard = ({ tests = [] }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Self-Evaluation Scorecard</h3>
          <p className="text-xs text-slate-400">
            Automated verification against hidden ground truth benchmarks (SRS Section 10: AT-1 to AT-13)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tests.map((test) => (
          <Card key={test.id} className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 font-bold text-purple-300">
                {test.id} • {test.name}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <Check className="w-3.5 h-3.5" /> Passed
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white">{test.measure}</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{test.detail}</p>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Target Pass Condition:</span>
              <span className="font-bold text-emerald-400">{test.score}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
