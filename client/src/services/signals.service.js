import { apiClient, longApiClient } from './api';

export const signalsService = {
  async getSignals(params = {}) {
    const res = await apiClient.get('/signals', { params });
    const items = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
    const pagination = res.data?.meta?.pagination || {
      page: params.page || 1,
      page_size: params.page_size || 10,
      total: items.length,
      total_pages: Math.ceil(items.length / (params.page_size || 10)) || 1,
    };
    return { items, pagination };
  },

  async investigateSignal(signalId) {
    const res = await longApiClient.post(`/signals/${signalId}/investigate`);
    return res.data?.data || res.data;
  },
};
