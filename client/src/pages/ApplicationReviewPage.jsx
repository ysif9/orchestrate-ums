import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authService } from '../services/authService.js';
import { applicationService } from '../services/applicationService.js';
import ApplicationViewer from '../components/ApplicationViewer.jsx';
import ReviewPanel from '../components/ReviewPanel.jsx';
import DecisionLetterModal from '../components/DecisionLetterModal.jsx';
import { ArrowLeft, FileText, Eye, RefreshCw } from 'lucide-react';

/**
 * ApplicationReviewPage - Main page for reviewing a single application
 * Combines ApplicationViewer and ReviewPanel side-by-side
 */
function ApplicationReviewPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const user = authService.getCurrentUser();

    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [generatingLetter, setGeneratingLetter] = useState(false);
    const [letterMessage, setLetterMessage] = useState('');
    const [letterModalOpen, setLetterModalOpen] = useState(false);
    const [generatedLetter, setGeneratedLetter] = useState(null);

    useEffect(() => {
        if (id) {
            fetchApplication();
        }
    }, [id]);

    const fetchApplication = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await applicationService.getApplication(id);
            setApplication(response.data);
        } catch (err) {
            setError('Failed to load application. Please try again.');
            console.error('Error fetching application:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReviewSubmitted = () => {
        // Refresh application data after review is submitted
        fetchApplication();
    };

    const handleGenerateLetter = async () => {
        if (!application) return;

        try {
            setGeneratingLetter(true);
            setLetterMessage('');
            const response = await applicationService.generateDecisionLetter(application.id);
            setLetterMessage('Decision letter generated successfully!');
            setGeneratedLetter(response.data);
            setLetterModalOpen(true);
        } catch (err) {
            setLetterMessage(err.response?.data?.message || 'Failed to generate letter.');
        } finally {
            setGeneratingLetter(false);
        }
    };

    const handleViewLetters = () => {
        setGeneratedLetter(null);
        setLetterModalOpen(true);
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const canGenerateLetter = application && ['accepted', 'rejected', 'waitlisted'].includes(application.status);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="loading-spinner"></div>
            </div>
        );
    }

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
                {/* Back button and actions */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate('/admin/applications')}
                        className="flex items-center gap-2 text-content-secondary hover:text-content transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Back to Applications
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchApplication}
                            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-surface-hover transition-colors"
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>

                        {canGenerateLetter && (
                            <button
                                onClick={handleViewLetters}
                                className="flex items-center gap-2 px-4 py-2 border border-indigo-300 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors"
                            >
                                <Eye size={16} />
                                View Letters
                            </button>
                        )}

                        {canGenerateLetter && (
                            <button
                                onClick={handleGenerateLetter}
                                disabled={generatingLetter}
                                className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                            >
                                {generatingLetter ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <FileText size={16} />
                                        Generate Decision Letter
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Letter generation message */}
                {letterMessage && (
                    <div className={`mb-6 p-4 rounded-lg text-sm ${letterMessage.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                        {letterMessage}
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
                )}

                {/* Main content - side by side layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Application Viewer */}
                    <div>
                        <ApplicationViewer application={application} />
                    </div>

                    {/* Right: Review Panel */}
                    <div>
                        <ReviewPanel application={application} onReviewSubmitted={handleReviewSubmitted} />
                    </div>
                </div>
            </div>

            {/* Decision Letter Modal */}
            <DecisionLetterModal
                isOpen={letterModalOpen}
                onClose={() => setLetterModalOpen(false)}
                applicationId={application?.id}
                generatedLetter={generatedLetter}
            />
        </div>
    );
}

export default ApplicationReviewPage;

