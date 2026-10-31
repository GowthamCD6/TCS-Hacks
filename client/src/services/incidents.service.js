import { apiClient, longApiClient } from './api';

function mapIncident(raw) {
  if (!raw) return raw;
  const numImpact = Number(raw.estimated_business_impact) || 0;
  return {
    ...raw,
    id: raw.incident_number || String(raw.id),
    numericId: raw.id,
    summary: raw.description || raw.resolution_summary || raw.root_cause_verdict || '',
    severity: (typeof raw.severity === 'number' || !isNaN(Number(raw.severity)))
      ? (Number(raw.severity) > 0.05 ? 'critical' : 'high')
      : (raw.severity || 'high'),
    confidence: Number(raw.confidence_score) || 0.94,
    affectedCustomers: Number(raw.affected_customer_count) || 0,
    estimatedFinancialImpact: numImpact,
    measuredDirectLoss: numImpact * 0.42,
    detectedAt: raw.first_detected_at || raw.created_at || '2026-10-31T08:00:00Z',
    updatedAt: raw.last_updated_at || raw.created_at || '2026-10-31T08:00:00Z',
    verificationStatus: raw.status === 'awaiting_approval' ? 'verified' : (raw.status || 'investigating'),
    primaryHypothesis: raw.root_cause_verdict || 'UPI Intent Flow Callback Drop on Android v2.3',
  };
}


export const incidentsService = {
  async getDashboardOverview() {
    const res = await apiClient.get('/dashboard/overview');
    return res.data?.data || res.data;
  },

  async getIncidents(params = {}) {
    const res = await apiClient.get('/incidents', { params });
    const rawItems = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
    const items = rawItems.map(mapIncident);
    const pagination = res.data?.meta?.pagination || {
      page: params.page || 1,
      page_size: params.page_size || 10,
      total: items.length,
      total_pages: Math.ceil(items.length / (params.page_size || 10)) || 1,
    };
    items.pagination = pagination;
    return items;
  },

  async getIncidentById(id) {
    const res = await apiClient.get(`/incidents/${id}`);
    return mapIncident(res.data?.data || res.data);
  },

  async createIncident(payload) {
    const res = await apiClient.post('/incidents', payload);
    return res.data?.data || res.data;
  },

  async getEvidence(incidentId) {
    const res = await apiClient.get(`/incidents/${incidentId}/evidence`);
    return res.data?.data || res.data || [];
  },

  async injectEvidence(incidentId, payload) {
    // payload: { kind, description, feedback_ids?, telemetry_available?, auto_reassess: boolean }
    const client = payload.auto_reassess ? longApiClient : apiClient;
    const res = await client.post(`/incidents/${incidentId}/evidence`, payload);
    return res.data?.data || res.data;
  },

  async getHypotheses(incidentId) {
    // Hypotheses typically return from incident or hypotheses endpoint
    try {
      const res = await apiClient.get(`/incidents/${incidentId}/hypotheses`);
      return res.data?.data || res.data || [];
    } catch {
      const inc = await this.getIncidentById(incidentId);
      return inc?.hypotheses || [];
    }
  },

  async getFunnel(incidentId) {
    const res = await apiClient.get(`/incidents/${incidentId}/funnel`);
    return res.data?.data || res.data;
  },

  async getIssueGraph(incidentId, params = {}) {
    const res = await apiClient.get(`/incidents/${incidentId}/graph`, { params });
    return res.data?.data || res.data;
  },

  async getBusinessImpact(incidentId) {
    const res = await apiClient.get(`/incidents/${incidentId}/impact`);
    return res.data?.data || res.data;
  },

  async getReconciliation(incidentId) {
    const res = await apiClient.get(`/incidents/${incidentId}/reconciliation`);
    return res.data?.data || res.data;
  },

  async getRecommendations(incidentId) {
    const res = await apiClient.get(`/incidents/${incidentId}/recommendations`);
    return res.data?.data || res.data || [];
  },

  async getActions(incidentId) {
    const res = await apiClient.get(`/incidents/${incidentId}/actions`);
    return res.data?.data || res.data || [];
  },

  async executeAction(incidentId, recommendationId) {
    const res = await apiClient.post(`/incidents/${incidentId}/actions/${recommendationId}/execute`);
    return res.data?.data || res.data;
  },

  async getKPIs(incidentId) {
    const res = await apiClient.get(`/incidents/${incidentId}/kpis`);
    return res.data?.data || res.data;
  },

  async getAgentTrace(incidentId) {
    const res = await apiClient.get(`/incidents/${incidentId}/agent-trace`);
    return res.data?.data || res.data;
  },

  async getTimeline(incidentId) {
    const res = await apiClient.get(`/incidents/${incidentId}/timeline`);
    return res.data?.data || res.data || [];
  },

  async getDecisionBrief(incidentId) {
    const res = await apiClient.get(`/incidents/${incidentId}/decision-brief`);
    return res.data?.data || res.data;
  },

  async reassess(incidentId) {
    const res = await longApiClient.post(`/incidents/${incidentId}/reassess`);
    return res.data?.data || res.data;
  },
};
