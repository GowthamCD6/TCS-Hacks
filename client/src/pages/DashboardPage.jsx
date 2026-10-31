import React, { useState } from 'react';
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
  CheckCircle2,
} from 'lucide-react';

export const DashboardPage = () => {
  const navigate = useNavigate();

  // Load live incident overview
  const { data: overview, isLoading } = useQuery({
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Row: Title on Left, 4 Stat Cards + '+ Create Workflow' Button on Right */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 pt-1">
        {/* Main Title: 32px – 36px | Semi-bold (600) */}
        <div className="space-y-1">
          <h1 className="text-[34px] font-semibold text-[#FFFFFF] tracking-tight leading-tight">
            Automation center
          </h1>
          <p className="text-[13px] text-[#9E9BB2]">
            Monitor workflows, approvals, incidents and AI recommendations in real time
          </p>
        </div>

        {/* 4 Stat Cards + Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Stat 1: Active workflows */}
          <div
            onClick={() => navigate('/feedback')}
            className="px-5 py-3.5 rounded-[18px] glass-card flex flex-col justify-between min-w-[125px] cursor-pointer hover:border-white/30 transition-all"
            title="View Active Workflows"
          >
            <div className="flex items-center gap-1.5 text-[#9E9BB2] text-[14px] font-medium">
              <RotateCcw className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Active workflows</span>
            </div>
            <div className="text-[34px] font-semibold text-[#FFFFFF] mt-1 leading-none">128</div>
          </div>

          {/* Stat 2: Success Rate */}
          <div
            onClick={() => navigate('/recovery')}
            className="px-5 py-3.5 rounded-[18px] glass-card flex flex-col justify-between min-w-[125px] cursor-pointer hover:border-white/30 transition-all"
            title="View Recovery SLAs"
          >
            <div className="flex items-center gap-1.5 text-[#9E9BB2] text-[14px] font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-[#34D399]" />
              <span>Success Rate</span>
            </div>
            <div className="text-[34px] font-semibold text-[#34D399] mt-1 leading-none">92%</div>
          </div>

          {/* Stat 3: Pending Approvals */}
          <div
            onClick={() => navigate('/approvals')}
            className="px-5 py-3.5 rounded-[18px] glass-card flex flex-col justify-between min-w-[125px] cursor-pointer hover:border-white/30 transition-all"
            title="Open Approvals Desk"
          >
            <div className="flex items-center gap-1.5 text-[#9E9BB2] text-[14px] font-medium">
              <Clock className="w-3.5 h-3.5 text-[#FBBF24]" />
              <span>Pending Approvals</span>
            </div>
            <div className="text-[34px] font-semibold text-[#FBBF24] mt-1 leading-none">
              {pendingApprovals.length > 0 ? pendingApprovals.length : 18}
            </div>
          </div>

          {/* Stat 4: Failed Tasks */}
          <div
            onClick={() => navigate('/incidents')}
            className="px-5 py-3.5 rounded-[18px] bg-[rgba(239,68,68,0.2)] border border-[rgba(248,113,113,0.3)] backdrop-blur-[16px] flex flex-col justify-between min-w-[125px] cursor-pointer hover:border-rose-400 transition-all"
            title="Inspect Critical Incidents"
          >
            <div className="flex items-center gap-1.5 text-[#F87171] text-[14px] font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-[#F87171]" />
              <span>Failed Tasks</span>
            </div>
            <div className="text-[34px] font-semibold text-[#F87171] mt-1 leading-none">07</div>
          </div>

          {/* Create Workflow Button */}
          <button
            onClick={() => navigate('/ingestion')}
            className="px-5 py-3 rounded-[12px] bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] hover:from-[#7C3AED] hover:to-[#5B21B6] text-white font-medium text-[13px] flex items-center gap-2 cursor-pointer transition-all shadow-[0_0_16px_rgba(139,92,246,0.35)]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Workflow</span>
          </button>
        </div>
      </div>

      {/* Main Section: AI Workflow Map Container */}
      <div className="glass-card space-y-6">
        {/* Section Header + Status Pills */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-[20px] font-medium text-[#FFFFFF] tracking-tight">AI Workflow Map</h2>

          {/* Workflow Status Legend Pills */}
          <div className="flex items-center gap-2 text-[12px]">
            <span
              onClick={() => navigate('/recovery')}
              className="badge-success px-3.5 py-1 flex items-center gap-1.5 font-medium cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#34D399]" />
              Running
            </span>
            <span
              onClick={() => navigate('/recovery')}
              className="badge-success px-3.5 py-1 flex items-center gap-1.5 font-medium cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#34D399]" />
              Optimized
            </span>
            <span
              onClick={() => navigate('/signals')}
              className="badge-warning px-3.5 py-1 flex items-center gap-1.5 font-medium cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#FBBF24]" />
              At risk
            </span>
            <span
              onClick={() => navigate('/incidents')}
              className="badge-failed px-3.5 py-1 flex items-center gap-1.5 font-medium cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#F87171]" />
              Delayed
            </span>
          </div>
        </div>

        {/* Horizontal Pipeline of 6 Interactive Connected Glass Nodes */}
        <div className="overflow-x-auto pb-4 scrollbar-none">
          <div className="min-w-[1040px] flex items-center justify-between gap-3 relative py-6">
            
            {/* SVG Connecting Track Line */}
            <svg
              className="absolute top-1/2 left-0 w-full h-10 -translate-y-1/2 pointer-events-none z-0"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line
                x1="40"
                y1="20"
                x2="1000"
                y2="20"
                stroke="rgba(139, 92, 246, 0.3)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            </svg>

            {/* Node 1: New Request */}
            <div
              onClick={() => navigate('/feedback')}
              className="w-44 p-4 rounded-[16px] glass-node-card relative z-10 cursor-pointer hover:border-purple-400"
              title="Click to view raw requests in Inbox"
            >
              <div className="flex items-center gap-2 text-[#9E9BB2] text-[13px] mb-2 font-medium">
                <User className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span className="text-[#FFFFFF]">New Request</span>
              </div>
              <div className="text-[32px] font-semibold text-[#FFFFFF] leading-tight">24</div>
              <div className="text-[12px] text-[#706C82] mt-1">incoming feed</div>
            </div>

            {/* Node 2: AI Classification */}
            <div
              onClick={() => navigate('/feedback')}
              className="w-48 p-4 rounded-[16px] glass-node-card relative z-10 cursor-pointer hover:border-teal-400"
              title="Click to view NLP classified feedback"
            >
              <div className="flex items-center gap-2 text-[#9E9BB2] text-[13px] mb-2 font-medium">
                <Globe className="w-3.5 h-3.5 text-[#34D399]" />
                <span className="text-[#FFFFFF]">AI Classification</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[32px] font-semibold text-[#FFFFFF] leading-tight">22</span>
                <span className="badge-success px-2 py-0.5 text-[11px] font-medium">
                  Optimized
                </span>
              </div>
              <div className="mt-2 text-[12px] text-[#706C82]">Auto-sorted NLP</div>
            </div>

            {/* Node 3: Risk Detection (Interactive Link to Root Cause Court) */}
            <div
              onClick={() => navigate('/incidents/INC-2026-084')}
              className="w-56 p-4 rounded-[16px] glass-node-active relative z-20 cursor-pointer hover:scale-[1.02] transition-transform"
              title="Click to enter Root Cause Court for INC-2026-084"
            >
              {/* Top Popover Priority Stack */}
              <div className="absolute -top-20 left-4 w-44 p-2.5 rounded-[12px] glass-panel border border-white/[0.12] space-y-1 text-[11px] font-medium pointer-events-none shadow-xl">
                <div className="flex items-center text-[#F87171] gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F87171]" /> High priority (04)
                </div>
                <div className="flex items-center text-[#FBBF24] gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FBBF24]" /> Medium priority (09)
                </div>
                <div className="flex items-center text-[#34D399] gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" /> Low priority (05)
                </div>
              </div>

              <div className="flex items-center gap-2 text-[#C4B5FD] text-[13px] mb-2 font-medium">
                <Headphones className="w-3.5 h-3.5 text-[#A855F7]" />
                <span className="text-[#FFFFFF]">Risk detection</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[32px] font-semibold text-[#FFFFFF] leading-tight">18</span>
                <span className="text-[12px] text-[#A8A3BA]">Root Cause Court</span>
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
              className="w-48 p-4 rounded-[16px] glass-node-card relative z-10 cursor-pointer hover:border-amber-400"
              title="Click to review actions awaiting approval"
            >
              <div className="flex items-center gap-2 text-[#9E9BB2] text-[13px] mb-2 font-medium">
                <UserCheck className="w-3.5 h-3.5 text-[#FBBF24]" />
                <span className="text-[#FFFFFF]">Human follow-up</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[32px] font-semibold text-[#FFFFFF] leading-tight">08</span>
                <span className="text-[12px] text-[#FBBF24]">5 awaiting</span>
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
              className="w-44 p-4 rounded-[16px] glass-node-card relative z-10 cursor-pointer hover:border-rose-400"
              title="Click to inspect throttled execution queue"
            >
              <div className="flex items-center gap-2 text-[#9E9BB2] text-[13px] mb-2 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#F87171]" />
                <span className="text-[#FFFFFF]">Scheduling</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[32px] font-semibold text-[#FFFFFF] leading-tight">06</span>
                <span className="text-[12px] text-[#F87171]">3 blocked</span>
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
              className="w-44 p-4 rounded-[16px] glass-node-card relative z-10 cursor-pointer hover:border-emerald-400"
              title="Click to view simulated sandbox executions"
            >
              <div className="flex items-center gap-2 text-[#9E9BB2] text-[13px] mb-2 font-medium">
                <Play className="w-3.5 h-3.5 text-[#34D399]" />
                <span className="text-[#FFFFFF]">Execution</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[32px] font-semibold text-[#FFFFFF] leading-tight">12</span>
                <span className="text-[12px] text-[#706C82]">in progress</span>
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

      {/* 3 Bottom Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Card 1: Active Workflow */}
        <div className="glass-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-medium text-[#FFFFFF]">Active Workflow</h3>
              <button
                onClick={() => navigate('/incidents')}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#9E9BB2] hover:text-[#FFFFFF] transition-colors cursor-pointer"
                title="Expand"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Item 1 */}
              <div
                onClick={() => navigate('/recovery')}
                className="cursor-pointer group p-1.5 rounded-xl hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center justify-between text-[13px] mb-1.5">
                  <span className="text-[#FFFFFF] font-normal group-hover:text-purple-300">Customer onboarding</span>
                  <div className="flex items-center gap-2">
                    <span className="badge-success px-2.5 py-0.5 text-[11px]">Running</span>
                    <span className="font-mono text-[#9E9BB2] text-[12px]">60%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                  <div className="h-full rounded-full bg-[#34D399] w-[60%]" />
                </div>
              </div>

              {/* Item 2 */}
              <div
                onClick={() => navigate('/recovery')}
                className="cursor-pointer group p-1.5 rounded-xl hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center justify-between text-[13px] mb-1.5">
                  <span className="text-[#FFFFFF] font-normal group-hover:text-purple-300">Invoice generation</span>
                  <div className="flex items-center gap-2">
                    <span className="badge-success px-2.5 py-0.5 text-[11px]">Running</span>
                    <span className="font-mono text-[#9E9BB2] text-[12px]">42%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                  <div className="h-full rounded-full bg-[#34D399] w-[42%]" />
                </div>
              </div>

              {/* Item 3 */}
              <div
                onClick={() => navigate('/incidents/INC-2026-084')}
                className="cursor-pointer group p-1.5 rounded-xl hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center justify-between text-[13px] mb-1.5">
                  <span className="text-[#FFFFFF] font-normal group-hover:text-rose-300">Support ticket routing</span>
                  <div className="flex items-center gap-2">
                    <span className="badge-failed px-2.5 py-0.5 text-[11px]">Warning</span>
                    <span className="font-mono text-[#9E9BB2] text-[12px]">80%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                  <div className="h-full rounded-full bg-[#F87171] w-[80%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/[0.08] flex items-center justify-between text-[12px] text-[#9E9BB2]">
            <span>Plant: App v2.3 UPI Break</span>
            <button
              onClick={() => navigate('/incidents/INC-2026-084')}
              className="text-[#8B5CF6] font-medium hover:text-[#A855F7] flex items-center gap-1 cursor-pointer"
            >
              Inspect Case <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Pending approvals (Functional with direct approval action) */}
        <div className="glass-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-medium text-[#FFFFFF]">Pending approvals</h3>
              <button
                onClick={() => navigate('/approvals')}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#9E9BB2] hover:text-[#FFFFFF] transition-colors cursor-pointer"
                title="Expand"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="text-[12px] text-[#9E9BB2] border-b border-white/[0.08]">
                  <tr>
                    <th className="pb-2">Request</th>
                    <th className="pb-2">Department</th>
                    <th className="pb-2">Owner</th>
                    <th className="pb-2">Risk</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {pendingApprovals.slice(0, 4).map((rec) => (
                    <tr
                      key={rec.id}
                      onClick={() => navigate('/approvals')}
                      className="hover:bg-white/[0.02] cursor-pointer"
                    >
                      <td className="py-2.5 font-normal text-[#FFFFFF] truncate max-w-[120px]">
                        {rec.title}
                      </td>
                      <td className="py-2.5 text-[#9E9BB2]">
                        {rec.targetDepartment || 'Operations'}
                      </td>
                      <td className="py-2.5 text-[#9E9BB2]">Liam Anderson</td>
                      <td className="py-2.5">
                        <span
                          className={
                            rec.riskLevel === 'high'
                              ? 'badge-failed px-2 py-0.5 text-[11px]'
                              : 'badge-warning px-2 py-0.5 text-[11px]'
                          }
                        >
                          {rec.riskLevel}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono text-[#8B5CF6] hover:text-white">
                        Review →
                      </td>
                    </tr>
                  ))}
                  {pendingApprovals.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-xs text-slate-400">
                        All interventions have been signed off.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.08] text-right">
            <button
              onClick={() => navigate('/approvals')}
              className="text-[12px] font-medium text-[#8B5CF6] hover:text-[#A855F7] inline-flex items-center gap-1 cursor-pointer"
            >
              Open Approvals Desk <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 3: AI recommendations (Clickable directly to incident court / recovery) */}
        <div className="glass-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-medium text-[#FFFFFF]">AI recommendations</h3>
              <button
                onClick={() => navigate('/incidents/INC-2026-084')}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#9E9BB2] hover:text-[#FFFFFF] transition-colors cursor-pointer"
                title="Expand"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Alert 1 */}
              <div
                onClick={() => navigate('/incidents/INC-2026-084')}
                className="p-3.5 rounded-[12px] glass-panel border border-white/[0.08] flex items-start gap-3 cursor-pointer hover:border-rose-400/50 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-[rgba(239,68,68,0.2)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-3 h-3 text-[#F87171]" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] text-[#FFFFFF] leading-snug">
                    Billing workflow is taking 24% longer than usual on Android 14 UPI gateways.
                  </p>
                </div>
                <span className="badge-failed px-2.5 py-0.5 text-[11px] font-medium">
                  High
                </span>
              </div>

              {/* Alert 2 */}
              <div
                onClick={() => navigate('/approvals')}
                className="p-3.5 rounded-[12px] glass-panel border border-white/[0.08] flex items-start gap-3 cursor-pointer hover:border-amber-400/50 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-[rgba(245,158,11,0.2)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lightbulb className="w-3 h-3 text-[#FBBF24]" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] text-[#FFFFFF] leading-snug">
                    12 support tickets can be auto-routed to priority reimbursement queue.
                  </p>
                </div>
                <span className="badge-warning px-2.5 py-0.5 text-[11px] font-medium">
                  Medium
                </span>
              </div>

              {/* Alert 3 */}
              <div
                onClick={() => navigate('/recovery')}
                className="p-3.5 rounded-[12px] glass-panel border border-white/[0.08] flex items-start gap-3 cursor-pointer hover:border-purple-400/50 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-[rgba(139,92,246,0.2)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <RotateCcw className="w-3 h-3 text-[#8B5CF6]" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] text-[#FFFFFF] leading-snug">
                    Document validation flow has repeat errors in step 3 (rollback recommended).
                  </p>
                </div>
                <span className="badge-retried px-2.5 py-0.5 text-[11px] font-medium">
                  Low
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.08] text-right">
            <button
              onClick={() => navigate('/recovery')}
              className="text-[12px] font-medium text-[#8B5CF6] hover:text-[#A855F7] inline-flex items-center gap-1 cursor-pointer"
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
