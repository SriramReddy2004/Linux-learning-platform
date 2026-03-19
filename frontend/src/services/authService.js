import api from './api';

export const authService = {
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async updateProfile(data) {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  async changePassword(data) {
    const response = await api.put('/auth/password', data);
    return response.data;
  },

  async logout() {
    const response = await api.get('/auth/logout');
    return response.data;
  },
};
