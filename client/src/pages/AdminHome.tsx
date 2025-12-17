import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService.js';
import { BookOpen, Plus, Users, BarChart3, FileText, ClipboardCheck, User, Calendar, Building, Wrench } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

function AdminHome() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const isStaff = user?.role === 'staff';

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
            title: 'Book Rooms',
            description: 'Reserve classrooms and labs for lectures',
            icon: Calendar,
            path: '/admin/room-booking',
            color: '#059669' // emerald-600
        },
        ...(!isStaff ? [
            {
                title: 'Report Maintenance',
                description: 'submit a room maintenance report',
                icon: Wrench,
                path: '/tickets',
                color: '#dc2626' // error-600
            }]
            : [])
        ,
        // Staff-only actions
        ...(isStaff ? [
            {
                title: 'Manage Rooms',
                description: 'Add, edit, and manage classrooms and labs',
                icon: Building,
                path: '/admin/rooms',
                color: '#7c3aed' // violet-600
            },
            {
                title: 'Review Transcript Requests',
                description: 'Review and approve student transcript requests',
                icon: FileText,
                path: '/admin/transcript-requests',
                color: '#9333ea' // purple-600
            },
            {
                title: 'Student Record Management',
                description: 'Search students and generate record summaries',
                icon: User,
                path: '/admin/student-records',
                color: '#ea580c' // orange-600
            },
            {
                title: 'Review Applications',
                description: 'Review and manage student applications',
                icon: Users,
                path: '/admin/applications',
                color: '#0066cc' // brand-500
            },
            {
                title: 'View Maintenance Tickets',
                description: 'Review and manage maintenance tickets and requests',
                icon: Wrench,
                path: '/admin/tickets',
                color: '#1D4ED8' // blue
            }
        ] : []),

    ];

    return (
        <div className="min-h-screen bg-background">
            {/* HEADER MATCHING THEME */}
            <nav className="bg-primary text-primary-foreground px-8 py-4 shadow-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-primary-foreground">
                        AIN SHAMS
                        <span className="block text-xs font-normal text-primary-foreground/80 tracking-wider mt-1">
                            UNIVERSITY | FACULTY OF ENGINEERING
                        </span>
                    </h1>
                    <div className="flex items-center gap-6">
                        <span className="text-sm font-medium text-primary-foreground/90">
                            {user?.role === 'professor' ? 'Professor' : 'Staff Member'}
                        </span>
                        <Button
                            onClick={handleLogout}
                            variant="secondary"
                            size="sm"
                            className="bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30 border-none"
                        >
                            Sign Out
                        </Button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* WELCOME SECTION */}
                <div className="bg-primary/95 text-primary-foreground rounded-lg p-8 mb-8 shadow-card">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 text-primary-foreground">Welcome, {user?.name}</h1>
                        <p className="text-primary-foreground/80">Manage courses, students, and system settings.</p>
                    </div>
                </div>

                {/* QUICK ACTIONS GRID */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-primary mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {quickActions.map((action, index) => {
                            const IconComponent = action.icon;
                            // Convert hex color to equivalent Tailwind class or style? 
                            // For simplicity, we keep the inline style but style the card wrapper with Shadcn
                            return (
                                <Card
                                    key={index}
                                    className="border-l-4 shadow-sm hover:shadow-lg transition-all cursor-pointer group"
                                    onClick={() => navigate(action.path)}
                                    style={{ borderLeftColor: action.color }}
                                >
                                    <CardContent className="p-6 flex items-start gap-4">
                                        <div
                                            className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: action.color }}
                                        >
                                            <IconComponent size={24} color="white" strokeWidth={2} />
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="text-lg font-semibold text-primary mb-1">{action.title}</h3>
                                            <p className="text-sm text-muted-foreground">{action.description}</p>
                                        </div>
                                        <div className="text-2xl text-muted-foreground group-hover:text-primary transition-colors">→</div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* SYSTEM INFO SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-primary mb-3">System Status</h3>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                                <span className="text-muted-foreground">All systems operational</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-primary mb-3">Current Semester</h3>
                            <p className="text-xl font-bold text-foreground">Fall 2024</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-primary mb-3">Your Role</h3>
                            <p className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold uppercase">
                                {user?.role}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default AdminHome;
