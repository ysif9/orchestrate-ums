import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { authService } from '@/services/authService';
import { BookOpen } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

function StudentHome() {
    const navigate = useNavigate();
    const user: any = authService.getCurrentUser();

    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEnrollments = async () => {
            try {
                setLoading(true);
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

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <div className="loading-spinner"></div>
            <p className="mt-4 text-muted-foreground">Loading your academic profile...</p>
        </div>
    );

    // Calculate total credits
    const totalCredits = enrollments.reduce((acc, curr) => acc + (curr.course?.credits || 0), 0);
    const activeCourses = enrollments.filter(e => e.status === 'active').length;
    const completedCourses = enrollments.filter(e => e.status === 'completed').length;

    return (
        <>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]}!</h1>
                <p className="text-muted-foreground mt-1">Here's what's happening with your courses today.</p>
            </div>

            {/* STATS OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Active Courses</p>
                            <h3 className="text-2xl font-bold text-gray-900">{activeCourses}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-full">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Completed Courses</p>
                            <h3 className="text-2xl font-bold text-gray-900">{completedCourses}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-full">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Credits</p>
                            <h3 className="text-2xl font-bold text-gray-900">{totalCredits}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ACTION BAR */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Current Enrollments</h2>
                <Button onClick={() => navigate('/catalog')}>
                    + Register New Course
                </Button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm border border-red-100">
                    {error}
                </div>
            )}

            {/* COURSE GRID */}
            {enrollments.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-200">
                    <div className="text-gray-300 mb-4 flex justify-center">
                        <BookOpen size={48} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Enrollments</h3>
                    <p className="text-gray-500 mb-6">You are not currently enrolled in any courses for this semester.</p>
                    <Button onClick={() => navigate('/catalog')} variant="outline">
                        Browse Course Catalog
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrollments.map((enrollment) => {
                        const course = enrollment.course;
                        if (!course) return null;

                        return (
                            <Link to={`/course/${course.id}`} key={enrollment.id} className="group block h-full">
                                <Card className="h-full border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-primary/20">
                                    <div className="relative h-40 bg-gray-100">
                                        <img
                                            src={course.image || "https://placehold.co/600x400"}
                                            alt={course.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-3 right-3">
                                            <Badge
                                                variant="secondary"
                                                className={
                                                    enrollment.status === 'completed'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-white/90 text-gray-700 backdrop-blur-sm'
                                                }
                                            >
                                                {enrollment.status}
                                            </Badge>
                                        </div>
                                    </div>

                                    <CardContent className="p-5 flex flex-col grow">
                                        <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                                            {course.subjectArea || "General"}
                                        </div>
                                        <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                            {course.title}
                                        </h3>
                                        <div className="flex justify-between items-center text-sm text-gray-500 mt-auto pt-4 border-t border-gray-50">
                                            <span className="font-mono bg-gray-50 px-2 py-1 rounded text-xs">{course.code}</span>
                                            <span>{course.credits} Credits</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </>
    );
}

export default StudentHome;
