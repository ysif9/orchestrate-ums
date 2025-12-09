import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Check, X, Wrench, Building2, MapPin, Users, Clock, CheckCircle, PlayCircle, Eye, Ticket } from 'lucide-react';
import {ticketsService} from "../services/ticketsService.js";
import {authService} from "../services/authService.js";

const ISSUE_TYPES = [
    { value: 'hardware', label: 'Hardware' },
    { value: 'software', label: 'Software' },
    { value: 'other', label: 'Other' }
];
const TICKET_STATUS_COLORS = {
    open: 'bg-red-100 text-red-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800'
};

const TICKET_STATUS_LABELS = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved'
};

const ISSUE_TYPE_LABELS = {
    hardware: 'Hardware',
    software: 'Software',
    other: 'Other'
};

const ISSUE_TYPE_COLORS = {
    hardware: 'bg-red-100 text-red-800',
    software: 'bg-blue-100 text-blue-800',
    other: 'bg-gray-100 text-gray-800'
};
function MaintenanceTicketPage() {
    const navigate = useNavigate();

    // State
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [myTickets, setMyTickets] = useState([]);
    const [ticketsLoading, setTicketsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('create'); // 'create' or 'myTickets'

    // Details modal state
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [detailsTicket, setDetailsTicket] = useState(null);
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [formData, setFormData] = useState({
        issue_type: 'other',
        description: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const user = authService.getCurrentUser();

    // Fetch rooms on mount
    useEffect(() => {
        fetchRooms();
    }, []);

    // Clear success message after 3 seconds
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);
    // Fetch my tickets when switching to that tab
    useEffect(() => {
        if (activeTab === 'myTickets') {
            fetchMyTickets();
        }
    }, [activeTab]);
    const fetchRooms = async () => {
        try {
            setLoading(true);
             const response = await ticketsService.getRooms();

            setRooms(response);
        } catch (err) {
            setError('Failed to load rooms');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    const fetchMyTickets = async () => {
        try {
            setTicketsLoading(true);
            const response = await ticketsService.getUserTickets();
            setMyTickets(response.tickets || response || []);
        } catch (err) {
            setError('Failed to load your tickets');
            console.error(err);
        } finally {
            setTicketsLoading(false);
        }
    };

    const handleOpenDetailsModal = (ticket) => {
        setDetailsTicket(ticket);
        setIsDetailsModalOpen(true);
    };

    const handleCloseDetailsModal = () => {
        setIsDetailsModalOpen(false);
        setDetailsTicket(null);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'open':
                return <AlertCircle size={16} />;
            case 'in_progress':
                return <PlayCircle size={16} />;
            case 'resolved':
                return <CheckCircle size={16} />;
            default:
                return <Clock size={16} />;
        }
    };
    const openTicketModal = (room) => {
        setSelectedRoom(room);
        setFormData({
            issue_type: 'other',
            description: ''
        });
        setFormError('');
        setSuccessMessage('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedRoom(null);
        setFormError('');
        setSuccessMessage('');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setFormError('');
        setSuccessMessage('');
        setSubmitting(true);

        if (!formData.description || formData.description.trim().length === 0) {
            setFormError('Please provide a description of the issue');
            setSubmitting(false);
            return;
        }

        try {
            const ticketData = {
                roomId: selectedRoom.id,
                issue_type: formData.issue_type,
                description: formData.description.trim()
            };

             const response = await ticketsService.createTicket(ticketData);
            console.log('Submitting ticket:', ticketData);

            // Mock success response
            await new Promise(resolve => setTimeout(resolve, 1000));
            setSuccessMessage('Maintenance ticket submitted successfully!');

            setTimeout(() => {
                closeModal();
            }, 1500);
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to submit ticket');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = () => {
        //console.log('Logging out...');
         authService.logout(); navigate('/login');
    };

    const handleBackToDashboard = () => {
        //console.log('Navigating to dashboard...');
        if (user?.role === 'student') {
            navigate('/home');
            console.log('Navigating to student dashboard...');
        } else {
            navigate('admin/home');
        }

    };

    // Filter rooms based on search term
    const filteredRooms = rooms.filter(room => {
        const searchLower = searchTerm.toLowerCase();
        return (
            room.name?.toLowerCase().includes(searchLower) ||
            room.building?.toLowerCase().includes(searchLower) ||
            room.type?.toLowerCase().includes(searchLower)
        );
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-700">Loading rooms...</div>
            </div>
        );
    }

    return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <nav className="bg-indigo-600 text-white px-8 py-4 shadow-md">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">
                    AIN SHAMS
                    <span className="block text-xs font-normal text-brand-100 tracking-wider mt-1">
                        UNIVERSITY | FACULTY OF ENGINEERING
                    </span>
                </h1>

                <div className="flex items-center gap-6">
                    <button
                        onClick={() => handleBackToDashboard()}
                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    >
                        ← Back to Dashboard
                    </button>
                    <span className="text-sm font-medium text-brand-100">
                        {user?.name}
                    </span>
                    <button
                        onClick={handleLogout}
                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </nav>

        <div className="max-w-7xl mx-auto px-8 py-8">
            {/* Page Title and Tabs */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Maintenance Tickets</h2>
                        <p className="text-gray-600 mt-1">Report issues or view your submitted tickets</p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-3">
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                            activeTab === 'create'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        <Wrench size={18} />
                        Report Issue
                    </button>
                    <button
                        onClick={() => setActiveTab('myTickets')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                            activeTab === 'myTickets'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        <Ticket size={18} />
                        My Tickets
                    </button>
                </div>
            </div>

            {/* Success Message */}
            {successMessage && !isModalOpen && (
                <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                    <Check size={20} />
                    {successMessage}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* Create Ticket Tab */}
            {activeTab === 'create' && (
                <>
                    {/* Search Bar */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <input
                            type="text"
                            placeholder="Search rooms by name, building, or type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Rooms Grid */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Available Rooms</h3>

                        {filteredRooms.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Building2 size={48} className="mx-auto mb-4 opacity-50" />
                                <p>{searchTerm ? 'No rooms match your search' : 'No rooms available'}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredRooms.map(room => (
                                    <div
                                        key={room.id}
                                        onClick={() => openTicketModal(room)}
                                        className="p-5 border-2 border-gray-200 rounded-lg cursor-pointer transition-all hover:border-indigo-500 hover:shadow-lg hover:scale-105 bg-white"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-lg text-gray-900">{room.name}</h4>
                                                <span className="inline-block px-2 py-1 rounded text-xs font-semibold mt-1 bg-blue-100 text-blue-800">
                                                    {room.type}
                                                </span>
                                            </div>
                                            <Wrench className="text-indigo-600" size={24} />
                                        </div>

                                        <div className="space-y-2 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Building2 size={16} className="text-gray-400" />
                                                <span>{room.building}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin size={16} className="text-gray-400" />
                                                <span>Floor {room.floor}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users size={16} className="text-gray-400" />
                                                <span>Capacity: {room.capacity}</span>
                                            </div>
                                        </div>

                                        {room.description && (
                                            <p className="mt-3 text-xs text-gray-500 line-clamp-2">
                                                {room.description}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* My Tickets Tab */}
            {activeTab === 'myTickets' && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {ticketsLoading ? (
                        <div className="text-center py-12 text-gray-500">
                            Loading your tickets...
                        </div>
                    ) : myTickets.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Ticket size={48} className="mx-auto mb-4 opacity-50" />
                            <p>You haven't submitted any tickets yet</p>
                            <button
                                onClick={() => setActiveTab('create')}
                                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Report Your First Issue
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                                        <thead>
                            <tr>
                                <th className="bg-gray-50 text-gray-700 font-semibold px-6 py-4 border-b border-gray-200 text-sm uppercase tracking-wider text-left">ID</th>
                                <th className="bg-gray-50 text-gray-700 font-semibold px-6 py-4 border-b border-gray-200 text-sm uppercase tracking-wider text-left">Room</th>
                                <th className="bg-gray-50 text-gray-700 font-semibold px-6 py-4 border-b border-gray-200 text-sm uppercase tracking-wider text-left">Issue Type</th>
                                <th className="bg-gray-50 text-gray-700 font-semibold px-6 py-4 border-b border-gray-200 text-sm uppercase tracking-wider text-left">Description</th>
                                <th className="bg-gray-50 text-gray-700 font-semibold px-6 py-4 border-b border-gray-200 text-sm uppercase tracking-wider text-left">Status</th>
                                <th className="bg-gray-50 text-gray-700 font-semibold px-6 py-4 border-b border-gray-200 text-sm uppercase tracking-wider text-left">Created</th>
                                <th className="bg-gray-50 text-gray-700 font-semibold px-6 py-4 border-b border-gray-200 text-sm uppercase tracking-wider text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myTickets.map(ticket => (
                                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 border-b border-gray-200 align-middle">
                                        <span className="font-semibold text-gray-900 text-base">#{ticket.id}</span>
                                    </td>
                                    <td className="px-6 py-4 border-b border-gray-200 align-middle">
                                        <div>
                                            <div className="font-medium text-gray-900 text-base">{ticket.room?.name}</div>
                                            <div className="text-sm text-gray-500">{ticket.room?.building}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 border-b border-gray-200 align-middle">
                                        <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${ISSUE_TYPE_COLORS[ticket.issue_type]}`}>
                                            {ISSUE_TYPE_LABELS[ticket.issue_type]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 border-b border-gray-200 align-middle">
                                        <div className="max-w-md">
                                            <p className="text-base text-gray-700 line-clamp-2">{ticket.description}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 border-b border-gray-200 align-middle">
                                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${TICKET_STATUS_COLORS[ticket.status]}`}>
                                            {getStatusIcon(ticket.status)}
                                            {TICKET_STATUS_LABELS[ticket.status]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 border-b border-gray-200 align-middle">
                                        <div className="text-base text-gray-700 whitespace-nowrap">{formatDate(ticket.created_by)}</div>
                                    </td>
                                    <td className="px-6 py-4 border-b border-gray-200 align-middle text-center">
                                        <button
                                            className="inline-flex items-center justify-center w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
                                            onClick={() => handleOpenDetailsModal(ticket)}
                                            title="View Details"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Ticket Submission Modal */}
        {isModalOpen && selectedRoom && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center p-6 border-b">
                        <h3 className="text-xl font-semibold text-gray-900">
                            Report Maintenance Issue
                        </h3>
                        <button
                            onClick={closeModal}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6">
                        {successMessage && (
                            <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-3 rounded-lg mb-4">
                                <Check size={20} />
                                {successMessage}
                            </div>
                        )}

                        {formError && (
                            <div className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4">
                                <AlertCircle size={20} />
                                {formError}
                            </div>
                        )}

                        {/* Room Info */}
                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                            <h4 className="font-semibold text-gray-900 mb-2">{selectedRoom.name}</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Building2 size={16} />
                                    <span>{selectedRoom.building}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} />
                                    <span>Floor {selectedRoom.floor}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users size={16} />
                                    <span>Capacity: {selectedRoom.capacity}</span>
                                </div>
                                <div>
                                    <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                                        {selectedRoom.type}
                                    </span>
                                </div>
                            </div>
                            {selectedRoom.amenities && selectedRoom.amenities.length > 0 && (
                                <div className="mt-3 text-sm text-gray-600">
                                    <strong>Amenities:</strong> {selectedRoom.amenities.join(', ')}
                                </div>
                            )}
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Issue Type *
                                </label>
                                <select
                                    name="issue_type"
                                    value={formData.issue_type}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    {ISSUE_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={6}
                                    placeholder="Please describe the issue in detail. Include any relevant information such as equipment affected, error messages, or when the problem started..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Provide as much detail as possible to help us resolve the issue quickly
                                </p>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <p className="text-yellow-800 text-sm">
                                    <strong>Note:</strong> Your ticket will be reviewed by maintenance staff.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    onClick={closeModal}
                                    disabled={submitting}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Ticket'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Details Modal */}
        {isDetailsModalOpen && detailsTicket && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCloseDetailsModal}>
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center p-6 border-b">
                        <h3 className="text-xl font-semibold text-gray-900">Ticket Details</h3>
                        <button
                            onClick={handleCloseDetailsModal}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1">Ticket ID</label>
                                <div className="text-gray-900">#{detailsTicket.id}</div>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1">Status</label>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${TICKET_STATUS_COLORS[detailsTicket.status]}`}>
                                    {getStatusIcon(detailsTicket.status)}
                                    {TICKET_STATUS_LABELS[detailsTicket.status]}
                                </span>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1">Issue Type</label>
                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${ISSUE_TYPE_COLORS[detailsTicket.issue_type]}`}>
                                    {ISSUE_TYPE_LABELS[detailsTicket.issue_type]}
                                </span>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1">Room</label>
                                <div className="text-gray-900">{detailsTicket.room?.name}</div>
                                <div className="text-sm text-gray-600">{detailsTicket.room?.building}, Floor {detailsTicket.room?.floor}</div>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1">Description</label>
                                <div className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                                    {detailsTicket.description}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 block mb-1">Created</label>
                                    <div className="text-gray-900 text-sm">{formatDate(detailsTicket.created_by)}</div>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 block mb-1">Resolved</label>
                                    <div className="text-gray-900 text-sm">
                                        {detailsTicket.resolved_at ? formatDate(detailsTicket.resolved_at) : 'Not yet resolved'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                            <button
                                onClick={handleCloseDetailsModal}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
);

}

export default MaintenanceTicketPage;