import axios from 'axios';
import { authService } from './authService';

const API_URL = 'http://localhost:5000/api/pd';

export const pdService = {
    getAllActivities: async (userId) => {
        const params = userId ? { userId } : {};
        const token = authService.getToken();
        const response = await axios.get(`${API_URL}/activities`, {
            headers: { Authorization: `Bearer ${token}` },
            params
        });
        return response.data;
    },

    createActivity: async (activityData) => {
        const token = authService.getToken();
        const response = await axios.post(`${API_URL}/activities`, activityData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};
