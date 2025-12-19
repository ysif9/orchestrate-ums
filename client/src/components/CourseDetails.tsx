import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const CourseDetails = () => {
    const { id } = useParams();
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
        <div className="space-y-6">
            {/* Hero Section */}
            <div className="bg-primary text-primary-foreground rounded-lg p-8 text-center shadow-sm">
                <Badge variant="secondary" className="mb-3">
                    {course.code}
                </Badge>
                <h1 className="text-3xl font-bold m-0 mb-2 text-primary-foreground">{course.title}</h1>
                <p className="text-lg text-primary-foreground/90">
                    {typeof course.semester === 'object' ? (course.semester as any).name : (course.semester || 'Fall 2024')} | {course.type} Course
                </p>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

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
                                    {(() => {
                                        if (!course.professor) return "T";
                                        const name = typeof course.professor === 'object' ? (course.professor as any).name : course.professor;
                                        return name ? name.charAt(0) : "T";
                                    })()}
                                </div>
                                <div>
                                    <strong className="text-foreground text-lg">
                                        {(() => {
                                            if (!course.professor) return "To Be Announced";
                                            return typeof course.professor === 'object' ? (course.professor as any).name : course.professor;
                                        })()}
                                    </strong>
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
        </div >
    );
};

export default CourseDetails;
