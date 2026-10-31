import { apiClient, USE_MOCKS } from './api';
import { mockKPIMonitoring } from '../mocks/data';

let kpiStore = [...mockKPIMonitoring];

export const kpisService = {
  async getKPIMonitoring(incidentId) {
    if (USE_MOCKS) {
      await new Promise((resolve) => setTimeout(resolve, 120));
      return [...kpiStore];
    }
    const response = await apiClient.get('/kpis/monitoring', {
      params: { incidentId },
    });
    return response.data;
  },

  async refreshMeasurements() {
    if (USE_MOCKS) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      kpiStore = kpiStore.map((kpi) => {
        if (kpi.metricName.includes('Without Order')) {
          return {
            ...kpi,
            currentValue: 0.08,
            trend: 'improving',
            status: 'target_met',
            measurementTimestamp: new Date().toISOString(),
          };
        }
        if (kpi.metricName.includes('Success Rate')) {
          return {
            ...kpi,
            currentValue: 98.4,
            trend: 'improving',
            status: 'target_met',
            measurementTimestamp: new Date().toISOString(),
          };
        }
        return kpi;
      });
      return [...kpiStore];
    }
    const response = await apiClient.post('/kpis/refresh');
    return response.data;
  },
};

