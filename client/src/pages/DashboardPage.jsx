import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Maximize2,
  Sparkles,
  Layers,
} from 'lucide-react';

export const DashboardPage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Row: Title on Left, 4 Stat Cards + '+ Create Workflow' Button on Right */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 pt-2">
        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Automation center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Monitor workflows, approvals, incidents and AI recommendations in real time
          </p>
        </div>

        {/* 4 Stat Cards + Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Stat 1: Active workflows */}
          <div className="px-4 py-2.5 rounded-2xl bg-[#140d2b]/80 border border-white/[0.08] backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.4)] flex flex-col justify-between min-w-[110px]">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
              <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
              <span>Active workflows</span>
            </div>
            <div className="text-2xl font-bold text-white mt-1">128</div>
          </div>

          {/* Stat 2: Success Rate */}
          <div className="px-4 py-2.5 rounded-2xl bg-[#140d2b]/80 border border-white/[0.08] backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.4)] flex flex-col justify-between min-w-[110px]">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Success Rate</span>
            </div>
            <div className="text-2xl font-bold text-white mt-1">92%</div>
          </div>

          {/* Stat 3: Pending Approvals */}
          <div className="px-4 py-2.5 rounded-2xl bg-[#140d2b]/80 border border-white/[0.08] backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.4)] flex flex-col justify-between min-w-[110px]">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Pending Approvals</span>
            </div>
            <div className="text-2xl font-bold text-white mt-1">18</div>
          </div>

          {/* Stat 4: Failed Tasks */}
          <div className="px-4 py-2.5 rounded-2xl bg-[#140d2b]/80 border border-white/[0.08] backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.4)] flex flex-col justify-between min-w-[110px]">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Failed Tasks</span>
            </div>
            <div className="text-2xl font-bold text-white mt-1">07</div>
          </div>

          {/* Create Workflow Button */}
          <button
            onClick={() => navigate('/ingestion')}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_24px_rgba(168,85,247,0.4)] border border-purple-400/40 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Workflow</span>
          </button>
        </div>
      </div>

      {/* Main Section: AI Workflow Map Container */}
      <div className="relative rounded-3xl bg-[#0f0920]/90 border border-white/[0.08] p-6 sm:p-8 backdrop-blur-2xl shadow-[0_16px_45px_rgba(0,0,0,0.65)] overflow-hidden">
        {/* Subtle radial inner glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent pointer-events-none" />

        {/* Section Header + Status Pills */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 mb-8">
          <h2 className="text-lg font-bold text-white tracking-wide">AI Workflow Map</h2>

          {/* Workflow Status Legend Pills */}
          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-[#160d2e] border border-white/10 text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              Running
            </span>
            <span className="px-3 py-1 rounded-full bg-[#160d2e] border border-white/10 text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf]" />
              Optimized
            </span>
            <span className="px-3 py-1 rounded-full bg-[#160d2e] border border-white/10 text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
              At risk
            </span>
            <span className="px-3 py-1 rounded-full bg-[#160d2e] border border-white/10 text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
              Delayed
            </span>
          </div>
        </div>

        {/* Horizontal Pipeline of 6 Connected Glass Nodes */}
        <div className="relative z-10 overflow-x-auto pb-4 scrollbar-none">
          <div className="min-w-[1040px] flex items-center justify-between gap-3 relative py-8">
            
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
                stroke="rgba(168, 85, 247, 0.25)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            </svg>

            {/* Node 1: New Request */}
            <div className="w-44 p-4 rounded-2xl bg-gradient-to-b from-[#221545]/90 to-[#140c2b]/95 border border-white/10 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.5)] relative z-10">
              {/* Top Right Pin */}
              <div className="absolute -top-2 right-4 w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-white/70" />
              </div>

              <div className="flex items-center gap-2 text-slate-300 text-xs mb-2">
                <User className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-semibold text-slate-200">New Request</span>
              </div>
              <div className="text-3xl font-extrabold text-white">24</div>
              <div className="text-[11px] text-slate-400 font-mono mt-1">incoming</div>
            </div>

            {/* Node 2: AI Classification */}
            <div className="w-48 p-4 rounded-2xl bg-gradient-to-b from-[#221545]/90 to-[#140c2b]/95 border border-white/10 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.5)] relative z-10">
              {/* Top Right Pin */}
              <div className="absolute -top-2 right-4 w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-white/70" />
              </div>

              <div className="flex items-center gap-2 text-slate-300 text-xs mb-2">
                <Globe className="w-3.5 h-3.5 text-teal-400" />
                <span className="font-semibold text-slate-200">AI Classification</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-white">22</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  Optimized
                </span>
              </div>
              <div className="mt-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Optimized
                </span>
              </div>
            </div>

            {/* Node 3: Risk Detection (Highlighted Active Glowing Node with Popover Tags) */}
            <div className="w-56 p-4 rounded-2xl bg-gradient-to-b from-purple-700/60 to-[#221142]/95 border border-purple-400/60 backdrop-blur-2xl shadow-[0_0_35px_rgba(168,85,247,0.45)] relative z-20">
              {/* Top Popover Priority Stack matching image */}
              <div className="absolute -top-20 left-4 w-44 p-2.5 rounded-xl bg-[#140a28]/95 border border-purple-500/30 backdrop-blur-2xl shadow-[0_8px_24px_rgba(0,0,0,0.7)] space-y-1 text-[10px] font-medium pointer-events-none">
                <div className="flex items-center justify-between text-rose-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> High priority
                  </span>
                </div>
                <div className="flex items-center justify-between text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Medium priority
                  </span>
                </div>
                <div className="flex items-center justify-between text-teal-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400" /> Low priority
                  </span>
                </div>
                <div className="flex items-center justify-between text-purple-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Under review
                  </span>
                </div>
              </div>

              {/* Top Right Pin */}
              <div className="absolute -top-2 right-4 w-5 h-5 rounded-full bg-purple-400/40 border border-purple-300 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_6px_#fff]" />
              </div>

              <div className="flex items-center gap-2 text-purple-200 text-xs mb-2">
                <Headphones className="w-3.5 h-3.5 text-purple-300" />
                <span className="font-semibold text-white">Risk detection</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-white">18</span>
                <span className="text-[11px] font-mono text-purple-200">Analyzing</span>
              </div>
              <div className="mt-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Running
                </span>
              </div>
            </div>

            {/* Node 4: Human follow-up */}
            <div className="w-48 p-4 rounded-2xl bg-gradient-to-b from-[#221545]/90 to-[#140c2b]/95 border border-white/10 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.5)] relative z-10">
              {/* Top Right Pin */}
              <div className="absolute -top-2 right-4 w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-white/70" />
              </div>

              <div className="flex items-center gap-2 text-slate-300 text-xs mb-2">
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-slate-200">Human follow-up</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-white">08</span>
                <span className="text-[11px] font-mono text-amber-300">5 pending</span>
              </div>
              <div className="mt-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> At risk
                </span>
              </div>
            </div>

            {/* Node 5: Scheduling */}
            <div className="w-44 p-4 rounded-2xl bg-gradient-to-b from-[#221545]/90 to-[#140c2b]/95 border border-white/10 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.5)] relative z-10">
              {/* Top Right Pin */}
              <div className="absolute -top-2 right-4 w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-white/70" />
              </div>

              <div className="flex items-center gap-2 text-slate-300 text-xs mb-2">
                <Calendar className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-semibold text-slate-200">Scheduling</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-white">06</span>
                <span className="text-[11px] font-mono text-rose-300">3 blocked</span>
              </div>
              <div className="mt-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Delayed
                </span>
              </div>
            </div>

            {/* Node 6: Execution */}
            <div className="w-44 p-4 rounded-2xl bg-gradient-to-b from-[#221545]/90 to-[#140c2b]/95 border border-white/10 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.5)] relative z-10">
              {/* Top Right Pin */}
              <div className="absolute -top-2 right-4 w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-white/70" />
              </div>

              <div className="flex items-center gap-2 text-slate-300 text-xs mb-2">
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold text-slate-200">Execution</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-white">12</span>
                <span className="text-[11px] font-mono text-slate-400">in progress</span>
              </div>
              <div className="mt-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Running
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 3 Bottom Cards (Exact Visual Proportion and Content from Screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Bottom Card 1: Active Workflow */}
        <div className="p-6 rounded-3xl bg-[#100a22]/90 border border-white/[0.08] backdrop-blur-2xl shadow-[0_12px_35px_rgba(0,0,0,0.5)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white tracking-wide">Active Workflow</h3>
              <button
                onClick={() => navigate('/incidents')}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Expand"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Item 1 */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-200 font-semibold">Customer onboarding</span>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Running
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">60%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-400 w-[60%]" />
                </div>
              </div>

              {/* Item 2 */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-200 font-semibold">Invoice generation</span>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Running
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">42%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-400 w-[42%]" />
                </div>
              </div>

              {/* Item 3 */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-200 font-semibold">Support ticket routing</span>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Warning
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">80%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-rose-400 w-[80%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
            <span>Plant: App v2.3 UPI Break</span>
            <button
              onClick={() => navigate('/incidents/INC-2026-084')}
              className="text-purple-300 font-semibold hover:text-purple-200 flex items-center gap-1 cursor-pointer"
            >
              Inspect Case <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Card 2: Pending approvals */}
        <div className="p-6 rounded-3xl bg-[#100a22]/90 border border-white/[0.08] backdrop-blur-2xl shadow-[0_12px_35px_rgba(0,0,0,0.5)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white tracking-wide">Pending approvals</h3>
              <button
                onClick={() => navigate('/approvals')}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Expand"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase font-mono text-slate-500 border-b border-white/[0.06]">
                  <tr>
                    <th className="pb-2">Request</th>
                    <th className="pb-2">Department</th>
                    <th className="pb-2">Owner</th>
                    <th className="pb-2">Risk level</th>
                    <th className="pb-2 text-right">Waiting</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2.5 font-semibold text-white">Refund approval</td>
                    <td className="py-2.5 text-slate-400">Finance</td>
                    <td className="py-2.5 text-slate-300">Maria Lee</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        Medium
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-400">2h 12m</td>
                  </tr>

                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2.5 font-semibold text-white">Contract validation</td>
                    <td className="py-2.5 text-slate-400">Legal</td>
                    <td className="py-2.5 text-slate-300">Daniel Kim</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        High
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-400">4h 13m</td>
                  </tr>

                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2.5 font-semibold text-white">Price change request</td>
                    <td className="py-2.5 text-slate-400">Sales</td>
                    <td className="py-2.5 text-slate-300">Emily Carter</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        Low
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-400">28m</td>
                  </tr>

                  <tr className="hover:bg-white/[0.02]">
                    <td className="py-2.5 font-semibold text-white">Budget allocation</td>
                    <td className="py-2.5 text-slate-400">Operations</td>
                    <td className="py-2.5 text-slate-300">James Wilson</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        High
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-400">3h 15m</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] text-right">
            <button
              onClick={() => navigate('/approvals')}
              className="text-xs font-semibold text-purple-300 hover:text-purple-200 inline-flex items-center gap-1 cursor-pointer"
            >
              Sign-off Desk <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Card 3: AI recommendations */}
        <div className="p-6 rounded-3xl bg-[#100a22]/90 border border-white/[0.08] backdrop-blur-2xl shadow-[0_12px_35px_rgba(0,0,0,0.5)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white tracking-wide">AI recommendations</h3>
              <button
                onClick={() => navigate('/incidents/INC-2026-084')}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Expand"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Alert 1 */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3 hover:border-purple-500/30 transition-colors">
                <div className="w-7 h-7 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-200 leading-snug">
                    Billing workflow is taking 24% longer than usual on Android 14 UPI gateways.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  High
                </span>
              </div>

              {/* Alert 2 */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3 hover:border-purple-500/30 transition-colors">
                <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-200 leading-snug">
                    12 support tickets can be auto-routed to the priority reimbursement queue.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Medium
                </span>
              </div>

              {/* Alert 3 */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3 hover:border-purple-500/30 transition-colors">
                <div className="w-7 h-7 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-200 leading-snug">
                    Document validation flow has repeat errors in step 3 (rollback recommended).
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Low
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] text-right">
            <button
              onClick={() => navigate('/recovery')}
              className="text-xs font-semibold text-purple-300 hover:text-purple-200 inline-flex items-center gap-1 cursor-pointer"
            >
              Recovery Center <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
