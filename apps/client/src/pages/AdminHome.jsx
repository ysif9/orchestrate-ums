import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { BookOpen, Plus, Users, BarChart3, FileText, ClipboardCheck } from 'lucide-react';
import '../styles/AdminHome.css';

function AdminHome() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    // Quick action cards configuration
    const quickActions = [
        {
            title: 'Manage Courses',
            description: 'View, edit, and delete existing courses',
            icon: BookOpen,
            path: '/admin/courses',
            color: '#003366'
        },
        {
            title: 'Create Course',
            description: 'Add a new course to the system',
            icon: Plus,
            path: '/admin/courses?action=create',
            color: '#D4AF37'
        },
        {
            title: 'Create Assessment',
            description: 'Create quizzes, assignments, and exams',
            icon: FileText,
            path: '/admin/assessments/create',
            color: '#8b5cf6'
        },
        {
            title: 'Grade Assessments',
            description: 'Review and grade student submissions',
            icon: ClipboardCheck,
            path: '/admin/gradebook',
            color: '#0891b2'
        },
        {
            title: 'View All Users',
            description: 'Manage students, staff, and administrators',
            icon: Users,
            path: '/admin/users',
            color: '#16a34a'
        },
        {
            title: 'Enrollment Reports',
            description: 'View enrollment statistics and reports',
            icon: BarChart3,
            path: '/admin/reports',
            color: '#dc2626'
        }
    ];

    return (
        <div className="admin-dashboard">
            {/* HEADER MATCHING THEME */}
            <nav className="navbar">
                <h1>
                    AIN SHAMS
                    <span className="uni-subtext">UNIVERSITY | FACULTY OF ENGINEERING</span>
                </h1>
                <div className="nav-links">
                    <span className="user-greeting">
                        {user?.name} ({user?.role})
                    </span>
                    <button onClick={handleLogout} className="nav-logout-btn">Logout</button>
                </div>
            </nav>

            <div className="admin-container">
                {/* WELCOME SECTION */}
                <div className="welcome-section">
                    <div className="welcome-content">
                        <h1 className="welcome-title">Welcome, {user?.name}</h1>
                        <p className="welcome-subtitle">
                            {user?.role === 'admin' ? 'Administrator' : 'Staff Member'} Dashboard
                        </p>
                        <p className="welcome-description">
                            Manage courses, users, and system settings from your centralized control panel.
                        </p>
                    </div>
                </div>

                {/* QUICK ACTIONS GRID */}
                <div className="quick-actions-section">
                    <h2 className="section-title">Quick Actions</h2>
                    <div className="actions-grid">
                        {quickActions.map((action, index) => {
                            const IconComponent = action.icon;
                            return (
                                <div
                                    key={index}
                                    className="action-card"
                                    onClick={() => navigate(action.path)}
                                    style={{ borderLeftColor: action.color }}
                                >
                                    <div className="action-icon" style={{ backgroundColor: action.color }}>
                                        <IconComponent size={24} color="white" strokeWidth={2} />
                                    </div>
                                    <div className="action-content">
                                        <h3 className="action-title">{action.title}</h3>
                                        <p className="action-description">{action.description}</p>
                                    </div>
                                    <div className="action-arrow">→</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* SYSTEM INFO SECTION */}
                <div className="system-info-section">
                    <div className="info-card">
                        <h3>System Status</h3>
                        <div className="status-indicator">
                            <span className="status-dot active"></span>
                            <span>All systems operational</span>
                        </div>
                    </div>
                    <div className="info-card">
                        <h3>Current Semester</h3>
                        <p className="semester-text">Fall 2024</p>
                    </div>
                    <div className="info-card">
                        <h3>Your Role</h3>
                        <p className="role-badge">{user?.role?.toUpperCase()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminHome;

