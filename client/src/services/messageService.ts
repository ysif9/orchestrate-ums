import axios from 'axios';
import { authService } from './authService';

const API_URL = 'http://localhost:5000/api/messages';

// Helper to get auth header
const getAuthFixed = () => {
    const token = authService.getToken();
    return {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};

export const messageService = {
    // Get recipients for parent (grouped by child)
    getRecipientsForParent: async () => {
        const response = await axios.get(`${API_URL}/recipients/parent`, getAuthFixed());
        return response.data;
    },

    // Get thread by message ID
    getThread: async (messageId: number) => {
        const response = await axios.get(`${API_URL}/${messageId}/thread`, getAuthFixed());
        return response.data;
    },

    // Get all messages for current user (parent or professor)
    getMessages: async () => {
        const response = await axios.get(`${API_URL}`, getAuthFixed());
        return response.data;
    },

    // Check if user has unread messages
    hasUnreadMessages: async () => {
        const response = await axios.get(`${API_URL}/unread/check`, getAuthFixed());
        return response.data;
    },

    // Send a message
    sendMessage: async (data: {
        receiverId: number;
        content: string;
        courseId?: number;
        parentId?: number;
        relatedStudentId?: number;
    }) => {
        const response = await axios.post(`${API_URL}`, data, getAuthFixed());
        return response.data;
    },

    // Reply to a message
    replyToMessage: async (parentId: number, content: string) => {
        const response = await axios.post(`${API_URL}`, { parentId, content }, getAuthFixed());
        return response.data;
    },

    // Mark message as read
    markAsRead: async (messageId: number) => {
        const response = await axios.put(`${API_URL}/${messageId}/read`, {}, getAuthFixed());
        return response.data;
    }
};
