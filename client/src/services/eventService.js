import axios from 'axios';

const API_URL = 'http://localhost:5000/api/events';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

// Get all events (filtered by user's role for visibility)
export const getEvents = async () => {
    const response = await axios.get(API_URL, getAuthHeaders());
    return response.data;
};

// Get all events for staff management (includes drafts)
export const getEventsForStaff = async () => {
    const response = await axios.get(`${API_URL}/staff`, getAuthHeaders());
    return response.data;
};

// Get single event
export const getEvent = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
};

// Create event (staff only)
export const createEvent = async (data) => {
    const response = await axios.post(API_URL, data, getAuthHeaders());
    return response.data;
};

// Update event (staff only)
export const updateEvent = async (id, data) => {
    const response = await axios.put(`${API_URL}/${id}`, data, getAuthHeaders());
    return response.data;
};

// Delete event (staff only)
export const deleteEvent = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
};

// Publish event immediately (staff only)
export const publishEvent = async (id) => {
    const response = await axios.post(`${API_URL}/${id}/publish`, {}, getAuthHeaders());
    return response.data;
};

// Enum mappings for UI display
export const EventStatus = {
    Draft: 0,
    Published: 1,
    Ongoing: 2,
    Completed: 3,
    Cancelled: 4
};

export const EventPriority = {
    Low: 0,
    Normal: 1,
    High: 2,
    Featured: 3
};

export const EventAudience = {
    All: 0,
    Students: 1,
    Staff: 2,
    Professors: 3,
    Parents: 4
};

export const eventService = {
    getEvents,
    getEventsForStaff,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    publishEvent,
    EventStatus,
    EventPriority,
    EventAudience
};

export default eventService;
