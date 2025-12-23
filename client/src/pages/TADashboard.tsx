import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authService } from '@/services/authService';
import { courseService } from '@/services/courseService';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, DollarSign, Shield, CalendarDays, Calendar, History } from 'lucide-react';

function TADashboard() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();


    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const data = await courseService.getMyTAAssignments();
                setAssignments(data);
            } catch (error) {
                console.error("Failed to fetch assignments", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAssignments();
    }, []);

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="min-h-screen p-8 bg-muted/20">
            <div className="max-w-7xl mx-auto space-y-6">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">TA Dashboard</h1>
                        <p className="text-muted-foreground mt-1">Manage your course responsibilities</p>
                    </div>
                    <Button variant="outline" onClick={handleLogout}>
                        Logout
                    </Button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Assigned Courses</CardTitle>
                            <CardTitle className="text-2xl font-bold">{assignments.length}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card
                        className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-emerald-500"
                        onClick={() => navigate('/admin/payroll')}
                    >
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-emerald-600" />
                                My Payroll
                            </CardTitle>
                            <CardDescription>View salary and deductions</CardDescription>
                        </CardHeader>
                    </Card>
                    <Card
                        className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-violet-500"
                        onClick={() => navigate('/admin/benefits')}
                    >
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-violet-600" />
                                My Benefits
                            </CardTitle>
                            <CardDescription>View employment benefits</CardDescription>
                        </CardHeader>
                    </Card>
                    <Card
                        className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
                        onClick={() => navigate('/faculty/leave-request')}
                    >
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarDays className="h-5 w-5 text-blue-600" />
                                Request Leave
                            </CardTitle>
                            <CardDescription>Submit a leave request</CardDescription>
                        </CardHeader>
                    </Card>
                    <Card
                        className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-amber-500"
                        onClick={() => navigate('/faculty/leave-history')}
                    >
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5 text-amber-600" />
                                Leave History
                            </CardTitle>
                            <CardDescription>View past leave requests</CardDescription>
                        </CardHeader>
                    </Card>
                </div>

                <h2 className="text-xl font-bold mt-8 mb-4">Your Courses</h2>

                {assignments.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            You have not been assigned to any courses yet.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6">
                        {assignments.map((assignment: any) => (
                            <Card key={assignment.id}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle>{assignment.course?.title}</CardTitle>
                                            <CardDescription>{assignment.course?.code}</CardDescription>
                                        </div>
                                        <Badge variant="outline">{assignment.course?.semester}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-sm">Responsibilities:</h4>
                                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{assignment.responsibilities}</p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                                        Assigned on {new Date(assignment.assignedAt).toLocaleDateString()}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TADashboard;
