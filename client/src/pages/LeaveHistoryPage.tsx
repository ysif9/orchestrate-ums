import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import axios from 'axios';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';

interface LeaveRequest {
    id: number;
    type: string;
    startDate: string;
    endDate: string;
    status: 'pending' | 'approved' | 'rejected';
    reason?: string;
    rejectionReason?: string;
    createdAt: string;
}

const LeaveHistoryPage = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Use environment variable or fallback to default local API URL
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/leave-requests/my-requests`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setRequests(response.data);
        } catch (error) {
            console.error("Error fetching requests:", error);
            toast.error("Error", {
                description: "Failed to load leave history",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>;
            case 'rejected':
                return <Badge variant="destructive">Rejected</Badge>;
            default:
                return <Badge variant="secondary">Pending</Badge>;
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
                            <CardTitle>My Leave History</CardTitle>
                            <CardDescription>View the status of your submitted leave requests.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleBack}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableCaption>A list of your recent leave requests.</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>End Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Submitted On</TableHead>
                                <TableHead>Notes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">No leave requests found.</TableCell>
                                </TableRow>
                            ) : (
                                requests.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell className="capitalize">{request.type}</TableCell>
                                        <TableCell>{format(new Date(request.startDate), 'MMM dd, yyyy')}</TableCell>
                                        <TableCell>{format(new Date(request.endDate), 'MMM dd, yyyy')}</TableCell>
                                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                                        <TableCell>{format(new Date(request.createdAt), 'MMM dd, yyyy')}</TableCell>
                                        <TableCell className="max-w-xs truncate" title={request.rejectionReason || request.reason}>
                                            {request.status === 'rejected' && request.rejectionReason ? (
                                                <span className="text-red-500 text-sm">Reason: {request.rejectionReason}</span>
                                            ) : (
                                                request.reason
                                            )}
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

export default LeaveHistoryPage;
