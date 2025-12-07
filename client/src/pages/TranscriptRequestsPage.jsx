import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { transcriptService } from '../services/transcriptService';
import { FileText, Plus, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';

function TranscriptRequestsPage() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [creating, setCreating] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await transcriptService.getMyRequests();
            setRequests(response.requests || []);
        } catch (err) {
            setError('Failed to load transcript requests. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRequest = async () => {
        try {
            setCreating(true);
            setMessage('');
            const response = await transcriptService.createRequest();
            if (response.success) {
                setMessage('Transcript request created successfully!');
                fetchRequests();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create transcript request. Please try again.');
            console.error(err);
        } finally {
            setCreating(false);
        }
    };

    const handleViewRequest = (id) => {
        navigate(`/transcript-requests/${id}`);
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'pending_review': {
                label: 'Pending Review',
                bgColor: 'bg-warning-100',
                textColor: 'text-warning-700',
                icon: Clock
            },
            'approved': {
                label: 'Approved',
                bgColor: 'bg-success-100',
                textColor: 'text-success-700',
                icon: CheckCircle
            },
            'rejected': {
                label: 'Rejected',
                bgColor: 'bg-error-100',
                textColor: 'text-error-700',
                icon: XCircle
            }
        };

        const statusInfo = statusMap[status] || statusMap['pending_review'];
        const Icon = statusInfo.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                <Icon size={14} />
                {statusInfo.label}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-content-secondary">
                Loading transcript requests...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-secondary">
            <div className="max-w-6xl mx-auto py-8 px-5">
                <div className="bg-surface rounded-xl shadow-lg">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 pt-8 px-8 border-b border-border pb-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/home')}
                                className="bg-brand-500 hover:bg-brand-600 text-content-inverse px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:-translate-y-0.5 whitespace-nowrap shadow-button hover:shadow-button-hover"
                            >
                                Back to Home
                            </button>
                            <h1 className="text-2xl font-bold text-brand-500 flex items-center gap-2">
                                <FileText size={28} />
                                Transcript Requests
                            </h1>
                        </div>
                        <button
                            onClick={handleCreateRequest}
                            disabled={creating}
                            className="bg-brand-500 hover:bg-brand-600 text-content-inverse px-6 py-2.5 rounded-lg text-sm font-medium transition-all hover:-translate-y-0.5 shadow-button hover:shadow-button-hover flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus size={18} />
                            {creating ? 'Creating...' : 'Generate Transcript Request'}
                        </button>
                    </div>

                    {/* Messages */}
                    {message && (
                        <div className="mx-8 mb-6 bg-success-100 text-success-700 px-4 py-3 rounded-lg border border-success-200">
                            {message}
                        </div>
                    )}
                    {error && (
                        <div className="mx-8 mb-6 bg-error-100 text-error-700 px-4 py-3 rounded-lg border border-error-200">
                            {error}
                        </div>
                    )}

                    {/* Requests Table */}
                    <div className="px-8 pb-8">
                        {requests.length === 0 ? (
                            <div className="text-center py-16">
                                <FileText size={64} className="mx-auto text-content-tertiary mb-4" />
                                <h3 className="text-xl font-semibold text-content mb-2">No Transcript Requests</h3>
                                <p className="text-content-tertiary mb-6">
                                    You haven't submitted any transcript requests yet.
                                </p>
                                <button
                                    onClick={handleCreateRequest}
                                    disabled={creating}
                                    className="bg-brand-500 hover:bg-brand-600 text-content-inverse px-6 py-3 rounded-lg font-medium transition-colors shadow-button hover:shadow-button-hover flex items-center gap-2 mx-auto disabled:opacity-50"
                                >
                                    <Plus size={18} />
                                    {creating ? 'Creating...' : 'Create Your First Request'}
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-surface-tertiary">
                                            <th className="px-4 py-3 text-left border-b-2 border-border text-sm font-semibold text-content">
                                                Request ID
                                            </th>
                                            <th className="px-4 py-3 text-left border-b-2 border-border text-sm font-semibold text-content">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-left border-b-2 border-border text-sm font-semibold text-content">
                                                Requested Date
                                            </th>
                                            <th className="px-4 py-3 text-left border-b-2 border-border text-sm font-semibold text-content">
                                                Reviewed Date
                                            </th>
                                            <th className="px-4 py-3 text-left border-b-2 border-border text-sm font-semibold text-content">
                                                Reviewed By
                                            </th>
                                            <th className="px-4 py-3 text-center border-b-2 border-border text-sm font-semibold text-content">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requests.map((request) => (
                                            <tr key={request.id} className="hover:bg-surface-hover transition-colors">
                                                <td className="px-4 py-3 border-b border-border-light text-sm text-content font-mono">
                                                    #{request.id}
                                                </td>
                                                <td className="px-4 py-3 border-b border-border-light text-sm">
                                                    {getStatusBadge(request.status)}
                                                </td>
                                                <td className="px-4 py-3 border-b border-border-light text-sm text-content">
                                                    {new Date(request.requestedAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3 border-b border-border-light text-sm text-content">
                                                    {request.reviewedAt
                                                        ? new Date(request.reviewedAt).toLocaleDateString()
                                                        : '—'}
                                                </td>
                                                <td className="px-4 py-3 border-b border-border-light text-sm text-content">
                                                    {request.reviewedBy?.name || '—'}
                                                </td>
                                                <td className="px-4 py-3 border-b border-border-light text-sm text-center">
                                                    {request.status === 'approved' ? (
                                                        <button
                                                            onClick={() => handleViewRequest(request.id)}
                                                            className="bg-info-600 hover:bg-info-700 text-content-inverse px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mx-auto shadow-button hover:shadow-button-hover"
                                                        >
                                                            <Eye size={16} />
                                                            View Transcript
                                                        </button>
                                                    ) : request.status === 'rejected' ? (
                                                        <div className="text-error-600 text-sm">
                                                            {request.rejectionReason || 'Rejected'}
                                                        </div>
                                                    ) : (
                                                        <span className="text-content-tertiary text-sm">Pending...</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TranscriptRequestsPage;

