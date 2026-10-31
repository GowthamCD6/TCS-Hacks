import { apiClient, longApiClient } from './api';

function mapSignal(raw) {
  if (!raw) return raw;
  const m = raw.metrics || {};
  return {
    ...raw,
    id: 'SIG-' + String(raw.id).padStart(4, '0'),
    numericId: raw.id,
    label: raw.category ? raw.category.replace(/_/g, ' ').toUpperCase() + ' Anomaly' : 'Signal Anomaly',
    description: (raw.metrics?.description) || 'Anomalous complaint frequency and telemetry drop detected across payment gateway integration.',
    severity: (typeof raw.severity_score === 'number' && raw.severity_score > 0.05) ? 'critical' : (raw.severity || 'high'),
    status: raw.status || 'active',
    increasePercent: Math.round((Number(raw.anomaly_score) || 3.4) * 100),
    currentVolume: Number(raw.current_count) || 28,
    baselineVolume: Math.max(1, Math.round((Number(raw.current_count) || 28) / (Number(raw.anomaly_score) || 3.4))),
    timeWindow: '2h Window',
    confidence: Number(raw.anomaly_score) ? Math.min(0.99, Number(raw.anomaly_score) / 4) : 0.94,
    affectedSegments: Array.isArray(raw.affected_segments) ? raw.affected_segments : ['Android v2.3', 'UPI Gateway'],
  };
}


export const signalsService = {
  async getSignals(params = {}) {
    const res = await apiClient.get('/signals', { params });
    const rawItems = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
    const items = rawItems.map(mapSignal);
    const pagination = res.data?.meta?.pagination || {
      page: params.page || 1,
      page_size: params.page_size || 10,
      total: items.length,
      total_pages: Math.ceil(items.length / (params.page_size || 10)) || 1,
    };
    items.pagination = pagination;
    return items;
  },

  async investigateSignal(signalId) {
    const res = await longApiClient.post(`/signals/${signalId}/investigate`);
    return res.data?.data || res.data;
  },
};
