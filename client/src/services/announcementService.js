import axios from 'axios';

const API_URL = 'http://localhost:5000/api/announcements';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

// Get all announcements (public)
export const getAnnouncements = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

// Get all announcements for staff management (includes drafts)
export const getAnnouncementsForStaff = async () => {
    const response = await axios.get(`${API_URL}/staff`, getAuthHeaders());
    return response.data;
};

// Get single announcement
export const getAnnouncement = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
};

// Create announcement (staff only)
export const createAnnouncement = async (data) => {
    const response = await axios.post(API_URL, data, getAuthHeaders());
    return response.data;
};

// Update announcement (staff only)
export const updateAnnouncement = async (id, data) => {
    const response = await axios.put(`${API_URL}/${id}`, data, getAuthHeaders());
    return response.data;
};

// Delete announcement (staff only)
export const deleteAnnouncement = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
};

// Publish announcement immediately (staff only)
export const publishAnnouncement = async (id) => {
    const response = await axios.post(`${API_URL}/${id}/publish`, {}, getAuthHeaders());
    return response.data;
};

// Enum mappings for UI display
export const AnnouncementStatus = {
    Draft: 0,
    Published: 1,
    Scheduled: 2,
    Archived: 3
};

export const AnnouncementPriority = {
    Low: 0,
    Normal: 1,
    High: 2,
    Urgent: 3
};



export const announcementService = {
    getAnnouncements,
    getAnnouncementsForStaff,
    getAnnouncement,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    publishAnnouncement,
    AnnouncementStatus,
    AnnouncementPriority
};

export default announcementService;
