import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { transcriptService } from '../services/transcriptService.js'; // Ensure correct import path
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { FileText, Plus, Eye, Clock, CheckCircle, XCircle, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

function TranscriptRequestsPage() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState<any[]>([]);
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
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create transcript request. Please try again.');
            console.error(err);
        } finally {
            setCreating(false);
        }
    };

    const handleViewRequest = (id: number) => {
        navigate(`/transcript-requests/${id}`);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700 gap-1 w-fit">
                        <CheckCircle className="w-3 h-3" /> Approved
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge variant="destructive" className="gap-1 w-fit">
                        <XCircle className="w-3 h-3" /> Rejected
                    </Badge>
                );
            case 'pending_review':
            default:
                return (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 gap-1 w-fit">
                        <Clock className="w-3 h-3" /> Pending Review
                    </Badge>
                );
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mr-2" />
                Loading transcript requests...
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8 bg-muted/20">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Transcript Requests</h1>
                            <p className="text-muted-foreground">Request and view your academic transcripts</p>
                        </div>
                    </div>

                    <Button variant="outline" onClick={() => navigate('/home')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Button>
                </div>

                <div className="flex justify-end">
                    <Button onClick={handleCreateRequest} disabled={creating}>
                        {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        {creating ? 'Creating...' : 'Generate New Request'}
                    </Button>
                </div>

                {message && (
                    <div className="bg-green-50 text-green-700 px-4 py-3 rounded-md text-sm flex items-center gap-2 border border-green-200">
                        <CheckCircle className="w-4 h-4" />
                        {message}
                    </div>
                )}
                {error && (
                    <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>My Requests</CardTitle>
                        <CardDescription>History of all transcript generated requests</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {requests.length === 0 ? (
                            <div className="text-center py-12 flex flex-col items-center">
                                <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No Requests Found</h3>
                                <p className="text-muted-foreground mb-6">You haven't submitted any transcript requests yet.</p>
                                <Button onClick={handleCreateRequest} disabled={creating} variant="secondary">
                                    Create Your First Request
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Request ID</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Requested Date</TableHead>
                                        <TableHead>Reviewed Date</TableHead>
                                        <TableHead>Reviewed By</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requests.map((request) => (
                                        <TableRow key={request.id}>
                                            <TableCell className="font-mono text-xs">#{request.id}</TableCell>
                                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                                            <TableCell>{new Date(request.requestedAt).toLocaleDateString()}</TableCell>
                                            <TableCell>{request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString() : '—'}</TableCell>
                                            <TableCell>{request.reviewedBy?.name || '—'}</TableCell>
                                            <TableCell className="text-center">
                                                {request.status === 'approved' ? (
                                                    <Button size="sm" variant="ghost" onClick={() => handleViewRequest(request.id)} className="hover:bg-primary/10 hover:text-primary">
                                                        <Eye className="w-4 h-4 mr-2" /> View
                                                    </Button>
                                                ) : request.status === 'rejected' ? (
                                                    <span className="text-destructive text-sm italic">{request.rejectionReason || 'Rejected'}</span>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm italic">Pending...</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default TranscriptRequestsPage;
