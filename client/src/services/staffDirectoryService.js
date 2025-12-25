import axios from 'axios';
import { authService } from './authService.js';

const API_URL = 'http://localhost:5000/api/staff-directory';

export const staffDirectoryService = {
  getAll: async (search = '') => {
    const params = search ? { search } : {};
    const res = await axios.get(API_URL, {
      params,
      headers: { Authorization: `Bearer ${authService.getToken()}` },
    });
    return res.data.data;
  },

  // JS version – no type annotations
  create: async (input) => {
    // input should contain:
    // { name, email, password, role: 'professor' | 'teaching_assistant', departmentId?, phone?, officeLocation? }
    const res = await axios.post(API_URL, input, {
      headers: { Authorization: `Bearer ${authService.getToken()}` },
    });
    return res.data.data;
  },
};
