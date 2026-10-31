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
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Incident Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Active customer experience incidents undergoing automated multi-agent investigation and recovery
          </p>
        </div>

        {/* 4 Stat Cards */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-5 py-3 rounded-2xl glass-card flex flex-col justify-between min-w-[125px]">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span>Total Cases</span>
            </div>
            <div className="text-2xl font-black text-white mt-1">03</div>
            <div className="text-[10px] text-purple-300 font-medium mt-0.5">Active cases</div>
          </div>

          <div className="px-5 py-3 rounded-2xl glass-card flex flex-col justify-between min-w-[125px]">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Causal</span>
            </div>
            <div className="text-2xl font-black text-white mt-1">01</div>
            <div className="text-[10px] text-emerald-400 font-medium mt-0.5">94% confidence</div>
          </div>

          <div className="px-5 py-3 rounded-2xl bg-gradient-to-b from-rose-950/60 to-rose-900/30 border border-rose-500/30 backdrop-blur-2xl shadow-[0_12px_35px_rgba(0,0,0,0.6)] flex flex-col justify-between min-w-[125px]">
            <div className="flex items-center gap-1.5 text-rose-300 text-[10px] font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Direct Exposure</span>
            </div>
            <div className="text-2xl font-black text-white mt-1 font-mono">₹4.82L</div>
            <div className="text-[10px] text-rose-300 font-medium mt-0.5">Stranded capture</div>
          </div>

          <div className="px-5 py-3 rounded-2xl glass-card flex flex-col justify-between min-w-[125px]">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
              <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
              <span>Interventions</span>
            </div>
            <div className="text-2xl font-black text-white mt-1">04</div>
            <div className="text-[10px] text-purple-300 font-medium mt-0.5">Awaiting sign-off</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-[2rem] glass-card flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search incident title, ID..."
            className="w-full pl-5 pr-10 py-2.5 rounded-full bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-400 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-4 py-2 rounded-full glass-pill text-white focus:outline-none focus:border-purple-400 cursor-pointer bg-[#150d2c]/80"
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
            className="px-4 py-2 rounded-full glass-pill text-white focus:outline-none focus:border-purple-400 cursor-pointer bg-[#150d2c]/80"
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
              className="p-6 rounded-[2rem] glass-card transition-all hover:scale-[1.005] cursor-pointer space-y-4 hover:border-purple-400/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-200 text-xs px-3 py-1 rounded-full glass-pill">
                      {inc.id}
                    </span>
                    <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {inc.severity}
                    </span>
                    <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {inc.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/15 px-3 py-0.5 rounded-full border border-emerald-500/30">
                      Confidence {(inc.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mt-2">{inc.title}</h3>
                  <p className="text-xs text-slate-300 max-w-4xl leading-relaxed">{inc.summary}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    Financial Exposure
                  </span>
                  <span className="text-3xl font-black text-white font-mono">
                    {formatCurrency(inc.estimatedFinancialImpact)}
                  </span>
                </div>
              </div>

              {/* Metric Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-white/[0.06] text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Affected Customers</span>
                  <span className="font-bold text-white text-base">{inc.affectedCustomers.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Direct Stranded Loss</span>
                  <span className="font-bold text-purple-300 font-mono text-base">
                    {formatCurrency(inc.measuredDirectLoss)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">First Detected</span>
                  <span className="font-semibold text-slate-300 font-mono text-base">
                    {formatDateTime(inc.detectedAt)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Verification State</span>
                  <span className="font-bold text-emerald-400 capitalize text-base">
                    {inc.verificationStatus.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400 font-mono">Last updated: {formatDateTime(inc.updatedAt)}</span>
                <span className="font-bold text-purple-300 flex items-center gap-1 group-hover:text-purple-200">
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
