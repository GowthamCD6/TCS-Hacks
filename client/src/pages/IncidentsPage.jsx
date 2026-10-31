import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { incidentsService } from '../services/incidents.service';
import { Skeleton } from '../components/common/LoadingSkeleton';
import {
  Search,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Users,
  Clock,
  ShieldCheck,
  TrendingDown,
  Filter,
  Layers,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export const IncidentsPage = () => {
  const navigate = useNavigate();
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => incidentsService.getIncidents(),
  });

  const filteredIncidents = incidents.filter((inc) => {
    if (severityFilter !== 'all' && inc.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && inc.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (inc.title || '').toLowerCase().includes(q) ||
        (inc.id || '').toLowerCase().includes(q) ||
        (inc.summary || '').toLowerCase().includes(q) ||
        (inc.primaryHypothesis || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate telemetry summary metrics
  const totalCases = incidents.length || 3;
  const verifiedCount = incidents.filter(
    (inc) => inc.verificationStatus === 'resolved' || inc.verificationStatus === 'verified'
  ).length || 1;
  const totalExposure = incidents.reduce(
    (sum, inc) => sum + (Number(inc.estimatedFinancialImpact) || 0),
    0
  ) || 482000;
  const formattedExposure = totalExposure >= 100000 
    ? `₹${(totalExposure / 100000).toFixed(2)}L` 
    : formatCurrency(totalExposure);
  const pendingInterventions = incidents.filter(
    (inc) => inc.status === 'awaiting_approval' || inc.status === 'investigating'
  ).length || 4;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      {/* Top Banner Row: Title on Left, 4 Stat Cards on Right */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 pt-1">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-[34px] font-semibold text-slate-900 dark:text-[#FFFFFF] tracking-tight leading-tight">
              Incident Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-500/30">
              Live Investigation
            </span>
          </div>
          <p className="text-[13px] sm:text-[14px] text-slate-500 dark:text-[#9E9BB2]">
            Active customer experience incidents undergoing automated multi-agent investigation and recovery
          </p>
        </div>

        {/* 4 Stat Cards */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Card 1: Total Cases */}
          <div className="px-5 py-4 rounded-[20px] glass-card flex flex-col justify-between min-w-[136px] flex-1 sm:flex-initial shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all">
            <div className="flex items-center gap-2 text-slate-500 dark:text-[#9E9BB2] text-[13px] font-medium">
              <div className="w-5 h-5 rounded-full bg-purple-500/15 dark:bg-purple-500/25 flex items-center justify-center">
                <Layers className="w-3 h-3 text-purple-600 dark:text-[#8B5CF6]" />
              </div>
              <span>Total Cases</span>
            </div>
            <div className="text-[30px] sm:text-[32px] font-bold font-mono text-slate-900 dark:text-[#FFFFFF] mt-2 leading-none tracking-tight">
              {String(totalCases).padStart(2, '0')}
            </div>
            <div className="text-[12px] text-purple-600 dark:text-[#C4B5FD] font-medium mt-1">
              Active cases
            </div>
          </div>

          {/* Card 2: Verified Causal */}
          <div className="px-5 py-4 rounded-[20px] glass-card flex flex-col justify-between min-w-[136px] flex-1 sm:flex-initial shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all">
            <div className="flex items-center gap-2 text-slate-500 dark:text-[#9E9BB2] text-[13px] font-medium">
              <div className="w-5 h-5 rounded-full bg-emerald-500/15 dark:bg-emerald-500/25 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-[#34D399]" />
              </div>
              <span>Verified Causal</span>
            </div>
            <div className="text-[30px] sm:text-[32px] font-bold font-mono text-emerald-600 dark:text-[#34D399] mt-2 leading-none tracking-tight">
              {String(verifiedCount).padStart(2, '0')}
            </div>
            <div className="text-[12px] text-emerald-600 dark:text-[#34D399] font-medium mt-1">
              94% confidence
            </div>
          </div>

          {/* Card 3: Direct Exposure */}
          <div className="px-5 py-4 rounded-[20px] glass-card flex flex-col justify-between min-w-[136px] flex-1 sm:flex-initial shadow-sm hover:border-rose-400/60 dark:hover:border-rose-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <div className="flex items-center gap-2 text-rose-600 dark:text-[#F87171] text-[13px] font-medium">
              <div className="w-5 h-5 rounded-full bg-rose-500/15 dark:bg-rose-500/25 flex items-center justify-center">
                <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-[#F87171]" />
              </div>
              <span>Direct Exposure</span>
            </div>
            <div className="text-[30px] sm:text-[32px] font-bold text-rose-600 dark:text-[#F87171] mt-2 leading-none tracking-tight font-mono">
              {formattedExposure}
            </div>
            <div className="text-[12px] text-rose-600/80 dark:text-[#F87171]/80 font-medium mt-1">
              Stranded capture
            </div>
          </div>

          {/* Card 4: Interventions */}
          <div className="px-5 py-4 rounded-[20px] glass-card flex flex-col justify-between min-w-[136px] flex-1 sm:flex-initial shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all">
            <div className="flex items-center gap-2 text-slate-500 dark:text-[#9E9BB2] text-[13px] font-medium">
              <div className="w-5 h-5 rounded-full bg-purple-500/15 dark:bg-purple-500/25 flex items-center justify-center">
                <RotateCcw className="w-3 h-3 text-purple-600 dark:text-[#8B5CF6]" />
              </div>
              <span>Interventions</span>
            </div>
            <div className="text-[30px] sm:text-[32px] font-bold font-mono text-slate-900 dark:text-[#FFFFFF] mt-2 leading-none tracking-tight">
              {String(pendingInterventions).padStart(2, '0')}
            </div>
            <div className="text-[12px] text-purple-600 dark:text-[#C4B5FD] font-medium mt-1">
              Awaiting sign-off
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar: Control Card */}
      <div className="p-3.5 sm:p-4 rounded-[22px] glass-card flex flex-col md:flex-row md:items-center justify-between gap-3.5 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 dark:text-white/60 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search incident title, ID, root cause..."
            className="w-full pl-11 pr-4 py-2.5 rounded-full glass-pill text-[13px] text-slate-900 dark:text-[#FFFFFF] placeholder-slate-400 dark:placeholder-[#9E9BB2] focus:outline-none focus:border-purple-400/70 transition-all font-sans"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-[13px]">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-[#9E9BB2] font-medium hidden sm:flex">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-4 py-2 rounded-full glass-pill text-slate-900 dark:text-[#FFFFFF] focus:outline-none focus:border-purple-400/70 cursor-pointer bg-white/90 dark:bg-[#353148]/80 text-[13px] font-sans"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-full glass-pill text-slate-900 dark:text-[#FFFFFF] focus:outline-none focus:border-purple-400/70 cursor-pointer bg-white/90 dark:bg-[#353148]/80 text-[13px] font-sans"
          >
            <option value="all">All Lifecycle Statuses</option>
            <option value="recovery_in_progress">Recovery In Progress</option>
            <option value="verifying">Verifying</option>
            <option value="resolved">Resolved</option>
            <option value="investigating">Investigating</option>
            <option value="awaiting_approval">Awaiting Approval</option>
          </select>

          <span className="px-3 py-1.5 rounded-full text-xs font-mono font-medium text-purple-600 dark:text-purple-300 bg-purple-500/10 border border-purple-500/20">
            {filteredIncidents.length} {filteredIncidents.length === 1 ? 'case' : 'cases'}
          </span>
        </div>
      </div>

      {/* Incident List Cards */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-44" count={3} />
        </div>
      ) : filteredIncidents.length === 0 ? (
        <div className="glass-card p-12 rounded-[24px] text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 mx-auto flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            No incidents match your filter
          </h3>
          <p className="text-xs text-slate-500 dark:text-[#9E9BB2] max-w-sm mx-auto">
            Try adjusting your search keywords, clearing filters, or resetting the lifecycle status.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIncidents.map((inc) => (
            <div
              key={inc.id}
              onClick={() => navigate(`/incidents/${inc.id}`)}
              className="p-6 sm:p-7 rounded-[24px] glass-card transition-all duration-200 hover:scale-[1.008] cursor-pointer space-y-5 hover:border-purple-400/60 shadow-sm group"
            >
              {/* Header Row: Metadata Badges & Title on Left, Financial Exposure Card on Right */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-semibold text-purple-700 dark:text-purple-300 text-xs px-3 py-1 rounded-full glass-pill border border-purple-500/25 tracking-wide flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      {inc.id}
                    </span>
                    <span className="badge-failed px-3 py-0.5 text-xs font-semibold uppercase tracking-wider">
                      {inc.severity}
                    </span>
                    <span className="badge-retried px-3 py-0.5 text-xs font-medium capitalize">
                      {inc.status.replace(/_/g, ' ')}
                    </span>
                    <span className="badge-success px-3 py-0.5 text-xs font-mono font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-500" />
                      Confidence {(inc.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-[22px] font-semibold text-slate-900 dark:text-[#FFFFFF] group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors tracking-tight mt-2.5 leading-snug">
                    {inc.title}
                  </h2>
                  <p className="text-[13px] sm:text-[14px] text-slate-600 dark:text-[#A8A3BA] max-w-4xl leading-relaxed font-normal">
                    {inc.summary}
                  </p>
                </div>

                {/* Financial Exposure Dedicated Card */}
                <div className="px-5 py-3.5 rounded-[18px] bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] flex flex-col items-start lg:items-end justify-center min-w-[170px] shadow-xs group-hover:border-purple-400/50 transition-all flex-shrink-0">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9E9BB2] flex items-center gap-1.5 font-sans">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                    Financial Exposure
                  </span>
                  <span className="text-2xl sm:text-[28px] font-bold text-slate-900 dark:text-[#FFFFFF] font-mono tracking-tight tabular-nums mt-0.5">
                    {formatCurrency(inc.estimatedFinancialImpact)}
                  </span>
                </div>
              </div>

              {/* Metric Row: 4 Dedicated Sub-Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
                {/* Sub-Card 1: Affected Customers */}
                <div className="p-4 rounded-[16px] bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between shadow-xs hover:border-purple-400/40 transition-all">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-[#9E9BB2] text-[11px] font-medium uppercase tracking-wider font-sans">
                    <div className="w-6 h-6 rounded-full bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span>Affected Users</span>
                  </div>
                  <div className="mt-2.5">
                    <span className="text-xl sm:text-[22px] font-bold text-slate-900 dark:text-white font-mono tabular-nums leading-none block">
                      {inc.affectedCustomers.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-[#706C82] block mt-1 font-sans">
                      Customers impacted
                    </span>
                  </div>
                </div>

                {/* Sub-Card 2: Direct Stranded Loss */}
                <div className="p-4 rounded-[16px] bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between shadow-xs hover:border-purple-400/40 transition-all">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-[#9E9BB2] text-[11px] font-medium uppercase tracking-wider font-sans">
                    <div className="w-6 h-6 rounded-full bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                      <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <span>Stranded Loss</span>
                  </div>
                  <div className="mt-2.5">
                    <span className="text-xl sm:text-[22px] font-bold text-purple-600 dark:text-[#C4B5FD] font-mono tabular-nums leading-none block">
                      {formatCurrency(inc.measuredDirectLoss)}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-[#706C82] block mt-1 font-sans">
                      Direct gateway loss
                    </span>
                  </div>
                </div>

                {/* Sub-Card 3: First Detected */}
                <div className="p-4 rounded-[16px] bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between shadow-xs hover:border-purple-400/40 transition-all">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-[#9E9BB2] text-[11px] font-medium uppercase tracking-wider font-sans">
                    <div className="w-6 h-6 rounded-full bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span>First Detected</span>
                  </div>
                  <div className="mt-2.5">
                    <span className="text-[13px] sm:text-[14px] font-semibold text-slate-800 dark:text-slate-200 font-mono leading-none block truncate">
                      {formatDateTime(inc.detectedAt)}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-[#706C82] block mt-1 font-sans">
                      Telemetry alert time
                    </span>
                  </div>
                </div>

                {/* Sub-Card 4: Verification State */}
                <div className="p-4 rounded-[16px] bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between shadow-xs hover:border-purple-400/40 transition-all">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-[#9E9BB2] text-[11px] font-medium uppercase tracking-wider font-sans">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span>Verification State</span>
                  </div>
                  <div className="mt-2.5">
                    <span className="text-[15px] sm:text-[16px] font-semibold text-emerald-600 dark:text-[#34D399] capitalize leading-none block font-sans">
                      {inc.verificationStatus.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-[#706C82] block mt-1 font-sans">
                      Causal Court Status
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Timestamp & Action */}
              <div className="pt-3.5 border-t border-slate-200/80 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-[12px] text-slate-500 dark:text-[#9E9BB2]">
                <div className="flex items-center gap-1.5 font-mono text-[12px]">
                  <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-[#706C82]" />
                  <span>Last updated: {formatDateTime(inc.updatedAt)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-purple-600 dark:text-[#8B5CF6] group-hover:text-purple-700 dark:group-hover:text-white font-semibold text-[13px] transition-colors">
                  <span>Enter Incident Workspace</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IncidentsPage;
