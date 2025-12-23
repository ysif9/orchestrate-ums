import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authService } from '../services/authService.js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    ArrowLeft,
    MessageSquare,
    Send,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Clock,
    User
} from 'lucide-react';

interface Inquiry {
    id: number;
    subject: string;
    parent: {
        id: number;
        name: string;
    };
    student: {
        id: number;
        name: string;
    };
    course: {
        id: number;
        code: string;
        title: string;
    };
    status: number; // 1=Open, 2=Resolved, 3=Archived
    lastMessageAt: string;
    hasUnread: boolean;
    messageCount: number;
    latestMessage: {
        content: string;
        isFromParent: boolean;
        createdAt: string;
    } | null;
}

interface InquiryThread {
    id: number;
    subject: string;
    parent: {
        id: number;
        name: string;
    };
    student: {
        id: number;
        name: string;
    };
    course: {
        id: number;
        code: string;
        title: string;
    };
    status: number;
    messages: Message[];
}

interface Message {
    id: number;
    sender: {
        id: number;
        name: string;
        role: number;
    };
    content: string;
    isFromParent: boolean;
    isRead: boolean;
    createdAt: string;
}

function ProfessorInbox() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Thread view state
    const [selectedInquiry, setSelectedInquiry] = useState<InquiryThread | null>(null);
    const [threadLoading, setThreadLoading] = useState(false);
    const [replyMessage, setReplyMessage] = useState('');
    const [sendingReply, setSendingReply] = useState(false);

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        try {
            setLoading(true);
            // For professors, we'll need a different endpoint
            const response = await axios.get('http://localhost:5000/api/parent-inquiries/professor');
            setInquiries(response.data.data);
        } catch (err: any) {
            console.error("Error fetching inquiries:", err);
            setError(err.response?.data?.message || 'Failed to load inquiries.');
        } finally {
            setLoading(false);
        }
    };

    const fetchThread = async (inquiryId: number) => {
        try {
            setThreadLoading(true);
            const response = await axios.get(`http://localhost:5000/api/parent-inquiries/${inquiryId}/thread`);
            setSelectedInquiry(response.data.data);
        } catch (err: any) {
            console.error("Error fetching thread:", err);
            setError(err.response?.data?.message || 'Failed to load conversation.');
        } finally {
            setThreadLoading(false);
        }
    };

    const handleSendReply = async () => {
        if (!selectedInquiry || !replyMessage.trim()) return;

        try {
            setSendingReply(true);
            await axios.post(`http://localhost:5000/api/parent-inquiries/${selectedInquiry.id}/reply`, {
                message: replyMessage
            });

            setReplyMessage('');
            // Refresh thread
            await fetchThread(selectedInquiry.id);
            // Refresh inquiry list
            await fetchInquiries();
        } catch (err: any) {
            console.error("Error sending reply:", err);
            setError(err.response?.data?.message || 'Failed to send reply.');
        } finally {
            setSendingReply(false);
        }
    };

    const handleResolveInquiry = async (inquiryId: number) => {
        try {
            await axios.put(`http://localhost:5000/api/parent-inquiries/${inquiryId}/resolve`);
            // Refresh thread to show updated status
            if (selectedInquiry) {
                await fetchThread(selectedInquiry.id);
            }
            await fetchInquiries();
        } catch (err: any) {
            console.error("Error resolving inquiry:", err);
            setError(err.response?.data?.message || 'Failed to resolve inquiry.');
        }
    };

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 1: // Open
                return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" />Open</Badge>;
            case 2: // Resolved
                return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Resolved</Badge>;
            default:
                return <Badge className="bg-gray-500">Unknown</Badge>;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    // Group inquiries by student
    const groupedInquiries = inquiries.reduce((acc, inquiry) => {
        const studentId = inquiry.student.id;
        if (!acc[studentId]) {
            acc[studentId] = {
                studentId: inquiry.student.id,
                studentName: inquiry.student.name,
                inquiries: []
            };
        }
        acc[studentId].inquiries.push(inquiry);
        return acc;
    }, {} as Record<number, { studentId: number; studentName: string; inquiries: Inquiry[] }>);

    return (
        <div className="min-h-screen bg-background">
            {/* HEADER */}
            <nav className="bg-primary text-primary-foreground px-8 py-4 shadow-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={() => navigate('/admin/home')}
                            variant="ghost"
                            className="text-primary-foreground hover:bg-primary-foreground/10"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="text-2xl font-bold text-primary-foreground">
                            Parent Inbox
                            <span className="block text-xs font-normal text-primary-foreground/80 tracking-wider mt-1">
                                PARENT COMMUNICATIONS
                            </span>
                        </h1>
                    </div>
                    <span className="text-primary-foreground/90 text-sm">Welcome, {(user as any)?.name}</span>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-8 py-8">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">Parent Communications</h2>
                    <p className="text-muted-foreground">
                        View and respond to messages from parents about their children's progress
                    </p>
                </div>

                {error && (
                    <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm flex items-center gap-2 mb-6">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setError('')}
                            className="ml-auto"
                        >
                            Dismiss
                        </Button>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : inquiries.length === 0 ? (
                    <Card>
                        <CardContent className="py-12">
                            <div className="text-center">
                                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                                <h3 className="text-lg font-semibold mb-2">No Parent Inquiries</h3>
                                <p className="text-muted-foreground mb-4">
                                    You haven't received any messages from parents yet.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-8">
                        {Object.values(groupedInquiries).map((group) => (
                            <Card key={group.studentId}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        {group.studentName}
                                    </CardTitle>
                                    <CardDescription>
                                        {group.inquiries.length} inquiry{group.inquiries.length !== 1 ? 'ies' : ''} from parent(s)
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {group.inquiries.map((inquiry) => (
                                            <Card
                                                key={inquiry.id}
                                                className={`cursor-pointer transition-all hover:shadow-md ${inquiry.hasUnread ? 'border-primary border-2' : ''
                                                    }`}
                                                onClick={() => fetchThread(inquiry.id)}
                                            >
                                                <CardContent className="pt-4">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="font-semibold">{inquiry.subject}</h4>
                                                                {inquiry.hasUnread && (
                                                                    <span className="h-2 w-2 bg-red-500 rounded-full"></span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">
                                                                From: {inquiry.parent.name}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Course: {inquiry.course.code} - {inquiry.course.title}
                                                            </p>
                                                        </div>
                                                        {getStatusBadge(inquiry.status)}
                                                    </div>
                                                    {inquiry.latestMessage && (
                                                        <div className="mt-3 pt-3 border-t">
                                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                                <span className="font-medium">
                                                                    {inquiry.latestMessage.isFromParent ? inquiry.parent.name : 'You'}:
                                                                </span>{' '}
                                                                {inquiry.latestMessage.content}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {formatDate(inquiry.latestMessage.createdAt)} · {inquiry.messageCount} message{inquiry.messageCount !== 1 ? 's' : ''}
                                                            </p>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Thread Dialog */}
            <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{selectedInquiry?.subject}</DialogTitle>
                        <DialogDescription>
                            From: {selectedInquiry?.parent.name} · Student: {selectedInquiry?.student.name} · {selectedInquiry?.course.code}
                        </DialogDescription>
                    </DialogHeader>

                    {threadLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto space-y-4 py-4">
                                {selectedInquiry?.messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${!message.isFromParent ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[70%] rounded-lg px-4 py-3 ${!message.isFromParent
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted'
                                                }`}
                                        >
                                            <p className="text-xs font-semibold mb-1">
                                                {message.sender.name}
                                            </p>
                                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                            <p className="text-xs mt-2 opacity-70">
                                                {formatDate(message.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Reply Input */}
                            <div className="border-t pt-4 space-y-3">
                                <Textarea
                                    placeholder="Type your reply..."
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    rows={3}
                                />
                                <div className="flex gap-2 justify-between">
                                    <Button
                                        variant="outline"
                                        onClick={() => selectedInquiry && handleResolveInquiry(selectedInquiry.id)}
                                        disabled={selectedInquiry?.status === 2}
                                    >
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        {selectedInquiry?.status === 2 ? 'Resolved' : 'Mark as Resolved'}
                                    </Button>
                                    <Button
                                        onClick={handleSendReply}
                                        disabled={!replyMessage.trim() || sendingReply}
                                    >
                                        {sendingReply ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4 mr-2" />
                                        )}
                                        Send Reply
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default ProfessorInbox;
