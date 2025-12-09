import { useParams, Link } from 'react-router-dom';
import {
    CheckCircle2,
    Mail,
    Clock,
    ArrowRight,
    Home,
    FileText
} from 'lucide-react';

/**
 * ApplicationConfirmationPage - Confirmation page after successful application submission
 */
function ApplicationConfirmationPage() {
    const { id } = useParams();

    return (
        <div className="min-h-screen">
            {/* Header */}
            <nav className="bg-gradient-to-r from-brand-600 to-brand-700 text-white px-8 py-4 shadow-lg">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">
                        AIN SHAMS
                        <span className="block text-xs font-normal text-brand-100 tracking-wider mt-1">
                            UNIVERSITY | FACULTY OF ENGINEERING
                        </span>
                    </h1>
                    <Link
                        to="/login"
                        className="text-white/90 hover:text-white text-sm font-medium transition-colors"
                    >
                        Sign In
                    </Link>
                </div>
            </nav>

            <div className="max-w-2xl mx-auto px-8 py-16">
                {/* Success Animation */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-success-100 rounded-full mb-6 animate-pulse">
                        <CheckCircle2 size={48} className="text-success-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-content mb-3">
                        Application Submitted!
                    </h1>
                    <p className="text-content-secondary text-lg">
                        Thank you for applying to Ain Shams University
                    </p>
                </div>

                {/* Application Reference */}
                <div className="bg-surface rounded-xl shadow-card p-8 border border-border mb-8">
                    <div className="text-center mb-6">
                        <span className="text-content-secondary text-sm">Application Reference Number</span>
                        <div className="text-3xl font-bold text-brand-600 mt-1">
                            APP-{id?.toString().padStart(6, '0')}
                        </div>
                    </div>

                    <div className="bg-info-50 text-info-700 px-4 py-3 rounded-lg text-sm border border-info-100 flex items-start gap-3">
                        <Mail size={20} className="flex-shrink-0 mt-0.5" />
                        <div>
                            <span className="font-medium">Confirmation Email Sent</span>
                            <p className="mt-1 text-info-600">
                                A confirmation email has been sent to your registered email address. Please keep this for your records.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Next Steps */}
                <div className="bg-surface rounded-xl shadow-card p-8 border border-border mb-8">
                    <h2 className="text-xl font-bold text-content mb-6 flex items-center gap-2">
                        <Clock size={20} className="text-brand-500" />
                        What Happens Next?
                    </h2>

                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-brand-600 font-bold text-sm">1</span>
                            </div>
                            <div>
                                <h3 className="font-medium text-content">Application Review</h3>
                                <p className="text-content-secondary text-sm mt-1">
                                    Our admissions team will review your application within 5-7 business days.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-brand-600 font-bold text-sm">2</span>
                            </div>
                            <div>
                                <h3 className="font-medium text-content">Document Verification</h3>
                                <p className="text-content-secondary text-sm mt-1">
                                    We may contact you if additional documents or information are required.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-brand-600 font-bold text-sm">3</span>
                            </div>
                            <div>
                                <h3 className="font-medium text-content">Decision Notification</h3>
                                <p className="text-content-secondary text-sm mt-1">
                                    You will receive an email with the admission decision once the review is complete.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 size={16} className="text-success-600" />
                            </div>
                            <div>
                                <h3 className="font-medium text-content">Enrollment</h3>
                                <p className="text-content-secondary text-sm mt-1">
                                    If accepted, you'll receive instructions on how to complete your enrollment.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-surface-secondary rounded-xl p-6 border border-border mb-8">
                    <h3 className="font-semibold text-content mb-3 flex items-center gap-2">
                        <FileText size={18} className="text-brand-500" />
                        Questions?
                    </h3>
                    <p className="text-content-secondary text-sm">
                        If you have any questions about your application, please contact our admissions office at{' '}
                        <a href="mailto:admissions@ainshams.edu" className="text-brand-500 hover:underline">
                            admissions@ainshams.edu
                        </a>
                        {' '}or call{' '}
                        <a href="tel:+20226390000" className="text-brand-500 hover:underline">
                            +20 2 2639 0000
                        </a>
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/admissions"
                        className="flex items-center justify-center gap-2 px-6 py-3 text-content-secondary hover:text-content border border-border rounded-lg transition-colors"
                    >
                        <Home size={18} />
                        Back to Admissions
                    </Link>
                    <Link
                        to="/login"
                        className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-button hover:shadow-button-hover"
                    >
                        Sign In to Your Account
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default ApplicationConfirmationPage;
