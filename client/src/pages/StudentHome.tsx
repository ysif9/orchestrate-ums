import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { authService } from '../services/authService.js';
import { ClipboardCheck, BarChart3, BookOpen, Sparkles, FileText, Monitor, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

function StudentHome() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEnrollments = async () => {
            try {
                setLoading(true);
                // The backend middleware identifies the user via token
                // and returns ONLY their specific enrollments
                const response = await axios.get('http://localhost:5000/api/enrollments');
                setEnrollments(response.data);
            } catch (err) {
                console.error("Error fetching enrollments:", err);
                setError('Failed to load your courses.');
            } finally {
                setLoading(false);
            }
        };

        fetchEnrollments();
    }, []);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const isAdminOrStaff = user?.role === 'professor' || user?.role === 'staff';

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <div className="loading-spinner"></div>
            <p className="mt-4 text-muted-foreground">Loading your academic profile...</p>
        </div>
    );

    // Calculate total credits
    const totalCredits = enrollments.reduce((acc, curr) => acc + (curr.course?.credits || 0), 0);

    return (
        <div className="min-h-screen bg-background">
            {/* HEADER MATCHING THEME */}
            <nav className="bg-primary text-primary-foreground px-8 py-4 shadow-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-primary-foreground">
                        AIN SHAMS
                        <span className="block text-xs font-normal text-primary-foreground/80 tracking-wider mt-1">
                            UNIVERSITY | FACULTY OF ENGINEERING
                        </span>
                    </h1>
                    <div className="flex items-center gap-6">
                        <span className="text-primary-foreground/90 text-sm">Welcome, {user?.name}</span>
                        <Link to="/catalog" className="text-primary-foreground hover:text-accent-foreground/80 transition-colors font-medium">
                            Course Catalog
                        </Link>
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
                {/* DASHBOARD SUMMARY SECTION */}
                <Card className="mb-8">
                    <CardContent className="p-8">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-primary mb-2">My Enrolled Courses</h2>
                            <p className="text-muted-foreground">Current Semester: Fall 2024</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex flex-col items-center bg-muted/50 px-6 py-4 rounded-lg min-w-[120px]">
                                <span className="text-3xl font-bold text-primary">{enrollments.length}</span>
                                <span className="text-sm text-muted-foreground mt-1">Active Courses</span>
                            </div>
                            <div className="flex flex-col items-center bg-muted/50 px-6 py-4 rounded-lg min-w-[120px]">
                                <span className="text-3xl font-bold text-primary">{totalCredits}</span>
                                <span className="text-sm text-muted-foreground mt-1">Total Credits</span>
                            </div>
                        </div>
                        <div className="mt-8 flex flex-wrap gap-4">
                            <Button
                                onClick={() => navigate('/catalog')}
                                size="lg"
                            >
                                + Register New Course
                            </Button>
                            {/* Admin/Staff Assessment Management Buttons */}
                            {isAdminOrStaff && (
                                <>
                                    <Button
                                        onClick={() => navigate('/admin/assessments/create')}
                                        className="bg-purple-600 hover:bg-purple-700"
                                        size="lg"
                                    >
                                        <Sparkles size={18} className="mr-2" />
                                        Create Assessment
                                    </Button>
                                    <Button
                                        onClick={() => navigate('/admin/gradebook')}
                                        className="bg-green-600 hover:bg-green-700"
                                        size="lg"
                                    >
                                        <ClipboardCheck size={18} className="mr-2" />
                                        Grade Assessments
                                    </Button>
                                </>
                            )}
                            {/* Student Grades View Button */}
                            {!isAdminOrStaff && (
                                <>
                                    <Button
                                        onClick={() => navigate('/my-grades')}
                                        className="bg-blue-600 hover:bg-blue-700"
                                        size="lg"
                                    >
                                        <BarChart3 size={18} className="mr-2" />
                                        View My Grades
                                    </Button>
                                    <Button
                                        onClick={() => navigate('/transcript-requests')}
                                        className="bg-orange-600 hover:bg-orange-700"
                                        size="lg"
                                    >
                                        <FileText size={18} className="mr-2" />
                                        Request Transcript
                                    </Button>
                                    <Button
                                        onClick={() => navigate('/lab-stations')}
                                        className="bg-purple-600 hover:bg-purple-700"
                                        size="lg"
                                    >
                                        <Monitor size={18} className="mr-2" />
                                        Reserve Lab Station
                                    </Button>
                                    <Button
                                        onClick={() => navigate('/tickets')}
                                        variant="destructive" // Error tends to map to destruction/danger
                                        size="lg"
                                    >
                                        <AlertCircle size={18} className="mr-2" />
                                        Report a Maintenance ticket
                                    </Button>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {error && <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-6 border border-destructive/20">{error}</div>}

                {/* ENROLLED COURSES GRID */}
                {enrollments.length === 0 ? (
                    <Card className="text-center py-16 border-2 border-dashed border-border shadow-none">
                        <CardContent>
                            <div className="text-muted-foreground mb-4 flex justify-center">
                                <BookOpen size={64} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">No Active Enrollments</h3>
                            <p className="text-muted-foreground mb-6">You are not currently enrolled in any courses for this semester.</p>
                            <Button
                                onClick={() => navigate('/catalog')}
                            >
                                Browse Course Catalog
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {enrollments.map((enrollment) => {
                            const course = enrollment.course;
                            if (!course) return null;

                            return (
                                <Link to={`/course/${course.id}`} key={enrollment.id} className="no-underline text-inherit group">
                                    <Card className="overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg h-full flex flex-col">
                                        <div className="relative">
                                            <img
                                                src={course.image || "https://placehold.co/600x400"}
                                                alt={course.title}
                                                className="w-full h-48 object-cover"
                                            />
                                            <div className="absolute top-3 right-3">
                                                <Badge
                                                    variant={
                                                        enrollment.status === 'completed' ? 'default' : // default usually primary/dark
                                                            enrollment.status === 'active' ? 'secondary' : 'outline'
                                                    }
                                                    className={
                                                        enrollment.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-100 border-none' :
                                                            enrollment.status === 'active' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-none' : ''
                                                    }
                                                >
                                                    {enrollment.status}
                                                </Badge>
                                            </div>
                                        </div>

                                        <CardContent className="p-6 flex flex-col flex-grow">
                                            <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                                                {course.subjectArea || "General"}
                                            </div>
                                            <h3 className="text-lg font-bold text-foreground mb-3 line-clamp-2">{course.title}</h3>
                                            <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                                                <span className="font-mono font-semibold">{course.code}</span>
                                                <span className="font-medium">{course.credits} Credits</span>
                                            </div>

                                            <div className="mt-auto">
                                                <div className="text-xs text-muted-foreground mb-2">Progress</div>
                                                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-primary h-full transition-all duration-300"
                                                        style={{ width: enrollment.status === 'completed' ? '100%' : '0%' }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default StudentHome;
