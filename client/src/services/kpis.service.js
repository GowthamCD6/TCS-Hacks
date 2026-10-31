import { incidentsService } from './incidents.service';
import { demoService } from './demo.service';

export const kpisService = {
  async getMonitoringKPIs(incidentId) {
    if (!incidentId) return [];
    return incidentsService.getKPIs(incidentId);
  },

  async refreshKPIs(minutes = 15) {
    return demoService.advanceClock(minutes);
  },
};
