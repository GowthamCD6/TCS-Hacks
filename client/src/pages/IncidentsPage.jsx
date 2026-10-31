import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { incidentsService } from '../services/incidents.service';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/LoadingSkeleton';
import { Search, ArrowUpRight } from 'lucide-react';
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Incidents Case Index</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Active customer experience incidents undergoing automated multi-agent investigation and recovery
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3 bg-[#130d24]/90 border border-white/10">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search incident title, ID..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#140e26] border border-white/10 text-white focus:outline-none focus:border-purple-400"
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
            className="px-3 py-1.5 rounded-xl bg-[#140e26] border border-white/10 text-white focus:outline-none focus:border-purple-400"
          >
            <option value="all">All Lifecycle Statuses</option>
            <option value="recovery_in_progress">Recovery In Progress</option>
            <option value="verifying">Verifying</option>
            <option value="resolved">Resolved</option>
            <option value="investigating">Investigating</option>
          </select>
        </div>
      </Card>

      {/* Incident List Cards */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40" count={3} />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIncidents.map((inc) => (
            <Card
              key={inc.id}
              interactive
              onClick={() => navigate(`/incidents/${inc.id}`)}
              className="p-5 sm:p-6 transition-all border border-purple-500/25 bg-[#140d28]/90 hover:border-purple-400/50 space-y-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-300 text-sm px-2.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                      {inc.id}
                    </span>
                    <Badge variant="severity" value={inc.severity}>
                      {inc.severity}
                    </Badge>
                    <Badge variant="status" value={inc.status}>
                      {inc.status.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Confidence {(inc.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white mt-1.5">{inc.title}</h3>
                  <p className="text-xs text-slate-300 max-w-4xl leading-relaxed">{inc.summary}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    Financial Exposure
                  </span>
                  <span className="text-2xl font-black text-white font-mono">
                    {formatCurrency(inc.estimatedFinancialImpact)}
                  </span>
                </div>
              </div>

              {/* Metric Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-white/5 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Affected Customers</span>
                  <span className="font-bold text-white text-sm">{inc.affectedCustomers.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Direct Stranded Loss</span>
                  <span className="font-bold text-purple-300 font-mono text-sm">
                    {formatCurrency(inc.measuredDirectLoss)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">First Detected</span>
                  <span className="font-semibold text-slate-300 font-mono text-sm">
                    {formatDateTime(inc.detectedAt)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Verification State</span>
                  <span className="font-bold text-emerald-400 capitalize text-sm">
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
export default IncidentsPage;

