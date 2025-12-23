import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authService } from '@/services/authService';
import { courseService } from '@/services/courseService';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, DollarSign } from 'lucide-react';

function TADashboard() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    // In a real app we would have a dedicated endpoint for "my assignments"
    // For now, since we don't have a direct "get my TA assignments" endpoint yet (unless I missed it in plan),
    // we might need to rely on the fact that the backend should provide this.
    // Wait, the plan said "GET /api/tas/me". I didn't implement that in courseTaRoutes.ts!
    // I implemented generic CRUD on course.

    // Let's assume for now we might fetch all courses and filter? No that's inefficient.
    // I should add the "get my assignments" endpoint to the backend. 
    // BUT since I already marked backend as "Done" and I am in frontend mode, 
    // I will quickly add that endpoint or just fetch all courses and filter on client if acceptable for MVP?
    // Looking at `courseTaRoutes.ts`... I missed `GET /api/tas/me`.

    // Actually, I can use `GET /api/users?role=teaching_assistant` to get TAs, but that doesn't help the TA see their courses.
    // I will quickly patch the backend to add `GET /api/courses/my-ta-assignments` or similar in `courseTaRoutes.ts`.
    // OR, I can use the existing `GET /api/courses` and maybe update it to return courses where I am TA?

    // Let's check `courseTaRoutes.ts` again. 

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
