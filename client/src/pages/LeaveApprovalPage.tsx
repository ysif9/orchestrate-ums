import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import axios from 'axios';
import { Loader2, Check, X, ArrowLeft } from 'lucide-react';
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';

interface User {
    id: number;
    name: string;
    email: string;
}

interface LeaveRequest {
    id: number;
    applicant: User;
    type: string;
    startDate: string;
    endDate: string;
    status: 'pending' | 'approved' | 'rejected';
    reason?: string;
    createdAt: string;
}

const LeaveApprovalPage = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Use environment variable or fallback to default local API URL
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null); // For rejection dialog

    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const fetchPendingRequests = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/leave-requests/pending`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            // Ensure response data is an array
            setRequests(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error fetching pending requests:", error);
            toast.error("Error", {
                description: "Failed to load pending requests",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (id: number, status: 'approved' | 'rejected', reason?: string) => {
        setProcessingId(id);
        try {
            await axios.patch(`${API_URL}/api/leave-requests/${id}/status`, {
                status: status === 'approved' ? 'approved' : 'rejected',
                rejectionReason: reason
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            toast.success("Success", {
                description: `Request ${status} successfully`,
            });

            // Remove from list
            setRequests(prev => prev.filter(r => r.id !== id));
            setRejectReason('');
            setSelectedRequestId(null);
        } catch (error) {
            console.error(`Error ${status} request:`, error);
            toast.error("Error", {
                description: `Failed to ${status} request`,
            });
        } finally {
            setProcessingId(null);
        }
    };

    const handleBack = () => {
        const user: any = authService.getCurrentUser();
        if (user?.role === 'teaching_assistant') {
            navigate('/ta-dashboard');
        } else {
            navigate('/admin/home');
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <div className="container mx-auto py-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Leave Requests Approval</CardTitle>
                            <CardDescription>Review and manage pending leave requests from staff.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleBack}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Applicant</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No pending requests found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                requests.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell>
                                            <div className="font-medium">{request.applicant.name}</div>
                                            <div className="text-sm text-muted-foreground">{request.applicant.email}</div>
                                        </TableCell>
                                        <TableCell className="capitalize">{request.type}</TableCell>
                                        <TableCell>
                                            {format(new Date(request.startDate), 'MMM dd')} - {format(new Date(request.endDate), 'MMM dd, yyyy')}
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={request.reason}>
                                            {request.reason || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => handleAction(request.id, 'approved')}
                                                    disabled={processingId === request.id}
                                                >
                                                    {processingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                </Button>

                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            disabled={processingId === request.id}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Reject Leave Request</DialogTitle>
                                                            <DialogDescription>
                                                                Please provide a reason for rejecting this request.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <Textarea
                                                            placeholder="Reason for rejection..."
                                                            value={rejectReason}
                                                            onChange={(e) => setRejectReason(e.target.value)}
                                                        />
                                                        <DialogFooter>
                                                            <Button
                                                                variant="destructive"
                                                                onClick={() => handleAction(request.id, 'rejected', rejectReason)}
                                                                disabled={!rejectReason.trim() || processingId === request.id}
                                                            >
                                                                {processingId === request.id ? "Rejecting..." : "Confirm Rejection"}
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default LeaveApprovalPage;
