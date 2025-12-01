import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { authService } from '../services/authService';
import { AlertTriangle, Lock } from 'lucide-react';

/**
 * Catalog Course Details Page
 * Dedicated course details view for the course catalog
 * Different from the enrollment course details page
 */
function CatalogCourseDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';

    const [course, setCourse] = useState(null);
    const [completedCourseIds, setCompletedCourseIds] = useState([]);
    const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
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
                    .filter(enr => enr.status === 'completed')
                    .map(enr => enr.course._id);
                const enrolled = enrollRes.data
                    .filter(enr => enr.status === 'enrolled')
                    .map(enr => enr.course._id);
                    
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

    // Check if prerequisites are met
    const arePrerequisitesMet = () => {
        if (!course || !course.prerequisites || course.prerequisites.length === 0) {
            return true;
        }
        return course.prerequisites.every(prereq => 
            completedCourseIds.includes(prereq._id)
        );
    };

    // Check if already enrolled
    const isAlreadyEnrolled = () => {
        return enrolledCourseIds.includes(id) || completedCourseIds.includes(id);
    };

    // Handle enrollment
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
        } catch (error) {
            setEnrollmentError(
                error.response?.data?.message || 
                'Failed to enroll in course. Please try again.'
            );
        } finally {
            setEnrolling(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background">
                <div className="loading-spinner"></div>
                <p className="mt-4 text-content-secondary">Loading course details...</p>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background">
                <h2 className="text-2xl font-bold text-content mb-4">Course not found</h2>
                <Link
                    to="/catalog"
                    className="bg-brand-500 hover:bg-brand-600 text-content-inverse px-6 py-3 rounded-lg transition-all no-underline font-medium"
                >
                    Back to Catalog
                </Link>
            </div>
        );
    }

    const prerequisitesMet = arePrerequisitesMet();
    const alreadyEnrolled = isAlreadyEnrolled();
    const hasPrerequisites = course.prerequisites && course.prerequisites.length > 0;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="bg-brand-500 text-content-inverse px-8 py-6 shadow-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold m-0 text-content-inverse">Course Details</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-brand-100 text-sm">Welcome, {user?.name}</span>
                        <button
                            onClick={() => navigate('/catalog')}
                            className="bg-transparent border border-brand-200 hover:bg-brand-400 hover:border-brand-100 text-content-inverse px-4 py-2 rounded text-sm transition-all font-medium"
                        >
                            Back to Catalog
                        </button>
                        <button
                            onClick={() => navigate(isAdminOrStaff ? '/admin/home' : '/home')}
                            className="bg-transparent border border-brand-200 hover:bg-brand-400 hover:border-brand-100 text-content-inverse px-4 py-2 rounded text-sm transition-all font-medium"
                        >
                            Home
                        </button>
                        <button
                            onClick={handleLogout}
                            className="bg-error-600 hover:bg-error-700 text-content-inverse px-4 py-2 rounded text-sm transition-all font-medium"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Course Hero Section */}
            <div className="bg-gradient-to-r from-brand-500 to-brand-600 text-content-inverse px-8 py-12">
                <div className="max-w-7xl mx-auto">
                    <div className="inline-block bg-white/20 text-content-inverse px-4 py-2 rounded-full text-sm font-bold mb-4">{course.code}</div>
                    <h1 className="text-4xl font-bold mb-4 text-content-inverse">{course.title}</h1>
                    <p className="text-xl text-brand-100 mb-6">{course.description}</p>

                    <div className="flex flex-wrap gap-4">
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                            course.type === 'Core'
                                ? 'bg-course-core-bg text-course-core'
                                : 'bg-course-elective-bg text-course-elective'
                        }`}>
                            {course.type}
                        </span>
                        <span className="bg-white/20 text-content-inverse px-4 py-2 rounded-full text-sm">
                            <strong>Level:</strong> {course.difficulty}
                        </span>
                        <span className="bg-white/20 text-content-inverse px-4 py-2 rounded-full text-sm">
                            <strong>Credits:</strong> {course.credits} CH
                        </span>
                        {course.professor && (
                            <span className="bg-white/20 text-content-inverse px-4 py-2 rounded-full text-sm">
                                <strong>Professor:</strong> {course.professor}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* Enrollment Status Messages */}
                {enrollmentSuccess && (
                    <div className="bg-success-100 text-success-700 px-6 py-4 rounded-lg mb-6 border border-success-200">
                        ✓ Successfully enrolled in {course.title}! Redirecting to home...
                    </div>
                )}

                {enrollmentError && (
                    <div className="bg-error-100 text-error-700 px-6 py-4 rounded-lg mb-6 border border-error-200">
                        ✗ {enrollmentError}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Course Information */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Prerequisites Section */}
                        {hasPrerequisites && (
                            <section className="bg-surface rounded-lg shadow-card p-6">
                                <h2 className="text-xl font-bold text-content mb-4">Prerequisites</h2>
                                <div className="space-y-3">
                                    {course.prerequisites.map(prereq => {
                                        const isCompleted = completedCourseIds.includes(prereq._id);
                                        return (
                                            <div
                                                key={prereq._id}
                                                className={`flex justify-between items-center p-4 rounded-lg border ${
                                                    isCompleted
                                                        ? 'bg-success-50 border-success-200'
                                                        : 'bg-error-50 border-error-200'
                                                }`}
                                            >
                                                <div>
                                                    <span className="font-bold text-brand-500 mr-2">{prereq.code}</span>
                                                    <span className="text-content-secondary">{prereq.title}</span>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    isCompleted
                                                        ? 'bg-success-100 text-success-700'
                                                        : 'bg-error-100 text-error-700'
                                                }`}>
                                                    {isCompleted ? '✓ Completed' : '✗ Not Completed'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                {!prerequisitesMet && (
                                    <p className="mt-4 flex items-center gap-2 text-warning-700 bg-warning-50 px-4 py-3 rounded-lg border border-warning-200">
                                        <AlertTriangle size={16} />
                                        You must complete all prerequisite courses before enrolling.
                                    </p>
                                )}
                            </section>
                        )}

                        {/* Course Overview */}
                        <section className="bg-surface rounded-lg shadow-card p-6">
                            <h2 className="text-xl font-bold text-content mb-4">Course Overview</h2>
                            <p className="text-content-secondary mb-3">{course.description}</p>
                            {course.subjectArea && (
                                <p className="text-content-secondary"><strong>Subject Area:</strong> {course.subjectArea}</p>
                            )}
                        </section>

                        {/* Learning Outcomes */}
                        <section className="bg-surface rounded-lg shadow-card p-6">
                            <h2 className="text-xl font-bold text-content mb-4">What You'll Learn</h2>
                            <ul className="space-y-2 list-disc list-inside text-content-secondary">
                                <li>Master fundamental concepts in {course.subjectArea || course.title}</li>
                                <li>Apply theoretical knowledge to practical scenarios</li>
                                <li>Develop critical thinking and problem-solving skills</li>
                                <li>Gain hands-on experience through projects and assignments</li>
                            </ul>
                        </section>

                        {/* Syllabus */}
                        {course.lessons && course.lessons.length > 0 && (
                            <section className="bg-surface rounded-lg shadow-card p-6">
                                <h2 className="text-xl font-bold text-content mb-4">Course Syllabus</h2>
                                <div className="space-y-3">
                                    {course.lessons.map((lesson, index) => (
                                        <div key={index} className="flex gap-4 p-4 bg-surface-tertiary rounded-lg">
                                            <div className="bg-brand-500 text-content-inverse px-3 py-1 rounded-full text-sm font-bold h-fit">
                                                Week {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-content">{lesson.title}</div>
                                                {lesson.duration && (
                                                    <div className="text-sm text-content-tertiary mt-1">{lesson.duration}</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Grading Information */}
                        {(course.totalMarks || course.passingMarks) && (
                            <section className="bg-surface rounded-lg shadow-card p-6">
                                <h2 className="text-xl font-bold text-content mb-4">Grading Information</h2>
                                <div className="space-y-2">
                                    {course.totalMarks && (
                                        <p className="text-content-secondary"><strong>Total Marks:</strong> {course.totalMarks}</p>
                                    )}
                                    {course.passingMarks && (
                                        <p className="text-content-secondary"><strong>Passing Marks:</strong> {course.passingMarks}</p>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right Column - Enrollment Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-surface rounded-lg shadow-card p-6 sticky top-8">
                            <h3 className="text-lg font-bold text-content mb-4">Enrollment</h3>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between">
                                    <span className="text-content-tertiary">Course Code</span>
                                    <span className="font-semibold text-content">{course.code}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-content-tertiary">Credits</span>
                                    <span className="font-semibold text-content">{course.credits} CH</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-content-tertiary">Level</span>
                                    <span className="font-semibold text-content">{course.difficulty}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-content-tertiary">Type</span>
                                    <span className="font-semibold text-content">{course.type}</span>
                                </div>
                                {course.semester && (
                                    <div className="flex justify-between">
                                        <span className="text-content-tertiary">Semester</span>
                                        <span className="font-semibold text-content">{course.semester}</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                {alreadyEnrolled ? (
                                    <button
                                        className="w-full bg-success-100 text-success-700 px-6 py-3 rounded-lg font-semibold cursor-not-allowed"
                                        disabled
                                    >
                                        ✓ Already Enrolled
                                    </button>
                                ) : !prerequisitesMet ? (
                                    <button
                                        className="w-full bg-surface-tertiary text-content-secondary px-6 py-3 rounded-lg font-semibold cursor-not-allowed flex items-center justify-center gap-2"
                                        disabled
                                    >
                                        <Lock size={16} />
                                        Prerequisites Required
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleEnroll}
                                        className="w-full bg-brand-500 hover:bg-brand-600 text-content-inverse px-6 py-3 rounded-lg font-semibold transition-all shadow-button hover:shadow-button-hover disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={enrolling}
                                    >
                                        {enrolling ? 'Enrolling...' : 'Enroll Now'}
                                    </button>
                                )}
                            </div>

                            {hasPrerequisites && (
                                <div className="mt-6 pt-6 border-t border-border">
                                    <h4 className="text-sm font-bold text-content mb-3">Prerequisites</h4>
                                    <ul className="space-y-2">
                                        {course.prerequisites.map(prereq => (
                                            <li
                                                key={prereq._id}
                                                className={`text-sm ${
                                                    completedCourseIds.includes(prereq._id)
                                                        ? 'text-success-700 font-semibold'
                                                        : 'text-content-secondary'
                                                }`}
                                            >
                                                {prereq.code}
                                                {completedCourseIds.includes(prereq._id) && ' ✓'}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CatalogCourseDetails;

