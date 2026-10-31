import { apiClient, USE_MOCKS } from './api';
import {
  mockIncidents,
  mockEvidenceItems,
  mockHypotheses,
  mockAffectedSegments,
  mockBusinessImpact,
  mockAgentTraceSteps,
  mockDashboardOverview,
  mockCustomerRecoveryList,
  mockSelfEvaluationTests,
} from '../mocks/data';

let incidentsStore = [...mockIncidents];
let evidenceStore = [...mockEvidenceItems];
let hypothesesStore = [...mockHypotheses];
let agentTraceStore = [...mockAgentTraceSteps];
let customerRecoveryStore = [...mockCustomerRecoveryList];

export const incidentsService = {
  async getDashboardOverview() {
    if (USE_MOCKS) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      return {
        ...mockDashboardOverview,
        activeIncidents: incidentsStore.filter((i) => i.status !== 'resolved').length,
        recentIncidents: [...incidentsStore],
      };
    }
    const response = await apiClient.get('/dashboard/overview');
    return response.data;
  },

  async getIncidents() {
    if (USE_MOCKS) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      return [...incidentsStore];
    }
    const response = await apiClient.get('/incidents');
    return response.data;
  },

  async getIncidentById(id) {
    if (USE_MOCKS) {
      await new Promise((resolve) => setTimeout(resolve, 120));
      return incidentsStore.find((i) => i.id === id);
    }
    const response = await apiClient.get(`/incidents/${id}`);
    return response.data;
  },

  async getEvidence(incidentId) {
    if (USE_MOCKS) {
      await new Promise((resolve) => setTimeout(resolve, 120));
      return [...evidenceStore];
    }
    const response = await apiClient.get(`/incidents/${incidentId}/evidence`);
    return response.data;
  },

  async getHypotheses(incidentId) {
    if (USE_MOCKS) {
      await new Promise((resolve) => setTimeout(resolve, 120));
      return [...hypothesesStore];
    }
    const response = await apiClient.get(`/incidents/${incidentId}/hypotheses`);
    return response.data;
  },

  async getAffectedSegments(incidentId) {
    if (USE_MOCKS) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return [...mockAffectedSegments];
    }
    const response = await apiClient.get(`/incidents/${incidentId}/segments`);
    return response.data;
  },

  async getBusinessImpact(incidentId) {
    if (USE_MOCKS) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return { ...mockBusinessImpact };
    }
    const response = await apiClient.get(`/incidents/${incidentId}/impact`);
    return response.data;
  },

  async getCustomerRecoveryList(incidentId) {
    if (USE_MOCKS) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return [...customerRecoveryStore];
    }
    const response = await apiClient.get(`/incidents/${incidentId}/customer-recovery`);
    return response.data;
  },

  async getSelfEvaluationScorecard(incidentId) {
    if (USE_MOCKS) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return [...mockSelfEvaluationTests];
    }
    const response = await apiClient.get(`/incidents/${incidentId}/scorecard`);
    return response.data;
  },

  async getAgentTrace(incidentId) {
    if (USE_MOCKS) {
      await new Promise((resolve) => setTimeout(resolve, 120));
      return [...agentTraceStore];
    }
    const response = await apiClient.get(`/incidents/${incidentId}/agent-trace`);
    return response.data;
  },

  async injectEvidence(payload) {
    if (USE_MOCKS) {
      await new Promise((resolve) => setTimeout(resolve, 600));

      const newEvidence = {
        id: `EVD-INJ-${Date.now().toString().slice(-4)}`,
        type: payload.evidenceType,
        source: payload.source || 'Operational Telemetry Injector',
        description: payload.description,
        timestamp: new Date().toISOString(),
        relatedRecord: payload.title,
        relevanceScore: 95,
        relation: payload.relation,
        targetHypothesisId: 'HYP-01',
        isVerified: true,
      };

      evidenceStore = [newEvidence, ...evidenceStore];

      const nextStep = {
        stepNumber: agentTraceStore.length + 1,
        agentName: 'AdaptiveReassessmentAgent',
        toolName: 'causal_reasoner.recalculate_bayes()',
        action: `Evaluated injected evidence: "${payload.title}"`,
        inputSummary: payload.description.slice(0, 100) + '...',
        outputSummary: `Shifted hypothesis confidence and triggered adaptive reassessment.`,
        evidenceReferences: [newEvidence.id],
        status: 'completed',
        durationMs: 820,
        timestamp: new Date().toISOString(),
      };
      agentTraceStore = [...agentTraceStore, nextStep];

      const isHotfix = payload.description.toLowerCase().includes('hotfix') || payload.title.toLowerCase().includes('hotfix');
      const targetInc = incidentsStore.find((i) => i.id === payload.incidentId);
      if (targetInc) {
        if (isHotfix) {
          targetInc.verificationStatus = 'improving';
          targetInc.confidence = 0.98;
        }
      }

      return {
        incidentId: payload.incidentId,
        reassessedAt: new Date().toISOString(),
        changeSummary: `New ${payload.evidenceType} evidence integrated: "${payload.title}". Root-cause Bayesian probability updated.`,
        confidenceShift: +0.02,
        updatedStatus: targetInc?.status || 'recovery_in_progress',
        affectedHypotheses: [
          {
            id: 'HYP-01',
            title: 'App v2.3 Client Timeout Mismatch on Android 14',
            oldLikelihood: 0.96,
            newLikelihood: 0.98,
            verdictChange: 'Confidence heightened with corroborating hotfix evidence',
          },
        ],
        newRecommendations: [],
        kpiImpactNotice: 'Projected 99.4% recovery verification within next measurement window.',
      };
    }

    const response = await apiClient.post(
      `/incidents/${payload.incidentId}/inject-evidence`,
      payload
    );
    return response.data;
  },
};
