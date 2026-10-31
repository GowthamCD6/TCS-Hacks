import { apiClient } from './api';

function mapFeedback(raw) {
  if (!raw) return raw;
  return {
    ...raw,
    customerRef: raw.customer_ref || ('CUST-' + String(raw.id).padStart(4, '0')),
    customerName: raw.customer_name || 'Customer ' + (raw.customer_ref || raw.id),
    platform: raw.channel || raw.source || 'Mobile App',
    incidentId: raw.incident_id ? ('INC-' + String(raw.incident_id).padStart(4, '0')) : null,
    timestamp: raw.event_timestamp || raw.created_at || '2026-10-31T08:00:00Z',
  };
}


export const feedbackService = {
  async getFeedback(params = {}) {
    const res = await apiClient.get('/feedback', { params });
    const rawItems = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
    const items = rawItems.map(mapFeedback);
    const pagination = res.data?.meta?.pagination || {
      page: params.page || 1,
      page_size: params.page_size || 10,
      total: items.length,
      total_pages: Math.ceil(items.length / (params.page_size || 10)) || 1,
    };
    items.pagination = pagination;
    return items;
  },

  async getFeedbackById(id) {
    const res = await apiClient.get(`/feedback/${id}`);
    return res.data?.data || res.data;
  },

  async submitWebsiteFeedback(payload) {
    const res = await apiClient.post('/feedback/website', payload);
    return res.data?.data || res.data;
  },
};
