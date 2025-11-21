import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import '../styles/StudentHome.css';

/**
 * Temporary Home Page Component
 * Displays a simple welcome message and logout functionality
 * This serves as a placeholder until a comprehensive dashboard is implemented
 */
function StudentHome() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';

    return (
        <div className="student-home-container">
            <div className="student-home-card">
                <div className="welcome-section">
                    <h1>Welcome to Orchestrate UMS</h1>
                    <p className="welcome-message">
                        You are successfully logged in as <strong>{user?.name}</strong>
                    </p>

                    {/* User Role Display */}
                    <div className="role-badge-container">
                        <span className={`role-badge role-${user?.role}`}>
                            {user?.role === 'admin' && '👤 Administrator'}
                            {user?.role === 'staff' && '👤 Staff Member'}
                            {user?.role === 'student' && '🎓 Student'}
                        </span>
                    </div>

                    <p className="temp-notice">
                        This is a temporary home page. A comprehensive dashboard will be available soon.
                    </p>
                </div>

                {/* Admin/Staff Quick Actions */}
                {isAdminOrStaff && (
                    <div className="quick-actions">
                        <h3>Quick Actions</h3>
                        <button
                            onClick={() => navigate('/admin/courses')}
                            className="action-btn"
                        >
                            📚 Manage Courses
                        </button>
                        {/* NEW BUTTON ADDED HERE */}
                        <button
                            onClick={() => navigate('/admin/assessments/create')}
                            className="action-btn action-create-assessment"
                        >
                            ✨ Create Assessment
                        </button>
                        {/* NEW BUTTON ADDED HERE */}
                        <button
                            onClick={() => navigate('/admin/gradebook')} // NEW ROUTE
                            className="action-btn action-grade-assessments" // Added class for distinct styling
                        >
                            📝 Grade Assessments
                        </button>
                            
                    </div>
                )}

                <button onClick={handleLogout} className="logout-btn">
                    Logout
                </button>
            </div>
        </div>
    );
}

export default StudentHome;

