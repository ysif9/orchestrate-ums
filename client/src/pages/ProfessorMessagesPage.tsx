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
    Archive,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Clock,
    User,
    Users,
    GraduationCap,
    Check
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

// Types for parent inquiries
interface ParentInquiry {
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
    messages: InquiryMessage[];
}

interface InquiryMessage {
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

// Types for student messages
interface StudentMessage {
    id: number;
    sender: {
        id: number;
        name: string;
        role: string;
    };
    receiver: {
        id: number;
        name: string;
    };
    content: string;
    course?: {
        id: number;
        code: string;
        name: string;
    };
    createdAt: string;
    isRead: boolean;
    parentId?: number;
    replyCount?: number;
}

interface ThreadMessage {
    id: number;
    sender: {
        id: number;
        name: string;
        role: string;
    };
    receiver: {
        id: number;
        name: string;
    };
    content: string;
    createdAt: string;
    isRead: boolean;
    parentId?: number;
}

type MessageTab = 'students' | 'parents';

function ProfessorMessagesPage() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser() as any;

    // Tab state
    const [activeTab, setActiveTab] = useState<MessageTab>('students');

    // Loading and error states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Unread counts for the tab badges
    const [studentUnreadCount, setStudentUnreadCount] = useState(0);
    const [parentUnreadCount, setParentUnreadCount] = useState(0);

    // Student messages state
    const [studentMessages, setStudentMessages] = useState<StudentMessage[]>([]);
    const [selectedStudentThread, setSelectedStudentThread] = useState<StudentMessage | null>(null);
    const [studentThreadMessages, setStudentThreadMessages] = useState<ThreadMessage[]>([]);
    const [studentThreadLoading, setStudentThreadLoading] = useState(false);

    // Parent inquiries state
    const [parentInquiries, setParentInquiries] = useState<ParentInquiry[]>([]);
    const [selectedParentInquiry, setSelectedParentInquiry] = useState<InquiryThread | null>(null);
    const [parentThreadLoading, setParentThreadLoading] = useState(false);

    // Reply state
    const [replyMessage, setReplyMessage] = useState('');
    const [sendingReply, setSendingReply] = useState(false);

    useEffect(() => {
        fetchUnreadCounts();
        if (activeTab === 'students') {
            fetchStudentMessages();
        } else {
            fetchParentInquiries();
        }
    }, [activeTab]);

    const fetchUnreadCounts = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch student messages unread count
            const studentCountRes = await axios.get(`${API_BASE_URL}/messages/unread-count`, { headers });
            if (studentCountRes.data.success) {
                setStudentUnreadCount(studentCountRes.data.data.unreadCount);
            }

            // Fetch parent inquiries unread count
            const parentCountRes = await axios.get(`${API_BASE_URL}/parent-inquiries/professor/unread-count`, { headers });
            if (parentCountRes.data.success) {
                setParentUnreadCount(parentCountRes.data.data.unreadCount);
            }
        } catch (err) {
            console.error('Error fetching unread counts:', err);
        }
    };

    const fetchStudentMessages = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setStudentMessages(res.data.data);
            }
        } catch (err: any) {
            console.error('Error fetching student messages:', err);
            setError(err.response?.data?.message || 'Failed to load student messages.');
        } finally {
            setLoading(false);
        }
    };

    const fetchParentInquiries = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/parent-inquiries/professor`);
            setParentInquiries(response.data.data);
        } catch (err: any) {
            console.error("Error fetching parent inquiries:", err);
            setError(err.response?.data?.message || 'Failed to load parent messages.');
        } finally {
            setLoading(false);
        }
    };

    // Student message handlers
    const fetchStudentThread = async (messageId: number) => {
        try {
            setStudentThreadLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/messages/${messageId}/thread`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setStudentThreadMessages(res.data.data);
            }

            // Mark thread as read
            await axios.put(`${API_BASE_URL}/messages/${messageId}/read-thread`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Refresh unread counts
            await fetchUnreadCounts();
        } catch (err) {
            console.error("Error fetching student thread:", err);
        } finally {
            setStudentThreadLoading(false);
        }
    };

    const handleOpenStudentThread = (message: StudentMessage) => {
        setSelectedStudentThread(message);
        fetchStudentThread(message.id);
    };

    const handleSendStudentReply = async () => {
        if (!selectedStudentThread || !replyMessage.trim()) return;

        try {
            setSendingReply(true);
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/messages`, {
                content: replyMessage,
                parentId: selectedStudentThread.id
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            setReplyMessage('');
            await fetchStudentThread(selectedStudentThread.id);
            await fetchStudentMessages();
            await fetchUnreadCounts();
        } catch (err: any) {
            console.error("Error sending reply:", err);
            setError(err.response?.data?.message || 'Failed to send reply.');
        } finally {
            setSendingReply(false);
        }
    };

    // Parent inquiry handlers
    const fetchParentThread = async (inquiryId: number) => {
        try {
            setParentThreadLoading(true);
            const response = await axios.get(`${API_BASE_URL}/parent-inquiries/${inquiryId}/thread`);
            setSelectedParentInquiry(response.data.data);

            // Refresh unread counts
            await fetchUnreadCounts();
        } catch (err: any) {
            console.error("Error fetching parent thread:", err);
            setError(err.response?.data?.message || 'Failed to load conversation.');
        } finally {
            setParentThreadLoading(false);
        }
    };

    const handleSendParentReply = async () => {
        if (!selectedParentInquiry || !replyMessage.trim()) return;

        try {
            setSendingReply(true);
            await axios.post(`${API_BASE_URL}/parent-inquiries/${selectedParentInquiry.id}/reply`, {
                message: replyMessage
            });

            setReplyMessage('');
            await fetchParentThread(selectedParentInquiry.id);
            await fetchParentInquiries();
            await fetchUnreadCounts();
        } catch (err: any) {
            console.error("Error sending reply:", err);
            setError(err.response?.data?.message || 'Failed to send reply.');
        } finally {
            setSendingReply(false);
        }
    };

    const handleResolveInquiry = async (inquiryId: number) => {
        try {
            await axios.put(`${API_BASE_URL}/parent-inquiries/${inquiryId}/resolve`);
            if (selectedParentInquiry) {
                await fetchParentThread(selectedParentInquiry.id);
            }
            await fetchParentInquiries();
        } catch (err: any) {
            console.error("Error resolving inquiry:", err);
            setError(err.response?.data?.message || 'Failed to resolve inquiry.');
        }
    };

    const handleArchiveInquiry = async (inquiryId: number) => {
        try {
            await axios.put(`${API_BASE_URL}/parent-inquiries/${inquiryId}/professor-archive`);
            setSelectedParentInquiry(null);
            await fetchParentInquiries();
            await fetchUnreadCounts();
        } catch (err: any) {
            console.error("Error archiving inquiry:", err);
            setError(err.response?.data?.message || 'Failed to archive thread.');
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

    // Group parent inquiries by student
    const groupedParentInquiries = parentInquiries.reduce((acc, inquiry) => {
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
    }, {} as Record<number, { studentId: number; studentName: string; inquiries: ParentInquiry[] }>);

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
                            Messages
                            <span className="block text-xs font-normal text-primary-foreground/80 tracking-wider mt-1">
                                MANAGE YOUR COMMUNICATIONS
                            </span>
                        </h1>
                    </div>
                    <span className="text-primary-foreground/90 text-sm">Welcome, {user?.name}</span>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* TAB SWITCHER */}
                <div className="flex gap-2 mb-6">
                    <Button
                        variant={activeTab === 'students' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('students')}
                        className="relative flex items-center gap-2"
                    >
                        <GraduationCap className="h-4 w-4" />
                        Student Messages
                        {studentUnreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                {studentUnreadCount > 9 ? '9+' : studentUnreadCount}
                            </span>
                        )}
                    </Button>
                    <Button
                        variant={activeTab === 'parents' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('parents')}
                        className="relative flex items-center gap-2"
                    >
                        <Users className="h-4 w-4" />
                        Parent Messages
                        {parentUnreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                {parentUnreadCount > 9 ? '9+' : parentUnreadCount}
                            </span>
                        )}
                    </Button>
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
                ) : activeTab === 'students' ? (
                    /* STUDENT MESSAGES TAB */
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <GraduationCap className="h-5 w-5" />
                                Student Communications
                            </CardTitle>
                            <CardDescription>
                                Messages from students about courses and academic matters
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {studentMessages.length === 0 ? (
                                <div className="text-center py-12">
                                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                                    <h3 className="text-lg font-semibold mb-2">No Student Messages</h3>
                                    <p className="text-muted-foreground">
                                        You haven't received any messages from students yet.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {studentMessages.map((message) => {
                                        const isMe = message.sender.id === user?.id;
                                        const otherPartyName = isMe ? message.receiver.name : message.sender.name;
                                        const isUnread = !message.isRead;

                                        return (
                                            <Card
                                                key={message.id}
                                                className={`cursor-pointer transition-all hover:shadow-md ${isUnread ? 'border-primary border-2' : ''
                                                    }`}
                                                onClick={() => handleOpenStudentThread(message)}
                                            >
                                                <CardContent className="pt-4">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="font-semibold">
                                                                    {isMe ? `To: ${otherPartyName}` : otherPartyName}
                                                                </h4>
                                                                {isUnread && (
                                                                    <span className="h-2 w-2 bg-red-500 rounded-full"></span>
                                                                )}
                                                            </div>
                                                            {message.course && (
                                                                <p className="text-sm text-muted-foreground">
                                                                    Course: {message.course.code}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {isUnread && (
                                                                <Badge className="bg-blue-600 text-white">New</Badge>
                                                            )}
                                                            {isMe && (
                                                                <span className="text-xs text-muted-foreground">Sent</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 pt-3 border-t">
                                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                                            {message.content}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-2">
                                                            {formatDate(message.createdAt)}
                                                            {message.replyCount !== undefined && message.replyCount > 0 && (
                                                                <span className="ml-2">
                                                                    · {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    /* PARENT MESSAGES TAB */
                    parentInquiries.length === 0 ? (
                        <Card>
                            <CardContent className="py-12">
                                <div className="text-center">
                                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                                    <h3 className="text-lg font-semibold mb-2">No Parent Messages</h3>
                                    <p className="text-muted-foreground mb-4">
                                        You haven't received any messages from parents yet.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-8">
                            {Object.values(groupedParentInquiries).map((group) => (
                                <Card key={group.studentId}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <User className="h-5 w-5" />
                                            {group.studentName}
                                        </CardTitle>
                                        <CardDescription>
                                            {group.inquiries.length} message thread{group.inquiries.length !== 1 ? 's' : ''} from parent(s)
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {group.inquiries.map((inquiry) => (
                                                <Card
                                                    key={inquiry.id}
                                                    className={`cursor-pointer transition-all hover:shadow-md ${inquiry.hasUnread ? 'border-primary border-2' : ''
                                                        }`}
                                                    onClick={() => fetchParentThread(inquiry.id)}
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
                    )
                )}
            </div>

            {/* STUDENT THREAD DIALOG */}
            <Dialog open={!!selectedStudentThread} onOpenChange={() => setSelectedStudentThread(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>
                            Conversation with {selectedStudentThread?.sender.id === user?.id
                                ? selectedStudentThread?.receiver.name
                                : selectedStudentThread?.sender.name}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedStudentThread?.course
                                ? `Course: ${selectedStudentThread.course.code}`
                                : 'General Inquiry'}
                        </DialogDescription>
                    </DialogHeader>

                    {studentThreadLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto space-y-4 py-4">
                                {studentThreadMessages.map((message) => {
                                    const isMe = message.sender.id === user?.id;
                                    return (
                                        <div
                                            key={message.id}
                                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[70%] rounded-lg px-4 py-3 ${isMe
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-muted'
                                                    }`}
                                            >
                                                <p className="text-xs font-semibold mb-1">
                                                    {message.sender.name}
                                                </p>
                                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <p className="text-xs opacity-70">
                                                        {formatDate(message.createdAt)}
                                                    </p>
                                                    {message.isRead && isMe && (
                                                        <span className="flex items-center text-xs opacity-70">
                                                            <Check className="h-3 w-3 mr-1" /> Read
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Reply Input */}
                            <div className="border-t pt-4 space-y-3">
                                <Textarea
                                    placeholder="Type your reply..."
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    rows={4}
                                />
                                <div className="flex gap-2 justify-end">
                                    <Button
                                        onClick={handleSendStudentReply}
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

            {/* PARENT THREAD DIALOG */}
            <Dialog open={!!selectedParentInquiry} onOpenChange={() => setSelectedParentInquiry(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{selectedParentInquiry?.subject}</DialogTitle>
                        <DialogDescription>
                            From: {selectedParentInquiry?.parent.name} · Student: {selectedParentInquiry?.student.name} · {selectedParentInquiry?.course.code}
                        </DialogDescription>
                    </DialogHeader>

                    {parentThreadLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto space-y-4 py-4">
                                {selectedParentInquiry?.messages.map((message) => (
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
                                            <div className="flex items-center gap-2 mt-2">
                                                <p className="text-xs opacity-70">
                                                    {formatDate(message.createdAt)}
                                                </p>
                                                {message.isRead && !message.isFromParent && (
                                                    <span className="flex items-center text-xs opacity-70">
                                                        <Check className="h-3 w-3 mr-1" /> Read
                                                    </span>
                                                )}
                                            </div>
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
                                    rows={4}
                                />
                                <div className="flex gap-2 justify-between">
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => selectedParentInquiry && handleResolveInquiry(selectedParentInquiry.id)}
                                            disabled={selectedParentInquiry?.status === 2}
                                        >
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            {selectedParentInquiry?.status === 2 ? 'Resolved' : 'Mark as Resolved'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => selectedParentInquiry && handleArchiveInquiry(selectedParentInquiry.id)}
                                        >
                                            <Archive className="h-4 w-4 mr-2" />
                                            Archive
                                        </Button>
                                    </div>
                                    <Button
                                        onClick={handleSendParentReply}
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

export default ProfessorMessagesPage;
