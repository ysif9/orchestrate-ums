import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { authService } from '../services/authService';
import '../styles/CatalogCourseDetails.css';

/**
 * Catalog Course Details Page
 * Dedicated course details view for the course catalog
 * Different from the enrollment course details page
 */
function CatalogCourseDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    
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
                navigate('/home');
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
            <div className="catalog-details-loading">
                <div className="loading-spinner"></div>
                <p>Loading course details...</p>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="catalog-details-error">
                <h2>Course not found</h2>
                <Link to="/catalog" className="btn-primary">Back to Catalog</Link>
            </div>
        );
    }

    const prerequisitesMet = arePrerequisitesMet();
    const alreadyEnrolled = isAlreadyEnrolled();
    const hasPrerequisites = course.prerequisites && course.prerequisites.length > 0;

    return (
        <div className="catalog-details-container">
            {/* Header */}
            <header className="catalog-details-header">
                <div className="header-content">
                    <h1>Course Details</h1>
                </div>
                <div className="header-actions">
                    <span className="user-info">Welcome, {user?.name}</span>
                    <button onClick={() => navigate('/catalog')} className="btn-secondary">
                        Back to Catalog
                    </button>
                    <button onClick={() => navigate('/home')} className="btn-secondary">
                        Home
                    </button>
                    <button onClick={handleLogout} className="btn-logout">
                        Logout
                    </button>
                </div>
            </header>

            {/* Course Hero Section */}
            <div className="course-hero">
                <div className="course-hero-content">
                    <div className="course-code-badge">{course.code}</div>
                    <h1 className="course-hero-title">{course.title}</h1>
                    <p className="course-hero-description">{course.description}</p>

                    <div className="course-meta">
                        <span className={`meta-badge badge-${course.type.toLowerCase()}`}>
                            {course.type}
                        </span>
                        <span className="meta-item">
                            <strong>Level:</strong> {course.difficulty}
                        </span>
                        <span className="meta-item">
                            <strong>Credits:</strong> {course.credits} CH
                        </span>
                        {course.professor && (
                            <span className="meta-item">
                                <strong>Professor:</strong> {course.professor}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="catalog-details-content">
                {/* Enrollment Status Messages */}
                {enrollmentSuccess && (
                    <div className="alert alert-success">
                        ✓ Successfully enrolled in {course.title}! Redirecting to home...
                    </div>
                )}

                {enrollmentError && (
                    <div className="alert alert-error">
                        ✗ {enrollmentError}
                    </div>
                )}

                <div className="content-grid">
                    {/* Left Column - Course Information */}
                    <div className="content-main">
                        {/* Prerequisites Section */}
                        {hasPrerequisites && (
                            <section className="details-section">
                                <h2>Prerequisites</h2>
                                <div className="prerequisites-list">
                                    {course.prerequisites.map(prereq => {
                                        const isCompleted = completedCourseIds.includes(prereq._id);
                                        return (
                                            <div
                                                key={prereq._id}
                                                className={`prerequisite-item ${isCompleted ? 'completed' : 'incomplete'}`}
                                            >
                                                <div className="prereq-info">
                                                    <span className="prereq-code">{prereq.code}</span>
                                                    <span className="prereq-title">{prereq.title}</span>
                                                </div>
                                                <span className={`prereq-status ${isCompleted ? 'status-completed' : 'status-incomplete'}`}>
                                                    {isCompleted ? '✓ Completed' : '✗ Not Completed'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                {!prerequisitesMet && (
                                    <p className="prerequisites-warning">
                                        ⚠️ You must complete all prerequisite courses before enrolling.
                                    </p>
                                )}
                            </section>
                        )}

                        {/* Course Overview */}
                        <section className="details-section">
                            <h2>Course Overview</h2>
                            <p>{course.description}</p>
                            {course.subjectArea && (
                                <p><strong>Subject Area:</strong> {course.subjectArea}</p>
                            )}
                        </section>

                        {/* Learning Outcomes */}
                        <section className="details-section">
                            <h2>What You'll Learn</h2>
                            <ul className="learning-outcomes">
                                <li>Master fundamental concepts in {course.subjectArea || course.title}</li>
                                <li>Apply theoretical knowledge to practical scenarios</li>
                                <li>Develop critical thinking and problem-solving skills</li>
                                <li>Gain hands-on experience through projects and assignments</li>
                            </ul>
                        </section>

                        {/* Syllabus */}
                        {course.lessons && course.lessons.length > 0 && (
                            <section className="details-section">
                                <h2>Course Syllabus</h2>
                                <div className="syllabus-list">
                                    {course.lessons.map((lesson, index) => (
                                        <div key={index} className="syllabus-item">
                                            <div className="syllabus-week">Week {index + 1}</div>
                                            <div className="syllabus-content">
                                                <div className="syllabus-title">{lesson.title}</div>
                                                {lesson.duration && (
                                                    <div className="syllabus-duration">{lesson.duration}</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Grading Information */}
                        {(course.totalMarks || course.passingMarks) && (
                            <section className="details-section">
                                <h2>Grading Information</h2>
                                <div className="grading-info">
                                    {course.totalMarks && (
                                        <p><strong>Total Marks:</strong> {course.totalMarks}</p>
                                    )}
                                    {course.passingMarks && (
                                        <p><strong>Passing Marks:</strong> {course.passingMarks}</p>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right Column - Enrollment Card */}
                    <div className="content-sidebar">
                        <div className="enrollment-card">
                            <h3>Enrollment</h3>

                            <div className="enrollment-details">
                                <div className="detail-row">
                                    <span className="detail-label">Course Code</span>
                                    <span className="detail-value">{course.code}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Credits</span>
                                    <span className="detail-value">{course.credits} CH</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Level</span>
                                    <span className="detail-value">{course.difficulty}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Type</span>
                                    <span className="detail-value">{course.type}</span>
                                </div>
                                {course.semester && (
                                    <div className="detail-row">
                                        <span className="detail-label">Semester</span>
                                        <span className="detail-value">{course.semester}</span>
                                    </div>
                                )}
                            </div>

                            <div className="enrollment-action">
                                {alreadyEnrolled ? (
                                    <button className="btn-enrolled" disabled>
                                        ✓ Already Enrolled
                                    </button>
                                ) : !prerequisitesMet ? (
                                    <button className="btn-disabled" disabled>
                                        🔒 Prerequisites Required
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleEnroll}
                                        className="btn-enroll"
                                        disabled={enrolling}
                                    >
                                        {enrolling ? 'Enrolling...' : 'Enroll Now'}
                                    </button>
                                )}
                            </div>

                            {hasPrerequisites && (
                                <div className="prerequisites-summary">
                                    <h4>Prerequisites</h4>
                                    <ul>
                                        {course.prerequisites.map(prereq => (
                                            <li key={prereq._id} className={completedCourseIds.includes(prereq._id) ? 'completed' : ''}>
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

