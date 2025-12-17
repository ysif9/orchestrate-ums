import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { transcriptService } from '@/services/transcriptService';
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FileText, ArrowLeft, Award, BookOpen, Printer } from 'lucide-react';

function ViewTranscriptPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [request, setRequest] = useState<any>(null);
    const [transcript, setTranscript] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTranscript();
    }, [id]);

    const fetchTranscript = async () => {
        try {
            setLoading(true);
            setError('');
            if (!id) return;
            const response: any = await transcriptService.viewTranscript(parseInt(id));

            if (!response.success) {
                setError(response.message || 'Failed to load transcript');
                return;
            }

            setRequest(response.request);

            if (response.request.status !== 'approved') {
                setError('This transcript request has not been approved yet.');
                return;
            }

            if (!response.transcript) {
                setError('Transcript data not available.');
                return;
            }

            setTranscript(response.transcript);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load transcript. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-muted-foreground">
                <span className="loading-spinner"></span> Loading transcript...
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/20">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6 text-center space-y-4">
                        <div className="text-destructive font-semibold">{error}</div>
                        <Button onClick={() => navigate('/transcript-requests')} variant="outline">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Requests
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!transcript || !request) {
        return null; // Should be handled by error state
    }

    const student = request.student;

    return (
        <div className="space-y-6 print:p-0">
            {/* Action Bar - Hidden when printing */}
            <div className="max-w-5xl mx-auto mb-6 flex justify-between print:hidden">
                <Button variant="outline" onClick={() => navigate('/transcript-requests')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Requests
                </Button>
                <Button onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print / Save PDF
                </Button>
            </div>

            <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden print:shadow-none print:rounded-none">
                <div className="p-10 space-y-8 print:p-0">

                    {/* Header */}
                    <div className="text-center border-b pb-8">
                        <div className="inline-flex items-center justify-center p-3 bg-primary/5 rounded-full mb-4 print:hidden">
                            <FileText className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-primary">OFFICIAL TRANSCRIPT</h1>
                        <p className="text-muted-foreground font-medium mt-1">Ain Shams University | Faculty of Engineering</p>
                        <p className="text-xs text-muted-foreground mt-4 font-mono">
                            Request ID: #{request.id} • Generated: {new Date(request.reviewedAt).toLocaleDateString()}
                        </p>
                    </div>

                    {/* Student Info Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-muted/10 p-6 rounded-lg print:border print:bg-transparent">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Student Name</span>
                            <div className="font-semibold text-lg">{student.name}</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Student ID</span>
                            <div className="font-semibold text-lg">#{student.id}</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Email</span>
                            <div className="text-sm font-medium">{student.email}</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Request Date</span>
                            <div className="text-sm font-medium">{new Date(request.requestedAt).toLocaleDateString()}</div>
                        </div>
                    </div>

                    {/* Academic Summary Cards */}
                    <div className="grid grid-cols-3 gap-6">
                        <Card className="bg-primary/5 border-primary/10 shadow-none">
                            <CardContent className="flex flex-col items-center justify-center p-6 space-y-2">
                                <Award className="w-8 h-8 text-primary" />
                                <span className="text-3xl font-bold text-primary">
                                    {transcript.overallGPA !== null ? transcript.overallGPA.toFixed(2) : 'N/A'}
                                </span>
                                <span className="text-xs font-semibold uppercase text-primary/70">Overall GPA</span>
                            </CardContent>
                        </Card>
                        <Card className="bg-muted/30 border-none shadow-none">
                            <CardContent className="flex flex-col items-center justify-center p-6 space-y-2">
                                <BookOpen className="w-8 h-8 text-muted-foreground" />
                                <span className="text-3xl font-bold text-foreground">
                                    {transcript.totalCredits}
                                </span>
                                <span className="text-xs font-semibold uppercase text-muted-foreground">Total Credits</span>
                            </CardContent>
                        </Card>
                        <Card className="bg-muted/30 border-none shadow-none">
                            <CardContent className="flex flex-col items-center justify-center p-6 space-y-2">
                                <FileText className="w-8 h-8 text-muted-foreground" />
                                <span className="text-3xl font-bold text-foreground">
                                    {transcript.totalCourses}
                                </span>
                                <span className="text-xs font-semibold uppercase text-muted-foreground">Completed Courses</span>
                            </CardContent>
                        </Card>
                    </div>

                    <Separator />

                    {/* Courses Detail */}
                    <div>
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-primary" />
                            Academic History (Completed Courses)
                        </h2>

                        {transcript.courses.length === 0 ? (
                            <div className="text-center py-12 border rounded-lg border-dashed">
                                No completed courses found.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {transcript.courses.map((course: any) => (
                                    <div key={course.enrollmentId} className="border rounded-xl p-5 break-inside-avoid shadow-sm print:shadow-none print:border-foreground/20">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-lg font-bold">{course.courseCode} — {course.courseTitle}</h3>
                                                    <Badge variant="outline">{course.semester}</Badge>
                                                </div>
                                                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                                                    <span>{course.credits} Credits</span>
                                                    <span>•</span>
                                                    <span className="font-semibold text-foreground">Grade: {course.letterGrade || 'N/A'} ({course.courseGPA?.toFixed(2) || 'N/A'})</span>
                                                </div>
                                            </div>
                                            {course.coursePercentage !== null && (
                                                <div className="text-right">
                                                    <span className="text-xl font-bold text-primary block">{course.coursePercentage.toFixed(1)}%</span>
                                                    <span className="text-[10px] uppercase text-muted-foreground">Average</span>
                                                </div>
                                            )}
                                        </div>

                                        {course.assessments.length > 0 && (
                                            <div className="mt-4 bg-muted/20 rounded-lg p-3">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="text-xs text-muted-foreground uppercase text-left border-b border-muted">
                                                            <th className="font-medium pb-2">Assessment</th>
                                                            <th className="font-medium pb-2">Type</th>
                                                            <th className="font-medium pb-2 text-center">Score</th>
                                                            <th className="font-medium pb-2 text-center">Total</th>
                                                            <th className="font-medium pb-2 text-center">%</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-muted/10">
                                                        {course.assessments.map((ass: any) => (
                                                            <tr key={ass.id}>
                                                                <td className="py-2 pr-2 font-medium">{ass.title}</td>
                                                                <td className="py-2 pr-2 text-[10px] uppercase text-muted-foreground">{ass.type}</td>
                                                                <td className="py-2 text-center">{ass.score || '—'}</td>
                                                                <td className="py-2 text-center text-muted-foreground">{ass.totalMarks}</td>
                                                                <td className="py-2 text-center font-medium">{ass.percentage ? ass.percentage.toFixed(0) + '%' : '—'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                        <div className="text-[10px] text-muted-foreground mt-3 text-right">
                                            Enrolled: {new Date(course.enrollmentDate).toLocaleDateString()} • Completed: {new Date(course.completedDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-10 mt-10 border-t-2 text-center text-xs text-muted-foreground">
                        <p>This document is an official transcript generated by the University Management System.</p>
                        <p className="mt-1">Verified by: {request.reviewedBy?.name || 'System'} on {new Date(request.reviewedAt).toLocaleDateString()}</p>
                    </div>

                </div>
            </div>

            <style>{`
                @media print {
                    @page { margin: 0.5cm; }
                    body { background: white; -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
}

export default ViewTranscriptPage;
