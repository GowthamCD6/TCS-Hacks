import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { feedbackService } from '../services/feedback.service';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import {
  UploadCloud,
  FileSpreadsheet,
  Globe,
  Code2,
  Share2,
  CheckCircle2,
  Copy,
} from 'lucide-react';

const SAMPLE_CSV_PREVIEW = [
  { customerRef: 'USR-8902', channel: 'mobile_app', rating: '1', text: 'Money deducted via UPI but no order was created on Android 14', category: 'Payment Processing' },
  { customerRef: 'USR-7731', channel: 'mobile_app', rating: '1', text: 'App crashed right after fingerprint auth. Bank sent debit notification', category: 'Payment Processing' },
  { customerRef: 'USR-6612', channel: 'website', rating: '4', text: 'Checkout was fast and clean, but package delivery was 1 day late', category: 'Order Tracking' },
];

export const IngestionPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('csv');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const importMutation = useMutation({
    mutationFn: () => feedbackService.importFeedbackBatch(SAMPLE_CSV_PREVIEW),
    onSuccess: (data) => {
      setImportSuccess(data.importedCount);
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
    },
  });

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFileName(e.dataTransfer.files[0].name);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFileName(e.target.files[0].name);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Data Ingestion Hub</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Connect feedback sources: Website forms, Google Forms Apps Script bridge, CSV batch uploads, and REST APIs
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-purple-500/20">
        {[
          { key: 'csv', label: 'CSV Batch Upload', icon: UploadCloud },
          { key: 'google-forms', label: 'Google Forms Webhook', icon: FileSpreadsheet },
          { key: 'website', label: 'Website Feedback Form', icon: Globe },
          { key: 'api', label: 'REST API Ingestion', icon: Code2 },
          { key: 'external', label: 'External Connectors', icon: Share2 },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-t border-x cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#150f2b] text-purple-300 border-purple-500/40 border-b-2 border-b-[#150f2b]'
                  : 'text-slate-400 hover:text-white border-transparent hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: CSV Upload */}
      {activeTab === 'csv' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-base font-bold text-white mb-2">Upload Batch Feedback CSV</h3>
            <p className="text-xs text-slate-400 mb-4">
              Supported columns: <code>customerRef</code>, <code>channel</code>, <code>rating</code>, <code>text</code>, <code>category</code>
            </p>

            {/* Drag & Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                dragActive
                  ? 'border-purple-400 bg-purple-500/10'
                  : 'border-white/10 bg-white/[0.02] hover:border-purple-500/30'
              }`}
            >
              <UploadCloud className="w-10 h-10 text-purple-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-white">
                {selectedFileName ? selectedFileName : 'Drag and drop your feedback CSV here, or browse'}
              </p>
              <p className="text-xs text-slate-400 mt-1">Maximum file size: 10MB (.csv format)</p>

              <label className="mt-4 inline-block">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className="px-4 py-2 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-semibold cursor-pointer hover:bg-purple-600/40 transition-colors">
                  Select CSV File
                </span>
              </label>
            </div>

            {/* Preview Section */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Data Preview (3 Records Detected)
                </h4>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={importMutation.isPending}
                  onClick={() => importMutation.mutate()}
                  className="gap-1.5"
                >
                  <UploadCloud className="w-4 h-4" />
                  Process & Import Records
                </Button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#0d0918]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-slate-400 font-mono text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Customer Ref</th>
                      <th className="py-2.5 px-3">Channel</th>
                      <th className="py-2.5 px-3">Rating</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Feedback Snippet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {SAMPLE_CSV_PREVIEW.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 font-mono text-purple-300">{row.customerRef}</td>
                        <td className="py-2.5 px-3 text-slate-300">{row.channel}</td>
                        <td className="py-2.5 px-3 font-bold text-amber-400">{row.rating}★</td>
                        <td className="py-2.5 px-3 text-slate-300">{row.category}</td>
                        <td className="py-2.5 px-3 text-slate-200 truncate max-w-xs">{row.text}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Success alert */}
            {importSuccess && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Successfully imported and clustered {importSuccess} feedback records!</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/feedback')}
                >
                  Open Feedback Inbox
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab 2: Google Forms */}
      {activeTab === 'google-forms' && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Google Forms Webhook Integration</h3>
              <p className="text-xs text-slate-400">
                Forward customer surveys automatically via Google Apps Script bridge
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 text-xs text-slate-300">
            <span className="font-bold text-white block">Architecture Requirement:</span>
            <p className="leading-relaxed">
              Google Forms does not support native outbound webhook POST requests directly. RecoverIQ utilizes a lightweight <strong>Google Apps Script</strong> bound to your Google Form's response sheet. Whenever a respondent submits feedback, Apps Script sends an authenticated JSON payload to RecoverIQ's webhook receiver.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-400">
                Google Apps Script Snippet (`Code.gs`)
              </span>
              <button
                onClick={() =>
                  handleCopy(`function onFormSubmit(e) {
  var url = "http://localhost:5000/api/v1/ingest/google-forms";
  var payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    channel: "google_forms",
    customerRef: "USR-GF-" + Math.floor(Math.random() * 9000),
    text: e.values[1],
    rating: parseInt(e.values[2]) || 3
  });
  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: payload
  });
}`)
                }
                className="text-xs font-mono text-purple-300 hover:text-purple-200 flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedCode ? 'Copied!' : 'Copy Script'}
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-[#090611] border border-white/10 font-mono text-xs text-purple-200 overflow-x-auto">
{`function onFormSubmit(e) {
  var url = "http://localhost:5000/api/v1/ingest/google-forms";
  var payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    channel: "google_forms",
    customerRef: "USR-GF-" + Math.floor(Math.random() * 9000),
    text: e.values[1],
    rating: parseInt(e.values[2]) || 3
  });
  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: payload
  });
}`}
            </pre>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs">
            <span className="text-purple-200">Webhook Receiver Status:</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Active (Listening on :5000)
            </span>
          </div>
        </Card>
      )}

      {/* Tab 3: Website Feedback Form */}
      {activeTab === 'website' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Public Website Feedback Widget</h3>
              <p className="text-xs text-slate-400">
                Embeddable modal and inline customer experience collector
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-2">
            <p>
              Embed the lightweight RecoverIQ feedback script on your checkout, order history, and account settings screens to intercept rage clicks and error dialogues.
            </p>
            <div className="pt-2">
              <code className="text-purple-300 font-mono bg-black/40 p-2 rounded block">
                &lt;script src="https://cdn.recoveriq.internal/v1/widget.js" data-app-id="tcs-hacks-demo"&gt;&lt;/script&gt;
              </code>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 4: REST API */}
      {activeTab === 'api' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">REST Ingestion Endpoint</h3>
              <p className="text-xs text-slate-400">
                Direct programmatic ingestion from microservices and backend queues
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono uppercase text-slate-400">cURL Specification</span>
            <pre className="p-4 rounded-xl bg-[#090611] border border-white/10 font-mono text-xs text-purple-200 overflow-x-auto">
{`curl -X POST "http://localhost:5000/api/v1/feedback/ingest" \\
  -H "Content-Type: application/json" \\
  -d '{
    "channel": "mobile_app",
    "customerRef": "USR-9912",
    "text": "Stripe timeout during checkout on Android v3.4.1",
    "rating": 1,
    "platform": "Android 14",
    "appVersion": "3.4.1"
  }'`}
            </pre>
          </div>
        </Card>
      )}

      {/* Tab 5: External Connectors */}
      {activeTab === 'external' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Connected & Simulated Feeds</h3>
              <p className="text-xs text-slate-400">Status of enterprise multi-channel ingestion sources</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: 'Google Play Reviews Stream', status: 'Simulated Feed', isReal: false },
              { name: 'Apple App Store RSS Feed', status: 'Simulated Feed', isReal: false },
              { name: 'Zendesk / Freshdesk API', status: 'Simulated Feed', isReal: false },
              { name: 'CSV Batch Pipeline', status: 'Active (Live)', isReal: true },
              { name: 'In-Memory Mock Store', status: 'Active (Live)', isReal: true },
            ].map((source, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-white">{source.name}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    source.isReal
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                  }`}
                >
                  {source.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
export default IngestionPage;

