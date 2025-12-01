import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { BookOpen, Plus, Users, BarChart3, FileText, ClipboardCheck } from 'lucide-react';

function AdminHome() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    // Quick action cards configuration - using accessible colors
    const quickActions = [
        {
            title: 'Manage Courses',
            description: 'View, edit, and delete existing courses',
            icon: BookOpen,
            path: '/admin/courses',
            color: '#0066cc' // brand-500
        },
        {
            title: 'Create Course',
            description: 'Add a new course to the system',
            icon: Plus,
            path: '/admin/courses?action=create',
            color: '#c9a227' // accent-500
        },
        {
            title: 'Create Assessment',
            description: 'Create quizzes, assignments, and exams',
            icon: FileText,
            path: '/admin/assessments/create',
            color: '#7c3aed' // course-core
        },
        {
            title: 'Grade Assessments',
            description: 'Review and grade student submissions',
            icon: ClipboardCheck,
            path: '/admin/gradebook',
            color: '#0891b2' // course-elective
        },
        {
            title: 'View All Users',
            description: 'Manage students, staff, and administrators',
            icon: Users,
            path: '/admin/users',
            color: '#16a34a' // success-600
        },
        {
            title: 'Enrollment Reports',
            description: 'View enrollment statistics and reports',
            icon: BarChart3,
            path: '/admin/reports',
            color: '#dc2626' // error-600
        }
    ];

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
                        <span className="text-sm font-medium text-brand-100">
                            {user?.role === 'admin' ? 'Administrator' : 'Staff Member'}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* WELCOME SECTION */}
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg p-8 mb-8 shadow-card">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 text-white">Welcome, {user?.name}</h1>
                        <p className="text-brand-100">Manage courses, students, and system settings.</p>
                    </div>
                </div>

                {/* QUICK ACTIONS GRID */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-brand-500 mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {quickActions.map((action, index) => {
                            const IconComponent = action.icon;
                            return (
                                <div
                                    key={index}
                                    className="bg-surface border-l-4 rounded-lg p-6 shadow-card hover:shadow-card-hover transition-all cursor-pointer flex items-start gap-4 group"
                                    onClick={() => navigate(action.path)}
                                    style={{ borderLeftColor: action.color }}
                                >
                                    <div
                                        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: action.color }}
                                    >
                                        <IconComponent size={24} color="white" strokeWidth={2} />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="text-lg font-semibold text-brand-500 mb-1">{action.title}</h3>
                                        <p className="text-sm text-content-secondary">{action.description}</p>
                                    </div>
                                    <div className="text-2xl text-border group-hover:text-brand-500 transition-colors">→</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* SYSTEM INFO SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-surface rounded-lg p-6 shadow-card">
                        <h3 className="text-lg font-semibold text-brand-500 mb-3">System Status</h3>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-success-500 rounded-full animate-pulse"></span>
                            <span className="text-content-secondary">All systems operational</span>
                        </div>
                    </div>
                    <div className="bg-surface rounded-lg p-6 shadow-card">
                        <h3 className="text-lg font-semibold text-brand-500 mb-3">Current Semester</h3>
                        <p className="text-xl font-bold text-content">Fall 2024</p>
                    </div>
                    <div className="bg-surface rounded-lg p-6 shadow-card">
                        <h3 className="text-lg font-semibold text-brand-500 mb-3">Your Role</h3>
                        <p className="inline-block px-4 py-2 bg-brand-500 text-content-inverse rounded-full text-sm font-bold uppercase">
                            {user?.role}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminHome;

