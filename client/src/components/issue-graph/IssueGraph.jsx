import React, { useState, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { WorkflowNode } from './CustomNodes';
import { Card } from '../common/Card';
import { Drawer } from '../common/Drawer';
import { Layers, Info } from 'lucide-react';

const initialNodes = [
  {
    id: 'node-sources',
    type: 'workflowNode',
    position: { x: 50, y: 160 },
    data: {
      category: 'fact',
      title: 'Customer Feedback Streams',
      subtitle: 'Mobile App (48%), Support (24%), Social (5%)',
      count: '148',
      badge: 'Observed',
      badgeColor: 'blue',
      details: {
        totalFeedbackCollected: 148,
        channelsInvolved: ['Mobile App', 'Support Desk', 'Twitter', 'Google Forms'],
        firstRecordedSpike: '07:49 UTC',
      },
    },
  },
  {
    id: 'node-cluster',
    type: 'workflowNode',
    position: { x: 360, y: 160 },
    data: {
      category: 'fact',
      title: 'Issue Cluster: Captured Without Order',
      subtitle: 'NLP semantic grouping of UPI timeout errors',
      count: '98%',
      badge: 'Clustered',
      badgeColor: 'purple',
      details: {
        errorFingerprint: 'ERR_UPI_TIMEOUT_NO_ORDER_REC',
        clusteringAlgorithm: 'SentenceTransformer Embeddings (Cosine Sim > 0.88)',
        confidence: 0.96,
      },
    },
  },
  {
    id: 'node-segment',
    type: 'workflowNode',
    position: { x: 670, y: 60 },
    data: {
      category: 'fact',
      title: 'Segment: Android 14 on v2.3',
      subtitle: '92.0x lift ratio vs baseline iOS/Web cohort',
      count: '336',
      badge: '92x Lift',
      badgeColor: 'rose',
      details: {
        targetSegment: 'Android 14 on Release v2.3 (Build 8901)',
        comparisonCohort: 'iOS v2.3 & Web Desktop',
        pScore: 'p < 0.0001 (Rank #1)',
      },
    },
  },
  {
    id: 'node-change',
    type: 'workflowNode',
    position: { x: 670, y: 260 },
    data: {
      category: 'fact',
      title: 'Operational Change: PR #4182',
      subtitle: 'Amended client socket timeout from 30s to 8s',
      count: '07:45',
      badge: 'Deployed',
      badgeColor: 'amber',
      details: {
        gitCommit: '91bf42e0: Optimize UPI intent socket timeout parameter',
        author: 'core-platform-deployer',
        deploymentTrack: 'Google Play Production Staged Rollout',
      },
    },
  },
  {
    id: 'node-hypothesis',
    type: 'workflowNode',
    position: { x: 990, y: 160 },
    data: {
      category: 'hypothesis',
      title: 'Root Cause Hypothesis HYP-01',
      subtitle: 'Client 8s timeout aborts before 9.4s webhook SLA',
      count: '96%',
      badge: 'Supported',
      badgeColor: 'purple',
      details: {
        temporalMatch: 'Supported (+4 min after deploy)',
        segmentSpecificity: 'Supported (Android 14 on v2.3)',
        operationalTelemetry: 'Confirmed by Datadog APM Traces',
        doseResponse: 'Confirmed (Scaled with rollout %)',
      },
    },
  },
  {
    id: 'node-impact',
    type: 'workflowNode',
    position: { x: 1300, y: 60 },
    data: {
      category: 'fact',
      title: 'Estimated Business Impact',
      subtitle: '₹98.5k direct captured payments + ₹43.5k risk',
      count: '₹1.42L',
      badge: 'At Risk',
      badgeColor: 'rose',
      details: {
        affectedCustomers: 342,
        affectedOrders: 389,
        directStrandedFunds: '₹98,500',
        reversalExposure: '₹43,500',
      },
    },
  },
  {
    id: 'node-action',
    type: 'workflowNode',
    position: { x: 1300, y: 260 },
    data: {
      category: 'action',
      title: 'Intervention: Rollback + Reconcile',
      subtitle: 'ConfigCat toggle + simulated batch order creation',
      count: '2 min',
      badge: 'Approved',
      badgeColor: 'emerald',
      details: {
        primaryAction: 'Rollback ENABLE_UPI_SOCKET_TIMEOUT_V2 to 30s',
        secondaryAction: 'Simulated Order Rehydration Batch #1 (50 users)',
        approvalRecord: 'Approved by Liam Anderson',
      },
    },
  },
  {
    id: 'node-outcome',
    type: 'workflowNode',
    position: { x: 1610, y: 160 },
    data: {
      category: 'outcome',
      title: 'Verified Recovery Outcome',
      subtitle: 'Payment success restored to 98.1%, complaints -88%',
      count: '98.1%',
      badge: 'Target Met',
      badgeColor: 'emerald',
      details: {
        kpiRecoveryWindow: '60 minutes post-intervention',
        currentErrorRate: '0.18% (down from 6.8%)',
        recoveryStatus: 'Verification Succeeded',
      },
    },
  },
];

const initialEdges = [
  { id: 'e1', source: 'node-sources', target: 'node-cluster', animated: true },
  { id: 'e2', source: 'node-cluster', target: 'node-segment', animated: true },
  { id: 'e3', source: 'node-cluster', target: 'node-change', animated: true },
  { id: 'e4', source: 'node-segment', target: 'node-hypothesis', animated: true },
  { id: 'e5', source: 'node-change', target: 'node-hypothesis', animated: true },
  { id: 'e6', source: 'node-hypothesis', target: 'node-impact', animated: true },
  { id: 'e7', source: 'node-hypothesis', target: 'node-action', animated: true },
  { id: 'e8', source: 'node-impact', target: 'node-outcome', animated: true },
  { id: 'e9', source: 'node-action', target: 'node-outcome', animated: true },
];

export const IssueGraph = () => {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);

  const nodeTypes = useMemo(() => ({ workflowNode: WorkflowNode }), []);

  const handleNodeClick = (_, node) => {
    setSelectedNode(node);
  };

  return (
    <Card className="p-0 overflow-hidden border border-purple-500/20">
      <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#120d24]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">CX Issue Relationship Graph</h3>
            <p className="text-xs text-slate-400">
              Interactive causal lineage from incoming feedback to verified recovery outcome
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-blue-300">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Observed Facts
          </span>
          <span className="flex items-center gap-1.5 text-purple-300">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Root Cause Hypothesis
          </span>
          <span className="flex items-center gap-1.5 text-pink-300">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500" /> Interventions
          </span>
          <span className="flex items-center gap-1.5 text-emerald-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Recovery Outcome
          </span>
        </div>
      </div>

      <div className="h-[480px] w-full bg-[#0d091a] relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          minZoom={0.2}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#a855f7" gap={24} size={1} className="opacity-15" />
          <Controls className="bg-[#150f2b] border border-purple-500/30 text-white fill-white rounded-xl shadow-lg" />
        </ReactFlow>
      </div>

      {/* Node Detail Drawer */}
      <Drawer
        isOpen={!!selectedNode}
        onClose={() => setSelectedNode(null)}
        title={selectedNode?.data?.title || 'Node Inspection'}
        description={`Category: ${(selectedNode?.data?.category || '').toUpperCase()}`}
      >
        {selectedNode && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <span className="text-xs font-mono uppercase text-purple-300">Description</span>
              <p className="text-sm text-slate-200 mt-1">{selectedNode.data?.subtitle}</p>
            </div>

            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                Extracted Node Attributes
              </h4>
              <div className="space-y-2">
                {Object.entries(selectedNode.data?.details || {}).map(([key, val]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-xs"
                  >
                    <span className="text-slate-400 capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className="font-semibold text-white">
                      {Array.isArray(val) ? val.join(', ') : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-2 text-purple-300 font-semibold">
                <Info className="w-4 h-4" />
                <span>Verification State</span>
              </div>
              <p>
                This node is connected directly to telemetry logs and verified by the autonomous causal reasoning loop.
              </p>
            </div>
          </div>
        )}
      </Drawer>
    </Card>
  );
};

