import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/semesters';

/**
 * Semester service for managing academic semesters
 */
export const semesterService = {
    /**
     * Get all semesters
     * @returns {Promise<Array>} List of all semesters
     */
    getAll: async () => {
        const response = await axios.get(API_BASE);
        return response.data;
    },

    /**
     * Get currently active semester
     * @returns {Promise<Object>} Active semester or null
     */
    getActive: async () => {
        try {
            const response = await axios.get(`${API_BASE}/active`);
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    },

    /**
     * Get a specific semester by ID
     * @param {number} id - Semester ID
     * @returns {Promise<Object>} Semester data
     */
    getById: async (id) => {
        const response = await axios.get(`${API_BASE}/${id}`);
        return response.data;
    },

    /**
     * Create a new semester
     * @param {Object} semesterData - Semester data
     * @param {string} semesterData.name - Semester name (e.g., "Fall 2025")
     * @param {string} semesterData.startDate - Start date (ISO string)
     * @param {string} semesterData.endDate - End date (ISO string)
     * @returns {Promise<Object>} Created semester
     */
    create: async (semesterData) => {
        const response = await axios.post(API_BASE, semesterData);
        return response.data;
    },

    /**
     * Update a semester
     * @param {number} id - Semester ID
     * @param {Object} semesterData - Updated semester data
     * @returns {Promise<Object>} Updated semester
     */
    update: async (id, semesterData) => {
        const response = await axios.put(`${API_BASE}/${id}`, semesterData);
        return response.data;
    },

    /**
     * Activate a semester (deactivates others)
     * @param {number} id - Semester ID
     * @returns {Promise<Object>} Activated semester
     */
    activate: async (id) => {
        const response = await axios.put(`${API_BASE}/${id}/activate`);
        return response.data;
    },

    /**
     * Finalize a semester (validates grades and marks enrollments as completed)
     * @param {number} id - Semester ID
     * @returns {Promise<Object>} Finalization result with details
     */
    finalize: async (id) => {
        const response = await axios.put(`${API_BASE}/${id}/finalize`);
        return response.data;
    }
};

