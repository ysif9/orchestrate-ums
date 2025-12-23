import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { messageService } from '../services/messageService';
import { ArrowLeft, Send, MessageCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Recipient {
    studentId: number;
    studentName: string;
    courseCode: string;
    courseName: string;
    courseId: number;
    professorId: number;
    professorName: string;
}

export default function ParentMessagesPage() {
    const navigate = useNavigate();
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [selectedRecipientKey, setSelectedRecipientKey] = useState<string>('');
    const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchRecipients();
    }, []);

    const fetchRecipients = async () => {
        try {
            setLoading(true);
            const response = await messageService.getRecipientsForParent();
            setRecipients(response.recipients || []);
        } catch (err: any) {
            setError('Failed to load eligible teachers.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRecipientChange = (value: string) => {
        setSelectedRecipientKey(value);
        setSuccess('');
        setError('');

        if (!value) {
            setSelectedRecipient(null);
            return;
        }

        const index = parseInt(value);
        const recipient = recipients[index];
        setSelectedRecipient(recipient);
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedRecipient) return;

        try {
            setError('');
            setSuccess('');

            await messageService.sendMessage({
                receiverId: selectedRecipient.professorId,
                content: newMessage,
                courseId: selectedRecipient.courseId,
                relatedStudentId: selectedRecipient.studentId,
            });

            setNewMessage('');
            setSuccess('Message sent successfully! The teacher will receive your message.');
        } catch (err) {
            console.error('Failed to send message', err);
            setError('Failed to send message. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <Button variant="ghost" onClick={() => navigate('/parent/home')} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>

                <Card className="shadow-lg border-t-4 border-t-primary">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <MessageCircle className="h-6 w-6 text-primary" />
                            Contact Teachers
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-50 text-green-600 p-3 rounded-md flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                {success}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Select Teacher / Course</Label>
                            <Select onValueChange={handleRecipientChange} value={selectedRecipientKey}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a teacher to contact..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {recipients.map((r, idx) => (
                                        <SelectItem key={`${r.studentId}-${r.courseId}-${r.professorId}`} value={idx.toString()}>
                                            <span className="font-semibold">{r.professorName}</span>
                                            <span className="text-muted-foreground ml-2">
                                                — {r.courseCode} ({r.studentName})
                                            </span>
                                        </SelectItem>
                                    ))}
                                    {recipients.length === 0 && !loading && (
                                        <SelectItem value="none" disabled>No teachers found</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground">
                                Select a specific course/teacher associated with your children to send a message.
                            </p>
                        </div>

                        {selectedRecipient && (
                            <div className="border rounded-lg bg-white overflow-hidden">
                                <div className="bg-gray-100 p-4 border-b flex justify-between items-center px-6">
                                    <div>
                                        <h3 className="font-bold text-lg">{selectedRecipient.professorName}</h3>
                                        <p className="text-xs text-muted-foreground">
                                            Re: {selectedRecipient.studentName} in {selectedRecipient.courseName}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="bg-white">
                                        New Message
                                    </Badge>
                                </div>

                                <div className="p-4 space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="message">Your Message</Label>
                                        <Textarea
                                            id="message"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type your message here..."
                                            className="min-h-[200px] resize-none"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && e.ctrlKey) {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Press Ctrl+Enter to send
                                        </p>
                                    </div>

                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!newMessage.trim()}
                                        className="w-full"
                                    >
                                        <Send className="mr-2 h-4 w-4" />
                                        Send Message
                                    </Button>

                                    <p className="text-xs text-muted-foreground text-center">
                                        Messages are private and visible only to you and the instructor.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
