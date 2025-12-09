import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const labStationService = {
    /**
     * Get all labs (rooms of type 'lab')
     * @returns {Promise<Object>} Response with labs array
     */
    getLabs: async () => {
        const response = await axios.get(`${API_URL}/lab-stations/labs`);
        return response.data;
    },

    /**
     * Get all stations for a specific lab
     * @param {number} labId - Lab ID
     * @returns {Promise<Object>} Response with lab info and stations array
     */
    getStationsByLab: async (labId) => {
        const response = await axios.get(`${API_URL}/lab-stations/lab/${labId}`);
        return response.data;
    },

    /**
     * Get all lab stations with optional filters
     * @param {Object} filters - Optional filters (labId, status, isActive)
     * @returns {Promise<Object>} Response with stations array
     */
    getAll: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.labId) params.append('labId', filters.labId);
        if (filters.status) params.append('status', filters.status);
        if (filters.isActive !== undefined) params.append('isActive', filters.isActive);
        
        const response = await axios.get(`${API_URL}/lab-stations?${params.toString()}`);
        return response.data;
    },

    /**
     * Get a single station by ID
     * @param {number} id - Station ID
     * @returns {Promise<Object>} Response with station data
     */
    getById: async (id) => {
        const response = await axios.get(`${API_URL}/lab-stations/${id}`);
        return response.data;
    },

    /**
     * Create a new lab station (Staff only)
     * @param {Object} stationData - Station data
     * @returns {Promise<Object>} Response with created station
     */
    create: async (stationData) => {
        const response = await axios.post(`${API_URL}/lab-stations`, stationData);
        return response.data;
    },

    /**
     * Update a lab station (Staff only)
     * @param {number} id - Station ID
     * @param {Object} stationData - Updated station data
     * @returns {Promise<Object>} Response with updated station
     */
    update: async (id, stationData) => {
        const response = await axios.put(`${API_URL}/lab-stations/${id}`, stationData);
        return response.data;
    },

    /**
     * Delete a lab station (Staff only)
     * @param {number} id - Station ID
     * @returns {Promise<Object>} Response
     */
    delete: async (id) => {
        const response = await axios.delete(`${API_URL}/lab-stations/${id}`);
        return response.data;
    }
};

export const labReservationService = {
    /**
     * Get all reservations with optional filters
     * @param {Object} filters - Optional filters (stationId, studentId, status, myReservations)
     * @returns {Promise<Object>} Response with reservations array
     */
    getAll: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.stationId) params.append('stationId', filters.stationId);
        if (filters.studentId) params.append('studentId', filters.studentId);
        if (filters.status) params.append('status', filters.status);
        if (filters.myReservations) params.append('myReservations', filters.myReservations);
        
        const response = await axios.get(`${API_URL}/lab-reservations?${params.toString()}`);
        return response.data;
    },

    /**
     * Get current user's active reservation
     * @returns {Promise<Object>} Response with active reservation info
     */
    getMyActive: async () => {
        const response = await axios.get(`${API_URL}/lab-reservations/my-active`);
        return response.data;
    },

    /**
     * Get a single reservation by ID
     * @param {number} id - Reservation ID
     * @returns {Promise<Object>} Response with reservation data
     */
    getById: async (id) => {
        const response = await axios.get(`${API_URL}/lab-reservations/${id}`);
        return response.data;
    },

    /**
     * Create a new reservation (Students only)
     * @param {Object} reservationData - Reservation data (stationId, startTime, endTime, purpose, notes)
     * @returns {Promise<Object>} Response with created reservation
     */
    create: async (reservationData) => {
        const response = await axios.post(`${API_URL}/lab-reservations`, reservationData);
        return response.data;
    },

    /**
     * Cancel a reservation
     * @param {number} id - Reservation ID
     * @returns {Promise<Object>} Response
     */
    cancel: async (id) => {
        const response = await axios.put(`${API_URL}/lab-reservations/${id}/cancel`);
        return response.data;
    },

    /**
     * Check for expiring reservations (for alerts)
     * @returns {Promise<Object>} Response with expiring reservation info
     */
    checkExpiring: async () => {
        const response = await axios.get(`${API_URL}/lab-reservations/check-expiring`);
        return response.data;
    }
};

