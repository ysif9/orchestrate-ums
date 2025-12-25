import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

/**
 * Admission service for public admission operations
 * These endpoints do not require authentication
 */
export const admissionService = {
    /**
     * Get admission information including programs, requirements, and deadlines
     * @returns {Promise<Object>} Response with admission info
     */
    getAdmissionInfo: async () => {
        const response = await axios.get(`${API_URL}/admissions/info`);
        return response.data;
    },

    /**
     * Submit a new admission application
     * @param {Object} applicationData - Application data
     * @param {string} applicationData.firstName - Applicant's first name
     * @param {string} applicationData.lastName - Applicant's last name
     * @param {string} applicationData.email - Applicant's email
     * @param {string} [applicationData.phone] - Applicant's phone number
     * @param {string} [applicationData.address] - Applicant's address
     * @param {string} applicationData.program - Selected program ID

     * @param {Object} [applicationData.academicHistory] - Academic history data
     * @param {Object} [applicationData.personalInfo] - Personal information data
     * @returns {Promise<Object>} Response with application confirmation
     */
    submitApplication: async (applicationData) => {
        const response = await axios.post(`${API_URL}/admissions/apply`, applicationData);
        return response.data;
    },

    /**
     * Check application status by email
     * @param {string} email - Applicant's email address
     * @returns {Promise<Object>} Response with application status
     */
    checkStatus: async (email) => {
        const response = await axios.get(`${API_URL}/admissions/status/${encodeURIComponent(email)}`);
        return response.data;
    },
};
