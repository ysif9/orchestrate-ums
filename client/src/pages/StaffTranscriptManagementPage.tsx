import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { transcriptService } from '../services/transcriptService';
import { FileText, CheckCircle, Clock, ArrowLeft, XCircle, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

const TRANSCRIPT_STATUS = {
    PENDING_REVIEW: 1,
    APPROVED: 2,
    REJECTED: 3
};

export default function StaffTranscriptManagementPage() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [approvingId, setApprovingId] = useState<number | null>(null);
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);

    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const fetchPendingRequests = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await transcriptService.getPendingRequests();
            setRequests((response as any).requests || []);
        } catch (err) {
            setError('Failed to load pending transcript requests. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveRequest = async (id: number) => {
        try {
            setApprovingId(id);
            setMessage('');
            setError('');
            const response = await transcriptService.approveRequest(id);
            if ((response as any).success) {
                setMessage(`Transcript request #${id} approved successfully!`);
                // Refresh the list to remove approved request
                await fetchPendingRequests();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || `Failed to approve request #${id}. Please try again.`);
            console.error(err);
        } finally {
            setApprovingId(null);
        }
    };

    const handleRejectRequest = async () => {
        if (!selectedRequestId) return;

        try {
            setRejectingId(selectedRequestId);
            setMessage('');
            setError('');
            const response = await transcriptService.rejectRequest(selectedRequestId, rejectionReason);
            if ((response as any).success) {
                setMessage(`Transcript request #${selectedRequestId} rejected.`);
                setShowRejectModal(false);
                setRejectionReason('');
                setSelectedRequestId(null);
                // Refresh the list to remove rejected request
                await fetchPendingRequests();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || `Failed to reject request #${selectedRequestId}. Please try again.`);
            console.error(err);
        } finally {
            setRejectingId(null);
        }
    };

    const openRejectModal = (id: number) => {
        setSelectedRequestId(id);
        setRejectionReason('');
        setShowRejectModal(true);
    };

    const closeRejectModal = () => {
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedRequestId(null);
    };

    const getStatusBadge = (status: number) => {
        switch (status) {
            case TRANSCRIPT_STATUS.PENDING_REVIEW:
                return (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 gap-1 w-fit">
                        <Clock size={12} /> Pending Review
                    </Badge>
                );
            case TRANSCRIPT_STATUS.APPROVED:
                return (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700 gap-1 w-fit">
                        <CheckCircle size={12} /> Approved
                    </Badge>
                );
            case TRANSCRIPT_STATUS.REJECTED:
                return (
                    <Badge variant="destructive" className="gap-1 w-fit">
                        <XCircle size={12} /> Rejected
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-muted-foreground">
                Loading pending transcript requests...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto py-8 px-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between border-b pb-6">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="default"
                                onClick={() => navigate('/admin/home')}
                                className="shadow-sm"
                            >
                                <ArrowLeft size={18} className="mr-2" />
                                Back to Home
                            </Button>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <FileText size={28} className="text-primary" />
                                Transcript Request Management
                            </CardTitle>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-6">
                        {/* Messages */}
                        {message && (
                            <Alert variant="default" className="mb-6 bg-green-50 text-green-900 border-green-200">
                                <CheckCircle className="h-4 w-4" />
                                <AlertTitle>Success</AlertTitle>
                                <AlertDescription>{message}</AlertDescription>
                            </Alert>
                        )}
                        {error && (
                            <Alert variant="destructive" className="mb-6">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Requests Table */}
                        {requests.length === 0 ? (
                            <div className="text-center py-16">
                                <FileText size={64} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                                <h3 className="text-xl font-semibold text-foreground mb-2">No Pending Requests</h3>
                                <p className="text-muted-foreground">
                                    There are no pending transcript requests at this time.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead>Request ID</TableHead>
                                            <TableHead>Student Name</TableHead>
                                            <TableHead>Student ID</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Requested Date</TableHead>
                                            <TableHead className="text-center">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {requests.map((request) => (
                                            <TableRow key={request.id}>
                                                <TableCell className="font-mono text-sm">#{request.id}</TableCell>
                                                <TableCell className="font-medium">
                                                    {request.student?.name || 'N/A'}
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    #{request.student?.id || 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(request.status)}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(request.requestedAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {request.status === TRANSCRIPT_STATUS.PENDING_REVIEW ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                                                onClick={() => handleApproveRequest(request.id)}
                                                                disabled={approvingId === request.id || rejectingId === request.id}
                                                            >
                                                                <CheckCircle size={16} className="mr-1" />
                                                                {approvingId === request.id ? 'Approving...' : 'Approve'}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                                onClick={() => openRejectModal(request.id)}
                                                                disabled={approvingId === request.id || rejectingId === request.id}
                                                            >
                                                                <XCircle size={16} className="mr-1" />
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">—</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Reject Modal */}
            <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Reject Transcript Request</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reject transcript request #{selectedRequestId}? Please provide a reason for rejection.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">Rejection Reason</Label>
                            <Textarea
                                id="reason"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Enter reason for rejection..."
                                className="col-span-3"
                                rows={4}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={closeRejectModal} disabled={rejectingId !== null}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRejectRequest}
                            disabled={rejectingId !== null || !rejectionReason.trim()}
                        >
                            <XCircle size={16} className="mr-2" />
                            {rejectingId !== null ? 'Rejecting...' : 'Reject Request'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
