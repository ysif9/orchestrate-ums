import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

/**
 * Application service for handling admission applications, reviews, and decision letters
 */
export const applicationService = {
    /**
     * Get all applications with optional filtering
     * @param {Object} params - Query parameters
     * @param {string} [params.status] - Filter by status
     * @param {string} [params.program] - Filter by program
     * @param {number} [params.limit] - Limit results
     * @param {number} [params.offset] - Offset for pagination
     * @returns {Promise<Object>} Response with applications data
     */
    getApplications: async (params = {}) => {
        const response = await axios.get(`${API_URL}/applications`, { params });
        return response.data;
    },

    /**
     * Get pending applications (pending or under_review status)
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Response with pending applications
     */
    getPendingApplications: async (params = {}) => {
        const response = await axios.get(`${API_URL}/applications/pending`, { params });
        return response.data;
    },

    /**
     * Get a single application by ID
     * @param {number} id - Application ID
     * @returns {Promise<Object>} Response with application data
     */
    getApplication: async (id) => {
        const response = await axios.get(`${API_URL}/applications/${id}`);
        return response.data;
    },

    /**
     * Update application status
     * @param {number} id - Application ID
     * @param {string} status - New status
     * @returns {Promise<Object>} Response with updated application
     */
    updateApplicationStatus: async (id, status) => {
        const response = await axios.put(`${API_URL}/applications/${id}/status`, { status });
        return response.data;
    },

    /**
     * Get all applicants
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Response with applicants data
     */
    getApplicants: async (params = {}) => {
        const response = await axios.get(`${API_URL}/applicants`, { params });
        return response.data;
    },

    /**
     * Get a single applicant by ID
     * @param {number} id - Applicant ID
     * @returns {Promise<Object>} Response with applicant data
     */
    getApplicant: async (id) => {
        const response = await axios.get(`${API_URL}/applicants/${id}`);
        return response.data;
    },

    /**
     * Submit a review for an application
     * @param {Object} reviewData - Review data
     * @param {number} reviewData.applicationId - Application ID
     * @param {string} reviewData.finalDecision - Decision (accepted/rejected/waitlisted)
     * @param {Object} [reviewData.scoringRubric] - Scoring criteria and scores
     * @param {string} [reviewData.comments] - Review comments
     * @returns {Promise<Object>} Response with created review
     */
    submitReview: async (reviewData) => {
        const response = await axios.post(`${API_URL}/reviews`, reviewData);
        return response.data;
    },

    /**
     * Get reviews for an application
     * @param {number} applicationId - Application ID
     * @returns {Promise<Object>} Response with reviews
     */
    getReviewsForApplication: async (applicationId) => {
        const response = await axios.get(`${API_URL}/reviews/application/${applicationId}`);
        return response.data;
    },

    /**
     * Generate a decision letter for an application
     * @param {number} applicationId - Application ID
     * @param {string} [customContent] - Optional custom content to include
     * @returns {Promise<Object>} Response with generated letter
     */
    generateDecisionLetter: async (applicationId, customContent = '') => {
        const response = await axios.post(`${API_URL}/decision-letters/generate`, {
            applicationId,
            customContent,
        });
        return response.data;
    },

    /**
     * Get decision letters for an application
     * @param {number} applicationId - Application ID
     * @returns {Promise<Object>} Response with decision letters
     */
    getDecisionLetters: async (applicationId) => {
        const response = await axios.get(`${API_URL}/decision-letters/application/${applicationId}`);
        return response.data;
    },

    /**
     * Get a single decision letter by ID
     * @param {number} id - Letter ID
     * @returns {Promise<Object>} Response with letter data
     */
    getDecisionLetter: async (id) => {
        const response = await axios.get(`${API_URL}/decision-letters/${id}`);
        return response.data;
    },

    /**
     * Download a decision letter as a text file
     * @param {number} id - Letter ID
     * @param {string} [filename] - Optional custom filename
     */
    downloadDecisionLetter: async (id, filename) => {
        const response = await axios.get(`${API_URL}/decision-letters/${id}/download`, {
            responseType: 'blob',
        });

        // Create a download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;

        // Extract filename from Content-Disposition header or use provided/default
        const contentDisposition = response.headers['content-disposition'];
        let downloadFilename = filename || 'decision_letter.txt';
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="?([^"]+)"?/);
            if (match) {
                downloadFilename = match[1];
            }
        }

        link.setAttribute('download', downloadFilename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
};

