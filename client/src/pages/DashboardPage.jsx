import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { formatCurrency, formatPercent } from '../utils/formatters';
import {
  Search,
  Sparkles,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Maximize2,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Bell,
  User,
  ChevronDown,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('Today');
  const [activeWorkflowTab, setActiveWorkflowTab] = useState('overview');

  return (
    <div className="space-y-6 relative animate-in fade-in duration-300">
      {/* Top Floating Aurora Glow Header / Action Bar */}
      <div className="relative overflow-hidden rounded-3xl bg-[#110b22]/90 border border-white/10 p-6 md:p-8 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        {/* Visual Aurora Light Beam */}
        <div className="absolute top-0 left-1/4 w-96 h-48 bg-gradient-to-b from-purple-500/25 via-fuchsia-500/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Autonomous Recovery Operations Active
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Automation center
            </h1>
            <p className="text-sm text-slate-300/80 max-w-xl">
              Monitor workflows, appraisals, incidents and AI recommendations in real time
            </p>
          </div>

          {/* Time range pills & Stats pills matching reference */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Time Filter Pills */}
            <div className="flex items-center bg-[#170e30] p-1 rounded-2xl border border-white/10 text-xs">
              {['Today', '7 Days', '30 Days'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeRange(t)}
                  className={`px-4 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                    timeRange === t
                      ? 'bg-purple-600/60 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)] border border-purple-400/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Top Quick Stats Pill Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="px-3.5 py-2 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md min-w-[95px]">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-mono">
                  <Layers className="w-3 h-3 text-purple-400" />
                  <span>Workflows</span>
                </div>
                <div className="text-xl font-bold text-white mt-0.5">128</div>
              </div>

              <div className="px-3.5 py-2 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md min-w-[95px]">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-mono">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span>Success</span>
                </div>
                <div className="text-xl font-bold text-emerald-400 mt-0.5">92%</div>
              </div>

              <div className="px-3.5 py-2 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md min-w-[95px]">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-mono">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Pending</span>
                </div>
                <div className="text-xl font-bold text-amber-300 mt-0.5">18</div>
              </div>

              <div className="px-3.5 py-2 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md min-w-[95px]">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-mono">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  <span>Failed</span>
                </div>
                <div className="text-xl font-bold text-rose-400 mt-0.5">07</div>
              </div>
            </div>

            {/* Create Workflow Button */}
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/ingestion')}
              className="gap-2 shadow-[0_0_20px_rgba(168,85,247,0.35)]"
            >
              <Plus className="w-4 h-4" />
              <span>Create Workflow</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Visual Section: AI Workflow Map (100% Matching Screenshot Flow) */}
      <div className="relative rounded-3xl bg-[#0f091f]/95 border border-purple-500/20 p-6 md:p-8 backdrop-blur-2xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        {/* Background cosmic nebula styling */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/15 via-[#0f091f]/40 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">AI Workflow Map</h2>
            <p className="text-xs text-slate-400">Continuous autonomic ingestion, causal inference, and remediation chain</p>
          </div>

          {/* Workflow Status Legend */}
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              Running
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf]" />
              Optimized
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
              At risk
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
              Delayed
            </span>
          </div>
        </div>

        {/* Horizontal Visual Pipeline Cards connected by SVG curved lines */}
        <div className="relative z-10 py-6 overflow-x-auto scrollbar-none">
          <div className="min-w-[980px] flex items-center justify-between gap-4 relative">
            
            {/* Stage 1: New Request */}
            <div className="w-44 p-4 rounded-2xl bg-gradient-to-b from-purple-800/30 to-[#1e133c]/80 border border-purple-500/30 backdrop-blur-xl relative shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-medium text-slate-300">New Request</span>
                <span className="w-2 h-2 rounded-full bg-purple-400" />
              </div>
              <div className="text-2xl font-black text-white">24</div>
              <div className="text-[10px] text-purple-300/80 font-mono mt-1">incoming feed</div>
            </div>

            <div className="text-purple-500/60 font-mono">──▶</div>

            {/* Stage 2: AI Classification */}
            <div className="w-48 p-4 rounded-2xl bg-gradient-to-b from-purple-800/30 to-[#1e133c]/80 border border-teal-500/30 backdrop-blur-xl relative shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-medium text-slate-300">AI Classification</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Optimized
                </span>
              </div>
              <div className="text-2xl font-black text-white">22</div>
              <div className="text-[10px] text-teal-300/80 font-mono mt-1">Auto-sorted NLP</div>
            </div>

            <div className="text-purple-500/60 font-mono">──▶</div>

            {/* Stage 3: Risk Detection (Highlighted purple glow) */}
            <div className="w-52 p-4 rounded-2xl bg-gradient-to-b from-purple-600/40 to-indigo-900/60 border border-purple-400/60 backdrop-blur-xl relative shadow-[0_0_30px_rgba(168,85,247,0.3)]">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-medium text-purple-200">Risk detection</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Running
                </span>
              </div>
              <div className="text-2xl font-black text-white">18</div>
              <div className="text-[10px] text-purple-200 font-mono mt-1">Root Cause Court</div>

              {/* Popover Mini Tag Stack matching screenshot */}
              <div className="mt-2.5 pt-2 border-t border-purple-400/20 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-rose-300 font-semibold">• High-priority</span>
                  <span className="font-mono text-white">04</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-amber-300 font-semibold">• Medium priority</span>
                  <span className="font-mono text-white">09</span>
                </div>
              </div>
            </div>

            <div className="text-purple-500/60 font-mono">──▶</div>

            {/* Stage 4: Human Follow-up */}
            <div className="w-48 p-4 rounded-2xl bg-gradient-to-b from-purple-800/30 to-[#1e133c]/80 border border-amber-500/30 backdrop-blur-xl relative shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-medium text-slate-300">Human follow-up</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  At risk
                </span>
              </div>
              <div className="text-2xl font-black text-white">08</div>
              <div className="text-[10px] text-amber-300/80 font-mono mt-1">5 awaiting sign-off</div>
            </div>

            <div className="text-purple-500/60 font-mono">──▶</div>

            {/* Stage 5: Scheduling */}
            <div className="w-44 p-4 rounded-2xl bg-gradient-to-b from-purple-800/30 to-[#1e133c]/80 border border-rose-500/30 backdrop-blur-xl relative shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-medium text-slate-300">Scheduling</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Delayed
                </span>
              </div>
              <div className="text-2xl font-black text-white">06</div>
              <div className="text-[10px] text-rose-300/80 font-mono mt-1">3 rate-throttled</div>
            </div>

            <div className="text-purple-500/60 font-mono">──▶</div>

            {/* Stage 6: Execution */}
            <div className="w-44 p-4 rounded-2xl bg-gradient-to-b from-purple-800/30 to-[#1e133c]/80 border border-emerald-500/30 backdrop-blur-xl relative shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-medium text-slate-300">Execution</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Running
                </span>
              </div>
              <div className="text-2xl font-black text-white">12</div>
              <div className="text-[10px] text-emerald-300/80 font-mono mt-1">Simulated sandbox</div>
            </div>

          </div>
        </div>
      </div>

      {/* 3 Bottom Cards (Exact Layout and Visual Proportion from Screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Card 1: Active Workflow with Progress Bars */}
        <div className="p-6 rounded-3xl bg-[#110b22]/90 border border-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">Active Workflow</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              </div>
              <button
                onClick={() => navigate('/incidents')}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Row 1 */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-200 font-semibold">Customer onboarding</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Running • 65%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-400 w-[65%]" />
                </div>
              </div>

              {/* Row 2 */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-200 font-semibold">Invoice generation</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Running • 42%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-400 w-[42%]" />
                </div>
              </div>

              {/* Row 3 */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-200 font-semibold">Support ticket routing</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/15 text-rose-300 border border-rose-500/30">
                    Warning • 80%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-rose-400 w-[80%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Plant Incident: App v2.3 UPI Break</span>
            <button
              onClick={() => navigate('/incidents/INC-2026-084')}
              className="text-purple-300 font-semibold hover:text-purple-200 flex items-center gap-1 cursor-pointer"
            >
              Open Case <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Pending Approvals Table */}
        <div className="p-6 rounded-3xl bg-[#110b22]/90 border border-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white tracking-wide">Pending approvals</h3>
              <button
                onClick={() => navigate('/approvals')}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase font-mono text-slate-500 border-b border-white/5">
                  <tr>
                    <th className="pb-2">Request</th>
                    <th className="pb-2">Department</th>
                    <th className="pb-2">Owner</th>
                    <th className="pb-2">Risk</th>
                    <th className="pb-2 text-right">Waiting</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2.5 font-semibold text-white">Refund approval</td>
                    <td className="py-2.5 text-slate-400">Finance</td>
                    <td className="py-2.5 text-slate-300">Maria Lee</td>
                    <td className="py-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300">
                        Medium
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-400">2h 14m</td>
                  </tr>

                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2.5 font-semibold text-white">Contract validation</td>
                    <td className="py-2.5 text-slate-400">Legal</td>
                    <td className="py-2.5 text-slate-300">Daniel Kim</td>
                    <td className="py-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-300">
                        High
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-400">4h 32m</td>
                  </tr>

                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2.5 font-semibold text-white">Price change request</td>
                    <td className="py-2.5 text-slate-400">Sales</td>
                    <td className="py-2.5 text-slate-300">Emily Carter</td>
                    <td className="py-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-300">
                        Low
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-400">38m</td>
                  </tr>

                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2.5 font-semibold text-white">Budget allocation</td>
                    <td className="py-2.5 text-slate-400">Operations</td>
                    <td className="py-2.5 text-slate-300">James Wilson</td>
                    <td className="py-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-300">
                        High
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-400">3h 15m</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 text-right">
            <button
              onClick={() => navigate('/approvals')}
              className="text-xs font-semibold text-purple-300 hover:text-purple-200 inline-flex items-center gap-1 cursor-pointer"
            >
              Go to Approvals Desk <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 3: AI Recommendations */}
        <div className="p-6 rounded-3xl bg-[#110b22]/90 border border-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">AI recommendations</h3>
              </div>
              <button
                onClick={() => navigate('/incidents/INC-2026-084')}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Item 1 */}
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3 hover:border-purple-500/20 transition-colors">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-slate-200 leading-snug">
                    Billing workflow is taking 24% longer than usual on Android 14 UPI gateways.
                  </p>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-300">
                  High
                </span>
              </div>

              {/* Item 2 */}
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3 hover:border-purple-500/20 transition-colors">
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-slate-200 leading-snug">
                    12 support tickets can be auto-routed to the priority reimbursement queue.
                  </p>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300">
                  Medium
                </span>
              </div>

              {/* Item 3 */}
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3 hover:border-purple-500/20 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-slate-200 leading-snug">
                    Rollback feature flag <code>enable_upi_intent_flow_v2</code> to restore checkout throughput.
                  </p>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/15 text-purple-300">
                  Low
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 text-right">
            <button
              onClick={() => navigate('/recovery')}
              className="text-xs font-semibold text-purple-300 hover:text-purple-200 inline-flex items-center gap-1 cursor-pointer"
            >
              View Recovery Center <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
