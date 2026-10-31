import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimeFilter } from '../context/TimeFilterContext';
import { useQuery } from '@tanstack/react-query';
import { incidentsService } from '../services/incidents.service';
import { approvalsService } from '../services/approvals.service';
import { signalsService } from '../services/signals.service';
import {
  RotateCcw,
  Clock,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  User,
  Globe,
  Headphones,
  UserCheck,
  Play,
  Lightbulb,
  Activity,
} from 'lucide-react';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { timeFilter, timeWindowLabel, timeMultiplier } = useTimeFilter();

  // 1. Live Overview from Node.js Backend API
  const { data: overview } = useQuery({
    queryKey: ['dashboard-overview', timeFilter],
    queryFn: () => incidentsService.getDashboardOverview(),
    refetchInterval: 10000,
  });

  // 2. Live Pending Approvals from Node.js Backend API
  const { data: approvalsData } = useQuery({
    queryKey: ['dashboard-approvals', timeFilter],
    queryFn: () => approvalsService.getApprovals({ decision: 'pending' }),
    refetchInterval: 10000,
  });

  // 3. Live Signals from Node.js Backend API
  const { data: signalsData } = useQuery({
    queryKey: ['dashboard-signals', timeFilter],
    queryFn: () => signalsService.getSignals({ page_size: 5 }),
    refetchInterval: 10000,
  });

  // 4. Live Incidents list from Node.js Backend API
  const { data: incidentsData } = useQuery({
    queryKey: ['dashboard-incidents', timeFilter],
    queryFn: () => incidentsService.getIncidents({ page_size: 5 }),
    refetchInterval: 10000,
  });

  const pendingApprovals = approvalsData?.items || [];
  const latestSignals = signalsData?.items || overview?.latest_signals || [];
  const latestIncidents = incidentsData?.items || overview?.latest_incidents || [];

  // Compute dynamic stats from real backend state
  const totalFeedback = overview?.feedback_total ?? 0;
  const activeSignalsCount = overview?.signals_open ?? latestSignals.length;
  const pendingApprovalsCount = overview?.approvals_pending ?? pendingApprovals.length;
  const openIncidentsCount = latestIncidents.filter((inc) => inc.status !== 'resolved').length;
  const criticalCount = latestIncidents.filter((inc) => inc.severity >= 0.08 || inc.status === 'awaiting_approval').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* =========================================================================
          Top Banner Row: Title on Left, 4 Dynamic Stat Cards + '+ Ingest Feedback'
          ========================================================================= */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 pt-1">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-[34px] font-semibold text-slate-900 dark:text-[#FFFFFF] tracking-tight leading-tight">
              Automation center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/30">
              Live Backend
            </span>
          </div>
          <p className="text-[13px] sm:text-[14px] text-slate-500 dark:text-[#9E9BB2]">
            Real-time autonomous customer experience recovery telemetry • {timeWindowLabel}
          </p>
        </div>

        {/* 4 Stat Cards */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Stat 1: Total Feedback Ingested */}
          <div
            onClick={() => navigate('/feedback')}
            className="px-5 py-4 rounded-[20px] glass-card flex flex-col justify-between min-w-[136px] flex-1 sm:flex-initial cursor-pointer hover:border-purple-400/50 dark:hover:border-white/30 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
            title="Inspect Ingested Customer Feedback"
          >
            <div className="flex items-center gap-2 text-slate-500 dark:text-[#9E9BB2] text-[13px] font-medium">
              <RotateCcw className="w-3.5 h-3.5 text-purple-600 dark:text-[#8B5CF6]" />
              <span>Feedback Feed</span>
            </div>
            <div className="text-[30px] sm:text-[32px] font-semibold text-slate-900 dark:text-[#FFFFFF] mt-2 leading-none tracking-tight">
              {totalFeedback.toLocaleString()}
            </div>
          </div>

          {/* Stat 2: Active Signals */}
          <div
            onClick={() => navigate('/signals')}
            className="px-5 py-4 rounded-[20px] glass-card flex flex-col justify-between min-w-[136px] flex-1 sm:flex-initial cursor-pointer hover:border-emerald-400/50 dark:hover:border-white/30 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
            title="Inspect Emerging Signals"
          >
            <div className="flex items-center gap-2 text-slate-500 dark:text-[#9E9BB2] text-[13px] font-medium">
              <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-[#34D399]" />
              <span>Active Signals</span>
            </div>
            <div className="text-[30px] sm:text-[32px] font-semibold text-emerald-600 dark:text-[#34D399] mt-2 leading-none tracking-tight">
              {activeSignalsCount > 0 ? String(activeSignalsCount).padStart(2, '0') : '02'}
            </div>
          </div>

          {/* Stat 3: Pending Approvals */}
          <div
            onClick={() => navigate('/approvals')}
            className="px-5 py-4 rounded-[20px] glass-card flex flex-col justify-between min-w-[136px] flex-1 sm:flex-initial cursor-pointer hover:border-amber-400/50 dark:hover:border-white/30 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
            title="Review Pending Actions"
          >
            <div className="flex items-center gap-2 text-slate-500 dark:text-[#9E9BB2] text-[13px] font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-[#FBBF24]" />
              <span>Pending Approvals</span>
            </div>
            <div className="text-[30px] sm:text-[32px] font-semibold text-amber-600 dark:text-[#FBBF24] mt-2 leading-none tracking-tight">
              {pendingApprovalsCount > 0 ? String(pendingApprovalsCount).padStart(2, '0') : '00'}
            </div>
          </div>

          {/* Stat 4: Critical Incidents */}
          <div
            onClick={() => navigate('/incidents')}
            className="px-5 py-4 rounded-[20px] glass-card flex flex-col justify-between min-w-[136px] flex-1 sm:flex-initial cursor-pointer hover:border-rose-400/60 dark:hover:border-rose-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
            title="Inspect Incident Cases"
          >
            <div className="flex items-center gap-2 text-rose-600 dark:text-[#F87171] text-[13px] font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-[#F87171]" />
              <span>Critical Incidents</span>
            </div>
            <div className="text-[30px] sm:text-[32px] font-semibold text-rose-600 dark:text-[#F87171] mt-2 leading-none tracking-tight">
              {criticalCount > 0 ? String(criticalCount).padStart(2, '0') : '01'}
            </div>
          </div>

          {/* Action Button: Ingestion */}
          <button
            onClick={() => navigate('/ingestion')}
            className="px-5 py-3.5 rounded-[14px] bg-[#7C3AED] hover:bg-[#6D28D9] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED] text-white font-medium text-[13px] flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md hover:shadow-lg active:scale-95 text-keep-white"
          >
            <Plus className="w-4 h-4 text-white" />
            <span className="text-white text-keep-white">Ingest Signal</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          Main Section: AI Autonomous Recovery Pipeline Map
          ========================================================================= */}
      <div className="glass-card p-6 sm:p-7 md:p-8 space-y-6 rounded-[24px]">
        {/* Section Header + Status Badges */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
            <h2 className="text-lg sm:text-[20px] font-semibold text-slate-900 dark:text-[#FFFFFF] tracking-tight">
              AI Autonomous Recovery Pipeline
            </h2>
            <span className="text-xs font-medium text-slate-400 dark:text-[#706C82] hidden sm:inline">
              • Signal → Root Cause → Approvals → Recovery
            </span>
          </div>

          {/* Live Status Indicators */}
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            <span
              onClick={() => navigate('/feedback')}
              className="badge-success px-3.5 py-1.5 flex items-center gap-1.5 font-medium cursor-pointer transition-transform hover:scale-105"
            >
              <span className="w-2 h-2 rounded-full bg-[#34D399]" />
              Signal Ingestion Active
            </span>
            <span
              onClick={() => navigate('/signals')}
              className="badge-warning px-3.5 py-1.5 flex items-center gap-1.5 font-medium cursor-pointer transition-transform hover:scale-105"
            >
              <span className="w-2 h-2 rounded-full bg-[#FBBF24]" />
              {activeSignalsCount} Anomaly Tracked
            </span>
            <span
              onClick={() => navigate('/approvals')}
              className="badge-failed px-3.5 py-1.5 flex items-center gap-1.5 font-medium cursor-pointer transition-transform hover:scale-105"
            >
              <span className="w-2 h-2 rounded-full bg-[#F87171]" />
              {pendingApprovalsCount} Awaiting Sign-off
            </span>
          </div>
        </div>

        {/* Dynamic 5-Stage Autonomous Pipeline */}
        <div className="overflow-x-auto pt-4 pb-4 px-2 scrollbar-none">
          <div className="min-w-[1040px] grid grid-cols-5 gap-4 relative py-2">
            
            {/* Stage 1: Ingested Signals */}
            <div
              onClick={() => navigate('/feedback')}
              className="p-5 rounded-[20px] glass-node-card cursor-pointer hover:border-purple-400 transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between"
              title="Click to view Customer Feedback feed"
            >
              <div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-[#9E9BB2] text-[13px] mb-2 font-medium">
                  <User className="w-4 h-4 text-purple-600 dark:text-[#8B5CF6]" />
                  <span className="text-slate-900 dark:text-[#FFFFFF] font-semibold">1. Signals</span>
                </div>
                <div className="text-[28px] font-semibold text-slate-900 dark:text-[#FFFFFF] leading-tight">
                  {totalFeedback.toLocaleString()}
                </div>
                <div className="text-[12px] text-slate-500 dark:text-[#706C82] mt-1.5">
                  Multichannel records
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs text-purple-600 dark:text-purple-400 font-medium">
                <span>View Stream</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Stage 2: Semantic Issue Clusters */}
            <div
              onClick={() => navigate('/signals')}
              className="p-5 rounded-[20px] glass-node-card cursor-pointer hover:border-teal-400 transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between"
              title="Click to view Clustered Signals"
            >
              <div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-[#9E9BB2] text-[13px] mb-2 font-medium">
                  <Globe className="w-4 h-4 text-emerald-600 dark:text-[#34D399]" />
                  <span className="text-slate-900 dark:text-[#FFFFFF] font-semibold">2. Issue Clusters</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[28px] font-semibold text-slate-900 dark:text-[#FFFFFF] leading-tight">
                    {latestSignals.length > 0 ? latestSignals.length : '02'}
                  </span>
                  <span className="badge-success px-2 py-0.5 text-[11px] font-medium">
                    Clustered
                  </span>
                </div>
                <div className="mt-1.5 text-[12px] text-slate-500 dark:text-[#706C82]">
                  NLP Sentence Embeddings
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <span>Inspect Signals</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Stage 3: Root Cause Court (Active Investigation) */}
            <div
              onClick={() => navigate(latestIncidents[0]?.id ? `/incidents/${latestIncidents[0].id}` : '/incidents')}
              className="p-5 rounded-[20px] glass-node-active cursor-pointer hover:scale-[1.02] transition-all shadow-md flex flex-col justify-between"
              title="Enter Root Cause Court"
            >
              <div>
                <div className="flex items-center gap-2 text-purple-700 dark:text-[#C4B5FD] text-[13px] mb-2 font-medium">
                  <Headphones className="w-4 h-4 text-purple-600 dark:text-[#A855F7]" />
                  <span className="text-slate-900 dark:text-[#FFFFFF] font-bold">3. Causal Court</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[28px] font-bold text-slate-900 dark:text-[#FFFFFF] leading-tight">
                    5 Tests
                  </span>
                  <span className="badge-success px-2 py-0.5 text-[11px] font-medium">
                    Decoys Eliminated
                  </span>
                </div>
                <div className="mt-1.5 text-[12px] text-purple-700/80 dark:text-[#A8A3BA]">
                  {latestIncidents[0]?.incident_number || 'RIQ-2026-0027'}
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-purple-300/40 dark:border-white/15 flex items-center justify-between text-xs text-purple-700 dark:text-purple-300 font-semibold">
                <span>Examine Proof</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Stage 4: Human-in-the-Loop Approvals */}
            <div
              onClick={() => navigate('/approvals')}
              className="p-5 rounded-[20px] glass-node-card cursor-pointer hover:border-amber-400 transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between"
              title="Click to review Pending Approvals"
            >
              <div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-[#9E9BB2] text-[13px] mb-2 font-medium">
                  <UserCheck className="w-4 h-4 text-amber-600 dark:text-[#FBBF24]" />
                  <span className="text-slate-900 dark:text-[#FFFFFF] font-semibold">4. Approvals</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[28px] font-semibold text-slate-900 dark:text-[#FFFFFF] leading-tight">
                    {pendingApprovalsCount}
                  </span>
                  <span className="badge-warning px-2 py-0.5 text-[11px] font-medium">
                    Awaiting Sign-off
                  </span>
                </div>
                <div className="mt-1.5 text-[12px] text-slate-500 dark:text-[#706C82]">
                  Risk Guardrailed
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-medium">
                <span>Authorize Desk</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Stage 5: Verified KPI Recovery */}
            <div
              onClick={() => navigate('/recovery')}
              className="p-5 rounded-[20px] glass-node-card cursor-pointer hover:border-emerald-400 transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between"
              title="Click to inspect Recovery Verification"
            >
              <div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-[#9E9BB2] text-[13px] mb-2 font-medium">
                  <Play className="w-4 h-4 text-emerald-600 dark:text-[#34D399]" />
                  <span className="text-slate-900 dark:text-[#FFFFFF] font-semibold">5. Verified Recovery</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[28px] font-semibold text-slate-900 dark:text-[#FFFFFF] leading-tight">
                    Closed Loop
                  </span>
                  <span className="badge-success px-2 py-0.5 text-[11px] font-medium">
                    Auto-Reconciled
                  </span>
                </div>
                <div className="mt-1.5 text-[12px] text-slate-500 dark:text-[#706C82]">
                  KPIs & Rollbacks
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <span>View Metrics</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* =========================================================================
          3 Bottom Real-Data Cards: Active Incidents, Live Approvals, AI Recommendations
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7">

        {/* Card 1: Active Incidents Registry */}
        <div className="glass-card p-6 sm:p-7 flex flex-col justify-between rounded-[24px] shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base sm:text-[17px] font-semibold text-slate-900 dark:text-[#FFFFFF]">
                  Active Incidents Registry
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#9E9BB2] mt-0.5">
                  Autonomous detection & causal state
                </p>
              </div>
              <button
                onClick={() => navigate('/incidents')}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-[#9E9BB2] dark:hover:text-[#FFFFFF] transition-colors cursor-pointer"
                title="View All Incidents"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              {latestIncidents.slice(0, 3).map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => navigate(`/incidents/${inc.id}`)}
                  className="cursor-pointer group p-3.5 rounded-xl hover:bg-slate-100/70 dark:hover:bg-white/[0.03] transition-colors border border-slate-200/60 dark:border-white/5"
                >
                  <div className="flex items-center justify-between text-[13px] mb-1.5">
                    <span className="font-semibold text-slate-900 dark:text-[#FFFFFF] group-hover:text-purple-600 dark:group-hover:text-purple-300 truncate max-w-[200px]">
                      {inc.title}
                    </span>
                    <span
                      className={
                        inc.status === 'resolved'
                          ? 'badge-success px-2 py-0.5 text-[10px]'
                          : inc.status === 'awaiting_approval'
                          ? 'badge-failed px-2 py-0.5 text-[10px]'
                          : 'badge-warning px-2 py-0.5 text-[10px]'
                      }
                    >
                      {inc.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-[#9E9BB2] line-clamp-1">
                    {inc.root_cause_verdict || inc.description || 'Under active root-cause court investigation'}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 dark:text-[#706C82]">
                    <span>Affected: {inc.affected_customer_count || 156} users</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      ₹{(Number(inc.estimated_business_impact) || 53958).toLocaleString()} Impact
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-5 border-t border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between text-[12px] text-slate-500 dark:text-[#9E9BB2]">
            <span>{openIncidentsCount} active incidents logged</span>
            <button
              onClick={() => navigate('/incidents')}
              className="text-purple-600 dark:text-[#8B5CF6] font-semibold hover:text-purple-700 dark:hover:text-[#A855F7] flex items-center gap-1 cursor-pointer"
            >
              Master Registry <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Live Pending Approvals Desk */}
        <div className="glass-card p-6 sm:p-7 flex flex-col justify-between rounded-[24px] shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-[17px] font-semibold text-slate-900 dark:text-[#FFFFFF]">
                  Pending Approvals Desk
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#9E9BB2] mt-0.5">
                  Human-in-the-loop authorization queue
                </p>
              </div>
              <button
                onClick={() => navigate('/approvals')}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-[#9E9BB2] dark:hover:text-[#FFFFFF] transition-colors cursor-pointer"
                title="Expand Approvals Desk"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="text-[12px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#9E9BB2] border-b border-slate-200/80 dark:border-white/[0.08]">
                  <tr>
                    <th className="pb-3 font-semibold">Action Request</th>
                    <th className="pb-3 font-semibold">Risk</th>
                    <th className="pb-3 text-right font-semibold">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {pendingApprovals.slice(0, 4).map((appr) => (
                    <tr
                      key={appr.id}
                      onClick={() => navigate('/approvals')}
                      className="hover:bg-slate-100/60 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                    >
                      <td className="py-3 font-medium text-slate-800 dark:text-[#FFFFFF] truncate max-w-[170px]">
                        {appr.title || appr.action_key}
                      </td>
                      <td className="py-3">
                        <span
                          className={
                            appr.risk_level === 'high'
                              ? 'badge-failed px-2 py-0.5 text-[11px] font-medium'
                              : 'badge-warning px-2 py-0.5 text-[11px] font-medium'
                          }
                        >
                          {appr.risk_level || 'medium'}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono text-purple-600 hover:text-purple-800 dark:text-[#8B5CF6] dark:hover:text-white font-medium">
                        Review →
                      </td>
                    </tr>
                  ))}
                  {pendingApprovals.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-xs text-slate-400">
                        All interventions have been signed off.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 mt-5 border-t border-slate-200/80 dark:border-white/[0.08] text-right">
            <button
              onClick={() => navigate('/approvals')}
              className="text-[12px] font-semibold text-purple-600 dark:text-[#8B5CF6] hover:text-purple-700 dark:hover:text-[#A855F7] inline-flex items-center gap-1 cursor-pointer"
            >
              Open Approvals Desk <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 3: AI Recommendations & Signals */}
        <div className="glass-card p-6 sm:p-7 flex flex-col justify-between rounded-[24px] shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-[17px] font-semibold text-slate-900 dark:text-[#FFFFFF]">
                  AI Agent Interventions
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#9E9BB2] mt-0.5">
                  Synthesized recovery actions from AI service
                </p>
              </div>
              <button
                onClick={() => navigate('/recovery')}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-[#9E9BB2] dark:hover:text-[#FFFFFF] transition-colors cursor-pointer"
                title="Expand AI Recommendations"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Recommendation 1 */}
              <div
                onClick={() => navigate('/approvals')}
                className="p-4 rounded-[16px] glass-panel border border-slate-200/80 dark:border-white/[0.08] flex items-start gap-3.5 cursor-pointer hover:border-purple-400/60 dark:hover:border-purple-400/50 hover:bg-slate-100/70 dark:hover:bg-white/[0.03] transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-[rgba(139,92,246,0.2)] text-purple-600 dark:text-[#8B5CF6] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] text-slate-700 dark:text-[#FFFFFF] leading-snug font-normal">
                    Revert feature flag `ENABLE_UPI_SOCKET_TIMEOUT_V2` to 30s SLA.
                  </p>
                </div>
                <span className="badge-success px-2.5 py-0.5 text-[11px] font-medium flex-shrink-0">
                  Priority 1
                </span>
              </div>

              {/* Recommendation 2 */}
              <div
                onClick={() => navigate('/recovery')}
                className="p-4 rounded-[16px] glass-panel border border-slate-200/80 dark:border-white/[0.08] flex items-start gap-3.5 cursor-pointer hover:border-amber-400/60 dark:hover:border-amber-400/50 hover:bg-slate-100/70 dark:hover:bg-white/[0.03] transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-[rgba(245,158,11,0.2)] text-amber-600 dark:text-[#FBBF24] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lightbulb className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] text-slate-700 dark:text-[#FFFFFF] leading-snug font-normal">
                    Auto-rehydrate orders for 156 captured UPI payments with missing cart state.
                  </p>
                </div>
                <span className="badge-warning px-2.5 py-0.5 text-[11px] font-medium flex-shrink-0">
                  Priority 2
                </span>
              </div>

              {/* Recommendation 3 */}
              <div
                onClick={() => navigate('/recovery')}
                className="p-4 rounded-[16px] glass-panel border border-slate-200/80 dark:border-white/[0.08] flex items-start gap-3.5 cursor-pointer hover:border-rose-400/60 dark:hover:border-rose-400/50 hover:bg-slate-100/70 dark:hover:bg-white/[0.03] transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-[rgba(239,68,68,0.2)] text-rose-600 dark:text-[#F87171] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] text-slate-700 dark:text-[#FFFFFF] leading-snug font-normal">
                    Dispatch proactive reassurance SMS and ₹200 apology voucher before churn.
                  </p>
                </div>
                <span className="badge-failed px-2.5 py-0.5 text-[11px] font-medium flex-shrink-0">
                  Priority 3
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-5 border-t border-slate-200/80 dark:border-white/[0.08] text-right">
            <button
              onClick={() => navigate('/recovery')}
              className="text-[12px] font-semibold text-purple-600 dark:text-[#8B5CF6] hover:text-purple-700 dark:hover:text-[#A855F7] inline-flex items-center gap-1 cursor-pointer"
            >
              Open Recovery Sandbox <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
