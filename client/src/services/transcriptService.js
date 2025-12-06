import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/transcript-requests';

/**
 * Transcript service for handling transcript requests
 */
export const transcriptService = {
    /**
     * Create a new transcript request
     * @returns {Promise<Object>} Response with created request
     */
    createRequest: async () => {
        const response = await axios.post(API_BASE);
        return response.data;
    },

    /**
     * Get all transcript requests for the current student
     * @returns {Promise<Object>} Response with list of requests
     */
    getMyRequests: async () => {
        const response = await axios.get(API_BASE);
        return response.data;
    },

    /**
     * Get a specific transcript request by ID
     * @param {number} id - Request ID
     * @returns {Promise<Object>} Response with request and transcript data (if approved)
     */
    getRequest: async (id) => {
        const response = await axios.get(`${API_BASE}/${id}`);
        return response.data;
    },

    /**
     * View transcript for an approved request
     * @param {number} id - Request ID
     * @returns {Promise<Object>} Response with transcript data
     */
    viewTranscript: async (id) => {
        const response = await axios.get(`${API_BASE}/${id}`);
        return response.data;
    }
};

