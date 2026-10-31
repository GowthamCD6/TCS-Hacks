import { apiClient, USE_MOCKS } from './api';
import { mockFeedbackItems } from '../mocks/data';

let feedbackStore = [...mockFeedbackItems];

export const feedbackService = {
  async getFeedback(params = {}) {
    if (USE_MOCKS) {
      await new Promise((resolve) => setTimeout(resolve, 180));
      let filtered = [...feedbackStore];

      if (params.channel && params.channel !== 'all') {
        filtered = filtered.filter((item) => item.channel === params.channel);
      }
      if (params.sentiment && params.sentiment !== 'all') {
        filtered = filtered.filter((item) => item.sentiment === params.sentiment);
      }
      if (params.category && params.category !== 'all') {
        filtered = filtered.filter((item) => item.category === params.category);
      }
      if (params.urgency && params.urgency !== 'all') {
        filtered = filtered.filter((item) => item.urgency === params.urgency);
      }
      if (params.status && params.status !== 'all') {
        filtered = filtered.filter((item) => item.status === params.status);
      }
      if (params.search) {
        const query = params.search.toLowerCase();
        filtered = filtered.filter(
          (item) =>
            item.text.toLowerCase().includes(query) ||
            item.customerName.toLowerCase().includes(query) ||
            item.id.toLowerCase().includes(query) ||
            item.customerRef.toLowerCase().includes(query)
        );
      }

      return filtered;
    }

    const response = await apiClient.get('/feedback', { params });
    return response.data;
  },

  async getFeedbackById(id) {
    if (USE_MOCKS) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return feedbackStore.find((item) => item.id === id);
    }
    const response = await apiClient.get(`/feedback/${id}`);
    return response.data;
  },

  async importFeedbackBatch(items = []) {
    if (USE_MOCKS) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const newItems = items.map((item, idx) => ({
        id: `FB-IMP-${Date.now()}-${idx}`,
        timestamp: new Date().toISOString(),
        channel: item.channel || 'csv',
        customerRef: item.customerRef || `USR-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: item.customerName || 'Imported Customer',
        maskedEmail: item.maskedEmail || 'customer@example.com',
        text: item.text || 'Imported feedback text',
        rating: item.rating || 3,
        category: item.category || 'Payment Processing',
        sentiment: item.sentiment || 'neutral',
        urgency: item.urgency || 'medium',
        status: 'analyzed',
        ...item,
      }));
      feedbackStore = [...newItems, ...feedbackStore];
      return { importedCount: newItems.length };
    }

    const response = await apiClient.post('/feedback/import', { items });
    return response.data;
  },
};

