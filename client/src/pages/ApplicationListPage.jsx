import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService.js';
import ApplicationList from '../components/ApplicationList.jsx';
import { ArrowLeft, Users } from 'lucide-react';

/**
 * ApplicationListPage - Page for viewing and managing all applications
 */
function ApplicationListPage() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const handleSelectApplication = (application) => {
        navigate(`/admin/applications/${application.id}/review`);
    };

    return (
        <div className="min-h-screen">
            {/* Header */}
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
                            {user?.role === 'professor' ? 'Professor' : 'Staff Member'}
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
                {/* Page header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/admin/home')}
                        className="flex items-center gap-2 text-content-secondary hover:text-content transition-colors mb-4"
                    >
                        <ArrowLeft size={20} />
                        Back to Dashboard
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-brand-500 rounded-lg flex items-center justify-center">
                            <Users size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-content">Admission Applications</h1>
                            <p className="text-content-secondary">Review and manage student applications</p>
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

