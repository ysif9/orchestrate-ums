import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { authService } from '../services/authService.js';
import { ClipboardCheck, BarChart3, BookOpen, Sparkles, FileText, Monitor } from 'lucide-react';

function StudentHome() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEnrollments = async () => {
            try {
                setLoading(true);
                // The backend middleware identifies the user via token
                // and returns ONLY their specific enrollments
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

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const isAdminOrStaff = user?.role === 'professor' || user?.role === 'staff';

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <div className="loading-spinner"></div>
            <p className="mt-4 text-content-secondary">Loading your academic profile...</p>
        </div>
    );

    // Calculate total credits
    const totalCredits = enrollments.reduce((acc, curr) => acc + (curr.course?.credits || 0), 0);

    return (
        <div className="min-h-screen">
            {/* HEADER MATCHING THEME */}
            <nav className="bg-indigo-600 text-white px-8 py-4 shadow-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">
                        AIN SHAMS
                        <span className="block text-xs font-normal text-brand-100 tracking-wider mt-1">
                            UNIVERSITY | FACULTY OF ENGINEERING
                        </span>
                    </h1>
                    <div className="flex items-center gap-6">
                        <span className="text-brand-100 text-sm">Welcome, {user?.name}</span>
                        <Link to="/catalog" className="text-white hover:text-accent-300 transition-colors font-medium">
                            Course Catalog
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="bg-transparent border border-brand-200 hover:bg-brand-400 hover:border-brand-100 text-white px-4 py-2 rounded transition-all font-medium"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* DASHBOARD SUMMARY SECTION */}
                <div className="bg-surface rounded-lg shadow-card p-8 mb-8">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-brand-500 mb-2">My Enrolled Courses</h2>
                        <p className="text-content-secondary">Current Semester: Fall 2024</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex flex-col items-center bg-surface-tertiary px-6 py-4 rounded-lg min-w-[120px]">
                            <span className="text-3xl font-bold text-brand-500">{enrollments.length}</span>
                            <span className="text-sm text-content-secondary mt-1">Active Courses</span>
                        </div>
                        <div className="flex flex-col items-center bg-surface-tertiary px-6 py-4 rounded-lg min-w-[120px]">
                            <span className="text-3xl font-bold text-brand-500">{totalCredits}</span>
                            <span className="text-sm text-content-secondary mt-1">Total Credits</span>
                        </div>
                        <button
                            onClick={() => navigate('/catalog')}
                            className="bg-brand-500 hover:bg-brand-600 text-content-inverse font-medium px-6 py-3 rounded-lg transition-colors shadow-button hover:shadow-button-hover"
                        >
                            + Register New Course
                        </button>
                        {/* Admin/Staff Assessment Management Buttons */}
                        {isAdminOrStaff && (
                            <>
                                <button
                                    onClick={() => navigate('/admin/assessments/create')}
                                    className="bg-course-core hover:bg-purple-700 text-content-inverse font-medium px-6 py-3 rounded-lg transition-colors flex items-center gap-2 shadow-button hover:shadow-button-hover"
                                >
                                    <Sparkles size={18} />
                                    Create Assessment
                                </button>
                                <button
                                    onClick={() => navigate('/admin/gradebook')}
                                    className="bg-success-600 hover:bg-success-700 text-content-inverse font-medium px-6 py-3 rounded-lg transition-colors flex items-center gap-2 shadow-button hover:shadow-button-hover"
                                >
                                    <ClipboardCheck size={18} />
                                    Grade Assessments
                                </button>
                            </>
                        )}
                        {/* Student Grades View Button */}
                        {!isAdminOrStaff && (
                            <>
                                <button
                                    onClick={() => navigate('/my-grades')}
                                    className="bg-info-600 hover:bg-info-700 text-content-inverse font-medium px-6 py-3 rounded-lg transition-colors flex items-center gap-2 shadow-button hover:shadow-button-hover"
                                >
                                    <BarChart3 size={18} />
                                    View My Grades
                                </button>
                                <button
                                    onClick={() => navigate('/transcript-requests')}
                                    className="bg-accent-600 hover:bg-accent-700 text-content-inverse font-medium px-6 py-3 rounded-lg transition-colors flex items-center gap-2 shadow-button hover:shadow-button-hover"
                                >
                                    <FileText size={18} />
                                    Request Transcript
                                </button>
                                <button
                                    onClick={() => navigate('/lab-stations')}
                                    className="bg-purple-600 hover:bg-purple-700 text-content-inverse font-medium px-6 py-3 rounded-lg transition-colors flex items-center gap-2 shadow-button hover:shadow-button-hover"
                                >
                                    <Monitor size={18} />
                                    Reserve Lab Station
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {error && <div className="bg-error-100 text-error-700 px-4 py-3 rounded-lg mb-6 border border-error-200">{error}</div>}

                {/* ENROLLED COURSES GRID */}
                {enrollments.length === 0 ? (
                    <div className="text-center py-16 bg-surface rounded-lg border-2 border-dashed border-border">
                        <div className="text-content-tertiary mb-4 flex justify-center">
                            <BookOpen size={64} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-semibold text-content mb-2">No Active Enrollments</h3>
                        <p className="text-content-tertiary mb-6">You are not currently enrolled in any courses for this semester.</p>
                        <button
                            onClick={() => navigate('/catalog')}
                            className="bg-brand-500 hover:bg-brand-600 text-content-inverse font-medium px-6 py-3 rounded-lg transition-colors shadow-button hover:shadow-button-hover"
                        >
                            Browse Course Catalog
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {enrollments.map((enrollment) => {
                            const course = enrollment.course;
                            if (!course) return null;

                            return (
                                <Link to={`/course/${course.id}`} key={enrollment.id} className="no-underline text-inherit">
                                    <div className="bg-surface border border-border rounded-lg overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover h-full flex flex-col relative">
                                        <div className="relative">
                                            <img
                                                src={course.image || "https://placehold.co/600x400"}
                                                alt={course.title}
                                                className="w-full h-48 object-cover"
                                            />
                                            <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold uppercase ${enrollment.status === 'completed' ? 'bg-success-100 text-success-700' :
                                                enrollment.status === 'active' ? 'bg-info-100 text-info-700' :
                                                    'bg-surface-tertiary text-content-secondary'
                                                }`}>
                                                {enrollment.status}
                                            </span>
                                        </div>

                                        <div className="p-6 flex flex-col flex-grow">
                                            <div className="text-xs font-bold text-accent-600 uppercase tracking-wider mb-2">
                                                {course.subjectArea || "General"}
                                            </div>
                                            <h3 className="text-lg font-bold text-brand-500 mb-3 line-clamp-2">{course.title}</h3>
                                            <div className="flex justify-between items-center text-sm text-content-secondary mb-4">
                                                <span className="font-mono font-semibold">{course.code}</span>
                                                <span className="font-medium">{course.credits} Credits</span>
                                            </div>

                                            <div className="mt-auto">
                                                <div className="text-xs text-content-secondary mb-2">Progress</div>
                                                <div className="w-full bg-surface-tertiary rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-brand-500 h-full transition-all duration-300"
                                                        style={{ width: enrollment.status === 'completed' ? '100%' : '0%' }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default StudentHome;