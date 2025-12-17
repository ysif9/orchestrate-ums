import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authService } from '../services/authService.js';
import { applicationService } from '../services/applicationService.js';
import ApplicationViewer from '../components/ApplicationViewer.js'; // Assuming this imports the .tsx but resolving via .js is common in these setups, check imports
// Actually we should import from the component name, assuming resolution works.
// Since we are in TSX now, let's use proper imports if possible, or relative paths.
import ApplicationViewerComponent from '../components/ApplicationViewer';
import ReviewPanel from '../components/ReviewPanel';
import DecisionLetterModal from '../components/DecisionLetterModal';
import { ArrowLeft, FileText, Eye, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button"

/**
 * ApplicationReviewPage - Main page for reviewing a single application
 * Combines ApplicationViewer and ReviewPanel side-by-side
 */
function ApplicationReviewPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const user = authService.getCurrentUser();

    const [application, setApplication] = useState<any>(null);
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
        } catch (err: any) {
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
        <div className="min-h-screen bg-background">
            {/* Header */}
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
                {/* Back button and actions */}
                <div className="flex items-center justify-between mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/admin/applications')}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft size={20} />
                        Back to Applications
                    </Button>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={fetchApplication}
                            variant="outline"
                            className="gap-2"
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </Button>

                        {canGenerateLetter && (
                            <Button
                                onClick={handleViewLetters}
                                variant="outline"
                                className="gap-2 text-primary border-primary hover:bg-primary/10"
                            >
                                <Eye size={16} />
                                View Letters
                            </Button>
                        )}

                        {canGenerateLetter && (
                            <Button
                                onClick={handleGenerateLetter}
                                disabled={generatingLetter}
                                className="gap-2"
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
                            </Button>
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
                    <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>
                )}

                {/* Main content - side by side layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Application Viewer */}
                    <div>
                        <ApplicationViewerComponent application={application} />
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
