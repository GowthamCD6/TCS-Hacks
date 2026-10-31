import { apiClient } from './api';

export const feedbackService = {
  async getFeedback(params = {}) {
    const res = await apiClient.get('/feedback', { params });
    const items = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
    const pagination = res.data?.meta?.pagination || {
      page: params.page || 1,
      page_size: params.page_size || 10,
      total: items.length,
      total_pages: Math.ceil(items.length / (params.page_size || 10)) || 1,
    };
    return { items, pagination };
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
