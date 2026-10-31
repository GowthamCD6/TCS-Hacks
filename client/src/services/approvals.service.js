import { apiClient, longApiClient } from './api';

export const approvalsService = {
  async getApprovals(params = {}) {
    const res = await apiClient.get('/approvals', { params });
    const items = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
    const pagination = res.data?.meta?.pagination || {
      page: params.page || 1,
      page_size: params.page_size || 10,
      total: items.length,
      total_pages: Math.ceil(items.length / (params.page_size || 10)) || 1,
    };
    return { items, pagination };
  },

  async approve(approvalId, comments = '') {
    const res = await apiClient.post(`/approvals/${approvalId}/approve`, { comments });
    return res.data?.data || res.data;
  },

  async reject(approvalId, comments) {
    const res = await longApiClient.post(`/approvals/${approvalId}/reject`, { comments });
    return res.data?.data || res.data;
  },

  async getRecommendations(incidentId) {
    if (incidentId) {
      const res = await apiClient.get(`/incidents/${incidentId}/recommendations`);
      return res.data?.data || res.data || [];
    }
    const { items } = await this.getApprovals({ decision: 'pending' });
    return items;
  },
};
