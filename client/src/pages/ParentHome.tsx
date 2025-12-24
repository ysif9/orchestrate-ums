import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authService } from '../services/authService.js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnnouncementsBanner } from "@/components/AnnouncementsBanner";
import { EventsBanner } from "@/components/EventsBanner";

import {
    Users,
    Calendar,
    BookOpen,
    AlertCircle,
    Loader2,
    GraduationCap,
    BarChart3,
    MessageSquare
} from 'lucide-react';


interface LinkedStudent {
    linkId: number;
    studentId: number;
    studentName: string;
    studentEmail: string;
    studentStatus: number | string; // Can be integer enum (1-5) or string
    linkedAt: string;
}

function ParentHome() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [unreadInquiryCount, setUnreadInquiryCount] = useState(0);


    useEffect(() => {
        fetchLinkedStudents();
        fetchUnreadInquiryCount();
    }, []);

    const fetchLinkedStudents = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/parents/linked-students');
            setLinkedStudents(response.data.students);
        } catch (err: any) {
            console.error("Error fetching linked students:", err);
            setError(err.response?.data?.message || 'Failed to load linked students.');
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadInquiryCount = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/parent-inquiries/unread-count');
            setUnreadInquiryCount(response.data.data.unreadCount);
        } catch (err: any) {
            console.error("Error fetching unread inquiry count:", err);
            // Don't show error to user, just log it
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    // Convert status enum (integer) to readable string
    const getStatusText = (status: number | string | undefined | null): string => {
        if (status === null || status === undefined) {
            return 'Unknown';
        }

        // If it's already a string, return it
        if (typeof status === 'string') {
            return status;
        }

        // Convert integer enum to string
        // StudentStatus enum: Active=1, Inactive=2, OnHold=3, Suspended=4, Graduated=5
        switch (status) {
            case 1: return 'Active';
            case 2: return 'Inactive';
            case 3: return 'On Hold';
            case 4: return 'Suspended';
            case 5: return 'Graduated';
            default: return 'Unknown';
        }
    };

    const getStatusColor = (status: number | string | undefined | null): string => {
        // Handle null/undefined
        if (status === null || status === undefined) {
            return 'bg-gray-500';
        }

        // Convert to lowercase string for comparison
        const statusStr = typeof status === 'string'
            ? status.toLowerCase()
            : getStatusText(status).toLowerCase();

        switch (statusStr) {
            case 'active': return 'bg-green-500';
            case 'inactive': return 'bg-gray-500';
            case 'on hold': return 'bg-yellow-500';
            case 'suspended': return 'bg-red-500';
            case 'graduated': return 'bg-blue-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* HEADER */}
            <nav className="bg-primary text-primary-foreground px-8 py-4 shadow-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-primary-foreground">
                        AIN SHAMS
                        <span className="block text-xs font-normal text-primary-foreground/80 tracking-wider mt-1">
                            UNIVERSITY | PARENT PORTAL
                        </span>
                    </h1>
                    <div className="flex items-center gap-6">
                        <span className="text-primary-foreground/90 text-sm">Welcome, {(user as any)?.name}</span>

                        <Button
                            onClick={handleLogout}
                            variant="outline"
                            className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                        >
                            Logout
                        </Button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* DASHBOARD HEADER */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-primary mb-2">Parent Dashboard</h2>
                    <p className="text-muted-foreground">Monitor your children's academic progress and information</p>
                </div>

                {error && (
                    <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm flex items-center gap-2 mb-6">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {/* ANNOUNCEMENTS & EVENTS SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <AnnouncementsBanner maxItems={3} />
                    <EventsBanner maxItems={3} />
                </div>

                {/* LINK STUDENT BUTTON - REMOVED AS PER REQUIREMENT (1 Student : 1 Parent) */}
                {/* <div className="mb-6"> ... </div> */}

                {/* LINKED STUDENTS SECTION */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Linked Students
                        </CardTitle>
                        <CardDescription>
                            Students connected to your parent account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : linkedStudents.length === 0 ? (
                            <div className="text-center py-8">
                                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                                <h3 className="text-lg font-semibold mb-2">No Students Linked</h3>
                                <p className="text-muted-foreground mb-4">
                                    You haven't linked any student accounts yet. Click "Link Student Account" to get started.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {linkedStudents.map((student) => (
                                    <Card key={student.linkId} className="border-2">
                                        <CardContent className="pt-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <GraduationCap className="h-6 w-6 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-lg">{student.studentName}</h3>
                                                        <p className="text-sm text-muted-foreground">{student.studentEmail}</p>
                                                    </div>
                                                </div>
                                                <Badge className={getStatusColor(student.studentStatus)}>
                                                    {getStatusText(student.studentStatus)}
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Linked on {new Date(student.linkedAt).toLocaleDateString()}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* CONTACT TEACHER CARD */}
                <Card
                    className="mb-8 border-2 border-primary/20 hover:border-primary/40 transition-all cursor-pointer hover:shadow-lg"
                    onClick={() => navigate('/parent/inbox')}
                >
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-2xl">
                                    <MessageSquare className="h-6 w-6 text-primary" />
                                    Contact Teacher
                                </CardTitle>
                                <CardDescription className="text-base mt-2">
                                    Send messages to your child's teachers and view their responses
                                </CardDescription>
                            </div>
                            {unreadInquiryCount > 0 && (
                                <div className="flex flex-col items-center">
                                    <div className="h-16 w-16 bg-red-500 rounded-full flex items-center justify-center mb-2">
                                        <span className="text-2xl font-bold text-white">
                                            {unreadInquiryCount > 9 ? '9+' : unreadInquiryCount}
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium text-red-500">New Messages</span>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between bg-primary/5 rounded-lg p-6">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                                    <MessageSquare className="h-7 w-7 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold mb-1">
                                        {unreadInquiryCount > 0 ? 'You have unread messages' : 'Start a conversation'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {unreadInquiryCount > 0
                                            ? 'Click to view and respond to teacher messages'
                                            : 'Ask questions about your child\'s progress and courses'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-4xl text-primary">→</div>
                        </div>
                    </CardContent>
                </Card>

                {/* PLACEHOLDER SECTIONS */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Attendance Placeholder */}
                    <Card className="border-dashed border-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-5 w-5" />
                                Attendance Records
                            </CardTitle>
                            <CardDescription>
                                View your children's attendance history
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8">
                                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                                <p className="text-sm text-muted-foreground">
                                    Attendance tracking feature coming soon
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Academic Summary Placeholder */}
                    <Card className="border-dashed border-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-muted-foreground">
                                <BarChart3 className="h-5 w-5" />
                                Academic Summary
                            </CardTitle>
                            <CardDescription>
                                Overview of grades and performance
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8">
                                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                                <p className="text-sm text-muted-foreground">
                                    Academic summary feature coming soon
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default ParentHome;

