import api from './api';

export const containerService = {
  async createContainer() {
    const response = await api.post('/containers');
    return response.data;
  },

  async getContainers(status) {
    const params = status ? { status } : {};
    const response = await api.get('/containers', { params });
    return response.data;
  },

  async getContainer(id) {
    const response = await api.get(`/containers/${id}`);
    return response.data;
  },

  async stopContainer(id) {
    const response = await api.post(`/containers/${id}/stop`);
    return response.data;
  },

  async restartContainer(id) {
    const response = await api.post(`/containers/${id}/restart`);
    return response.data;
  },

  async deleteContainer(id) {
    const response = await api.delete(`/containers/${id}`);
    return response.data;
  },

  async getContainerStats(id) {
    const response = await api.get(`/containers/${id}/stats`);
    return response.data;
  },
};
