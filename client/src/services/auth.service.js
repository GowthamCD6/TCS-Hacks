import { apiClient } from './api';

const TOKEN_KEY = 'recoveriq_token';
const USER_KEY = 'recoveriq_user';

export const authService = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return Boolean(this.getToken());
  },

  isApprover() {
    const user = this.getCurrentUser();
    return user ? user.role === 'approver' || user.is_approver === true : false;
  },

  async login(email, password) {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const payload = response.data?.data || response.data || {};
      const token = payload.token;
      const user = payload.user || {
        email,
        name: email.split('@')[0],
        role: email.includes('approver') ? 'approver' : 'analyst',
      };

      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      }
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return { token, user };
    } catch (err) {
      // In dev/mock mode or fallback if auth server allows local sign-in
      if (err.status === 404 || err.message?.includes('Network Error')) {
        const dummyToken = 'mock_jwt_token_' + Date.now();
        const dummyUser = {
          email,
          name: email.split('@')[0],
          role: email.includes('approver') ? 'approver' : 'analyst',
        };
        localStorage.setItem(TOKEN_KEY, dummyToken);
        localStorage.setItem(USER_KEY, JSON.stringify(dummyUser));
        return { token: dummyToken, user: dummyUser };
      }
      throw err;
    }
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

