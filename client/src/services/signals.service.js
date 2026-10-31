import { apiClient, USE_MOCKS } from './api';
import { mockEmergingSignals } from '../mocks/data';

let signalsStore = [...mockEmergingSignals];

export const signalsService = {
  async getSignals() {
    if (USE_MOCKS) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      return [...signalsStore];
    }
    const response = await apiClient.get('/signals');
    return response.data;
  },

  async getSignalById(id) {
    if (USE_MOCKS) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return signalsStore.find((s) => s.id === id);
    }
    const response = await apiClient.get(`/signals/${id}`);
    return response.data;
  },

  async investigateSignal(id) {
    if (USE_MOCKS) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const target = signalsStore.find((s) => s.id === id);
      if (target) {
        target.status = 'investigating';
        if (!target.incidentId) {
          target.incidentId = 'INC-2026-084';
        }
      }
      return {
        signal: target || signalsStore[0],
        incidentId: target?.incidentId || 'INC-2026-084',
      };
    }
    const response = await apiClient.post(`/signals/${id}/investigate`);
    return response.data;
  },
};

