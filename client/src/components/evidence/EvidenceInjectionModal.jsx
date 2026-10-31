import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { incidentsService } from '../../services/incidents.service';
import { Sparkles, ArrowRight } from 'lucide-react';

const DEMO_PRESETS = [
  {
    name: 'Hotfix v2.3.1 Deployed',
    title: 'Hotfix v2.3.1 Reverting UPI Socket Timeout',
    type: 'code_deployment',
    source: 'GitHub CI/CD Deployment Orchestrator',
    relation: 'supports',
    description: 'Hotfix commit #88f12b pushed to production. Client socket timeout parameter restored to 30,000ms SLA.',
  },
  {
    name: 'Complaints on iOS Reported',
    title: 'Customer Feedback Stream: iOS Client Anomalies',
    type: 'customer_feedback',
    source: 'App Store Review RSS Stream',
    relation: 'contradicts',
    description: '3 independent complaints received from iOS 18 users claiming cart deductions without order confirmations.',
  },
  {
    name: 'Telemetry Missing: Drop Logs',
    title: 'Payment Gateway Telemetry Cutoff',
    type: 'telemetry',
    source: 'Payment Gateway Telemetry Probe',
    relation: 'neutral',
    description: 'Telemetry logs for order creation webhook unreachable. Forces test to UNTESTED rather than rejected.',
  },
  {
    name: 'Approver Rejects Rollback',
    title: 'Operator Decision: Rollback Rejected',
    type: 'code_deployment',
    source: 'Approvals Desk Event',
    relation: 'contradicts',
    description: 'Approver rejected code rollback due to pending database migration. Agent plans safe alternative with priority callbacks.',
  },
];

export const EvidenceInjectionModal = ({
  isOpen,
  onClose,
  incidentId,
  onEvidenceInjected,
}) => {
  const [title, setTitle] = useState('');
  const [evidenceType, setEvidenceType] = useState('telemetry');
  const [source, setSource] = useState('');
  const [relation, setRelation] = useState('supports');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reassessmentResult, setReassessmentResult] = useState(null);

  const applyPreset = (preset) => {
    setTitle(preset.title);
    setEvidenceType(preset.type);
    setSource(preset.source);
    setRelation(preset.relation);
    setDescription(preset.description);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) return;

    setIsSubmitting(true);
    try {
      const payload = {
        incidentId,
        title,
        evidenceType,
        source: source || 'Manual Operator Telemetry',
        relation,
        description,
      };

      const result = await incidentsService.injectEvidence(payload);
      setReassessmentResult(result);
      onEvidenceInjected?.(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    setReassessmentResult(null);
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleFinish}
      title={reassessmentResult ? 'Adaptive Reassessment Complete' : 'Inject Operational Evidence'}
      description={
        reassessmentResult
          ? 'Autonomous agent evaluated the evidence and updated root cause likelihoods.'
          : 'Introduce new telemetry, operational events, or customer signals to test adaptive reasoning.'
      }
      maxWidth="xl"
    >
      {reassessmentResult ? (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-200">
            <div className="flex items-center gap-2 font-bold mb-1">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>Bayesian Causal Shift Verified</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {reassessmentResult.changeSummary}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase text-slate-400">Hypothesis Probability Adjustments</h4>
            {reassessmentResult.affectedHypotheses?.map((h) => (
              <div
                key={h.id}
                className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-white block">{h.title}</span>
                  <span className="text-slate-400 text-[11px]">{h.verdictChange}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-400">{(h.oldLikelihood * 100).toFixed(0)}%</span>
                  <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-bold text-emerald-400">
                    {(h.newLikelihood * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {reassessmentResult.kpiImpactNotice && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
              {reassessmentResult.kpiImpactNotice}
            </div>
          )}

          <div className="pt-3 flex justify-end">
            <Button variant="primary" onClick={handleFinish}>
              Done & Return to Workspace
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Demo Presets */}
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2">
              Jury Demonstration Scenarios (Quick Fill)
            </label>
            <div className="flex flex-wrap gap-2">
              {DEMO_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.name}
                  onClick={() => applyPreset(p)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-all cursor-pointer"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Evidence Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Hotfix v2.3.1 Deployed to Production"
              className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Evidence Type</label>
              <select
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#140e26] border border-white/10 text-white text-sm focus:outline-none focus:border-purple-400"
              >
                <option value="code_deployment">Code Deployment</option>
                <option value="telemetry">Operational Telemetry</option>
                <option value="payment_gateway">Payment Gateway Log</option>
                <option value="database_logs">Database Logs</option>
                <option value="customer_feedback">Customer Feedback</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Hypothesis Relation
              </label>
              <select
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#140e26] border border-white/10 text-white text-sm focus:outline-none focus:border-purple-400"
              >
                <option value="supports">Supports Hypothesis</option>
                <option value="contradicts">Contradicts Hypothesis</option>
                <option value="neutral">Neutral / Informational</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Source / System</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. GitHub Actions, Datadog APM, UPI Webhook Log"
              className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Description & Log Snippet</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter exact operational details, telemetry logs, or customer verbatims..."
              className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-400"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={handleFinish}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Inject & Trigger Adaptive Reassessment
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
