import axios from 'axios';
import { authService } from './authService';

const API_URL = 'http://localhost:5000/api/users';

const getAll = async (params = {}) => {
    const token = authService.getToken();
    const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params
    });
    return response.data;
};

export const userService = {
    getAll,
    getProfessors: async () => {
        // Use server-side filtering for efficiency
        const users = await getAll({ role: 'professor' });
        if (!Array.isArray(users)) return [];
        return users;
    },

    getTeachingAssistants: async () => {
        const users = await getAll({ role: 'teaching_assistant' });
        if (!Array.isArray(users)) return [];
        return users;
    }
};
