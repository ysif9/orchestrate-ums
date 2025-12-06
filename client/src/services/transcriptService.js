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
    },

    /**
     * Get all pending transcript requests (Staff only)
     * @returns {Promise<Object>} Response with list of pending requests
     */
    getPendingRequests: async () => {
        const response = await axios.get(`${API_BASE}/pending`);
        return response.data;
    },

    /**
     * Approve a transcript request (Staff only)
     * @param {number} id - Request ID
     * @returns {Promise<Object>} Response with approved request
     */
    approveRequest: async (id) => {
        const response = await axios.put(`${API_BASE}/${id}/approve`);
        return response.data;
    },

    /**
     * Reject a transcript request (Staff only)
     * @param {number} id - Request ID
     * @param {string} reason - Rejection reason
     * @returns {Promise<Object>} Response with rejected request
     */
    rejectRequest: async (id, reason) => {
        const response = await axios.put(`${API_BASE}/${id}/reject`, { rejectionReason: reason });
        return response.data;
    }
};

