
import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { authService } from '@/services/authService';
import {
    LayoutDashboard,
    BookOpen,
    GraduationCap,
    FileText,
    Monitor,
    AlertCircle,
    LogOut,
    Menu,
    X,
    User
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StudentLayoutProps {
    children?: React.ReactNode;
}

const StudentLayout = ({ children }: StudentLayoutProps) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const user: any = authService.getCurrentUser();

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/home', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/my-grades', label: 'My Grades', icon: GraduationCap },
        { path: '/catalog', label: 'Course Catalog', icon: BookOpen },
        { path: '/transcript-requests', label: 'Transcript Requests', icon: FileText },
        { path: '/lab-stations', label: 'Lab Stations', icon: Monitor },
        { path: '/tickets', label: 'Support Tickets', icon: AlertCircle },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-xl font-bold text-primary">
                        AIN SHAMS
                        <span className="block text-[10px] font-normal text-muted-foreground tracking-wider mt-1">
                            UNIVERSITY | ENGINEERING
                        </span>
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                )}
                            >
                                <item.icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <User size={16} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Student'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={handleLogout}
                    >
                        <LogOut size={18} className="mr-2" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center sticky top-0 z-20">
                    <span className="font-bold text-primary">AIN SHAMS UNIV.</span>
                    <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </Button>
                </header>

                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div className="md:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setIsSidebarOpen(false)} />
                )}

                {/* Mobile Sidebar */}
                <aside className={cn(
                    "md:hidden fixed inset-y-0 left-0 w-64 bg-white z-40 transform transition-transform duration-200 ease-in-out border-r border-gray-200 flex flex-col",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <div className="p-6 border-b border-gray-100">
                        <h1 className="text-xl font-bold text-primary">Menu</h1>
                    </div>
                    <nav className="flex-1 p-4 space-y-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                                    location.pathname === item.path
                                        ? "bg-primary/10 text-primary"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                )}
                            >
                                <item.icon size={18} />
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                    <div className="p-4 border-t border-gray-100">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={handleLogout}
                        >
                            <LogOut size={18} className="mr-2" />
                            Logout
                        </Button>
                    </div>
                </aside>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <div className="max-w-6xl mx-auto">
                        {children || <Outlet />}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default StudentLayout;
