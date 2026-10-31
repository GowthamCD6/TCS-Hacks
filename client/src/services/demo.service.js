import { apiClient, longApiClient } from './api';

export const demoService = {
  async getClock() {
    try {
      const res = await apiClient.get('/demo/clock');
      return res.data?.data || res.data || {};
    } catch {
      return { sim_now: new Date().toISOString() };
    }
  },

  async advanceClock(minutes) {
    const res = await apiClient.post('/demo/advance-clock', { minutes });
    return res.data?.data || res.data || {};
  },

  async getScenarios() {
    try {
      const res = await apiClient.get('/demo/scenarios');
      return res.data?.data || res.data || [];
    } catch {
      return [
        { name: 'hotfix_deployed', label: 'Hotfix Deployed (v2.3.1)' },
        { name: 'ios_complaints', label: 'iOS Complaints Emerge' },
        { name: 'telemetry_missing', label: 'Telemetry Gap Introduced' },
        { name: 'support_transcripts', label: 'Support Transcripts Ingested' },
        { name: 'rollback_rejected', label: 'Rollback Rejected' },
        { name: 'relapse', label: 'Relapse / Regression Spike' },
      ];
    }
  },

  async runScenario(name) {
    const res = await longApiClient.post(`/demo/scenario/${name}`);
    return res.data?.data || res.data || {};
  },

  async runDetection() {
    const res = await longApiClient.post('/demo/run-detection');
    return res.data?.data || res.data || {};
  },

  async resetDemo() {
    const res = await apiClient.post('/demo/reset');
    return res.data?.data || res.data || {};
  },
};

