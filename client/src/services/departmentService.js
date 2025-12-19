import axios from 'axios';
import { authService } from './authService.js';

const API_URL = 'http://localhost:5000/api/departments';

export const departmentService = {
  getAll: async () => {
    const res = await axios.get(API_URL, {
      headers: { Authorization: `Bearer ${authService.getToken()}` },
    });
    // adjust if your backend wraps in { success, data }
    return res.data.data || res.data;
  },
};
