import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authService } from '../services/authService.js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
    ArrowLeft,
    MessageSquare,
    Send,
    Archive,
    Loader2,
    AlertCircle,
    Plus,
    CheckCircle2,
    Clock
} from 'lucide-react';

interface Student {
    studentId: number;
    studentName: string;
    inquiries: Inquiry[];
}

interface Inquiry {
    id: number;
    subject: string;
    course: {
        id: number;
        code: string;
        title: string;
    };
    professor: {
        id: number;
        name: string;
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
    student: {
        id: number;
        name: string;
    };
    course: {
        id: number;
        code: string;
        title: string;
    };
    professor: {
        id: number;
        name: string;
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

interface Course {
    id: number;
    code: string;
    title: string;
    professor: {
        id: number;
        name: string;
    };
}

function ParentInbox() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Thread view state
    const [selectedInquiry, setSelectedInquiry] = useState<InquiryThread | null>(null);
    const [threadLoading, setThreadLoading] = useState(false);
    const [replyMessage, setReplyMessage] = useState('');
    const [sendingReply, setSendingReply] = useState(false);

    // New inquiry dialog state
    const [showNewInquiryDialog, setShowNewInquiryDialog] = useState(false);
    const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [newInquiry, setNewInquiry] = useState({
        courseId: '',
        subject: '',
        message: ''
    });
    const [creatingInquiry, setCreatingInquiry] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch inquiries (grouped by student)
            const inquiriesResponse = await axios.get('http://localhost:5000/api/parent-inquiries');
            const inquiriesData = inquiriesResponse.data.data;

            // Fetch linked students
            const studentsResponse = await axios.get('http://localhost:5000/api/parents/linked-students');
            const linkedStudents = studentsResponse.data.students;

            // Merge data: create student entries for all linked students
            const studentsMap = new Map<number, Student>();

            // First, add all linked students with empty inquiry arrays
            linkedStudents.forEach((ls: any) => {
                studentsMap.set(ls.studentId, {
                    studentId: ls.studentId,
                    studentName: ls.studentName,
                    inquiries: []
                });
            });

            // Then, add inquiries to the corresponding students
            inquiriesData.forEach((studentWithInquiries: Student) => {
                if (studentsMap.has(studentWithInquiries.studentId)) {
                    studentsMap.get(studentWithInquiries.studentId)!.inquiries = studentWithInquiries.inquiries;
                }
            });

            setStudents(Array.from(studentsMap.values()));
        } catch (err: any) {
            console.error("Error fetching data:", err);
            setError(err.response?.data?.message || 'Failed to load data.');
        } finally {
            setLoading(false);
        }
    };

    const fetchInquiries = async () => {
        await fetchData();
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

    const handleArchiveInquiry = async (inquiryId: number) => {
        try {
            await axios.put(`http://localhost:5000/api/parent-inquiries/${inquiryId}/archive`);
            setSelectedInquiry(null);
            await fetchInquiries();
        } catch (err: any) {
            console.error("Error archiving inquiry:", err);
            setError(err.response?.data?.message || 'Failed to archive inquiry.');
        }
    };

    const handleOpenNewInquiryDialog = async (studentId: number) => {
        try {
            setSelectedStudentId(studentId);
            const response = await axios.get(`http://localhost:5000/api/parent-inquiries/available-courses/${studentId}`);
            setAvailableCourses(response.data.data);
            setShowNewInquiryDialog(true);
        } catch (err: any) {
            console.error("Error fetching courses:", err);
            setError(err.response?.data?.message || 'Failed to load courses.');
        }
    };

    const handleCreateInquiry = async () => {
        if (!selectedStudentId || !newInquiry.courseId || !newInquiry.subject.trim() || !newInquiry.message.trim()) {
            setError('Please fill in all fields');
            return;
        }

        try {
            setCreatingInquiry(true);
            await axios.post('http://localhost:5000/api/parent-inquiries', {
                studentId: selectedStudentId,
                courseId: Number(newInquiry.courseId),
                subject: newInquiry.subject,
                message: newInquiry.message
            });

            setShowNewInquiryDialog(false);
            setNewInquiry({ courseId: '', subject: '', message: '' });
            setSelectedStudentId(null);
            await fetchInquiries();
        } catch (err: any) {
            console.error("Error creating inquiry:", err);
            setError(err.response?.data?.message || 'Failed to create inquiry.');
        } finally {
            setCreatingInquiry(false);
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

    return (
        <div className="min-h-screen bg-background">
            {/* HEADER */}
            <nav className="bg-primary text-primary-foreground px-8 py-4 shadow-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={() => navigate('/parent/home')}
                            variant="ghost"
                            className="text-primary-foreground hover:bg-primary-foreground/10"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="text-2xl font-bold text-primary-foreground">
                            Contact Teacher
                            <span className="block text-xs font-normal text-primary-foreground/80 tracking-wider mt-1">
                                COMMUNICATE WITH YOUR CHILD'S TEACHERS
                            </span>
                        </h1>
                    </div>
                    <span className="text-primary-foreground/90 text-sm">Welcome, {(user as any)?.name}</span>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-8 py-8">
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
                ) : students.length === 0 ? (
                    <Card>
                        <CardContent className="py-12">
                            <div className="text-center">
                                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                                <h3 className="text-lg font-semibold mb-2">No Messages Yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    You haven't started any conversations with teachers.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-8">
                        {students.map((student) => (
                            <Card key={student.studentId}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                {student.studentName}
                                            </CardTitle>
                                            <CardDescription>
                                                {student.inquiries.length} message thread{student.inquiries.length !== 1 ? 's' : ''}
                                            </CardDescription>
                                        </div>
                                        <Button
                                            onClick={() => handleOpenNewInquiryDialog(student.studentId)}
                                            size="sm"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            New Message
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {student.inquiries.map((inquiry) => (
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
                                                                {inquiry.course.code} - {inquiry.course.title}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Professor: {inquiry.professor.name}
                                                            </p>
                                                        </div>
                                                        {getStatusBadge(inquiry.status)}
                                                    </div>
                                                    {inquiry.latestMessage && (
                                                        <div className="mt-3 pt-3 border-t">
                                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                                <span className="font-medium">
                                                                    {inquiry.latestMessage.isFromParent ? 'You' : inquiry.professor.name}:
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
                            {selectedInquiry?.course.code} - {selectedInquiry?.course.title} · Teacher: {selectedInquiry?.professor.name}
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
                                        className={`flex ${message.isFromParent ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[70%] rounded-lg px-4 py-3 ${message.isFromParent
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
                                    rows={5}
                                />
                                <div className="flex gap-2 justify-between">
                                    <Button
                                        variant="outline"
                                        onClick={() => selectedInquiry && handleArchiveInquiry(selectedInquiry.id)}
                                    >
                                        <Archive className="h-4 w-4 mr-2" />
                                        Archive
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

            {/* New Message Dialog */}
            <Dialog open={showNewInquiryDialog} onOpenChange={setShowNewInquiryDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>New Message to Teacher</DialogTitle>
                        <DialogDescription>
                            Start a conversation with your child's teacher about their course
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="course">Course</Label>
                            <Select
                                value={newInquiry.courseId}
                                onValueChange={(value) => setNewInquiry({ ...newInquiry, courseId: value })}
                            >
                                <SelectTrigger id="course">
                                    <SelectValue placeholder="Select a course" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableCourses.map((course) => (
                                        <SelectItem key={course.id} value={course.id.toString()}>
                                            {course.code} - {course.title} (Teacher: {course.professor.name})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                                id="subject"
                                placeholder="Brief description of your message"
                                value={newInquiry.subject}
                                onChange={(e) => setNewInquiry({ ...newInquiry, subject: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                                id="message"
                                placeholder="Write your message to the teacher..."
                                value={newInquiry.message}
                                onChange={(e) => setNewInquiry({ ...newInquiry, message: e.target.value })}
                                rows={6}
                            />
                        </div>

                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowNewInquiryDialog(false);
                                    setNewInquiry({ courseId: '', subject: '', message: '' });
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateInquiry}
                                disabled={creatingInquiry || !newInquiry.courseId || !newInquiry.subject.trim() || !newInquiry.message.trim()}
                            >
                                {creatingInquiry ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4 mr-2" />
                                )}
                                Send Message
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default ParentInbox;
