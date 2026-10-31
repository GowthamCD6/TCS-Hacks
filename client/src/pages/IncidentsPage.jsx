import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { incidentsService } from '../services/incidents.service';
import { Skeleton } from '../components/common/LoadingSkeleton';
import { Search, ArrowUpRight, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
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
        inc.title.toLowerCase().includes(q) ||
        inc.id.toLowerCase().includes(q) ||
        inc.summary.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Row matching screenshot */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 pt-1">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-[34px] font-semibold text-slate-900 dark:text-[#FFFFFF] tracking-tight leading-tight">
            Incident Directory
          </h1>
          <p className="text-[13px] sm:text-[14px] text-slate-500 dark:text-[#9E9BB2]">
            Active customer experience incidents undergoing automated multi-agent investigation and recovery
          </p>
        </div>

        {/* 4 Stat Cards */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="px-5 py-4 rounded-[20px] glass-card flex flex-col justify-between min-w-[136px] flex-1 sm:flex-initial shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 dark:text-[#9E9BB2] text-[13px] font-medium">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span>Total Cases</span>
            </div>
            <div className="text-[30px] sm:text-[32px] font-semibold text-slate-900 dark:text-[#FFFFFF] mt-2 leading-none tracking-tight">
              03
            </div>
            <div className="text-[12px] text-purple-600 dark:text-[#C4B5FD] font-medium mt-1">
              Active cases
            </div>
          </div>

          <div className="px-5 py-4 rounded-[20px] glass-card flex flex-col justify-between min-w-[136px] flex-1 sm:flex-initial shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 dark:text-[#9E9BB2] text-[13px] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-[#34D399]" />
              <span>Verified Causal</span>
            </div>
            <div className="text-[30px] sm:text-[32px] font-semibold text-emerald-600 dark:text-[#34D399] mt-2 leading-none tracking-tight">
              01
            </div>
            <div className="text-[12px] text-emerald-600 dark:text-[#34D399] font-medium mt-1">
              94% confidence
            </div>
          </div>

          <div className="px-5 py-4 rounded-[20px] glass-card flex flex-col justify-between min-w-[136px] flex-1 sm:flex-initial shadow-sm hover:border-rose-400/60 dark:hover:border-rose-500/50 transition-all">
            <div className="flex items-center gap-2 text-rose-600 dark:text-[#F87171] text-[13px] font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-[#F87171]" />
              <span>Direct Exposure</span>
            </div>
            <div className="text-[30px] sm:text-[32px] font-semibold text-rose-600 dark:text-[#F87171] mt-2 leading-none tracking-tight font-mono">
              ₹4.82L
            </div>
            <div className="text-[12px] text-rose-600/80 dark:text-[#F87171]/80 font-medium mt-1">
              Stranded capture
            </div>
          </div>

          <div className="px-5 py-4 rounded-[20px] glass-card flex flex-col justify-between min-w-[136px] flex-1 sm:flex-initial shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 dark:text-[#9E9BB2] text-[13px] font-medium">
              <RotateCcw className="w-3.5 h-3.5 text-purple-600 dark:text-[#8B5CF6]" />
              <span>Interventions</span>
            </div>
            <div className="text-[30px] sm:text-[32px] font-semibold text-slate-900 dark:text-[#FFFFFF] mt-2 leading-none tracking-tight">
              04
            </div>
            <div className="text-[12px] text-purple-600 dark:text-[#C4B5FD] font-medium mt-1">
              Awaiting sign-off
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 sm:p-4 rounded-[22px] glass-card flex flex-wrap items-center justify-between gap-3.5">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search incident title, ID..."
            className="w-full pl-5 pr-10 py-2.5 rounded-full glass-pill text-[13px] text-slate-900 dark:text-[#FFFFFF] placeholder-slate-400 dark:placeholder-[#9E9BB2] focus:outline-none focus:border-purple-400/70 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 dark:text-white/60 absolute right-4 top-3" />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-[13px]">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-4 py-2 rounded-full glass-pill text-slate-900 dark:text-[#FFFFFF] focus:outline-none focus:border-purple-400/70 cursor-pointer bg-white/90 dark:bg-[#353148]/80 text-[13px]"
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
            className="px-4 py-2 rounded-full glass-pill text-slate-900 dark:text-[#FFFFFF] focus:outline-none focus:border-purple-400/70 cursor-pointer bg-white/90 dark:bg-[#353148]/80 text-[13px]"
          >
            <option value="all">All Lifecycle Statuses</option>
            <option value="recovery_in_progress">Recovery In Progress</option>
            <option value="verifying">Verifying</option>
            <option value="resolved">Resolved</option>
            <option value="investigating">Investigating</option>
          </select>
        </div>
      </div>

      {/* Incident List Cards */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40" count={3} />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIncidents.map((inc) => (
            <div
              key={inc.id}
              onClick={() => navigate(`/incidents/${inc.id}`)}
              className="p-6 sm:p-7 rounded-[22px] glass-card transition-all hover:scale-[1.008] cursor-pointer space-y-5 hover:border-purple-400/50 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-purple-600 dark:text-purple-300 text-xs px-3 py-1 rounded-full glass-pill border border-purple-500/20">
                      {inc.id}
                    </span>
                    <span className="badge-failed px-3 py-0.5 text-xs font-medium">
                      {inc.severity}
                    </span>
                    <span className="badge-retried px-3 py-0.5 text-xs font-medium">
                      {inc.status.replace(/_/g, ' ')}
                    </span>
                    <span className="badge-success px-3 py-0.5 text-xs font-mono font-medium">
                      Confidence {(inc.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-[19px] font-semibold text-slate-900 dark:text-[#FFFFFF] mt-2.5 tracking-tight">{inc.title}</h3>
                  <p className="text-[13px] text-slate-600 dark:text-[#A8A3BA] max-w-4xl leading-relaxed mt-1">{inc.summary}</p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#9E9BB2] block">
                    Financial Exposure
                  </span>
                  <span className="text-2xl sm:text-[28px] font-bold text-slate-900 dark:text-[#FFFFFF] font-mono mt-0.5 block leading-tight">
                    {formatCurrency(inc.estimatedFinancialImpact)}
                  </span>
                </div>
              </div>

              {/* Metric Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3.5 border-y border-slate-200/80 dark:border-white/[0.08] text-xs">
                <div>
                  <span className="text-slate-400 dark:text-[#9E9BB2] block text-[11px] font-medium uppercase tracking-wide">Affected Customers</span>
                  <span className="font-semibold text-slate-900 dark:text-[#FFFFFF] text-base mt-1 block">{inc.affectedCustomers.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-[#9E9BB2] block text-[11px] font-medium uppercase tracking-wide">Direct Stranded Loss</span>
                  <span className="font-semibold text-purple-600 dark:text-[#C4B5FD] font-mono text-base mt-1 block">
                    {formatCurrency(inc.measuredDirectLoss)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-[#9E9BB2] block text-[11px] font-medium uppercase tracking-wide">First Detected</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 font-mono text-[13px] mt-1 block">
                    {formatDateTime(inc.detectedAt)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-[#9E9BB2] block text-[11px] font-medium uppercase tracking-wide">Verification State</span>
                  <span className="font-semibold text-emerald-600 dark:text-[#34D399] capitalize text-base mt-1 block">
                    {inc.verificationStatus.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[12px] pt-1 text-slate-500 dark:text-[#9E9BB2]">
                <span className="font-mono">Last updated: {formatDateTime(inc.updatedAt)}</span>
                <span className="font-semibold text-purple-600 dark:text-[#8B5CF6] hover:text-purple-700 dark:hover:text-[#A855F7] flex items-center gap-1.5 transition-colors">
                  Enter Incident Workspace <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IncidentsPage;
