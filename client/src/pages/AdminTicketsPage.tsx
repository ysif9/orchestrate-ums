import { useState, useEffect } from 'react';
import { ticketsService } from "../services/ticketsService.js";
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Wrench, AlertCircle, Check, X, Clock, CheckCircle, PlayCircle, Eye } from 'lucide-react';

// ticket_status enum: open=1, in_progress=2, resolved=3
const TICKET_STATUS = [
    { value: '1', label: 'Open' },
    { value: '2', label: 'In Progress' },
    { value: '3', label: 'Resolved' }
];

const TICKET_STATUS_CLASSES: Record<number | string, string> = {
    1: 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200',
    2: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200',
    3: 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200'
};

const TICKET_STATUS_LABELS: Record<number | string, string> = {
    1: 'Open',
    2: 'In Progress',
    3: 'Resolved'
};

// issue_type enum: hardware=1, software=2, other=3
const ISSUE_TYPE_LABELS: Record<number | string, string> = {
    1: 'Hardware',
    2: 'Software',
    3: 'Other'
};

const ISSUE_TYPE_CLASSES: Record<number | string, string> = {
    1: 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200',
    2: 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200',
    3: 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200'
};


const AdminTicketsManager = () => {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const navigate = useNavigate();

    // Modal state
    const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [newStatus, setNewStatus] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [modalError, setModalError] = useState('');

    // Details modal state
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [detailsTicket, setDetailsTicket] = useState<any>(null);

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

    const handleOpenModifyModal = (ticket: any) => {
        setSelectedTicket(ticket);
        setNewStatus(String(ticket.status)); // Convert to string for Select component
        setModalError('');
        setIsModifyModalOpen(true);
    };

    const handleCloseModifyModal = () => {
        setIsModifyModalOpen(false);
        setSelectedTicket(null);
        setModalError('');
    };

    const handleOpenDetailsModal = (ticket: any) => {
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

        if (parseInt(newStatus) === selectedTicket.status) {
            setModalError('Please select a different status');
            setSubmitting(false);
            return;
        }

        try {
            await ticketsService.updateTicket(selectedTicket.id, { status: parseInt(newStatus) });

            // Simulate delay like existing code
            await new Promise(resolve => setTimeout(resolve, 800));

            setSuccessMessage(`Ticket #${selectedTicket.id} status updated successfully!`);

            // Update local state
            setTickets(prev => prev.map(t =>
                t.id === selectedTicket.id
                    ? { ...t, status: parseInt(newStatus), resolved_at: parseInt(newStatus) === 3 ? new Date().toISOString() : t.resolved_at }
                    : t
            ));

            handleCloseModifyModal();
        } catch (err: any) {
            setModalError(err.response?.data?.message || 'Failed to update ticket');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
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

    const getStatusIcon = (status: number | string) => {
        switch (status) {
            case 1:
                return <AlertCircle size={14} />;
            case 2:
                return <PlayCircle size={14} />;
            case 3:
                return <CheckCircle size={14} />;
            default:
                return <Clock size={14} />;
        }
    };

    // Filter tickets based on status
    const filteredTickets = filterStatus === 'all'
        ? tickets
        : tickets.filter(t => t.status === parseInt(filterStatus));

    // Calculate statistics
    const stats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 1).length,
        in_progress: tickets.filter(t => t.status === 2).length,
        resolved: tickets.filter(t => t.status === 3).length
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-muted-foreground">
                <div className="flex gap-2 items-center">Loading tickets...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8 bg-muted/20">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Success Message */}
                {successMessage && (
                    <div className="bg-green-100 text-green-700 px-4 py-3 rounded-md mb-4 text-sm border border-green-200 flex items-center gap-2">
                        <Check size={18} />
                        {successMessage}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md mb-4 text-sm flex items-center gap-2">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {/* Header */}
                <header className="flex justify-between items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/admin/home')}
                        className="gap-2"
                    >
                        ← Back to Home
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Maintenance Tickets</h1>
                        <p className="text-muted-foreground mt-1">Review and manage all maintenance requests</p>
                    </div>
                </header>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-l-4 border-l-primary">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Total Tickets</p>
                                    <p className="text-3xl font-bold text-foreground mt-1">{stats.total}</p>
                                </div>
                                <Wrench className="text-muted-foreground/40" size={32} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-destructive">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Open</p>
                                    <p className="text-3xl font-bold text-destructive mt-1">{stats.open}</p>
                                </div>
                                <AlertCircle className="text-destructive/40" size={32} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-yellow-500">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">In Progress</p>
                                    <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.in_progress}</p>
                                </div>
                                <PlayCircle className="text-yellow-500/40" size={32} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-green-500">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Resolved</p>
                                    <p className="text-3xl font-bold text-green-600 mt-1">{stats.resolved}</p>
                                </div>
                                <CheckCircle className="text-green-500/40" size={32} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Tabs */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: 'all', label: `All (${stats.total})`, variant: filterStatus === 'all' ? 'default' : 'secondary' },
                                { id: '1', label: `Open (${stats.open})`, variant: filterStatus === '1' ? 'destructive' : 'secondary', className: filterStatus === '1' ? '' : 'hover:bg-destructive/10 hover:text-destructive' },
                                { id: '2', label: `In Progress (${stats.in_progress})`, variant: filterStatus === '2' ? 'default' : 'secondary', className: filterStatus === '2' ? 'bg-yellow-600 hover:bg-yellow-700' : 'hover:bg-yellow-100 hover:text-yellow-800' },
                                { id: '3', label: `Resolved (${stats.resolved})`, variant: filterStatus === '3' ? 'default' : 'secondary', className: filterStatus === '3' ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-green-100 hover:text-green-800' }
                            ].map((filter: any) => (
                                <Button
                                    key={filter.id}
                                    variant={filter.variant}
                                    onClick={() => setFilterStatus(filter.id)}
                                    className={`h-9 px-4 text-sm font-medium ${filter.className || ''}`}
                                >
                                    {filter.label}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Tickets Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground uppercase">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">ID</th>
                                        <th className="px-6 py-4 font-medium">Room</th>
                                        <th className="px-6 py-4 font-medium">Issue Type</th>
                                        <th className="px-6 py-4 font-medium">Description</th>
                                        <th className="px-6 py-4 font-medium">Reported By</th>
                                        <th className="px-6 py-4 font-medium">Status</th>
                                        <th className="px-6 py-4 font-medium">Date</th>
                                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredTickets.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center p-8 text-muted-foreground">
                                                No tickets found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTickets.map(ticket => (
                                            <tr key={ticket.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="px-6 py-4 font-semibold">#{ticket.id}</td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="font-medium text-foreground">{ticket.room?.name}</div>
                                                        <div className="text-xs text-muted-foreground">{ticket.room?.building}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${ISSUE_TYPE_CLASSES[ticket.issue_type]}`}>
                                                        {ISSUE_TYPE_LABELS[ticket.issue_type]}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="max-w-xs truncate" title={ticket.description}>
                                                        {ticket.description}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="font-medium text-foreground">{ticket.user?.name}</div>
                                                        <div className="text-xs text-muted-foreground">{ticket.user?.email}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${TICKET_STATUS_CLASSES[ticket.status]}`}>
                                                        {getStatusIcon(ticket.status)}
                                                        {TICKET_STATUS_LABELS[ticket.status]}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {formatDate(ticket.created_by)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2 justify-end">
                                                        <Button
                                                            variant="secondary"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => handleOpenDetailsModal(ticket)}
                                                            title="View Details"
                                                        >
                                                            <Eye size={16} />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200"
                                                            onClick={() => handleOpenModifyModal(ticket)}
                                                            title="Update Status"
                                                        >
                                                            <Wrench size={16} /> {/* Using Wrench icon for edit/update status */}
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Update Status Modal */}
            <Dialog open={isModifyModalOpen} onOpenChange={setIsModifyModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Update Ticket Status</DialogTitle>
                    </DialogHeader>

                    {selectedTicket && (
                        <div className="space-y-4 py-4">
                            {modalError && (
                                <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    {modalError}
                                </div>
                            )}

                            {/* Ticket Info */}
                            <div className="bg-muted p-4 rounded-md">
                                <div className="font-semibold mb-2">Ticket #{selectedTicket.id}</div>
                                <div className="text-sm text-muted-foreground space-y-1">
                                    <div><strong>Room:</strong> {selectedTicket.room?.name}</div>
                                    <div><strong>Issue:</strong> {ISSUE_TYPE_LABELS[selectedTicket.issue_type]}</div>
                                    <div><strong>Reported by:</strong> {selectedTicket.user?.name}</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Current Status</Label>
                                <div>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${TICKET_STATUS_CLASSES[selectedTicket.status]}`}>
                                        {getStatusIcon(selectedTicket.status)}
                                        {TICKET_STATUS_LABELS[selectedTicket.status]}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="newStatus">New Status *</Label>
                                <Select
                                    value={newStatus}
                                    onValueChange={(value) => setNewStatus(value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TICKET_STATUS.map(status => (
                                            <SelectItem key={status.value} value={status.value}>
                                                {status.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={handleCloseModifyModal} disabled={submitting}>
                                    Cancel
                                </Button>
                                <Button type="submit" onClick={handleUpdateStatus} disabled={submitting}>
                                    {submitting ? 'Updating...' : 'Update Status'}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Details Modal */}
            <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Ticket Details</DialogTitle>
                    </DialogHeader>

                    {detailsTicket && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground">Ticket ID</Label>
                                        <div className="font-medium">#{detailsTicket.id}</div>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Status</Label>
                                        <div className="mt-1">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${TICKET_STATUS_CLASSES[detailsTicket.status]}`}>
                                                {getStatusIcon(detailsTicket.status)}
                                                {TICKET_STATUS_LABELS[detailsTicket.status]}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground">Issue Type</Label>
                                        <div className="mt-1">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${ISSUE_TYPE_CLASSES[detailsTicket.issue_type]}`}>
                                                {ISSUE_TYPE_LABELS[detailsTicket.issue_type]}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Room</Label>
                                        <div className="font-medium">{detailsTicket.room?.name}</div>
                                        <div className="text-xs text-muted-foreground">{detailsTicket.room?.building}, Floor {detailsTicket.room?.floor}</div>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-muted-foreground">Reported By</Label>
                                    <div className="font-medium">{detailsTicket.user?.name}</div>
                                    <div className="text-sm text-muted-foreground">{detailsTicket.user?.email}</div>
                                </div>

                                <div>
                                    <Label className="text-muted-foreground">Description</Label>
                                    <div className="bg-muted p-4 rounded-md mt-1 text-sm">
                                        {detailsTicket.description}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground">Created</Label>
                                        <div className="text-sm text-foreground">{formatDate(detailsTicket.created_by)}</div>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Resolved</Label>
                                        <div className="text-sm text-foreground">
                                            {detailsTicket.resolved_at ? formatDate(detailsTicket.resolved_at) : 'Not yet resolved'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={handleCloseDetailsModal}>
                                    Close
                                </Button>
                                <Button onClick={() => {
                                    handleCloseDetailsModal();
                                    handleOpenModifyModal(detailsTicket);
                                }}>
                                    Update Status
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminTicketsManager;
