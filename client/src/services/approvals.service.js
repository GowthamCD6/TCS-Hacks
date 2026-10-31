import { apiClient, longApiClient } from './api';

function mapApproval(raw) {
  if (!raw) return raw;
  const rationale = (raw.rationale && typeof raw.rationale === 'object') ? JSON.stringify(raw.rationale) : (raw.rationale || '');
  return {
    ...raw,
    id: raw.id,
    approvalStatus: raw.decision || raw.approval_decision || 'pending',
    title: raw.title || ('Recovery Action #' + raw.id),
    actionType: raw.action_type || raw.action_key || 'simulate_refund',
    riskLevel: raw.risk_level || 'medium',
    expectedCustomerBenefit: raw.expected_customer_benefit || (raw.action_key === 'disable_feature_flag' ? 'Immediate error rate drop (<1%)' : 'Reconciliation & 100% funds restored'),
    estimatedCost: Number(raw.estimated_cost) || 0,
    implementationTimeMinutes: Number(raw.implementation_time_minutes) || 5,
    rationale: raw.comments || rationale || 'Automated multi-agent recovery intervention requiring human sign-off.',
    rejectionReason: raw.rejection_reason || '',
    alternativeAction: raw.alternative_action || '',
  };
}


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
    items.pagination = pagination;
    return items;
  },

  async approve(approvalId, comments = '') {
    const res = await apiClient.post(`/approvals/${approvalId}/approve`, { comments });
    return res.data?.data || res.data;
  },

  async reject(approvalId, comments = '') {
    const res = await longApiClient.post(`/approvals/${approvalId}/reject`, { comments });
    return res.data?.data || res.data;
  },

  async approveRecommendation(recommendationId, comments = '') {
    // If it's an approval record id, use approve endpoint
    return this.approve(recommendationId, comments);
  },

  async rejectRecommendation(recommendationId, comments = '') {
    return this.reject(recommendationId, comments);
  },

  async getRecommendations(incidentId) {
    if (incidentId) {
      const res = await apiClient.get(`/incidents/${incidentId}/recommendations`);
      const items = res.data?.data || res.data || [];
      return items.map((r) => ({
        ...r,
        approvalStatus: r.approval_decision || (r.requires_approval ? 'pending' : 'approved'),
        riskLevel: r.risk_level,
        actionType: r.action_type,
      }));
    }
    const raw = await this.getApprovals({ decision: 'pending' });
    const items = Array.isArray(raw) ? raw : (raw?.items || []);
    return items.map(mapApproval);
  },

  async getExecutedActions(incidentId) {
    if (incidentId) {
      const res = await apiClient.get(`/incidents/${incidentId}/actions`);
      return res.data?.data || res.data || [];
    }
    // Retrieve latest incident and get actions
    try {
      const incRes = await apiClient.get('/incidents', { params: { page_size: 1 } });
      const firstInc = incRes.data?.data?.[0] || incRes.data?.[0];
      if (firstInc?.id) {
        const res = await apiClient.get(`/incidents/${firstInc.id}/actions`);
        return res.data?.data || res.data || [];
      }
    } catch {
      // return empty if none yet
    }
    return [];
  },
};
