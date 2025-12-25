import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

/**
 * Authentication service for handling user login, signup, and token management
 */
export const authService = {
    /**
     * Login user with email and password
     * @param {Object} credentials - User credentials
     * @param {string} credentials.email - User email
     * @param {string} credentials.password - User password
     * @returns {Promise<Object>} Response with token and user data
     */
    login: async (credentials) => {
        const response = await axios.post(`${API_URL}/login`, credentials);
        if (response.data.success && response.data.token) {
            // Store token in localStorage
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @param {string} userData.name - User's full name
     * @param {string} userData.email - User's email
     * @param {string} userData.password - User's password
     * @param {string} [userData.role] - User's role (default: student)
     * @param {number} [userData.maxCredits] - Maximum credits for students
     * @returns {Promise<Object>} Response with token and user data
     */
    signup: async (userData) => {
        const response = await axios.post(`${API_URL}/signup`, userData);
        if (response.data.success && response.data.token) {
            // Store token in localStorage
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    /**
     * Login parent with linking code only (no email/password required)
     * @param {Object} credentials - Parent credentials
     * @param {string} credentials.linkingCode - Parent's unique linking code
     * @param {string} [credentials.parentName] - Parent's name (required for first-time login)
     * @returns {Promise<Object>} Response with token and user data
     */
    parentLogin: async (credentials) => {
        const response = await axios.post(`${API_URL}/parent-login`, credentials);
        if (response.data.success && response.data.token) {
            // Store token in localStorage
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    /**
     * Logout user by removing token from localStorage
     */
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    /**
     * Get current user from localStorage
     * @returns {Object|null} User object or null if not logged in
     */
    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    /**
     * Get authentication token from localStorage
     * @returns {string|null} Token or null if not logged in
     */
    getToken: () => {
        return localStorage.getItem('token');
    },

    /**
     * Check if user is authenticated
     * @returns {boolean} True if user is authenticated
     */
    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    /**
     * Get current user profile from API
     * @returns {Promise<Object>} User profile data
     */
    getMe: async () => {
        const token = authService.getToken();
        const response = await axios.get(`${API_URL}/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    }
};

/**
 * Axios interceptor to add authentication token to all requests
 */
axios.interceptors.request.use(
    (config) => {
        const token = authService.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Axios interceptor to handle authentication errors
 */
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expired or invalid, logout user
            authService.logout();
            // Redirect to login page if not already there
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

