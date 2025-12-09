// client/src/services/resourceService.js
import axios from 'axios';
import { authService } from './authService.js';

const API_URL = 'http://localhost:5000/api/resources';

export const resourceService = {
  getAll: async () => {
    const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${authService.getToken()}` } });
    return res.data.data;
  },
  create: async (data) => {
    const res = await axios.post(API_URL, data, { headers: { Authorization: `Bearer ${authService.getToken()}` } });
    return res.data.data;
  },
  allocate: async (resourceId, data) => {
    const res = await axios.post(`${API_URL}/${resourceId}/allocate`, data, { headers: { Authorization: `Bearer ${authService.getToken()}` } });
    return res.data.data;
  },
  getMyAllocations: async () => {
    const res = await axios.get(`${API_URL}/my`, { headers: { Authorization: `Bearer ${authService.getToken()}` } });
    return res.data.data;
  },
  // Return by allocation ID — matches backend route /api/resources/allocations/:id/return
  returnResource: async (allocationId) => {
    const res = await axios.post(
      `${API_URL}/allocations/${allocationId}/return`,
      {},
      { headers: { Authorization: `Bearer ${authService.getToken()}` } }
    );
    return res.data.data;
  },
  getResourceDetails: async (resourceId) => {
    const res = await axios.get(`${API_URL}/${resourceId}`, { headers: { Authorization: `Bearer ${authService.getToken()}` } });
    return res.data.data;
  }
};
