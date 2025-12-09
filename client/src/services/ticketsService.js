import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const ticketsService = {

        /**
     * Get all rooms
     * @returns {Promise<Object>} Response with rooms array
     */
    getRooms: async () => {
        const response = await axios.get(`${API_URL}/tickets/rooms`);
        return response.data.rooms;
    },
            /**
     * creates a new maintenance ticket
     * @returns {Promise<Object>} Response with created ticket
     */
    createTicket: async (ticketData) => {
        const response = await axios.post(`${API_URL}/tickets/rooms/tickets`, ticketData);
        return response.data;
    },

    viewTickets: async () => {
        const response = await axios.get(`${API_URL}/admin/tickets/`);
        console.log('viewTickets response:', response.data);
        return response.data.tickets;
    },

    updateTicket: async (id, ticketData) => {
        const response = await axios.patch(`${API_URL}/admin/tickets/${id}`, ticketData);
        return response.data;
    },

    getUserTickets: async (id) => {
        const response = await axios.get(`${API_URL}/tickets/`);
        return response.data.tickets;
    }

};