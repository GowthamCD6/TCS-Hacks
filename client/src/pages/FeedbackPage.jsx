import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { feedbackService } from '../services/feedback.service';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Drawer } from '../components/common/Drawer';
import { Skeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import {
  Inbox,
  Filter,
  Search,
  UploadCloud,
  Star,
  ExternalLink,
  ShieldAlert,
  Smartphone,
  Globe,
  FileSpreadsheet,
  Headphones,
  Share2,
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
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);

  const { data: feedbackList = [], isLoading } = useQuery({
    queryKey: ['feedback', channelFilter, sentimentFilter, categoryFilter, search],
    queryFn: () =>
      feedbackService.getFeedback({
        channel: channelFilter,
        sentiment: sentimentFilter,
        category: categoryFilter,
        search,
      }),
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Feedback Inbox</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Multichannel customer feedback normalized with real-time NLP classification & entity extraction
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/ingestion')}
          className="gap-2"
        >
          <UploadCloud className="w-4 h-4" />
          Ingest / Import Data
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3 bg-[#130d24]/90 border border-white/10">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search feedback text, user ID..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Channel Filter */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#140e26] border border-white/10 text-white focus:outline-none focus:border-purple-400"
          >
            <option value="all">All Channels</option>
            <option value="mobile_app">Mobile App</option>
            <option value="website">Website</option>
            <option value="support_ticket">Support Tickets</option>
            <option value="google_forms">Google Forms</option>
            <option value="social_media">Social Media</option>
            <option value="csv">CSV Upload</option>
          </select>

          {/* Sentiment Filter */}
          <select
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#140e26] border border-white/10 text-white focus:outline-none focus:border-purple-400"
          >
            <option value="all">All Sentiments</option>
            <option value="critical">Critical</option>
            <option value="negative">Negative</option>
            <option value="neutral">Neutral</option>
            <option value="positive">Positive</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#140e26] border border-white/10 text-white focus:outline-none focus:border-purple-400"
          >
            <option value="all">All Categories</option>
            <option value="Payment Processing">Payment Processing</option>
            <option value="Checkout Delivery">Checkout Delivery</option>
            <option value="Authentication">Authentication</option>
            <option value="Order Tracking">Order Tracking</option>
            <option value="Product Catalog">Product Catalog</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10" count={6} />
          </div>
        ) : feedbackList.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No feedback records match filters"
            description="Try modifying search keywords or reset filter dropdowns to view records."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearch('');
              setChannelFilter('all');
              setSentimentFilter('all');
              setCategoryFilter('all');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#120d24] text-slate-400 uppercase text-[10px] font-mono border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Feedback Verbatim</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Sentiment</th>
                  <th className="py-3 px-4">Urgency</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {feedbackList.map((item) => {
                  const ChannelIcon = CHANNEL_ICONS[item.channel] || Globe;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="hover:bg-purple-900/10 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-purple-300">
                        {item.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 capitalize text-slate-300 text-xs">
                          <ChannelIcon className="w-3.5 h-3.5 text-purple-400" />
                          <span>{item.channel.replace(/_/g, ' ')}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-white block">{item.customerName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {item.customerRef}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                        <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                          {item.text}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center text-amber-400 text-xs">
                          <Star className="w-3.5 h-3.5 fill-current mr-1" />
                          <span className="font-bold">{item.rating}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300">{item.category}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant="severity" value={item.sentiment}>
                          {item.sentiment}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="severity" value={item.urgency}>
                          {item.urgency}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="status" value={item.status}>
                          {item.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {formatDateTime(item.timestamp)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Detail Drawer */}
      <Drawer
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.id || 'Feedback Detail'}
        description={`Reported via ${selectedItem?.channel.replace(/_/g, ' ')}`}
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
              <span className="text-[10px] font-mono uppercase text-purple-300">Original Feedback</span>
              <p className="text-sm text-slate-100 leading-relaxed font-medium">"{selectedItem.text}"</p>
            </div>

            {/* Extracted Entities */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                Extracted Operational Entities
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
                  <span className="text-slate-400">Customer Reference</span>
                  <span className="font-bold text-white font-mono">{selectedItem.customerRef}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
                  <span className="text-slate-400">Customer Name</span>
                  <span className="font-bold text-white">{selectedItem.customerName}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
                  <span className="text-slate-400">Contact / Email</span>
                  <span className="font-mono text-purple-300">{selectedItem.maskedEmail}</span>
                </div>
                {selectedItem.platform && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
                    <span className="text-slate-400">Runtime Client</span>
                    <span className="font-mono text-white">
                      {selectedItem.platform} (v{selectedItem.appVersion})
                    </span>
                  </div>
                )}
                {selectedItem.extractedEntities?.errorCode && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs">
                    <span className="text-rose-300">Detected Error Signature</span>
                    <span className="font-mono font-bold text-rose-300">
                      {selectedItem.extractedEntities.errorCode}
                    </span>
                  </div>
                )}
                {selectedItem.extractedEntities?.amount && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
                    <span className="text-slate-400">Transaction Value</span>
                    <span className="font-mono font-bold text-white">
                      ₹{selectedItem.extractedEntities.amount}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Linked Incident */}
            {selectedItem.incidentId && (
              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-purple-400" />
                    Linked Incident Case
                  </span>
                  <span className="font-mono text-xs text-purple-300">{selectedItem.incidentId}</span>
                </div>
                <p className="text-xs text-slate-300">
                  This complaint has been clustered into active incident investigation #{selectedItem.incidentId}.
                </p>
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => navigate(`/incidents/${selectedItem.incidentId}`)}
                  >
                    Open Incident Workspace <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};
export default FeedbackPage;

