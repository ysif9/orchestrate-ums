import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { studentRecordService } from '../services/studentRecordService';
import { FileText, ArrowLeft, Download, Award, BookOpen, Calendar, User, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function StudentRecordSummaryPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) {
            fetchSummary();
        }
    }, [id]);

    const fetchSummary = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await studentRecordService.getStudentSummary(parseInt(id!));

            if (!response.success) {
                setError(response.message || 'Failed to load student record');
                return;
            }

            setSummary(response);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load student record. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge variant="success" className="gap-1"><CheckCircle size={12} /> Active</Badge>;
            case 'inactive':
                return <Badge variant="secondary" className="gap-1"><Clock size={12} /> Inactive</Badge>;
            case 'on_hold':
                return <Badge variant="warning" className="gap-1"><AlertCircle size={12} /> On Hold</Badge>;
            case 'suspended':
                return <Badge variant="destructive" className="gap-1"><XCircle size={12} /> Suspended</Badge>;
            case 'graduated':
                return <Badge variant="info" className="gap-1"><Award size={12} /> Graduated</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getRegistrationStatusBadge = (status: string) => {
        switch (status) {
            case 'Fully Registered':
                return <Badge variant="success">{status}</Badge>;
            case 'Partially Registered':
                return <Badge variant="warning">{status}</Badge>;
            case 'Not Registered':
                return <Badge variant="destructive">{status}</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getEnrollmentStatusBadge = (status: string) => {
        switch (status) {
            case 'enrolled':
                return <Badge variant="info">Enrolled</Badge>;
            case 'completed':
                return <Badge variant="success">Completed</Badge>;
            case 'dropped':
                return <Badge variant="destructive">Dropped</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-muted-foreground">
                Loading student record...
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-5 text-center">
                    <div className="text-destructive mb-4 text-lg font-semibold">{error}</div>
                    <Button onClick={() => navigate('/admin/student-records')} className="mx-auto gap-2">
                        <ArrowLeft size={18} />
                        Back to Search
                    </Button>
                </div>
            </div>
        );
    }

    if (!summary) {
        return null;
    }

    const { student, academicSummary, currentTermRegistration, courseHistory, activeHolds } = summary;

    return (
        <div className="min-h-screen bg-gray-50 print:bg-white">
            <div className="max-w-5xl mx-auto py-8 px-5 print:py-4 print:px-0">
                {/* Action Bar - Hidden when printing */}
                <div className="bg-white rounded-xl shadow-lg mb-6 print:hidden">
                    <div className="flex items-center justify-between p-6 border-b">
                        <Button variant="ghost" onClick={() => navigate('/admin/student-records')} className="gap-2">
                            <ArrowLeft size={18} />
                            Back to Search
                        </Button>
                        <Button onClick={handlePrint} className="gap-2">
                            <Download size={18} />
                            Print / Save PDF
                        </Button>
                    </div>
                </div>

                {/* Student Record Document */}
                <div className="bg-white rounded-xl shadow-lg p-8 print:shadow-none print:p-0">
                    {/* Header */}
                    <div className="text-center mb-8 border-b-2 pb-6">
                        <h1 className="text-3xl font-bold text-primary mb-2">STUDENT RECORD SUMMARY</h1>
                        <p className="text-muted-foreground">Ain Shams University | Faculty of Engineering</p>
                        <p className="text-muted-foreground text-sm mt-2">
                            Generated: {new Date().toLocaleDateString()}
                        </p>
                    </div>

                    {/* Student Information */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                            <User size={24} />
                            Student Information
                        </h2>
                        <div className="grid grid-cols-2 gap-4 print:grid-cols-2">
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-1">Name</h3>
                                <p className="text-lg font-semibold">{student.name}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-1">Student ID</h3>
                                <p className="text-lg font-semibold">#{student.id}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-1">Email</h3>
                                <p>{student.email}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-1">Account Status</h3>
                                <div>{getStatusBadge(student.status)}</div>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-1">Max Credits</h3>
                                <p>{student.maxCredits}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-1">Enrollment Date</h3>
                                <p>{new Date(student.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Active Holds */}
                    {activeHolds && activeHolds.length > 0 && (
                        <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
                                <AlertCircle size={20} />
                                Active Holds
                            </div>
                            <ul className="list-disc list-inside text-red-700">
                                {activeHolds.map((hold: string, index: number) => (
                                    <li key={index}>{hold}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Academic Summary */}
                    <div className="mb-8 bg-muted/30 rounded-lg p-6 border">
                        <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                            <Award size={24} />
                            Academic Summary
                        </h2>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-primary mb-2">
                                    {academicSummary.gpa !== null ? academicSummary.gpa.toFixed(2) : 'N/A'}
                                </div>
                                <div className="text-sm text-muted-foreground">Overall GPA</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-primary mb-2">{academicSummary.totalCredits}</div>
                                <div className="text-sm text-muted-foreground">Total Credits</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-primary mb-2">{academicSummary.completedCourses}</div>
                                <div className="text-sm text-muted-foreground">Completed Courses</div>
                            </div>
                        </div>
                    </div>

                    {/* Current Term Registration */}
                    {currentTermRegistration && (
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                                <Calendar size={24} />
                                Current Term Registration
                            </h2>
                            <div className="bg-muted/30 rounded-lg p-6 mb-4 border">
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <div className="text-sm font-semibold text-muted-foreground mb-1">Semester</div>
                                        <div className="text-lg font-semibold">{currentTermRegistration.semester}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-muted-foreground mb-1">Registered Credits</div>
                                        <div className="text-lg font-semibold">{currentTermRegistration.registeredCredits}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-muted-foreground mb-1">Registration Status</div>
                                        <div>{getRegistrationStatusBadge(currentTermRegistration.registrationStatus)}</div>
                                    </div>
                                </div>
                                {currentTermRegistration.enrolledCourses.length > 0 && (
                                    <div>
                                        <div className="text-sm font-semibold text-muted-foreground mb-2">Enrolled Courses</div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b">
                                                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Course Code</th>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Title</th>
                                                        <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground">Credits</th>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Enrollment Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentTermRegistration.enrolledCourses.map((course: any) => (
                                                        <tr key={course.id} className="border-b last:border-0">
                                                            <td className="px-3 py-2 font-mono">{course.code}</td>
                                                            <td className="px-3 py-2">{course.title}</td>
                                                            <td className="px-3 py-2 text-center">{course.credits}</td>
                                                            <td className="px-3 py-2">{new Date(course.enrollmentDate).toLocaleDateString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Course History */}
                    {courseHistory && courseHistory.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                                <BookOpen size={24} />
                                Complete Course History
                            </h2>
                            <div className="space-y-6">
                                {courseHistory.map((semesterData: any, index: number) => (
                                    <div key={index} className="border rounded-lg p-6 print:break-inside-avoid">
                                        <div className="mb-4 pb-4 border-b">
                                            <h3 className="text-lg font-bold flex items-center gap-2">
                                                <Calendar size={18} />
                                                {semesterData.semester}
                                            </h3>
                                            <div className="text-sm text-muted-foreground mt-1">
                                                Total Credits: {semesterData.totalCredits}
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-muted/50">
                                                        <th className="px-3 py-2 text-left border-b text-xs font-semibold text-muted-foreground">Course Code</th>
                                                        <th className="px-3 py-2 text-left border-b text-xs font-semibold text-muted-foreground">Title</th>
                                                        <th className="px-3 py-2 text-center border-b text-xs font-semibold text-muted-foreground">Credits</th>
                                                        <th className="px-3 py-2 text-center border-b text-xs font-semibold text-muted-foreground">Status</th>
                                                        <th className="px-3 py-2 text-center border-b text-xs font-semibold text-muted-foreground">Grade</th>
                                                        <th className="px-3 py-2 text-center border-b text-xs font-semibold text-muted-foreground">Percentage</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {semesterData.courses.map((course: any) => (
                                                        <tr key={course.id} className="hover:bg-muted/30">
                                                            <td className="px-3 py-2 border-b font-mono">{course.code}</td>
                                                            <td className="px-3 py-2 border-b">{course.title}</td>
                                                            <td className="px-3 py-2 border-b text-center">{course.credits}</td>
                                                            <td className="px-3 py-2 border-b text-center">
                                                                {getEnrollmentStatusBadge(course.status)}
                                                            </td>
                                                            <td className="px-3 py-2 border-b text-center font-semibold">
                                                                {course.grade || '—'}
                                                            </td>
                                                            <td className="px-3 py-2 border-b text-center">
                                                                {course.percentage !== null ? `${course.percentage.toFixed(1)}%` : '—'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t-2 text-center text-sm text-muted-foreground">
                        <p>This is an official student record summary generated by the University Management System.</p>
                        <p className="mt-2">Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body { background: white; }
                    .print\\:bg-white { background: white; }
                    .print\\:shadow-none { box-shadow: none; }
                    .print\\:p-0 { padding: 0; }
                    .print\\:py-4 { padding-top: 1rem; padding-bottom: 1rem; }
                    .print\\:px-0 { padding-left: 0; padding-right: 0; }
                    .print\\:break-inside-avoid { break-inside: avoid; }
                    .print\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); display: grid; }
                    .print\\:hidden { display: none !important; }
                }
            `}</style>
        </div>
    );
}
