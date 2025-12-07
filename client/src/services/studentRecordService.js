import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/student-records';

/**
 * Student Record service for staff to search and view student records
 */
export const studentRecordService = {
    /**
     * Search for a student by ID
     * @param {number|string} studentId - Student ID to search for
     * @returns {Promise<Object>} Response with student key verification data
     */
    searchStudent: async (studentId) => {
        const response = await axios.get(`${API_BASE}/search`, {
            params: { studentId }
        });
        return response.data;
    },

    /**
     * Get full student record summary
     * @param {number|string} studentId - Student ID
     * @returns {Promise<Object>} Response with complete student record summary
     */
    getStudentSummary: async (studentId) => {
        const response = await axios.get(`${API_BASE}/${studentId}/summary`);
        return response.data;
    }
};

