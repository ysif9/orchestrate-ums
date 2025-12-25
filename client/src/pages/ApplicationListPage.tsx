import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService.js';
import ApplicationList from '../components/ApplicationList';
import { ArrowLeft, Users, GraduationCap, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button"


/**
 * ApplicationListPage - Page for viewing and managing all applications
 */
function ApplicationListPage() {
    const navigate = useNavigate();
    const user: any = authService.getCurrentUser();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const handleSelectApplication = (application: any) => {
        navigate(`/admin/applications/${application.id}/review`);
    };

    return (
        <div className="min-h-screen bg-muted/20">
            {/* Header */}
            <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-8 w-8 text-primary-foreground/90" />
                        <div>
                            <h1 className="text-lg font-bold leading-none">AIN SHAMS</h1>
                            <p className="text-[10px] opacity-80 font-normal tracking-wider">UNIVERSITY | FACULTY OF ENGINEERING</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-primary-foreground/10 rounded-full text-sm font-medium">
                            <span className="w-2 h-2 rounded-full bg-green-400"></span>
                            {user?.role === 'professor' ? 'Professor' : 'Staff Member'}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                            className="text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Page header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate('/admin/home')}
                            className="bg-background"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                                <Users className="w-8 h-8 text-primary" />
                                Admission Applications
                            </h1>
                            <p className="text-muted-foreground mt-1">Review and manage student admission applications</p>
                        </div>
                    </div>
                </div>

                {/* Application list */}
                <ApplicationList onSelectApplication={handleSelectApplication} />
            </div>
        </div>
    );
}

export default ApplicationListPage;
