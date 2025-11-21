import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { authService } from '../services/authService';
import '../styles/StudentHome.css';

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

    const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';

    if (loading) return (
        <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your academic profile...</p>
        </div>
    );

    // Calculate total credits
    const totalCredits = enrollments.reduce((acc, curr) => acc + (curr.course?.credits || 0), 0);

    return (
        <div className="student-dashboard">
            {/* HEADER MATCHING THEME */}
            <nav className="navbar">
                <h1>
                    AIN SHAMS
                    <span className="uni-subtext">UNIVERSITY | FACULTY OF ENGINEERING</span>
                </h1>
                <div className="nav-links">
                    <span className="user-greeting">Welcome, {user?.name}</span>
                    <Link to="/catalog">Course Catalog</Link>
                    <button onClick={handleLogout} className="nav-logout-btn">Logout</button>
                </div>
            </nav>

            <div className="dashboard-container">
                {/* DASHBOARD SUMMARY SECTION */}
                <div className="welcome-banner">
                    <div className="banner-text">
                        <h2>My Enrolled Courses</h2>
                        <p className="semester-info">Current Semester: Fall 2024</p>
                    </div>
                    
                    <div className="quick-stats">
                        <div className="stat-item">
                            <span className="stat-value">{enrollments.length}</span>
                            <span className="stat-label">Active Courses</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{totalCredits}</span>
                            <span className="stat-label">Total Credits</span>
                        </div>
                        <button onClick={() => navigate('/catalog')} className="btn-primary">
                            + Register New Course
                        </button>
                        {/* Admin/Staff Assessment Management Buttons */}
                        {isAdminOrStaff && (
                            <>
                                <button
                                    onClick={() => navigate('/admin/assessments/create')}
                                    className="action-btn action-create-assessment"
                                >
                                    ✨ Create Assessment
                                </button>
                                <button
                                    onClick={() => navigate('/admin/gradebook')}
                                    className="action-btn action-grade-assessments"
                                >
                                    📝 Grade Assessments
                                </button>
                            </>
                        )}
                        {/* Student Grades View Button */}
                        {!isAdminOrStaff && (
                            <button
                                onClick={() => navigate('/my-grades')}
                                className="action-btn action-view-grades"
                            >
                                📊 View My Grades
                            </button>
                        )}
                    </div>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {/* ENROLLED COURSES GRID */}
                {enrollments.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📚</div>
                        <h3>No Active Enrollments</h3>
                        <p>You are not currently enrolled in any courses for this semester.</p>
                        <button onClick={() => navigate('/catalog')} className="btn-primary">
                            Browse Course Catalog
                        </button>
                    </div>
                ) : (
                    <div className="course-grid">
                        {enrollments.map((enrollment) => {
                            const course = enrollment.course;
                            if (!course) return null;

                            return (
                                <Link to={`/course/${course._id}`} key={enrollment._id} className="course-card-link">
                                    <div className="course-card">
                                        <div className="card-image-wrapper">
                                            <img
                                                src={course.image || "https://placehold.co/600x400"}
                                                alt={course.title}
                                                className="card-image"
                                            />
                                            <span className={`status-badge ${enrollment.status}`}>
                                                {enrollment.status}
                                            </span>
                                        </div>

                                        <div className="card-body">
                                            <div className="subject-tag">
                                                {course.subjectArea || "General"}
                                            </div>
                                            <h3 className="card-title">{course.title}</h3>
                                            <div className="card-meta">
                                                <span className="code">{course.code}</span>
                                                <span className="credits">{course.credits} Credits</span>
                                            </div>

                                            <div className="progress-bar-container">
                                                <div className="progress-text">Progress</div>
                                                <div className="progress-track">
                                                    <div
                                                        className="progress-fill"
                                                        style={{width: enrollment.status === 'completed' ? '100%' : '0%'}}
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