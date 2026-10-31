import { apiClient, longApiClient } from './api';

export const simulationService = {
  async getSimulationTest() {
    const res = await apiClient.get('/simulation-test');
    return res.data?.data || res.data;
  },

  async runEvaluation() {
    const res = await longApiClient.post('/demo/evaluate');
    return res.data?.data || res.data;
  },

  async getModels() {
    try {
      const res = await apiClient.get('/models');
      return res.data?.data || res.data;
    } catch {
      return null;
    }
  },
};

