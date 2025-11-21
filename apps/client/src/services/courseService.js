import axios from 'axios';

const API_URL = 'http://localhost:5000/api/courses';

export const courseService = {
    getAll: async () => {
        const response = await axios.get(API_URL);
        return response.data;
    },

    create: async (courseData) => {
        const response = await axios.post(API_URL, courseData);
        return response.data;
    },

    update: async (id, courseData) => {
        const response = await axios.put(`${API_URL}/${id}`, courseData);
        return response.data;
    },

    delete: async (id) => {
        const response = await axios.delete(`${API_URL}/${id}`);
        return response.data;
    }
};