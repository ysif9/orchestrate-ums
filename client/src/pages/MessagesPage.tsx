import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { authService } from '@/services/authService';
import { ArrowLeft } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

interface Message {
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

export default function MessagesPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedThread, setSelectedThread] = useState<Message | null>(null);
    const [threadMessages, setThreadMessages] = useState<Message[]>([]);
    const [loadingThread, setLoadingThread] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [sendingReply, setSendingReply] = useState(false);

    const user = authService.getCurrentUser() as any;
    const navigate = useNavigate();
    const isProfessor = user?.role === 'professor' || user?.role === 'staff';

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setMessages(json.data);
            }
        } catch (err) {
            console.error("Failed to fetch messages", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchThread = async (messageId: number) => {
        setLoadingThread(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/messages/${messageId}/thread`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setThreadMessages(json.data);
            }
        } catch (e) {
            console.error("Failed to fetch thread", e);
        } finally {
            setLoadingThread(false);
        }
    };

    const handleOpenThread = (message: Message) => {
        setSelectedThread(message);
        fetchThread(message.id);
        if (!message.isRead && message.receiver.id === user.id) {
            markAsRead(message.id);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE_URL}/messages/${id}/read`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
        } catch (e) {
            console.error("Failed to mark read", e);
        }
    };

    const handleSendReply = async () => {
        if (!replyContent.trim() || !selectedThread) return;
        setSendingReply(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/messages`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: replyContent,
                    parentId: selectedThread.id,
                    // receiverId is handled by backend for replies
                })
            });
            const json = await res.json();
            if (res.ok && json.success) {
                setReplyContent('');
                fetchThread(selectedThread.id); // Refresh thread
                fetchMessages(); // Refresh messages list to update latest message
            }
        } catch (e) {
            console.error("Failed to send reply", e);
        } finally {
            setSendingReply(false);
        }
    };

    if (loading) return <div className="p-6">Loading messages...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                {isProfessor && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/admin/home')}
                        className="hover:bg-muted"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                )}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
                    <p className="text-muted-foreground">
                        View your communications.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Inbox</CardTitle>
                </CardHeader>
                <CardContent>
                    {messages.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No messages found.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Status</TableHead>
                                    <TableHead>From / To</TableHead>
                                    <TableHead>Course</TableHead>
                                    <TableHead className="w-[400px]">Latest Message</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {messages.map((message) => {
                                    const isMe = message.sender.id === user?.id;
                                    const otherPartyName = isMe ? message.receiver.name : message.sender.name;
                                    const isUnread = !message.isRead; // Backend handles whether message should be unread for current user

                                    return (
                                        <TableRow
                                            key={message.id}
                                            className={`cursor-pointer transition-colors ${
                                                isUnread
                                                    ? 'bg-blue-50 hover:bg-blue-100 border-l-4 border-l-blue-500'
                                                    : 'hover:bg-muted/50'
                                            }`}
                                            onClick={() => handleOpenThread(message)}
                                        >
                                            <TableCell>
                                                {isUnread && (
                                                    <Badge className="bg-blue-600 text-white hover:bg-blue-700 font-semibold">
                                                        New
                                                    </Badge>
                                                )}
                                                {isMe && <span className="text-xs text-muted-foreground">Sent</span>}
                                            </TableCell>
                                            <TableCell className={isUnread ? "font-bold" : "font-medium"}>
                                                {isMe ? `To: ${otherPartyName}` : otherPartyName}
                                            </TableCell>
                                            <TableCell>
                                                {message.course ? (
                                                    <Badge variant="outline">{message.course.code}</Badge>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">General</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="max-w-[400px]">
                                                <p className={`truncate text-sm ${isUnread ? 'font-semibold text-gray-900' : ''}`}>
                                                    {message.content}
                                                    {message.replyCount && message.replyCount > 0 && (
                                                        <span className="ml-2 text-xs text-muted-foreground">
                                                            ({message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'})
                                                        </span>
                                                    )}
                                                </p>
                                            </TableCell>
                                            <TableCell className={`text-sm ${isUnread ? 'font-semibold text-gray-900' : 'text-muted-foreground'}`}>
                                                {new Date(message.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">View Thread</Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!selectedThread} onOpenChange={(open) => !open && setSelectedThread(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Conversation</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
                        {loadingThread ? (
                            <p>Loading conversation...</p>
                        ) : (
                            threadMessages.map((msg) => {
                                const isMe = msg.sender.id === user?.id;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-lg p-3 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                            <div className="flex justify-between items-baseline gap-2 mb-1">
                                                <span className="text-xs font-bold opacity-90">{msg.sender.name}</span>
                                                <span className="text-[10px] opacity-70">{new Date(msg.createdAt).toLocaleString()}</span>
                                            </div>
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="pt-4 border-t gap-2 flex flex-col">
                        <Textarea
                            placeholder="Type a reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            rows={3}
                        />
                        <div className="flex justify-end">
                            <Button onClick={handleSendReply} disabled={sendingReply || !replyContent.trim()}>
                                {sendingReply ? 'Sending...' : 'Send Reply'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
