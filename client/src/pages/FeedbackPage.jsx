import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { feedbackService } from '../services/feedback.service';
import { Drawer } from '../components/common/Drawer';
import { Skeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import {
  Inbox,
  Search,
  UploadCloud,
  ExternalLink,
  Smartphone,
  Globe,
  FileSpreadsheet,
  Headphones,
  Share2,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import { formatDateTime } from '../utils/formatters';

const CHANNEL_ICONS = {
  mobile_app: Smartphone,
  website: Globe,
  support_ticket: Headphones,
  google_forms: FileSpreadsheet,
  social_media: Share2,
  csv: UploadCloud,
};

export const FeedbackPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);

  const { data: feedbackList = [], isLoading } = useQuery({
    queryKey: ['feedback', channelFilter, statusFilter, search],
    queryFn: () =>
      feedbackService.getFeedback({
        channel: channelFilter,
        sentiment: statusFilter,
        search,
      }),
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Row matching exact specs */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 pt-1">
        <div className="space-y-1">
          <h1 className="text-[34px] font-semibold text-[#FFFFFF] tracking-tight leading-tight">
            Automation History
          </h1>
          <p className="text-[13px] text-[#9E9BB2]">
            Track, investigate, and audit workflow executions and system logs in real time.
          </p>
        </div>

        {/* 4 Stat Metric Cards (32px-36px Numbers, 14px-15px Card Titles) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Card 1: Total Executions */}
          <div className="px-5 py-4 rounded-[18px] glass-card flex flex-col justify-between min-w-[130px]">
            <div className="flex items-center gap-1.5 text-[#9E9BB2] text-[14px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
              <span>Total Executions</span>
            </div>
            <div className="text-[34px] font-semibold text-[#FFFFFF] mt-1 leading-none">8,421</div>
            <div className="text-[12px] text-[#34D399] font-normal mt-1">+12% vs last week</div>
          </div>

          {/* Card 2: Successful */}
          <div className="px-5 py-4 rounded-[18px] glass-card flex flex-col justify-between min-w-[130px]">
            <div className="flex items-center gap-1.5 text-[#9E9BB2] text-[14px] font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
              <span>Successful</span>
            </div>
            <div className="text-[34px] font-semibold text-[#FFFFFF] mt-1 leading-none">7,984</div>
            <div className="text-[12px] text-[#34D399] font-normal mt-1">94.8% rate</div>
          </div>

          {/* Card 3: Failed (Solid #3A1922 / rgba(239, 68, 68, 0.2)) */}
          <div className="px-5 py-4 rounded-[18px] bg-[rgba(239,68,68,0.2)] border border-[rgba(248,113,113,0.3)] backdrop-blur-[16px] flex flex-col justify-between min-w-[130px]">
            <div className="flex items-center gap-1.5 text-[#F87171] text-[14px] font-medium">
              <AlertTriangle className="w-4 h-4 text-[#F87171]" />
              <span>Failed</span>
            </div>
            <div className="text-[34px] font-semibold text-[#FFFFFF] mt-1 leading-none">253</div>
            <div className="text-[12px] text-[#F87171] font-normal mt-1">Action required</div>
          </div>

          {/* Card 4: Retried/In-progress */}
          <div className="px-5 py-4 rounded-[18px] glass-card flex flex-col justify-between min-w-[130px]">
            <div className="flex items-center gap-1.5 text-[#9E9BB2] text-[14px] font-medium">
              <RotateCcw className="w-4 h-4 text-[#60A5FA]" />
              <span>Retried/In-progress</span>
            </div>
            <div className="text-[34px] font-semibold text-[#FFFFFF] mt-1 leading-none">184</div>
            <div className="text-[12px] text-[#9E9BB2] font-normal mt-1">Active tracking</div>
          </div>
        </div>
      </div>

      {/* Main Table Container: Execution Logs Card */}
      <div className="glass-card space-y-5">
        {/* Table Header and Filter Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-3 border-b border-white/[0.08]">
          <h2 className="text-[20px] font-medium text-[#FFFFFF] tracking-tight">
            Execution Logs
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* All Workflows Filter */}
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="action-control px-4 py-2 text-[13px] text-[#FFFFFF] cursor-pointer appearance-none pr-8"
            >
              <option value="all">All Workflows</option>
              <option value="mobile_app">Customer onboarding</option>
              <option value="website">Invoice generation</option>
              <option value="support_ticket">Price change request</option>
              <option value="google_forms">Budget allocation</option>
              <option value="social_media">Refund approval</option>
            </select>

            {/* Filter by Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="action-control px-4 py-2 text-[13px] text-[#FFFFFF] cursor-pointer appearance-none pr-8"
            >
              <option value="all">Filter by Status</option>
              <option value="positive">Success</option>
              <option value="critical">Failed</option>
              <option value="negative">Retried</option>
              <option value="neutral">In-progress</option>
            </select>

            {/* Search Input */}
            <div className="relative w-48 sm:w-60">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search logs..."
                className="action-control w-full pl-4 pr-9 py-2 text-[13px] text-[#FFFFFF] placeholder-[#706C82]"
              />
              <Search className="w-4 h-4 text-[#706C82] absolute right-3.5 top-2.5" />
            </div>

            {/* Import Button */}
            <button
              onClick={() => navigate('/ingestion')}
              className="px-4 py-2 rounded-[12px] bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] hover:from-[#7C3AED] hover:to-[#5B21B6] text-white font-medium text-[13px] flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Import Data</span>
            </button>
          </div>
        </div>

        {/* Execution Logs Table & Failure Analysis Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Table (Col 3) */}
          <div className="xl:col-span-3 overflow-x-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-12" count={6} />
              </div>
            ) : feedbackList.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No execution logs found"
                description="Try clearing search filters or import new workflow runs."
                actionLabel="Reset Filters"
                onAction={() => {
                  setSearch('');
                  setChannelFilter('all');
                  setStatusFilter('all');
                }}
              />
            ) : (
              <table className="w-full text-left">
                <thead className="table-header-strip text-[12px] font-medium text-[#9E9BB2] border-b border-white/[0.08]">
                  <tr>
                    <th className="py-3 px-4">Execution ID</th>
                    <th className="py-3 px-4">Workflow Name</th>
                    <th className="py-3 px-4">Triggered By</th>
                    <th className="py-3 px-4">Start Time</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {feedbackList.map((item, idx) => {
                    const executionId = `0072033${item.id?.replace(/\D/g, '').padEnd(4, '0').slice(0, 4) || (6300 + idx)}`;
                    const isSuccess = item.sentiment === 'positive';
                    const isFailed = item.sentiment === 'critical';
                    const isRetried = item.sentiment === 'negative';
                    const isInProgress = item.sentiment === 'neutral' || !item.sentiment;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className="table-log-row hover:bg-white/[0.03] transition-colors cursor-pointer text-[13px]"
                      >
                        <td className="py-3.5 px-4 font-mono text-[#706C82]">
                          {executionId}
                        </td>
                        <td className="py-3.5 px-4 font-normal text-[#FFFFFF]">
                          {item.category || 'Invoice generation'}
                        </td>
                        <td className="py-3.5 px-4 text-[#9E9BB2]">
                          {item.channel === 'mobile_app' ? 'API Trigger' : item.channel === 'support_ticket' ? 'Liam Anderson' : 'Schedule'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#706C82] whitespace-nowrap">
                          {formatDateTime(item.timestamp)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#9E9BB2]">
                          {idx % 3 === 0 ? '2m 12s' : idx % 2 === 0 ? '4m 06s' : '3h 15m'}
                        </td>
                        <td className="py-3.5 px-4">
                          {isSuccess && (
                            <span className="badge-success px-3 py-0.5 text-[12px] font-medium">
                              Success
                            </span>
                          )}
                          {isFailed && (
                            <span className="badge-failed px-3 py-0.5 text-[12px] font-medium">
                              Failed
                            </span>
                          )}
                          {isRetried && (
                            <span className="badge-retried px-3 py-0.5 text-[12px] font-medium">
                              Retried
                            </span>
                          )}
                          {isInProgress && (
                            <span className="badge-warning px-3 py-0.5 text-[12px] font-medium">
                              In-progress
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button className="px-3 py-1 rounded-[10px] action-control text-[#FFFFFF] text-[12px] hover:border-[rgba(168,85,247,0.35)] transition-all">
                            {isFailed ? 'Debug' : isRetried ? 'Restart' : 'View Data'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Right Column: Failure Analysis Card */}
          <div className="xl:col-span-1 rounded-[16px] bg-[#141220] border border-white/[0.08] p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-medium text-[#FFFFFF]">Failure Analysis</h3>
                <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[#9E9BB2]">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Alert 1 */}
              <div className="p-3.5 rounded-[12px] bg-[#181528] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#F87171] text-[13px] font-medium">UPI Android 14</span>
                  <span className="badge-failed px-2 py-0.5 text-[11px]">Highlight</span>
                </div>
                <p className="text-[12px] text-[#9E9BB2] leading-snug">
                  Billing workflows taking 33% longer on Android 14 UPI gateways.
                </p>
              </div>

              {/* Alert 2 */}
              <div className="p-3.5 rounded-[12px] bg-[#181528] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#FBBF24] text-[13px] font-medium">Auto-route</span>
                  <span className="badge-warning px-2 py-0.5 text-[11px]">System</span>
                </div>
                <p className="text-[12px] text-[#9E9BB2] leading-snug">
                  12 support tickets can be auto-routed to priority refund queue.
                </p>
              </div>

              {/* Alert 3 */}
              <div className="p-3.5 rounded-[12px] bg-[#181528] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#60A5FA] text-[13px] font-medium">Validation</span>
                  <span className="badge-retried px-2 py-0.5 text-[11px]">Quick debug</span>
                </div>
                <p className="text-[12px] text-[#9E9BB2] leading-snug">
                  Document workflow has repeat errors in step 3 verification.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08] mt-4">
              <button
                onClick={() => navigate('/incidents/INC-2026-084')}
                className="w-full py-2.5 rounded-[12px] bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-[#FFFFFF] font-medium text-[13px] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Launch Causal Workspace</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Inspection Drawer */}
      <Drawer
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.id || 'Log Detail'}
        description={`Source Channel: ${selectedItem?.channel?.replace(/_/g, ' ')}`}
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="p-4 rounded-[14px] bg-[#181528] border border-white/[0.08] space-y-2">
              <span className="text-[11px] font-mono uppercase text-[#A8A3BA] font-medium">Original Log Data</span>
              <p className="text-[14px] text-[#FFFFFF] leading-relaxed">"{selectedItem.text}"</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-[13px] font-medium text-[#9E9BB2]">Extracted Metadata</h4>
              <div className="p-3 rounded-[12px] bg-[#141220] flex items-center justify-between text-[13px]">
                <span className="text-[#9E9BB2]">Customer Reference</span>
                <span className="font-mono text-[#FFFFFF]">{selectedItem.customerRef}</span>
              </div>
              <div className="p-3 rounded-[12px] bg-[#141220] flex items-center justify-between text-[13px]">
                <span className="text-[#9E9BB2]">Customer Name</span>
                <span className="text-[#FFFFFF]">{selectedItem.customerName}</span>
              </div>
              {selectedItem.platform && (
                <div className="p-3 rounded-[12px] bg-[#141220] flex items-center justify-between text-[13px]">
                  <span className="text-[#9E9BB2]">Device Platform</span>
                  <span className="font-mono text-[#A8A3BA]">{selectedItem.platform}</span>
                </div>
              )}
            </div>

            {selectedItem.incidentId && (
              <div className="pt-2">
                <button
                  onClick={() => navigate(`/incidents/${selectedItem.incidentId}`)}
                  className="w-full py-2.5 rounded-[12px] bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white font-medium text-[13px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Open Incident Case {selectedItem.incidentId} <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default FeedbackPage;
