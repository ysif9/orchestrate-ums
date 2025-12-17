import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authService } from '@/services/authService';
import { AlertTriangle, Lock } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

function CatalogCourseDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user: any = authService.getCurrentUser();
    const isAdminOrStaff = user?.role === 'professor' || user?.role === 'staff';

    const [course, setCourse] = useState<any>(null);
    const [completedCourseIds, setCompletedCourseIds] = useState<any[]>([]);
    const [enrolledCourseIds, setEnrolledCourseIds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [enrollmentError, setEnrollmentError] = useState('');
    const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch course details
                const courseRes = await axios.get(`http://localhost:5000/api/courses/${id}`);
                setCourse(courseRes.data);

                // Fetch user's enrollments
                const enrollRes = await axios.get('http://localhost:5000/api/enrollments');
                const completed = enrollRes.data
                    .filter((enr: any) => enr.status === 'completed')
                    .map((enr: any) => enr.course.id);
                const enrolled = enrollRes.data
                    .filter((enr: any) => enr.status === 'enrolled')
                    .map((enr: any) => enr.course.id);

                setCompletedCourseIds(completed);
                setEnrolledCourseIds(enrolled);
            } catch (error) {
                console.error("Error loading course:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const arePrerequisitesMet = () => {
        if (!course || !course.prerequisites || course.prerequisites.length === 0) {
            return true;
        }
        return course.prerequisites.every((prereq: any) =>
            completedCourseIds.includes(prereq.id)
        );
    };

    const isAlreadyEnrolled = () => {
        return enrolledCourseIds.includes(id) || completedCourseIds.includes(id);
    };

    const handleEnroll = async () => {
        if (!course) return;

        setEnrolling(true);
        setEnrollmentError('');
        setEnrollmentSuccess(false);

        try {
            await axios.post('http://localhost:5000/api/enrollments', {
                course_code: course.code,
                semester: course.semester || 'Fall 2024'
            });

            setEnrollmentSuccess(true);
            setEnrolledCourseIds([...enrolledCourseIds, id]);

            // Redirect to home after 2 seconds
            setTimeout(() => {
                navigate(isAdminOrStaff ? '/admin/home' : '/home');
            }, 2000);
        } catch (error: any) {
            setEnrollmentError(
                error.response?.data?.message ||
                'Failed to enroll in course. Please try again.'
            );
        } finally {
            setEnrolling(false);
        }
    };

    // const handleLogout = () => {
    //     authService.logout();
    //     navigate('/login');
    // };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <div className="loading-spinner"></div>
                <p className="mt-4 text-muted-foreground">Loading course details...</p>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold text-foreground mb-4">Course not found</h2>
                <Button onClick={() => navigate('/catalog')}>
                    Back to Catalog
                </Button>
            </div>
        );
    }

    const prerequisitesMet = arePrerequisitesMet();
    const alreadyEnrolled = isAlreadyEnrolled();
    const hasPrerequisites = course.prerequisites && course.prerequisites.length > 0;

    return (
        <div className="space-y-6">
            {/* Course Hero Section */}
            <div className="bg-primary text-primary-foreground rounded-lg p-8 shadow-sm">
                <div>
                    <Badge variant="outline" className="text-primary-foreground border-primary-foreground/30 mb-4 text-sm font-bold bg-primary-foreground/10">
                        {course.code}
                    </Badge>
                    <h1 className="text-3xl font-bold mb-4 text-primary-foreground">{course.title}</h1>
                    <p className="text-lg text-primary-foreground/80 mb-6">{course.description}</p>

                    <div className="flex flex-wrap gap-4 text-primary-foreground">
                        <Badge variant="secondary" className="text-sm">
                            {course.type}
                        </Badge>
                        <span className="bg-primary-foreground/10 px-4 py-2 rounded-full text-sm flex items-center">
                            <strong className="mr-1">Level:</strong> {course.difficulty}
                        </span>
                        <span className="bg-primary-foreground/10 px-4 py-2 rounded-full text-sm flex items-center">
                            <strong className="mr-1">Credits:</strong> {course.credits} CH
                        </span>
                        {course.professor && (
                            <span className="bg-primary-foreground/10 px-4 py-2 rounded-full text-sm flex items-center">
                                <strong className="mr-1">Professor:</strong> {course.professor}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div>
                {/* Enrollment Status Messages */}
                {enrollmentSuccess && (
                    <div className="bg-green-100 text-green-700 px-6 py-4 rounded-lg mb-6 border border-green-200">
                        ✓ Successfully enrolled in {course.title}! Redirecting to home...
                    </div>
                )}

                {enrollmentError && (
                    <div className="bg-destructive/10 text-destructive px-6 py-4 rounded-lg mb-6 border border-destructive/20">
                        ✗ {enrollmentError}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Course Information */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Prerequisites Section */}
                        {hasPrerequisites && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Prerequisites</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {course.prerequisites.map((prereq: any) => {
                                            const isCompleted = completedCourseIds.includes(prereq.id);
                                            return (
                                                <div
                                                    key={prereq.id}
                                                    className={`flex justify-between items-center p-4 rounded-lg border ${isCompleted
                                                        ? 'bg-green-50 border-green-200'
                                                        : 'bg-red-50 border-red-200'
                                                        }`}
                                                >
                                                    <div>
                                                        <span className="font-bold text-primary mr-2">{prereq.code}</span>
                                                        <span className="text-muted-foreground">{prereq.title}</span>
                                                    </div>
                                                    <Badge variant={isCompleted ? 'default' : 'destructive'} className={isCompleted ? 'bg-green-600' : ''}>
                                                        {isCompleted ? '✓ Completed' : '✗ Not Completed'}
                                                    </Badge>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {!prerequisitesMet && (
                                        <div className="mt-4 flex items-center gap-2 text-amber-700 bg-amber-50 px-4 py-3 rounded-lg border border-amber-200 text-sm">
                                            <AlertTriangle size={16} />
                                            You must complete all prerequisite courses before enrolling.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Course Overview */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Course Overview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-3">{course.description}</p>
                                {course.subjectArea && (
                                    <p className="text-muted-foreground"><strong>Subject Area:</strong> {course.subjectArea}</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Learning Outcomes */}
                        <Card>
                            <CardHeader>
                                <CardTitle>What You'll Learn</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                                    <li>Master fundamental concepts in {course.subjectArea || course.title}</li>
                                    <li>Apply theoretical knowledge to practical scenarios</li>
                                    <li>Develop critical thinking and problem-solving skills</li>
                                    <li>Gain hands-on experience through projects and assignments</li>
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Syllabus */}
                        {course.lessons && course.lessons.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Course Syllabus</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {course.lessons.map((lesson: any, index: number) => (
                                            <div key={index} className="flex gap-4 p-4 bg-muted/30 rounded-lg items-center">
                                                <Badge className="h-fit py-1">
                                                    Week {index + 1}
                                                </Badge>
                                                <div className="flex-1">
                                                    <div className="font-semibold text-foreground">{lesson.title}</div>
                                                    {lesson.duration && (
                                                        <div className="text-sm text-muted-foreground mt-1">{lesson.duration}</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Grading Information */}
                        {(course.totalMarks || course.passingMarks) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Grading Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-muted-foreground">
                                        {course.totalMarks && (
                                            <p><strong>Total Marks:</strong> {course.totalMarks}</p>
                                        )}
                                        {course.passingMarks && (
                                            <p><strong>Passing Marks:</strong> {course.passingMarks}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column - Enrollment Card */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-8">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-bold text-foreground mb-4">Enrollment</h3>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Course Code</span>
                                        <span className="font-semibold text-foreground">{course.code}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Credits</span>
                                        <span className="font-semibold text-foreground">{course.credits} CH</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Level</span>
                                        <span className="font-semibold text-foreground">{course.difficulty}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Type</span>
                                        <span className="font-semibold text-foreground">{course.type}</span>
                                    </div>
                                    {course.semester && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Semester</span>
                                            <span className="font-semibold text-foreground">{course.semester}</span>
                                        </div>
                                    )}
                                </div>

                                <Separator className="my-6" />

                                <div>
                                    {alreadyEnrolled ? (
                                        <Button
                                            className="w-full bg-green-100 text-green-700 hover:bg-green-200 border-none cursor-not-allowed"
                                            disabled
                                            variant="secondary"
                                        >
                                            ✓ Already Enrolled
                                        </Button>
                                    ) : !prerequisitesMet ? (
                                        <Button
                                            className="w-full cursor-not-allowed"
                                            disabled
                                            variant="secondary"
                                        >
                                            <Lock size={16} className="mr-2" />
                                            Prerequisites Required
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleEnroll}
                                            className="w-full"
                                            disabled={enrolling}
                                        >
                                            {enrolling ? 'Enrolling...' : 'Enroll Now'}
                                        </Button>
                                    )}
                                </div>

                                {hasPrerequisites && (
                                    <div className="mt-6 pt-6 border-t border-border">
                                        <h4 className="text-sm font-bold text-foreground mb-3">Prerequisites</h4>
                                        <ul className="space-y-2">
                                            {course.prerequisites.map((prereq: any) => (
                                                <li
                                                    key={prereq.id}
                                                    className={`text-sm ${completedCourseIds.includes(prereq.id)
                                                        ? 'text-green-600 font-semibold'
                                                        : 'text-muted-foreground'
                                                        }`}
                                                >
                                                    {prereq.code}
                                                    {completedCourseIds.includes(prereq.id) && ' ✓'}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CatalogCourseDetails;
