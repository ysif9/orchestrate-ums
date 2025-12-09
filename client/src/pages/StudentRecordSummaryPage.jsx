import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { studentRecordService } from '../services/studentRecordService';
import { FileText, ArrowLeft, Download, Award, BookOpen, Calendar, User, Mail, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

function StudentRecordSummaryPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSummary();
    }, [id]);

    const fetchSummary = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await studentRecordService.getStudentSummary(parseInt(id));
            
            if (!response.success) {
                setError(response.message || 'Failed to load student record');
                return;
            }

            setSummary(response);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load student record. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'active': {
                label: 'Active',
                bgColor: 'bg-success-100',
                textColor: 'text-success-700',
                icon: CheckCircle
            },
            'inactive': {
                label: 'Inactive',
                bgColor: 'bg-content-tertiary',
                textColor: 'text-content-secondary',
                icon: Clock
            },
            'on_hold': {
                label: 'On Hold',
                bgColor: 'bg-warning-100',
                textColor: 'text-warning-700',
                icon: AlertCircle
            },
            'suspended': {
                label: 'Suspended',
                bgColor: 'bg-error-100',
                textColor: 'text-error-700',
                icon: XCircle
            },
            'graduated': {
                label: 'Graduated',
                bgColor: 'bg-info-100',
                textColor: 'text-info-700',
                icon: Award
            }
        };

        const statusInfo = statusMap[status] || statusMap['active'];
        const Icon = statusInfo.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                <Icon size={14} />
                {statusInfo.label}
            </span>
        );
    };

    const getRegistrationStatusBadge = (status) => {
        const statusMap = {
            'Fully Registered': {
                bgColor: 'bg-success-100',
                textColor: 'text-success-700'
            },
            'Partially Registered': {
                bgColor: 'bg-warning-100',
                textColor: 'text-warning-700'
            },
            'Not Registered': {
                bgColor: 'bg-error-100',
                textColor: 'text-error-700'
            }
        };

        const statusInfo = statusMap[status] || statusMap['Not Registered'];

        return (
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                {status}
            </span>
        );
    };

    const getEnrollmentStatusBadge = (status) => {
        const statusMap = {
            'enrolled': {
                label: 'Enrolled',
                bgColor: 'bg-info-100',
                textColor: 'text-info-700'
            },
            'completed': {
                label: 'Completed',
                bgColor: 'bg-success-100',
                textColor: 'text-success-700'
            },
            'dropped': {
                label: 'Dropped',
                bgColor: 'bg-error-100',
                textColor: 'text-error-700'
            }
        };

        const statusInfo = statusMap[status] || statusMap['enrolled'];

        return (
            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                {statusInfo.label}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-content-secondary">
                Loading student record...
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-surface rounded-xl shadow-lg p-8 max-w-2xl mx-5">
                    <div className="text-center">
                        <div className="text-error-600 mb-4 text-lg font-semibold">{error}</div>
                        <button
                            onClick={() => navigate('/admin/student-records')}
                            className="bg-brand-500 hover:bg-brand-600 text-content-inverse px-6 py-3 rounded-lg font-medium transition-colors shadow-button hover:shadow-button-hover flex items-center gap-2 mx-auto"
                        >
                            <ArrowLeft size={18} />
                            Back to Search
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!summary) {
        return null;
    }

    const { student, academicSummary, currentTermRegistration, courseHistory, activeHolds } = summary;

    return (
        <div className="min-h-screen bg-surface-secondary print:bg-white">
            <div className="max-w-5xl mx-auto py-8 px-5 print:py-4 print:px-0">
                {/* Action Bar - Hidden when printing */}
                <div className="bg-surface rounded-xl shadow-lg mb-6 print:hidden">
                    <div className="flex items-center justify-between p-6 border-b border-border">
                        <button
                            onClick={() => navigate('/admin/student-records')}
                            className="bg-brand-500 hover:bg-brand-600 text-content-inverse px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:-translate-y-0.5 shadow-button hover:shadow-button-hover flex items-center gap-2"
                        >
                            <ArrowLeft size={18} />
                            Back to Search
                        </button>
                        <button
                            onClick={handlePrint}
                            className="bg-info-600 hover:bg-info-700 text-content-inverse px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-button hover:shadow-button-hover flex items-center gap-2"
                        >
                            <Download size={18} />
                            Print / Save PDF
                        </button>
                    </div>
                </div>

                {/* Student Record Document */}
                <div className="bg-white rounded-xl shadow-lg p-8 print:shadow-none print:p-0">
                    {/* Header */}
                    <div className="text-center mb-8 border-b-2 border-border pb-6">
                        <h1 className="text-3xl font-bold text-brand-500 mb-2">STUDENT RECORD SUMMARY</h1>
                        <p className="text-content-secondary">Ain Shams University | Faculty of Engineering</p>
                        <p className="text-content-tertiary text-sm mt-2">
                            Generated: {new Date().toLocaleDateString()}
                        </p>
                    </div>

                    {/* Student Information */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-brand-500 mb-4 flex items-center gap-2">
                            <User size={24} />
                            Student Information
                        </h2>
                        <div className="grid grid-cols-2 gap-4 print:grid-cols-2">
                            <div>
                                <h3 className="text-sm font-semibold text-content-secondary mb-1">Name</h3>
                                <p className="text-lg font-semibold text-content">{student.name}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-content-secondary mb-1">Student ID</h3>
                                <p className="text-lg font-semibold text-content">#{student.id}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-content-secondary mb-1">Email</h3>
                                <p className="text-content">{student.email}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-content-secondary mb-1">Account Status</h3>
                                <div>{getStatusBadge(student.status)}</div>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-content-secondary mb-1">Max Credits</h3>
                                <p className="text-content">{student.maxCredits}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-content-secondary mb-1">Enrollment Date</h3>
                                <p className="text-content">{new Date(student.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Active Holds */}
                    {activeHolds && activeHolds.length > 0 && (
                        <div className="mb-8 bg-warning-100 border border-warning-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-warning-700 font-semibold mb-2">
                                <AlertCircle size={20} />
                                Active Holds
                            </div>
                            <ul className="list-disc list-inside text-warning-700">
                                {activeHolds.map((hold, index) => (
                                    <li key={index}>{hold}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Academic Summary */}
                    <div className="mb-8 bg-surface-tertiary rounded-lg p-6">
                        <h2 className="text-xl font-bold text-brand-500 mb-4 flex items-center gap-2">
                            <Award size={24} />
                            Academic Summary
                        </h2>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-brand-500 mb-2">
                                    {academicSummary.gpa !== null ? academicSummary.gpa.toFixed(2) : 'N/A'}
                                </div>
                                <div className="text-sm text-content-secondary">Overall GPA</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-brand-500 mb-2">{academicSummary.totalCredits}</div>
                                <div className="text-sm text-content-secondary">Total Credits</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-brand-500 mb-2">{academicSummary.completedCourses}</div>
                                <div className="text-sm text-content-secondary">Completed Courses</div>
                            </div>
                        </div>
                    </div>

                    {/* Current Term Registration */}
                    {currentTermRegistration && (
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-brand-500 mb-4 flex items-center gap-2">
                                <Calendar size={24} />
                                Current Term Registration
                            </h2>
                            <div className="bg-surface-tertiary rounded-lg p-6 mb-4">
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <div className="text-sm font-semibold text-content-secondary mb-1">Semester</div>
                                        <div className="text-lg font-semibold text-content">{currentTermRegistration.semester}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-content-secondary mb-1">Registered Credits</div>
                                        <div className="text-lg font-semibold text-content">{currentTermRegistration.registeredCredits}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-content-secondary mb-1">Registration Status</div>
                                        <div>{getRegistrationStatusBadge(currentTermRegistration.registrationStatus)}</div>
                                    </div>
                                </div>
                                {currentTermRegistration.enrolledCourses.length > 0 && (
                                    <div>
                                        <div className="text-sm font-semibold text-content-secondary mb-2">Enrolled Courses</div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-surface border-b border-border">
                                                        <th className="px-3 py-2 text-left text-xs font-semibold text-content">Course Code</th>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold text-content">Title</th>
                                                        <th className="px-3 py-2 text-center text-xs font-semibold text-content">Credits</th>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold text-content">Enrollment Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentTermRegistration.enrolledCourses.map((course) => (
                                                        <tr key={course.id} className="border-b border-border-light">
                                                            <td className="px-3 py-2 font-mono text-content">{course.code}</td>
                                                            <td className="px-3 py-2 text-content">{course.title}</td>
                                                            <td className="px-3 py-2 text-center text-content">{course.credits}</td>
                                                            <td className="px-3 py-2 text-content">{new Date(course.enrollmentDate).toLocaleDateString()}</td>
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
                            <h2 className="text-xl font-bold text-brand-500 mb-4 flex items-center gap-2">
                                <BookOpen size={24} />
                                Complete Course History
                            </h2>
                            <div className="space-y-6">
                                {courseHistory.map((semesterData, index) => (
                                    <div key={index} className="border border-border rounded-lg p-6 print:break-inside-avoid">
                                        <div className="mb-4 pb-4 border-b border-border-light">
                                            <h3 className="text-lg font-bold text-content flex items-center gap-2">
                                                <Calendar size={18} />
                                                {semesterData.semester}
                                            </h3>
                                            <div className="text-sm text-content-secondary mt-1">
                                                Total Credits: {semesterData.totalCredits}
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-surface-tertiary">
                                                        <th className="px-3 py-2 text-left border-b border-border text-xs font-semibold text-content">Course Code</th>
                                                        <th className="px-3 py-2 text-left border-b border-border text-xs font-semibold text-content">Title</th>
                                                        <th className="px-3 py-2 text-center border-b border-border text-xs font-semibold text-content">Credits</th>
                                                        <th className="px-3 py-2 text-center border-b border-border text-xs font-semibold text-content">Status</th>
                                                        <th className="px-3 py-2 text-center border-b border-border text-xs font-semibold text-content">Grade</th>
                                                        <th className="px-3 py-2 text-center border-b border-border text-xs font-semibold text-content">Percentage</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {semesterData.courses.map((course) => (
                                                        <tr key={course.id} className="hover:bg-surface-hover">
                                                            <td className="px-3 py-2 border-b border-border-light font-mono text-content">{course.code}</td>
                                                            <td className="px-3 py-2 border-b border-border-light text-content">{course.title}</td>
                                                            <td className="px-3 py-2 border-b border-border-light text-center text-content">{course.credits}</td>
                                                            <td className="px-3 py-2 border-b border-border-light text-center">
                                                                {getEnrollmentStatusBadge(course.status)}
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-border-light text-center font-semibold text-content">
                                                                {course.grade || '—'}
                                                            </td>
                                                            <td className="px-3 py-2 border-b border-border-light text-center text-content">
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
                    <div className="mt-8 pt-6 border-t-2 border-border text-center text-sm text-content-tertiary">
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
                    .print\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                }
            `}</style>
        </div>
    );
}

export default StudentRecordSummaryPage;

