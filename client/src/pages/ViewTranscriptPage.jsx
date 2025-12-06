import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { transcriptService } from '../services/transcriptService';
import { FileText, ArrowLeft, Download, Award, BookOpen, Calendar } from 'lucide-react';

function ViewTranscriptPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [request, setRequest] = useState(null);
    const [transcript, setTranscript] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTranscript();
    }, [id]);

    const fetchTranscript = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await transcriptService.viewTranscript(parseInt(id));
            
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
        } catch (err) {
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
            <div className="min-h-screen flex items-center justify-center text-content-secondary">
                Loading transcript...
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
                            onClick={() => navigate('/transcript-requests')}
                            className="bg-brand-500 hover:bg-brand-600 text-content-inverse px-6 py-3 rounded-lg font-medium transition-colors shadow-button hover:shadow-button-hover flex items-center gap-2 mx-auto"
                        >
                            <ArrowLeft size={18} />
                            Back to Requests
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!transcript || !request) {
        return null;
    }

    const student = request.student;

    return (
        <div className="min-h-screen bg-surface-secondary print:bg-white">
            <div className="max-w-5xl mx-auto py-8 px-5 print:py-4 print:px-0">
                {/* Action Bar - Hidden when printing */}
                <div className="bg-surface rounded-xl shadow-lg mb-6 print:hidden">
                    <div className="flex items-center justify-between p-6 border-b border-border">
                        <button
                            onClick={() => navigate('/transcript-requests')}
                            className="bg-brand-500 hover:bg-brand-600 text-content-inverse px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:-translate-y-0.5 shadow-button hover:shadow-button-hover flex items-center gap-2"
                        >
                            <ArrowLeft size={18} />
                            Back to Requests
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

                {/* Transcript Document */}
                <div className="bg-white rounded-xl shadow-lg p-8 print:shadow-none print:p-0">
                    {/* Header */}
                    <div className="text-center mb-8 border-b-2 border-border pb-6">
                        <h1 className="text-3xl font-bold text-brand-500 mb-2">OFFICIAL TRANSCRIPT</h1>
                        <p className="text-content-secondary">Ain Shams University | Faculty of Engineering</p>
                        <p className="text-content-tertiary text-sm mt-2">
                            Request ID: #{request.id} | Generated: {new Date(request.reviewedAt).toLocaleDateString()}
                        </p>
                    </div>

                    {/* Student Information */}
                    <div className="mb-8 grid grid-cols-2 gap-4 print:grid-cols-2">
                        <div>
                            <h3 className="text-sm font-semibold text-content-secondary mb-1">Student Name</h3>
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
                            <h3 className="text-sm font-semibold text-content-secondary mb-1">Request Date</h3>
                            <p className="text-content">{new Date(request.requestedAt).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Academic Summary */}
                    <div className="mb-8 bg-surface-tertiary rounded-lg p-6 grid grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="flex items-center justify-center mb-2">
                                <Award className="text-brand-500" size={24} />
                            </div>
                            <div className="text-2xl font-bold text-brand-500">
                                {transcript.overallGPA !== null ? transcript.overallGPA.toFixed(2) : 'N/A'}
                            </div>
                            <div className="text-sm text-content-secondary mt-1">Overall GPA</div>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center mb-2">
                                <BookOpen className="text-brand-500" size={24} />
                            </div>
                            <div className="text-2xl font-bold text-brand-500">{transcript.totalCredits}</div>
                            <div className="text-sm text-content-secondary mt-1">Total Credits</div>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center mb-2">
                                <FileText className="text-brand-500" size={24} />
                            </div>
                            <div className="text-2xl font-bold text-brand-500">{transcript.totalCourses}</div>
                            <div className="text-sm text-content-secondary mt-1">Completed Courses</div>
                        </div>
                    </div>

                    {/* Course Details */}
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-brand-500 mb-4 flex items-center gap-2">
                            <BookOpen size={24} />
                            Completed Courses
                        </h2>

                        {transcript.courses.length === 0 ? (
                            <div className="text-center py-8 text-content-tertiary">
                                No completed courses found.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {transcript.courses.map((course, index) => (
                                    <div key={course.enrollmentId} className="border border-border rounded-lg p-6 print:break-inside-avoid">
                                        {/* Course Header */}
                                        <div className="mb-4 pb-4 border-b border-border-light">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="text-lg font-bold text-content">
                                                        {course.courseCode} - {course.courseTitle}
                                                    </h3>
                                                    <div className="flex items-center gap-4 mt-2 text-sm text-content-secondary">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={14} />
                                                            {course.semester}
                                                        </span>
                                                        <span>{course.credits} Credits</span>
                                                        {course.letterGrade && (
                                                            <span className="font-semibold text-content">
                                                                Grade: {course.letterGrade} ({course.courseGPA?.toFixed(2)})
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {course.coursePercentage !== null && (
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-brand-500">
                                                            {course.coursePercentage.toFixed(1)}%
                                                        </div>
                                                        <div className="text-xs text-content-secondary">Average</div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-xs text-content-tertiary mt-2">
                                                Enrolled: {new Date(course.enrollmentDate).toLocaleDateString()} | 
                                                Completed: {new Date(course.completedDate).toLocaleDateString()}
                                            </div>
                                        </div>

                                        {/* Assessments */}
                                        {course.assessments.length > 0 ? (
                                            <div>
                                                <h4 className="text-sm font-semibold text-content-secondary mb-3">
                                                    Assessment Grades:
                                                </h4>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="bg-surface-tertiary">
                                                                <th className="px-3 py-2 text-left border-b border-border text-xs font-semibold text-content">
                                                                    Assessment
                                                                </th>
                                                                <th className="px-3 py-2 text-left border-b border-border text-xs font-semibold text-content">
                                                                    Type
                                                                </th>
                                                                <th className="px-3 py-2 text-center border-b border-border text-xs font-semibold text-content">
                                                                    Score
                                                                </th>
                                                                <th className="px-3 py-2 text-center border-b border-border text-xs font-semibold text-content">
                                                                    Out of
                                                                </th>
                                                                <th className="px-3 py-2 text-center border-b border-border text-xs font-semibold text-content">
                                                                    Percentage
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {course.assessments.map((assessment) => (
                                                                <tr key={assessment.id} className="hover:bg-surface-hover">
                                                                    <td className="px-3 py-2 border-b border-border-light text-content">
                                                                        {assessment.title}
                                                                    </td>
                                                                    <td className="px-3 py-2 border-b border-border-light">
                                                                        <span className="inline-block px-2 py-1 bg-info-100 text-info-700 rounded text-xs font-semibold uppercase">
                                                                            {assessment.type}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-3 py-2 border-b border-border-light text-center font-semibold text-content">
                                                                        {assessment.score !== null ? assessment.score : '—'}
                                                                    </td>
                                                                    <td className="px-3 py-2 border-b border-border-light text-center text-content">
                                                                        {assessment.totalMarks}
                                                                    </td>
                                                                    <td className="px-3 py-2 border-b border-border-light text-center text-content">
                                                                        {assessment.percentage !== null
                                                                            ? `${assessment.percentage.toFixed(1)}%`
                                                                            : '—'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-content-tertiary italic">
                                                No assessment grades available for this course.
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t-2 border-border text-center text-sm text-content-tertiary">
                        <p>This is an official transcript generated by the University Management System.</p>
                        <p className="mt-2">
                            Verified by: {request.reviewedBy?.name || 'System'} on{' '}
                            {new Date(request.reviewedAt).toLocaleDateString()}
                        </p>
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

export default ViewTranscriptPage;

