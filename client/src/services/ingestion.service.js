import { apiClient } from './api';

export const ingestionService = {
  async uploadCsv(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/ingestion/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data?.data || res.data;
  },

  async getJob(jobId) {
    const res = await apiClient.get(`/ingestion/jobs/${jobId}`);
    return res.data?.data || res.data;
  },

  getCsvTemplateUrl() {
    return `${apiClient.defaults.baseURL}/ingestion/csv/template`;
  },
};

