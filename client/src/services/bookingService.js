import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const roomService = {
    /**
     * Get all rooms with optional filters
     * @param {Object} filters - Optional filters (type, building, minCapacity, isAvailable)
     * @returns {Promise<Object>} Response with rooms array
     */
    getAll: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.type) params.append('type', filters.type);
        if (filters.building) params.append('building', filters.building);
        if (filters.minCapacity) params.append('minCapacity', filters.minCapacity);
        if (filters.isAvailable !== undefined) params.append('isAvailable', filters.isAvailable);
        
        const response = await axios.get(`${API_URL}/rooms?${params.toString()}`);
        return response.data;
    },

    /**
     * Get a single room by ID
     * @param {number} id - Room ID
     * @returns {Promise<Object>} Response with room data
     */
    getById: async (id) => {
        const response = await axios.get(`${API_URL}/rooms/${id}`);
        return response.data;
    },

    /**
     * Create a new room (Staff only)
     * @param {Object} roomData - Room data
     * @returns {Promise<Object>} Response with created room
     */
    create: async (roomData) => {
        const response = await axios.post(`${API_URL}/rooms`, roomData);
        return response.data;
    },

    /**
     * Update a room (Staff only)
     * @param {number} id - Room ID
     * @param {Object} roomData - Updated room data
     * @returns {Promise<Object>} Response with updated room
     */
    update: async (id, roomData) => {
        const response = await axios.put(`${API_URL}/rooms/${id}`, roomData);
        return response.data;
    },

    /**
     * Delete a room (Staff only)
     * @param {number} id - Room ID
     * @returns {Promise<Object>} Response
     */
    delete: async (id) => {
        const response = await axios.delete(`${API_URL}/rooms/${id}`);
        return response.data;
    }
};

export const bookingService = {
    /**
     * Get all bookings with optional filters
     * @param {Object} filters - Optional filters (roomId, startDate, endDate, status, myBookings)
     * @returns {Promise<Object>} Response with bookings array
     */
    getAll: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.roomId) params.append('roomId', filters.roomId);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.status) params.append('status', filters.status);
        if (filters.myBookings) params.append('myBookings', filters.myBookings);
        
        const response = await axios.get(`${API_URL}/bookings?${params.toString()}`);
        return response.data;
    },

    /**
     * Get bookings for a specific room
     * @param {number} roomId - Room ID
     * @param {Object} filters - Optional filters (startDate, endDate)
     * @returns {Promise<Object>} Response with bookings array
     */
    getByRoom: async (roomId, filters = {}) => {
        const params = new URLSearchParams();
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        
        const response = await axios.get(`${API_URL}/bookings/room/${roomId}?${params.toString()}`);
        return response.data;
    },

    /**
     * Get a single booking by ID
     * @param {number} id - Booking ID
     * @returns {Promise<Object>} Response with booking data
     */
    getById: async (id) => {
        const response = await axios.get(`${API_URL}/bookings/${id}`);
        return response.data;
    },

    /**
     * Create a new booking
     * @param {Object} bookingData - Booking data (title, description, roomId, startTime, endTime, notes)
     * @returns {Promise<Object>} Response with created booking
     */
    create: async (bookingData) => {
        const response = await axios.post(`${API_URL}/bookings`, bookingData);
        return response.data;
    },

    /**
     * Update a booking
     * @param {number} id - Booking ID
     * @param {Object} bookingData - Updated booking data
     * @returns {Promise<Object>} Response with updated booking
     */
    update: async (id, bookingData) => {
        const response = await axios.put(`${API_URL}/bookings/${id}`, bookingData);
        return response.data;
    },

    /**
     * Cancel a booking
     * @param {number} id - Booking ID
     * @returns {Promise<Object>} Response
     */
    cancel: async (id) => {
        const response = await axios.delete(`${API_URL}/bookings/${id}`);
        return response.data;
    },

    /**
     * Check room availability
     * @param {number} roomId - Room ID
     * @param {string} startTime - Start time ISO string
     * @param {string} endTime - End time ISO string
     * @returns {Promise<Object>} Response with availability status
     */
    checkAvailability: async (roomId, startTime, endTime) => {
        const response = await axios.post(`${API_URL}/bookings/check-availability`, {
            roomId,
            startTime,
            endTime
        });
        return response.data;
    }
};

