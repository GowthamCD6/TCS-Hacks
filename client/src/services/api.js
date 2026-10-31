import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Standard API client with 15s timeout
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Long-running API client with 120s timeout (for investigate, reassess, run-detection, scenario, reject, evaluate)
export const longApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,
});

const attachAuthInterceptor = (instance) => {
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('recoveriq_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const errData = error.response?.data?.error || error.response?.data || {};
      const errorMessage = errData.message || error.message || 'An unexpected error occurred';
      const enhancedError = new Error(errorMessage);
      enhancedError.code = errData.code || error.code;
      enhancedError.details = errData.details;
      enhancedError.status = error.response?.status;
      enhancedError.raw = error;
      return Promise.reject(enhancedError);
    }
  );
};

attachAuthInterceptor(apiClient);
attachAuthInterceptor(longApiClient);
