import { apiClient, longApiClient } from './api';

export const incidentsService = {
  async getDashboardOverview() {
    const res = await apiClient.get('/dashboard/overview');
    return res.data?.data || res.data;
  },

  async getIncidents(params = {}) {
    const res = await apiClient.get('/incidents', { params });
    const items = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
    const pagination = res.data?.meta?.pagination || {
      page: params.page || 1,
      page_size: params.page_size || 10,
      total: items.length,
      total_pages: Math.ceil(items.length / (params.page_size || 10)) || 1,
    };
    return { items, pagination };
  },

  async getIncidentById(id) {
    const res = await apiClient.get(`/incidents/${id}`);
    return res.data?.data || res.data;
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
