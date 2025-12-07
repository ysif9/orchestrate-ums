import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { transcriptService } from '../services/transcriptService';
import { FileText, CheckCircle, Clock, ArrowLeft } from 'lucide-react';

function StaffTranscriptManagementPage() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [approvingId, setApprovingId] = useState(null);

    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const fetchPendingRequests = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await transcriptService.getPendingRequests();
            setRequests(response.requests || []);
        } catch (err) {
            setError('Failed to load pending transcript requests. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveRequest = async (id) => {
        try {
            setApprovingId(id);
            setMessage('');
            setError('');
            const response = await transcriptService.approveRequest(id);
            if (response.success) {
                setMessage(`Transcript request #${id} approved successfully!`);
                // Refresh the list to remove approved request
                await fetchPendingRequests();
            }
        } catch (err) {
            setError(err.response?.data?.message || `Failed to approve request #${id}. Please try again.`);
            console.error(err);
        } finally {
            setApprovingId(null);
        }
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
                icon: Clock
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
                Loading pending transcript requests...
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
                                onClick={() => navigate('/admin/home')}
                                className="bg-brand-500 hover:bg-brand-600 text-content-inverse px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:-translate-y-0.5 whitespace-nowrap shadow-button hover:shadow-button-hover"
                            >
                                <ArrowLeft size={18} className="inline mr-2" />
                                Back to Home
                            </button>
                            <h1 className="text-2xl font-bold text-brand-500 flex items-center gap-2">
                                <FileText size={28} />
                                Transcript Request Management
                            </h1>
                        </div>
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
                                <h3 className="text-xl font-semibold text-content mb-2">No Pending Requests</h3>
                                <p className="text-content-tertiary mb-6">
                                    There are no pending transcript requests at this time.
                                </p>
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
                                                Student Name
                                            </th>
                                            <th className="px-4 py-3 text-left border-b-2 border-border text-sm font-semibold text-content">
                                                Student ID
                                            </th>
                                            <th className="px-4 py-3 text-left border-b-2 border-border text-sm font-semibold text-content">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-left border-b-2 border-border text-sm font-semibold text-content">
                                                Requested Date
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
                                                <td className="px-4 py-3 border-b border-border-light text-sm text-content font-medium">
                                                    {request.student?.name || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3 border-b border-border-light text-sm text-content font-mono">
                                                    #{request.student?.id || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3 border-b border-border-light text-sm">
                                                    {getStatusBadge(request.status)}
                                                </td>
                                                <td className="px-4 py-3 border-b border-border-light text-sm text-content">
                                                    {new Date(request.requestedAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3 border-b border-border-light text-sm text-center">
                                                    {request.status === 'pending_review' ? (
                                                        <button
                                                            onClick={() => handleApproveRequest(request.id)}
                                                            disabled={approvingId === request.id}
                                                            className="bg-success-600 hover:bg-success-700 text-content-inverse px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mx-auto shadow-button hover:shadow-button-hover disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <CheckCircle size={16} />
                                                            {approvingId === request.id ? 'Approving...' : 'Approve Request'}
                                                        </button>
                                                    ) : (
                                                        <span className="text-content-tertiary text-sm">—</span>
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

export default StaffTranscriptManagementPage;

