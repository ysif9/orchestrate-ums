import { useState, useEffect } from 'react';
import { Wrench, AlertCircle, Check, X, Clock, CheckCircle, PlayCircle, Eye } from 'lucide-react';
import {ticketsService} from "../services/ticketsService.js";

const TICKET_STATUS = [
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' }
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

const AdminTicketsManager = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [modalError, setModalError] = useState('');

    // Details modal state
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [detailsTicket, setDetailsTicket] = useState(null);

    useEffect(() => {
        fetchTickets();
    }, []);

    // Clear success message after 3 seconds
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const response = await ticketsService.viewTickets();


            setTickets(response);
        } catch (err) {
            setError('Failed to fetch tickets');
            console.error('Failed to fetch tickets', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (ticket) => {
        setSelectedTicket(ticket);
        setNewStatus(ticket.status);
        setModalError('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTicket(null);
        setModalError('');
    };

    const handleOpenDetailsModal = (ticket) => {
        setDetailsTicket(ticket);
        setIsDetailsModalOpen(true);
    };

    const handleCloseDetailsModal = () => {
        setIsDetailsModalOpen(false);
        setDetailsTicket(null);
    };

    const handleUpdateStatus = async () => {
        setModalError('');
        setSubmitting(true);

        if (newStatus === selectedTicket.status) {
            setModalError('Please select a different status');
            setSubmitting(false);
            return;
        }

        try {
            await ticketsService.updateTicket(selectedTicket.id, { status: newStatus });



            await new Promise(resolve => setTimeout(resolve, 800));

            setSuccessMessage(`Ticket #${selectedTicket.id} status updated successfully!`);

            // Update local state
            setTickets(prev => prev.map(t =>
                t.id === selectedTicket.id
                    ? { ...t, status: newStatus, resolved_at: newStatus === 'resolved' ? new Date().toISOString() : t.resolved_at }
                    : t
            ));

            handleCloseModal();
        } catch (err) {
            setModalError(err.response?.data?.message || 'Failed to update ticket');
        } finally {
            setSubmitting(false);
        }
    };

    const handleBackToHome = () => {
        navigate('/');

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

    // Filter tickets based on status
    const filteredTickets = filterStatus === 'all'
        ? tickets
        : tickets.filter(t => t.status === filterStatus);

    // Calculate statistics
    const stats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        in_progress: tickets.filter(t => t.status === 'in_progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-700">Loading tickets...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                {/* Success Message */}
                {successMessage && (
                    <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm border border-green-200 flex items-center gap-2">
                        <Check size={20} />
                        {successMessage}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm border border-red-200">
                        {error}
                    </div>
                )}

                {/* Header */}
                <header className="flex justify-between items-center mb-8 gap-4">
                    <button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg text-sm font-medium transition-all hover:-translate-y-0.5 whitespace-nowrap shadow-md"
                        onClick={handleBackToHome}
                    >
                        ← Back to Home
                    </button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 m-0">Maintenance Tickets</h1>
                        <p className="text-gray-600 mt-2">Review and manage all maintenance requests</p>
                    </div>
                </header>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-gray-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Total Tickets</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                            </div>
                            <Wrench className="text-gray-400" size={32} />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-red-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Open</p>
                                <p className="text-3xl font-bold text-red-600 mt-1">{stats.open}</p>
                            </div>
                            <AlertCircle className="text-red-400" size={32} />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">In Progress</p>
                                <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.in_progress}</p>
                            </div>
                            <PlayCircle className="text-yellow-400" size={32} />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Resolved</p>
                                <p className="text-3xl font-bold text-green-600 mt-1">{stats.resolved}</p>
                            </div>
                            <CheckCircle className="text-green-400" size={32} />
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                filterStatus === 'all'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            All ({stats.total})
                        </button>
                        <button
                            onClick={() => setFilterStatus('open')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                filterStatus === 'open'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Open ({stats.open})
                        </button>
                        <button
                            onClick={() => setFilterStatus('in_progress')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                filterStatus === 'in_progress'
                                    ? 'bg-yellow-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            In Progress ({stats.in_progress})
                        </button>
                        <button
                            onClick={() => setFilterStatus('resolved')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                filterStatus === 'resolved'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Resolved ({stats.resolved})
                        </button>
                    </div>
                </div>

                {/* Tickets Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="bg-gray-50 text-gray-700 font-semibold px-6 py-4 border-b border-gray-200 text-xs uppercase tracking-wider text-left">ID</th>
                                    <th className="bg-gray-50 text-gray-700 font-semibold px-6 py-4 border-b border-gray-200 text-xs uppercase tracking-wider text-left">Room</th>
                                    <th className="bg-gray-50 text-gray-700 font-semibold px-6 py-4 border-b border-gray-200 text-xs uppercase tracking-wider text-left">Issue Type</th>
                                    <th className="bg-gray-50 text-gray-700 font-semibold px-6 py-4 border-b border-gray-200 text-xs uppercase tracking-wider text-left">Description</th>
                                    <th className="bg-gray-50 text-gray-700 font-semibold px-6 py-4 border-b border-gray-200 text-xs uppercase tracking-wider text-left">Reported By</th>
                                    <th className="bg-gray-50 text-gray-700 font-semibold px-6 py-4 border-b border-gray-200 text-xs uppercase tracking-wider text-left">Status</th>
                                    <th className="bg-gray-50 text-gray-700 font-semibold px-6 py-4 border-b border-gray-200 text-xs uppercase tracking-wider text-left">Date</th>
                                    <th className="bg-gray-50 text-gray-700 font-semibold px-6 py-4 border-b border-gray-200 text-xs uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTickets.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center p-8 text-gray-500">
                                            No tickets found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTickets.map(ticket => (
                                        <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 border-b border-gray-200 align-middle">
                                                <span className="font-semibold text-gray-900">#{ticket.id}</span>
                                            </td>
                                            <td className="px-6 py-4 border-b border-gray-200 align-middle">
                                                <div>
                                                    <div className="font-medium text-gray-900">{ticket.room?.name}</div>
                                                    <div className="text-xs text-gray-500">{ticket.room?.building}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 border-b border-gray-200 align-middle">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ISSUE_TYPE_COLORS[ticket.issue_type]}`}>
                                                    {ISSUE_TYPE_LABELS[ticket.issue_type]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 border-b border-gray-200 align-middle">
                                                <div className="max-w-xs">
                                                    <p className="text-sm text-gray-700 line-clamp-2">{ticket.description}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 border-b border-gray-200 align-middle">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{ticket.user?.name}</div>
                                                    <div className="text-xs text-gray-500">{ticket.user?.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 border-b border-gray-200 align-middle">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${TICKET_STATUS_COLORS[ticket.status]}`}>
                                                    {getStatusIcon(ticket.status)}
                                                    {TICKET_STATUS_LABELS[ticket.status]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 border-b border-gray-200 align-middle">
                                                <div className="text-sm text-gray-700">{formatDate(ticket.created_by)}</div>
                                            </td>
                                            <td className="px-6 py-4 border-b border-gray-200 align-middle">
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        className="w-8 h-8 flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                                                        onClick={() => handleOpenDetailsModal(ticket)}
                                                        title="View Details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        className="w-8 h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors text-lg"
                                                        onClick={() => handleOpenModal(ticket)}
                                                        title="Update Status"
                                                    >
                                                        ✎
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Update Status Modal */}
            {isModalOpen && selectedTicket && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4 px-6 pt-6">
                            <h2 className="text-xl font-semibold m-0 text-gray-900">Update Ticket Status</h2>
                            <button
                                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                                onClick={handleCloseModal}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="px-6 pb-6">
                            {modalError && (
                                <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm border border-red-200 flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    {modalError}
                                </div>
                            )}

                            {/* Ticket Info */}
                            <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                <div className="font-semibold text-gray-900 mb-2">Ticket #{selectedTicket.id}</div>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div><strong>Room:</strong> {selectedTicket.room?.name}</div>
                                    <div><strong>Issue:</strong> {ISSUE_TYPE_LABELS[selectedTicket.issue_type]}</div>
                                    <div><strong>Reported by:</strong> {selectedTicket.user?.name}</div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2 text-gray-700">
                                    Current Status
                                </label>
                                <div className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold ${TICKET_STATUS_COLORS[selectedTicket.status]}`}>
                                    {getStatusIcon(selectedTicket.status)}
                                    {TICKET_STATUS_LABELS[selectedTicket.status]}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2 text-gray-700">
                                    New Status *
                                </label>
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white transition-colors focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                >
                                    {TICKET_STATUS.map(status => (
                                        <option key={status.value} value={status.value}>
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                                <button
                                    onClick={handleCloseModal}
                                    disabled={submitting}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateStatus}
                                    disabled={submitting}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Updating...' : 'Update Status'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {isDetailsModalOpen && detailsTicket && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCloseDetailsModal}>
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4 px-6 pt-6">
                            <h2 className="text-xl font-semibold m-0 text-gray-900">Ticket Details</h2>
                            <button
                                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                                onClick={handleCloseDetailsModal}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="px-6 pb-6">
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
                                    <label className="text-sm font-semibold text-gray-700 block mb-1">Reported By</label>
                                    <div className="text-gray-900">{detailsTicket.user?.name}</div>
                                    <div className="text-sm text-gray-600">{detailsTicket.user?.email}</div>
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

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                                <button
                                    onClick={handleCloseDetailsModal}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        handleCloseDetailsModal();
                                        handleOpenModal(detailsTicket);
                                    }}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-md"
                                >
                                    Update Status
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTicketsManager;