import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentRecordService } from '../services/studentRecordService';
import { Search, User, Mail, Award, BookOpen, Calendar, AlertCircle, CheckCircle, XCircle, Clock, FileText, ArrowLeft } from 'lucide-react';

function StudentRecordSearchPage() {
    const navigate = useNavigate();
    const [studentId, setStudentId] = useState('');
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!studentId.trim()) {
            setError('Please enter a student ID');
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
        } catch (err) {
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

    return (
        <div className="min-h-screen bg-surface-secondary">
            <div className="max-w-6xl mx-auto py-8 px-5">
                <div className="bg-surface rounded-xl shadow-lg">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 pt-8 px-8 border-b border-border pb-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/admin/home')}
                                className="bg-brand-500 hover:bg-brand-600 text-content-inverse px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:-translate-y-0.5 whitespace-nowrap shadow-button hover:shadow-button-hover flex items-center gap-2"
                            >
                                <ArrowLeft size={18} />
                                Back to Home
                            </button>
                            <h1 className="text-2xl font-bold text-brand-500 flex items-center gap-2">
                                <User size={28} />
                                Student Record Management
                            </h1>
                        </div>
                    </div>

                    {/* Search Section */}
                    <div className="px-8 pb-8">
                        <form onSubmit={handleSearch} className="mb-6">
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={studentId}
                                        onChange={(e) => setStudentId(e.target.value)}
                                        placeholder="Enter Student ID"
                                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-content bg-surface"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-brand-500 hover:bg-brand-600 text-content-inverse px-6 py-3 rounded-lg font-medium transition-colors shadow-button hover:shadow-button-hover flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Search size={18} />
                                    {loading ? 'Searching...' : 'Search'}
                                </button>
                            </div>
                        </form>

                        {error && (
                            <div className="mb-6 bg-error-100 text-error-700 px-4 py-3 rounded-lg border border-error-200">
                                {error}
                            </div>
                        )}

                        {/* Key Verification Data */}
                        {studentData && studentData.student && (
                            <div className="space-y-6">
                                {/* Student Information Card */}
                                <div className="bg-surface-tertiary rounded-lg p-6 border border-border">
                                    <h2 className="text-xl font-bold text-brand-500 mb-4 flex items-center gap-2">
                                        <User size={24} />
                                        Student Information
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm font-semibold text-content-secondary mb-1">Name</div>
                                            <div className="text-lg font-semibold text-content">{studentData.student.name}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-content-secondary mb-1">Student ID</div>
                                            <div className="text-lg font-mono font-semibold text-content">#{studentData.student.id}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-content-secondary mb-1">Email</div>
                                            <div className="text-content flex items-center gap-2">
                                                <Mail size={16} />
                                                {studentData.student.email}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-content-secondary mb-1">Current Status</div>
                                            <div>{getStatusBadge(studentData.student.status)}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Current Term Registration */}
                                {studentData.currentTermRegistration && (
                                    <div className="bg-surface-tertiary rounded-lg p-6 border border-border">
                                        <h2 className="text-xl font-bold text-brand-500 mb-4 flex items-center gap-2">
                                            <Calendar size={24} />
                                            Current Term Registration
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div>
                                                <div className="text-sm font-semibold text-content-secondary mb-1">Semester</div>
                                                <div className="text-lg font-semibold text-content">{studentData.currentTermRegistration.semester}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-content-secondary mb-1">Registered Credits</div>
                                                <div className="text-lg font-semibold text-content">{studentData.currentTermRegistration.registeredCredits}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-content-secondary mb-1">Registration Status</div>
                                                <div>{getRegistrationStatusBadge(studentData.currentTermRegistration.registrationStatus)}</div>
                                            </div>
                                        </div>
                                        {studentData.currentTermRegistration.enrolledCourses.length > 0 && (
                                            <div>
                                                <div className="text-sm font-semibold text-content-secondary mb-2">Enrolled Courses</div>
                                                <div className="space-y-2">
                                                    {studentData.currentTermRegistration.enrolledCourses.map((course) => (
                                                        <div key={course.id} className="bg-surface rounded p-3 flex justify-between items-center">
                                                            <div>
                                                                <div className="font-semibold text-content">{course.code} - {course.title}</div>
                                                                <div className="text-sm text-content-secondary">{course.credits} Credits</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Academic Summary */}
                                {studentData.academicSummary && (
                                    <div className="bg-surface-tertiary rounded-lg p-6 border border-border">
                                        <h2 className="text-xl font-bold text-brand-500 mb-4 flex items-center gap-2">
                                            <Award size={24} />
                                            Academic Summary
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-sm font-semibold text-content-secondary mb-1">GPA</div>
                                                <div className="text-2xl font-bold text-brand-500">
                                                    {studentData.academicSummary.gpa !== null 
                                                        ? studentData.academicSummary.gpa.toFixed(2) 
                                                        : 'N/A'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-content-secondary mb-1">Total Credits</div>
                                                <div className="text-2xl font-bold text-brand-500">{studentData.academicSummary.totalCredits}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Active Holds */}
                                {studentData.student.status === 'on_hold' || studentData.student.status === 'suspended' && (
                                    <div className="bg-warning-100 border border-warning-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2 text-warning-700 font-semibold mb-2">
                                            <AlertCircle size={20} />
                                            Active Holds
                                        </div>
                                        <div className="text-warning-700">
                                            {studentData.student.status === 'on_hold' && 'Administrative Hold'}
                                            {studentData.student.status === 'suspended' && 'Suspension'}
                                        </div>
                                    </div>
                                )}

                                {/* Generate Summary Button */}
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleGenerateSummary}
                                        className="bg-brand-500 hover:bg-brand-600 text-content-inverse px-6 py-3 rounded-lg font-medium transition-colors shadow-button hover:shadow-button-hover flex items-center gap-2"
                                    >
                                        <FileText size={18} />
                                        Generate Full Summary
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentRecordSearchPage;

