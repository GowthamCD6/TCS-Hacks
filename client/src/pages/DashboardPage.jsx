import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { incidentsService } from '../services/incidents.service';
import { approvalsService } from '../services/approvals.service';
import {
  RotateCcw,
  TrendingUp,
  Clock,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  User,
  Globe,
  Headphones,
  UserCheck,
  Calendar,
  Play,
  Lightbulb,
} from 'lucide-react';

export const DashboardPage = () => {
  const navigate = useNavigate();

  // Load live incident overview
  const { data: overview } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => incidentsService.getDashboardOverview(),
  });

  // Load pending approvals
  const { data: recommendations = [] } = useQuery({
    queryKey: ['approvals-recommendations'],
    queryFn: () => approvalsService.getRecommendations(),
  });

  // Filter pending approvals
  const pendingApprovals = recommendations.filter((r) => r.approvalStatus === 'pending');

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* =========================================================================
          Top Banner Row: Title on Left, 4 Stat Cards + '+ Create Workflow' Button
          ========================================================================= */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 pt-1">
        {/* Main Title & Subtitle */}
        <div className="space-y-1.5">
          <h1 className="text-3xl sm:text-[34px] font-semibold text-slate-900 dark:text-[#FFFFFF] tracking-tight leading-tight">
            Automation center
          </h1>
          <p className="text-[13px] sm:text-[14px] text-slate-500 dark:text-[#9E9BB2]">
            Monitor workflows, approvals, incidents, and AI recommendations in real time
          </p>
        </div>

        {/* 4 Stat Cards + Button */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Stat 1: Active workflows */}
          <div
            onClick={() => navigate('/feedback')}
            className="px-5 py-4 rounded-[20px] glass-card flex flex-col justify-between min-w-[136px] flex-1 sm:flex-initial cursor-pointer hover:border-purple-400/50 dark:hover:border-white/30 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
            title="View Active Workflows"
          >
            <div className="flex items-center gap-2 text-slate-500 dark:text-[#9E9BB2] text-[13px] font-medium">
              <RotateCcw className="w-3.5 h-3.5 text-purple-600 dark:text-[#8B5CF6]" />
              <span>Active workflows</span>
            </div>
            <div className="text-[32px] sm:text-[34px] font-semibold text-slate-900 dark:text-[#FFFFFF] mt-2 leading-none tracking-tight">
              {overview?.activeWorkflows || 128}
            </div>
          </div>

          {/* Stat 2: Success Rate */}
          <div
            onClick={() => navigate('/recovery')}
            className="px-5 py-4 rounded-[20px] glass-card flex flex-col justify-between min-w-[136px] flex-1 sm:flex-initial cursor-pointer hover:border-emerald-400/50 dark:hover:border-white/30 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
            title="View Recovery SLAs"
          >
            <div className="flex items-center gap-2 text-slate-500 dark:text-[#9E9BB2] text-[13px] font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-[#34D399]" />
              <span>Success Rate</span>
            </div>
            <div className="text-[32px] sm:text-[34px] font-semibold text-emerald-600 dark:text-[#34D399] mt-2 leading-none tracking-tight">
              92%
            </div>
          </div>

          {/* Stat 3: Pending Approvals */}
          <div
            onClick={() => navigate('/approvals')}
            className="px-5 py-4 rounded-[20px] glass-card flex flex-col justify-between min-w-[136px] flex-1 sm:flex-initial cursor-pointer hover:border-amber-400/50 dark:hover:border-white/30 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
            title="Open Approvals Desk"
          >
            <div className="flex items-center gap-2 text-slate-500 dark:text-[#9E9BB2] text-[13px] font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-[#FBBF24]" />
              <span>Pending Approvals</span>
            </div>
            <div className="text-[32px] sm:text-[34px] font-semibold text-amber-600 dark:text-[#FBBF24] mt-2 leading-none tracking-tight">
              {pendingApprovals.length > 0 ? pendingApprovals.length : 18}
            </div>
          </div>

          {/* Stat 4: Failed Tasks */}
          <div
            onClick={() => navigate('/incidents')}
            className="px-5 py-4 rounded-[20px] bg-rose-50/90 border border-rose-200 dark:bg-[rgba(239,68,68,0.2)] dark:border-[rgba(248,113,113,0.3)] backdrop-blur-[16px] flex flex-col justify-between min-w-[136px] flex-1 sm:flex-initial cursor-pointer hover:border-rose-400/80 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
            title="Inspect Critical Incidents"
          >
            <div className="flex items-center gap-2 text-rose-600 dark:text-[#F87171] text-[13px] font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-[#F87171]" />
              <span>Failed Tasks</span>
            </div>
            <div className="text-[32px] sm:text-[34px] font-semibold text-rose-600 dark:text-[#F87171] mt-2 leading-none tracking-tight">
              07
            </div>
          </div>

          {/* Create Workflow Button */}
          <button
            onClick={() => navigate('/ingestion')}
            className="px-5 py-3.5 rounded-[14px] bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] hover:from-[#7C3AED] hover:to-[#5B21B6] text-white font-medium text-[13px] flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_4px_16px_rgba(139,92,246,0.35)] hover:shadow-[0_6px_22px_rgba(139,92,246,0.5)] active:scale-95"
          >
            <Plus className="w-4 h-4 text-white" />
            <span className="text-white">Create Workflow</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          Main Section: AI Workflow Map Container
          ========================================================================= */}
      <div className="glass-card p-6 sm:p-7 md:p-8 space-y-6 rounded-[24px]">
        {/* Section Header + Status Pills */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
            <h2 className="text-lg sm:text-[20px] font-semibold text-slate-900 dark:text-[#FFFFFF] tracking-tight">
              AI Workflow Map
            </h2>
            <span className="text-xs font-medium text-slate-400 dark:text-[#706C82] hidden sm:inline">
              • Real-time Agent State
            </span>
          </div>

          {/* Workflow Status Legend Pills */}
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            <span
              onClick={() => navigate('/recovery')}
              className="badge-success px-3.5 py-1.5 flex items-center gap-1.5 font-medium cursor-pointer transition-transform hover:scale-105"
            >
              <span className="w-2 h-2 rounded-full bg-[#34D399]" />
              Running
            </span>
            <span
              onClick={() => navigate('/recovery')}
              className="badge-success px-3.5 py-1.5 flex items-center gap-1.5 font-medium cursor-pointer transition-transform hover:scale-105"
            >
              <span className="w-2 h-2 rounded-full bg-[#34D399]" />
              Optimized
            </span>
            <span
              onClick={() => navigate('/signals')}
              className="badge-warning px-3.5 py-1.5 flex items-center gap-1.5 font-medium cursor-pointer transition-transform hover:scale-105"
            >
              <span className="w-2 h-2 rounded-full bg-[#FBBF24]" />
              At risk
            </span>
            <span
              onClick={() => navigate('/incidents')}
              className="badge-failed px-3.5 py-1.5 flex items-center gap-1.5 font-medium cursor-pointer transition-transform hover:scale-105"
            >
              <span className="w-2 h-2 rounded-full bg-[#F87171]" />
              Delayed
            </span>
          </div>
        </div>

        {/* Horizontal Pipeline of 6 Interactive Connected Glass Nodes */}
        {/* Generous pt-24 ensures the popover priority stack has ample headroom and never overlaps */}
        <div className="overflow-x-auto pt-24 pb-6 px-2 scrollbar-none">
          <div className="min-w-[1060px] flex items-center justify-between gap-4 relative py-6">
            
            {/* SVG Connecting Track Line */}
            <svg
              className="absolute top-1/2 left-0 w-full h-10 -translate-y-1/2 pointer-events-none z-0"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line
                x1="40"
                y1="20"
                x2="1020"
                y2="20"
                className="stroke-purple-400/40 dark:stroke-purple-500/30"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            </svg>

            {/* Node 1: New Request */}
            <div
              onClick={() => navigate('/feedback')}
              className="w-44 p-4.5 rounded-[18px] glass-node-card relative z-10 cursor-pointer hover:border-purple-400 transition-all hover:scale-[1.02] shadow-sm"
              title="Click to view raw requests in Inbox"
            >
              <div className="flex items-center gap-2 text-slate-500 dark:text-[#9E9BB2] text-[13px] mb-2 font-medium">
                <User className="w-3.5 h-3.5 text-purple-600 dark:text-[#8B5CF6]" />
                <span className="text-slate-900 dark:text-[#FFFFFF]">New Request</span>
              </div>
              <div className="text-[32px] font-semibold text-slate-900 dark:text-[#FFFFFF] leading-tight">
                24
              </div>
              <div className="text-[12px] text-slate-500 dark:text-[#706C82] mt-1.5">
                incoming feed
              </div>
            </div>

            {/* Node 2: AI Classification */}
            <div
              onClick={() => navigate('/feedback')}
              className="w-48 p-4.5 rounded-[18px] glass-node-card relative z-10 cursor-pointer hover:border-teal-400 transition-all hover:scale-[1.02] shadow-sm"
              title="Click to view NLP classified feedback"
            >
              <div className="flex items-center gap-2 text-slate-500 dark:text-[#9E9BB2] text-[13px] mb-2 font-medium">
                <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-[#34D399]" />
                <span className="text-slate-900 dark:text-[#FFFFFF]">AI Classification</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[32px] font-semibold text-slate-900 dark:text-[#FFFFFF] leading-tight">
                  22
                </span>
                <span className="badge-success px-2 py-0.5 text-[11px] font-medium">
                  Optimized
                </span>
              </div>
              <div className="mt-1.5 text-[12px] text-slate-500 dark:text-[#706C82]">
                Auto-sorted NLP
              </div>
            </div>

            {/* Node 3: Risk Detection (Interactive Link to Root Cause Court) */}
            <div
              onClick={() => navigate('/incidents/INC-2026-084')}
              className="w-56 p-4.5 rounded-[18px] glass-node-active relative z-20 cursor-pointer hover:scale-[1.03] transition-all shadow-md"
              title="Click to enter Root Cause Court for INC-2026-084"
            >
              {/* Top Popover Priority Stack with proper contrast and border */}
              <div className="absolute -top-[82px] left-3 w-48 p-3 rounded-[14px] glass-panel border border-slate-200/90 dark:border-white/[0.12] space-y-1.5 text-[11px] font-medium pointer-events-none shadow-xl bg-white/95 dark:bg-[#120d24]/95">
                <div className="flex items-center justify-between text-rose-600 dark:text-[#F87171] font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> High priority
                  </span>
                  <span className="font-mono text-xs">04</span>
                </div>
                <div className="flex items-center justify-between text-amber-600 dark:text-[#FBBF24]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Medium priority
                  </span>
                  <span className="font-mono text-xs">09</span>
                </div>
                <div className="flex items-center justify-between text-emerald-600 dark:text-[#34D399]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Low priority
                  </span>
                  <span className="font-mono text-xs">05</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-purple-700 dark:text-[#C4B5FD] text-[13px] mb-2 font-medium">
                <Headphones className="w-3.5 h-3.5 text-purple-600 dark:text-[#A855F7]" />
                <span className="text-slate-900 dark:text-[#FFFFFF] font-semibold">Risk detection</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[32px] font-bold text-slate-900 dark:text-[#FFFFFF] leading-tight">
                  18
                </span>
                <span className="text-[12px] font-medium text-purple-600 dark:text-[#A8A3BA]">
                  Root Cause Court
                </span>
              </div>
              <div className="mt-2">
                <span className="badge-success px-2.5 py-0.5 text-[11px] font-medium">
                  Running • INC-2026-084
                </span>
              </div>
            </div>

            {/* Node 4: Human follow-up */}
            <div
              onClick={() => navigate('/approvals')}
              className="w-48 p-4.5 rounded-[18px] glass-node-card relative z-10 cursor-pointer hover:border-amber-400 transition-all hover:scale-[1.02] shadow-sm"
              title="Click to review actions awaiting approval"
            >
              <div className="flex items-center gap-2 text-slate-500 dark:text-[#9E9BB2] text-[13px] mb-2 font-medium">
                <UserCheck className="w-3.5 h-3.5 text-amber-600 dark:text-[#FBBF24]" />
                <span className="text-slate-900 dark:text-[#FFFFFF]">Human follow-up</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[32px] font-semibold text-slate-900 dark:text-[#FFFFFF] leading-tight">
                  08
                </span>
                <span className="text-[12px] font-medium text-amber-600 dark:text-[#FBBF24]">
                  5 awaiting
                </span>
              </div>
              <div className="mt-2">
                <span className="badge-warning px-2.5 py-0.5 text-[11px] font-medium">
                  At risk
                </span>
              </div>
            </div>

            {/* Node 5: Scheduling */}
            <div
              onClick={() => navigate('/recovery')}
              className="w-44 p-4.5 rounded-[18px] glass-node-card relative z-10 cursor-pointer hover:border-rose-400 transition-all hover:scale-[1.02] shadow-sm"
              title="Click to inspect throttled execution queue"
            >
              <div className="flex items-center gap-2 text-slate-500 dark:text-[#9E9BB2] text-[13px] mb-2 font-medium">
                <Calendar className="w-3.5 h-3.5 text-rose-600 dark:text-[#F87171]" />
                <span className="text-slate-900 dark:text-[#FFFFFF]">Scheduling</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[32px] font-semibold text-slate-900 dark:text-[#FFFFFF] leading-tight">
                  06
                </span>
                <span className="text-[12px] font-medium text-rose-600 dark:text-[#F87171]">
                  3 blocked
                </span>
              </div>
              <div className="mt-2">
                <span className="badge-failed px-2.5 py-0.5 text-[11px] font-medium">
                  Delayed
                </span>
              </div>
            </div>

            {/* Node 6: Execution */}
            <div
              onClick={() => navigate('/recovery')}
              className="w-44 p-4.5 rounded-[18px] glass-node-card relative z-10 cursor-pointer hover:border-emerald-400 transition-all hover:scale-[1.02] shadow-sm"
              title="Click to view simulated sandbox executions"
            >
              <div className="flex items-center gap-2 text-slate-500 dark:text-[#9E9BB2] text-[13px] mb-2 font-medium">
                <Play className="w-3.5 h-3.5 text-emerald-600 dark:text-[#34D399]" />
                <span className="text-slate-900 dark:text-[#FFFFFF]">Execution</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[32px] font-semibold text-slate-900 dark:text-[#FFFFFF] leading-tight">
                  12
                </span>
                <span className="text-[12px] text-slate-500 dark:text-[#706C82]">
                  in progress
                </span>
              </div>
              <div className="mt-2">
                <span className="badge-success px-2.5 py-0.5 text-[11px] font-medium">
                  Running
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* =========================================================================
          3 Bottom Cards Grid: Spaced & Padded for Clean Symmetry
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7">

        {/* Card 1: Active Workflow */}
        <div className="glass-card p-6 sm:p-7 flex flex-col justify-between rounded-[24px] shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base sm:text-[17px] font-semibold text-slate-900 dark:text-[#FFFFFF]">
                  Active Workflow
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#9E9BB2] mt-0.5">
                  Real-time recovery execution progress
                </p>
              </div>
              <button
                onClick={() => navigate('/incidents')}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-[#9E9BB2] dark:hover:text-[#FFFFFF] transition-colors cursor-pointer"
                title="Expand and inspect incidents"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Item 1 */}
              <div
                onClick={() => navigate('/recovery')}
                className="cursor-pointer group p-3 rounded-xl hover:bg-slate-100/70 dark:hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center justify-between text-[13px] mb-2">
                  <span className="text-slate-800 dark:text-[#FFFFFF] font-medium group-hover:text-purple-600 dark:group-hover:text-purple-300">
                    Customer onboarding
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="badge-success px-2.5 py-0.5 text-[11px] font-medium">Running</span>
                    <span className="font-mono text-slate-500 dark:text-[#9E9BB2] text-[12px] font-semibold">60%</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-black/40 overflow-hidden border border-slate-200/60 dark:border-white/5">
                  <div className="h-full rounded-full bg-[#34D399] w-[60%]" />
                </div>
              </div>

              {/* Item 2 */}
              <div
                onClick={() => navigate('/recovery')}
                className="cursor-pointer group p-3 rounded-xl hover:bg-slate-100/70 dark:hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center justify-between text-[13px] mb-2">
                  <span className="text-slate-800 dark:text-[#FFFFFF] font-medium group-hover:text-purple-600 dark:group-hover:text-purple-300">
                    Invoice generation
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="badge-success px-2.5 py-0.5 text-[11px] font-medium">Running</span>
                    <span className="font-mono text-slate-500 dark:text-[#9E9BB2] text-[12px] font-semibold">42%</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-black/40 overflow-hidden border border-slate-200/60 dark:border-white/5">
                  <div className="h-full rounded-full bg-[#34D399] w-[42%]" />
                </div>
              </div>

              {/* Item 3 */}
              <div
                onClick={() => navigate('/incidents/INC-2026-084')}
                className="cursor-pointer group p-3 rounded-xl hover:bg-slate-100/70 dark:hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center justify-between text-[13px] mb-2">
                  <span className="text-slate-800 dark:text-[#FFFFFF] font-medium group-hover:text-rose-600 dark:group-hover:text-rose-300">
                    Support ticket routing
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="badge-failed px-2.5 py-0.5 text-[11px] font-medium">Warning</span>
                    <span className="font-mono text-slate-500 dark:text-[#9E9BB2] text-[12px] font-semibold">80%</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-black/40 overflow-hidden border border-slate-200/60 dark:border-white/5">
                  <div className="h-full rounded-full bg-[#F87171] w-[80%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-5 border-t border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between text-[12px] text-slate-500 dark:text-[#9E9BB2]">
            <span>Plant: App v2.3 UPI Break</span>
            <button
              onClick={() => navigate('/incidents/INC-2026-084')}
              className="text-purple-600 dark:text-[#8B5CF6] font-semibold hover:text-purple-700 dark:hover:text-[#A855F7] flex items-center gap-1 cursor-pointer"
            >
              Inspect Case <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Pending approvals (Functional with direct approval action) */}
        <div className="glass-card p-6 sm:p-7 flex flex-col justify-between rounded-[24px] shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-[17px] font-semibold text-slate-900 dark:text-[#FFFFFF]">
                  Pending approvals
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#9E9BB2] mt-0.5">
                  Interventions requiring human authorization
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
                    <th className="pb-3 font-semibold">Request</th>
                    <th className="pb-3 font-semibold">Department</th>
                    <th className="pb-3 font-semibold">Owner</th>
                    <th className="pb-3 font-semibold">Risk</th>
                    <th className="pb-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {pendingApprovals.slice(0, 4).map((rec) => (
                    <tr
                      key={rec.id}
                      onClick={() => navigate('/approvals')}
                      className="hover:bg-slate-100/60 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                    >
                      <td className="py-3 font-medium text-slate-800 dark:text-[#FFFFFF] truncate max-w-[120px]">
                        {rec.title}
                      </td>
                      <td className="py-3 text-slate-500 dark:text-[#9E9BB2]">
                        {rec.targetDepartment || 'Operations'}
                      </td>
                      <td className="py-3 text-slate-500 dark:text-[#9E9BB2]">Liam A.</td>
                      <td className="py-3">
                        <span
                          className={
                            rec.riskLevel === 'high'
                              ? 'badge-failed px-2 py-0.5 text-[11px] font-medium'
                              : 'badge-warning px-2 py-0.5 text-[11px] font-medium'
                          }
                        >
                          {rec.riskLevel}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono text-purple-600 hover:text-purple-800 dark:text-[#8B5CF6] dark:hover:text-white font-medium">
                        Review →
                      </td>
                    </tr>
                  ))}
                  {pendingApprovals.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-xs text-slate-400">
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

        {/* Card 3: AI recommendations (Clickable directly to incident court / recovery) */}
        <div className="glass-card p-6 sm:p-7 flex flex-col justify-between rounded-[24px] shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-[17px] font-semibold text-slate-900 dark:text-[#FFFFFF]">
                  AI recommendations
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#9E9BB2] mt-0.5">
                  Autonomous recovery suggestions
                </p>
              </div>
              <button
                onClick={() => navigate('/incidents/INC-2026-084')}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-[#9E9BB2] dark:hover:text-[#FFFFFF] transition-colors cursor-pointer"
                title="Expand AI Recommendations"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Alert 1 */}
              <div
                onClick={() => navigate('/incidents/INC-2026-084')}
                className="p-4 rounded-[16px] glass-panel border border-slate-200/80 dark:border-white/[0.08] flex items-start gap-3.5 cursor-pointer hover:border-rose-400/60 dark:hover:border-rose-400/50 hover:bg-slate-100/70 dark:hover:bg-white/[0.03] transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-[rgba(239,68,68,0.2)] text-rose-600 dark:text-[#F87171] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] text-slate-700 dark:text-[#FFFFFF] leading-snug font-normal">
                    Billing workflow is taking 24% longer than usual on Android 14 UPI gateways.
                  </p>
                </div>
                <span className="badge-failed px-2.5 py-0.5 text-[11px] font-medium flex-shrink-0">
                  High
                </span>
              </div>

              {/* Alert 2 */}
              <div
                onClick={() => navigate('/approvals')}
                className="p-4 rounded-[16px] glass-panel border border-slate-200/80 dark:border-white/[0.08] flex items-start gap-3.5 cursor-pointer hover:border-amber-400/60 dark:hover:border-amber-400/50 hover:bg-slate-100/70 dark:hover:bg-white/[0.03] transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-[rgba(245,158,11,0.2)] text-amber-600 dark:text-[#FBBF24] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lightbulb className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] text-slate-700 dark:text-[#FFFFFF] leading-snug font-normal">
                    12 support tickets can be auto-routed to priority reimbursement queue.
                  </p>
                </div>
                <span className="badge-warning px-2.5 py-0.5 text-[11px] font-medium flex-shrink-0">
                  Medium
                </span>
              </div>

              {/* Alert 3 */}
              <div
                onClick={() => navigate('/recovery')}
                className="p-4 rounded-[16px] glass-panel border border-slate-200/80 dark:border-white/[0.08] flex items-start gap-3.5 cursor-pointer hover:border-purple-400/60 dark:hover:border-purple-400/50 hover:bg-slate-100/70 dark:hover:bg-white/[0.03] transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-[rgba(139,92,246,0.2)] text-purple-600 dark:text-[#8B5CF6] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] text-slate-700 dark:text-[#FFFFFF] leading-snug font-normal">
                    Document validation flow has repeat errors in step 3 (rollback recommended).
                  </p>
                </div>
                <span className="badge-retried px-2.5 py-0.5 text-[11px] font-medium flex-shrink-0">
                  Low
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
