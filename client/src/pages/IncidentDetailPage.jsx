import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { incidentsService } from '../services/incidents.service';
import { approvalsService } from '../services/approvals.service';
import { kpisService } from '../services/kpis.service';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/LoadingSkeleton';
import { IssueGraph } from '../components/issue-graph/IssueGraph';
import { EvidenceExplorer } from '../components/evidence/EvidenceExplorer';
import { RootCauseCourt } from '../components/root-cause/RootCauseCourt';
import { AffectedSegments } from '../components/segments/AffectedSegments';
import { BusinessImpactView } from '../components/incidents/BusinessImpactView';
import { CustomerRecoveryListView } from '../components/incidents/CustomerRecoveryListView';
import { SelfEvaluationScorecard } from '../components/incidents/SelfEvaluationScorecard';
import { AgentTraceTimeline } from '../components/agent-trace/AgentTraceTimeline';
import { RecommendationsList } from '../components/recommendations/RecommendationsList';
import { KPIMonitoringView } from '../components/kpis/KPIMonitoringView';
import {

  ArrowLeft,
  Layers,
  Scale,
  FileText,
  Users,
  DollarSign,
  Cpu,
  Sparkles,
  Activity,
  UserCheck,
  Award,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export const IncidentDetailPage = () => {
  const { id = 'INC-2026-084' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('graph');

  // Load Incident details
  const { data: incident, isLoading: isLoadingIncident } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => incidentsService.getIncidentById(id),
  });

  // Load Evidence
  const { data: evidence = [], refetch: refetchEvidence } = useQuery({
    queryKey: ['incident-evidence', id],
    queryFn: () => incidentsService.getEvidence(id),
  });

  // Load Hypotheses
  const { data: hypotheses = [], refetch: refetchHypotheses } = useQuery({
    queryKey: ['incident-hypotheses', id],
    queryFn: () => incidentsService.getHypotheses(id),
  });

  // Load Segments
  const { data: segments = [] } = useQuery({
    queryKey: ['incident-segments', id],
    queryFn: () => incidentsService.getAffectedSegments(id),
  });

  // Load Business Impact
  const { data: impact } = useQuery({
    queryKey: ['incident-impact', id],
    queryFn: () => incidentsService.getBusinessImpact(id),
  });

  // Load Agent Trace
  const { data: trace = [], refetch: refetchTrace } = useQuery({
    queryKey: ['incident-trace', id],
    queryFn: () => incidentsService.getAgentTrace(id),
  });

  // Load Recommendations
  const { data: recommendations = [], refetch: refetchRecommendations } = useQuery({
    queryKey: ['incident-recommendations', id],
    queryFn: () => approvalsService.getRecommendations(id),
  });

  // Load KPIs
  const { data: kpis = [], refetch: refetchKPIs } = useQuery({
    queryKey: ['incident-kpis', id],
    queryFn: () => kpisService.getKPIMonitoring(id),
  });

  const handleDataRefresh = () => {
    refetchEvidence();
    refetchHypotheses();
    refetchTrace();
    refetchRecommendations();
    refetchKPIs();
    queryClient.invalidateQueries({ queryKey: ['incident', id] });
  };

  if (isLoadingIncident) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!incident) {
    return (
      <Card className="p-8 text-center space-y-4">
        <p className="text-slate-300">Incident not found or no data available.</p>
        <Button variant="secondary" onClick={() => navigate('/incidents')}>
          Return to Incidents
        </Button>
      </Card>
    );
  }

  const tabs = [
    { key: 'graph', label: 'CX Issue Graph', icon: Layers },
    { key: 'root-cause', label: 'Root Cause Court', icon: Scale, badge: hypotheses.length },
    { key: 'evidence', label: 'Evidence Explorer', icon: FileText, badge: evidence.length },
    { key: 'segments', label: 'Affected Segments', icon: Users, badge: segments.length },
    { key: 'impact', label: 'Business Impact', icon: DollarSign },
    { key: 'recovery-list', label: 'Customer Recovery List', icon: UserCheck },
    { key: 'trace', label: 'Agent Trace', icon: Cpu, badge: trace.length },
    { key: 'recommendations', label: 'Interventions', icon: Sparkles, badge: recommendations.length },
    { key: 'kpis', label: 'Recovery Verification', icon: Activity },
    { key: 'scorecard', label: 'Evaluation Scorecard', icon: Award },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back button & top navigation breadcrumb */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/incidents')}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Incidents Index
        </Button>
        <span className="text-slate-600">/</span>
        <span className="text-xs font-mono font-bold text-purple-300">{incident.id}</span>
      </div>

      {/* Section A: Incident Overview Hero Card */}
      <Card className="p-6 border border-purple-500/30 bg-[#160f2e]/90 shadow-[0_0_30px_rgba(168,85,247,0.15)] space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-purple-200 text-sm px-2.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/30">
                {incident.id}
              </span>
              <Badge variant="severity" value={incident.severity}>
                {incident.severity}
              </Badge>
              <Badge variant="status" value={incident.status}>
                {incident.status.replace(/_/g, ' ')}
              </Badge>
              <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Confidence {(incident.confidence * 100).toFixed(0)}%
              </span>
              <Badge variant="simulated">Autonomous Case</Badge>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              {incident.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              {incident.summary}
            </p>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">
              Estimated Total Exposure
            </span>
            <span className="text-3xl font-black text-white font-mono">
              {formatCurrency(incident.estimatedFinancialImpact)}
            </span>
            <span className="text-xs text-purple-300 block font-mono mt-0.5">
              Direct Loss: {formatCurrency(incident.measuredDirectLoss)}
            </span>
          </div>
        </div>

        {/* Quick Facts Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Affected Customers</span>
            <span className="font-extrabold text-white text-sm">{incident.affectedCustomers.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">First Detected</span>
            <span className="font-semibold text-slate-300 font-mono text-sm">
              {formatDateTime(incident.detectedAt)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Primary Hypothesis</span>
            <span className="font-semibold text-purple-300 truncate block text-xs" title={incident.primaryHypothesis}>
              {incident.primaryHypothesis || 'Evaluating'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Recovery State</span>
            <span className="font-bold text-emerald-400 capitalize text-sm">
              {incident.verificationStatus.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs Bar centered */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-purple-500/20">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-t border-x cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#150f2b] text-purple-300 border-purple-500/40 border-b-2 border-b-[#150f2b] shadow-[0_-4px_12px_rgba(168,85,247,0.15)]'
                  : 'bg-transparent text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40'
                      : 'bg-white/5 text-slate-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === 'graph' && <IssueGraph />}

        {activeTab === 'root-cause' && <RootCauseCourt hypotheses={hypotheses} />}

        {activeTab === 'evidence' && (
          <EvidenceExplorer
            evidence={evidence}
            incidentId={incident.id}
            onRefresh={handleDataRefresh}
          />
        )}

        {activeTab === 'segments' && <AffectedSegments segments={segments} />}

        {activeTab === 'impact' && (
          <BusinessImpactView
            impact={{
              capturedPaymentsWithoutOrders: impact?.estimated_financial_loss || incident.measuredDirectLoss || 202440,
              estimatedRevenueImpact: impact?.estimated_revenue_impact || incident.estimatedFinancialImpact || 482000,
              affectedCustomers: incident.affectedCustomers || 156,
              confirmedReversals: (impact?.estimated_financial_loss || 202440) * 0.28,
              ...impact,
            }}
          />
        )}

        {activeTab === 'recovery-list' && <CustomerRecoveryListView
            entries={
              impact?.reconciliation?.overdue?.map((o, idx) => ({
                id: 'AUD-' + (1001 + idx),
                customerName: o.customer_name,
                customerRef: 'CUST-' + (1001 + idx),
                transactionRef: o.bank_ref || o.order_id,
                transactionState: o.status || 'captured_without_order',
                amount: o.amount,
                isEligible: true,
                prescribedRemedy: 'Auto-rehydrate order + waive delivery fees',
                status: 'pending_reconciliation',
              })) || [
                {
                  id: 'AUD-1001',
                  customerName: 'Aarav Mehta',
                  customerRef: 'CUST-1001',
                  transactionRef: 'HDFC-UPI-98124',
                  transactionState: 'captured_without_order',
                  amount: 3499,
                  isEligible: true,
                  prescribedRemedy: 'Rehydrate order + ₹200 apology voucher',
                  status: 'pending_reconciliation',
                },
                {
                  id: 'AUD-1002',
                  customerName: 'Priya Sharma',
                  customerRef: 'CUST-1002',
                  transactionRef: 'ICICI-UPI-41829',
                  transactionState: 'captured_without_order',
                  amount: 1850,
                  isEligible: true,
                  prescribedRemedy: 'Auto-rehydrate order',
                  status: 'pending_reconciliation',
                },
                {
                  id: 'AUD-1003',
                  customerName: 'Rohan Verma',
                  customerRef: 'CUST-1003',
                  transactionRef: 'SBI-UPI-10928',
                  transactionState: 'captured_without_order',
                  amount: 2400,
                  isEligible: true,
                  prescribedRemedy: 'Direct refund to source account',
                  status: 'pending_reconciliation',
                },
              ]
            }
            onTriggerReconciliation={handleDataRefresh}
          />}

        {activeTab === 'trace' && <AgentTraceTimeline steps={trace} />}

        {activeTab === 'recommendations' && (
          <RecommendationsList
            recommendations={recommendations}
            onActionComplete={handleDataRefresh}
          />
        )}

        {activeTab === 'kpis' && (
          <KPIMonitoringView kpis={kpis} onRefresh={handleDataRefresh} />
        )}

        {activeTab === 'scorecard' && <SelfEvaluationScorecard />}
      </div>
    </div>
  );
};
export default IncidentDetailPage;

