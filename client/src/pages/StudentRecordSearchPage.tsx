import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentRecordService } from '../services/studentRecordService';
import { Search, User, Mail, Award, Calendar, AlertCircle, CheckCircle, XCircle, Clock, FileText, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

export default function StudentRecordSearchPage() {
    const navigate = useNavigate();
    const [studentId, setStudentId] = useState('');
    const [studentData, setStudentData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentId.trim()) {
            setError('Please enter a student ID or Email');
            return;
        }

        try {
            setLoading(true);
            setError('');
            setStudentData(null);
            const response = await studentRecordService.searchStudent(studentId);
            if (response.success) {
                setStudentData(response);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Student not found. Please check the ID and try again.');
            setStudentData(null);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateSummary = () => {
        if (studentData?.student?.id) {
            navigate(`/admin/student-records/${studentData.student.id}/summary`);
        }
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

    return (
        <div className="min-h-screen bg-gray-50 bg-opacity-50">
            <div className="max-w-6xl mx-auto py-8 px-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between border-b pb-6">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" onClick={() => navigate('/admin/home')} className="gap-2">
                                <ArrowLeft size={18} />
                                Back to Home
                            </Button>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <User size={28} className="text-primary" />
                                Student Record Management
                            </CardTitle>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-8">
                        {/* Search Section */}
                        <form onSubmit={handleSearch} className="mb-6">
                            <div className="flex gap-3 max-w-xl mx-auto">
                                <div className="flex-1">
                                    <Input
                                        type="text"
                                        value={studentId}
                                        onChange={(e) => setStudentId(e.target.value)}
                                        placeholder="Enter Student ID or Email"
                                        className="h-12 text-lg"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    size="lg"
                                    className="gap-2"
                                >
                                    <Search size={18} />
                                    {loading ? 'Searching...' : 'Search'}
                                </Button>
                            </div>
                        </form>

                        {error && (
                            <Alert variant="destructive" className="mb-6 max-w-xl mx-auto">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Key Verification Data */}
                        {studentData && studentData.student && (
                            <div className="space-y-6 mt-8 animate-in fade-in-50 duration-500">
                                {/* Student Information Card */}
                                <Card className="bg-muted/30 border-2">
                                    <CardHeader className="pb-2">
                                        <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
                                            <User size={24} />
                                            Student Information
                                        </h2>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <div className="text-sm font-medium text-muted-foreground mb-1">Name</div>
                                                <div className="text-lg font-semibold">{studentData.student.name}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-muted-foreground mb-1">Student ID</div>
                                                <div className="text-lg font-mono font-semibold">#{studentData.student.id}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-muted-foreground mb-1">Email</div>
                                                <div className="flex items-center gap-2">
                                                    <Mail size={16} className="text-muted-foreground" />
                                                    {studentData.student.email}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-muted-foreground mb-1">Current Status</div>
                                                <div>{getStatusBadge(studentData.student.status)}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Current Term Registration */}
                                {studentData.currentTermRegistration && (
                                    <Card className="bg-muted/30 border-2">
                                        <CardHeader className="pb-2">
                                            <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
                                                <Calendar size={24} />
                                                Current Term Registration
                                            </h2>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                                                <div>
                                                    <div className="text-sm font-medium text-muted-foreground mb-1">Semester</div>
                                                    <div className="text-lg font-semibold">{studentData.currentTermRegistration.semester}</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-muted-foreground mb-1">Registered Credits</div>
                                                    <div className="text-lg font-semibold">{studentData.currentTermRegistration.registeredCredits}</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-muted-foreground mb-1">Registration Status</div>
                                                    <div>{getRegistrationStatusBadge(studentData.currentTermRegistration.registrationStatus)}</div>
                                                </div>
                                            </div>
                                            {studentData.currentTermRegistration.enrolledCourses.length > 0 && (
                                                <div className="mt-4">
                                                    <div className="text-sm font-semibold text-muted-foreground mb-2">Enrolled Courses</div>
                                                    <div className="space-y-2">
                                                        {studentData.currentTermRegistration.enrolledCourses.map((course: any) => (
                                                            <div key={course.id} className="bg-background rounded-md p-3 border flex justify-between items-center shadow-sm">
                                                                <div>
                                                                    <div className="font-semibold">{course.code} - {course.title}</div>
                                                                    <div className="text-sm text-muted-foreground">{course.credits} Credits</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Academic Summary */}
                                {studentData.academicSummary && (
                                    <Card className="bg-muted/30 border-2">
                                        <CardHeader className="pb-2">
                                            <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
                                                <Award size={24} />
                                                Academic Summary
                                            </h2>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <div className="text-sm font-medium text-muted-foreground mb-1">GPA</div>
                                                    <div className="text-2xl font-bold text-primary">
                                                        {studentData.academicSummary.gpa !== null
                                                            ? studentData.academicSummary.gpa.toFixed(2)
                                                            : 'N/A'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-muted-foreground mb-1">Total Credits</div>
                                                    <div className="text-2xl font-bold text-primary">{studentData.academicSummary.totalCredits}</div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Active Holds */}
                                {(studentData.student.status === 'on_hold' || studentData.student.status === 'suspended') && (
                                    <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Active Holds</AlertTitle>
                                        <AlertDescription>
                                            {studentData.student.status === 'on_hold' && 'Administrative Hold'}
                                            {studentData.student.status === 'suspended' && 'Suspension'}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* Generate Summary Button */}
                                <div className="flex justify-end pt-4">
                                    <Button
                                        onClick={handleGenerateSummary}
                                        size="lg"
                                        className="gap-2"
                                    >
                                        <FileText size={18} />
                                        Generate Full Summary
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
