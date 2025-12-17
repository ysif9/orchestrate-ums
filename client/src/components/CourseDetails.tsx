import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { authService } from '../services/authService.js';
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const CourseDetails = () => {
    const { id } = useParams();
    const user = authService.getCurrentUser();
    const isAdminOrStaff = user?.role === 'professor' || user?.role === 'staff';
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`http://localhost:5000/api/courses/${id}`);
                setCourse(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [id]);

    if (loading) return (
        <div className="h-screen flex justify-center items-center">
            <div className="loading-spinner"></div>
        </div>
    );

    if (!course) return <div className="text-center text-muted-foreground py-8">Course not found.</div>;

    return (
        <>
            <nav className="bg-primary text-primary-foreground px-8 py-6 shadow-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold m-0 text-primary-foreground">
                        AIN SHAMS
                        <span className="block text-xs font-normal tracking-wider text-primary-foreground/80 mt-1">UNIVERSITY | FACULTY OF ENGINEERING</span>
                    </h1>
                    <div className="flex gap-6">
                        {/* UPDATED: Link back to My Courses (Home) based on user role */}
                        <Link to={isAdminOrStaff ? '/admin/home' : '/home'} className="text-primary-foreground hover:text-accent-foreground/80 transition-colors no-underline">← Back to My Courses</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="bg-primary/95 text-primary-foreground text-center py-16 px-8">
                <Badge variant="secondary" className="mb-3">
                    {course.code}
                </Badge>
                <h1 className="text-4xl font-bold m-0 mb-4 text-primary-foreground">{course.title}</h1>
                <p className="text-xl max-w-3xl mx-auto text-primary-foreground/80">
                    {course.semester || 'Fall 2024'} | {course.type} Course
                </p>
            </div>

            {/* Two Column Layout */}
            <div className="max-w-7xl mx-auto px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* LEFT SIDEBAR */}
                <div className="lg:col-span-1 h-fit sticky top-8">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-muted-foreground text-sm">Status</span>
                                <span className="text-green-600 font-bold flex items-center gap-1">
                                    <span>●</span> Enrolled
                                </span>
                            </div>

                            <div className="flex justify-between items-start mb-4">
                                <span className="text-muted-foreground text-sm">Duration</span>
                                <span className="font-semibold text-foreground">{course.lessons?.length ? `${course.lessons.length} Weeks` : 'TBA'}</span>
                            </div>
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-muted-foreground text-sm">Subject</span>
                                <span className="font-semibold text-foreground">{course.subjectArea}</span>
                            </div>
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-muted-foreground text-sm">Credits</span>
                                <span className="font-semibold text-foreground">{course.credits} Credit Hours</span>
                            </div>

                            <Separator className="my-6" />

                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={() => alert('Drop deadline has passed.')}
                            >
                                Drop Course
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT MAIN CONTENT */}
                <div className="lg:col-span-3 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Course Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{course.description}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Instructor</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center">
                                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full mr-4 flex items-center justify-center text-2xl font-bold">
                                    {course.professor ? course.professor.charAt(0) : "T"}
                                </div>
                                <div>
                                    <strong className="text-foreground text-lg">{course.professor || "To Be Announced"}</strong>
                                    <p className="text-muted-foreground text-sm">Faculty of Engineering</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Learning Materials</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {course.lessons && course.lessons.length > 0 ? (
                                <ul className="space-y-4">
                                    {course.lessons.map((lesson: any, index: number) => (
                                        <li key={index} className="p-4 border border-l-4 border-l-primary rounded bg-muted/20 flex justify-between items-center">
                                            <div>
                                                <strong className="text-primary block mb-1">Week {index + 1}</strong>
                                                <span className="text-foreground">{lesson.title}</span>
                                            </div>
                                            <Badge variant="secondary">
                                                {lesson.duration || '1h 30m'}
                                            </Badge>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-8 bg-muted/20 rounded-lg text-center text-muted-foreground">
                                    No lessons have been uploaded for this course yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
};

export default CourseDetails;
