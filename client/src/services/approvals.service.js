import { apiClient, USE_MOCKS } from './api';
import { mockRecommendations, mockExecutedActions } from '../mocks/data';

let recommendationsStore = [...mockRecommendations];
let executedActionsStore = [...mockExecutedActions];

export const approvalsService = {
  async getRecommendations(incidentId) {
    if (USE_MOCKS) {
      await new Promise((resolve) => setTimeout(resolve, 120));
      if (incidentId) {
        return recommendationsStore.filter((r) => r.incidentId === incidentId);
      }
      return [...recommendationsStore];
    }
    const response = await apiClient.get('/recommendations', {
      params: { incidentId },
    });
    return response.data;
  },

  async getExecutedActions() {
    if (USE_MOCKS) {
      await new Promise((resolve) => setTimeout(resolve, 120));
      return [...executedActionsStore];
    }
    const response = await apiClient.get('/recovery-actions');
    return response.data;
  },

  async approveRecommendation(id) {
    if (USE_MOCKS) {
      await new Promise((resolve) => setTimeout(resolve, 450));
      const target = recommendationsStore.find((r) => r.id === id);
      if (target) {
        target.approvalStatus = 'approved';
      }

      const newAction = {
        id: `ACT-SIM-${Date.now().toString().slice(-4)}`,
        incidentId: target?.incidentId || 'INC-2026-084',
        recommendationId: id,
        title: target ? `Simulated: ${target.title}` : 'Simulated Recovery Action',
        actionType: target?.actionType || 'simulated_refund',
        targetReference: 'Batch Target: 342 Affected Android Customers (Masked)',
        approvalStatus: 'approved',
        executionStatus: 'completed',
        executionTime: new Date().toISOString(),
        resultSummary:
          'Simulated sandbox execution completed successfully. Zero real transactions dispatched in hackathon demo mode.',
        isSimulated: true,
      };

      executedActionsStore = [newAction, ...executedActionsStore];
      return newAction;
    }

    const response = await apiClient.post(`/recommendations/${id}/approve`);
    return response.data;
  },

  async rejectRecommendation(id, reason) {
    if (USE_MOCKS) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const target = recommendationsStore.find((r) => r.id === id);
      if (target) {
        target.approvalStatus = 'rejected';
        target.rejectionReason = reason;
        target.alternativeAction =
          'Alternative Generated: Queue customer support outbound callbacks with priority routing.';
      }
      return target || recommendationsStore[0];
    }

    const response = await apiClient.post(`/recommendations/${id}/reject`, {
      reason,
    });
    return response.data;
  },
};
