import { useParams, Link } from 'react-router-dom';
import {
    CheckCircle2,
    Mail,
    Clock,
    ArrowRight,
    Home,
    FileText
} from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * ApplicationConfirmationPage - Confirmation page after successful application submission
 */
function ApplicationConfirmationPage() {
    const { id } = useParams();

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <nav className="bg-primary text-primary-foreground px-8 py-4 shadow-lg">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-primary-foreground">
                        AIN SHAMS
                        <span className="block text-xs font-normal text-primary-foreground/80 tracking-wider mt-1">
                            UNIVERSITY | FACULTY OF ENGINEERING
                        </span>
                    </h1>
                    <Link
                        to="/login"
                        className="text-primary-foreground/90 hover:text-primary-foreground text-sm font-medium transition-colors"
                    >
                        Sign In
                    </Link>
                </div>
            </nav>

            <div className="max-w-2xl mx-auto px-8 py-16">
                {/* Success Animation */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6 animate-pulse">
                        <CheckCircle2 size={48} className="text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-3">
                        Application Submitted!
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Thank you for applying to Ain Shams University
                    </p>
                </div>

                {/* Application Reference */}
                <Card className="mb-8">
                    <CardContent className="p-8">
                        <div className="text-center mb-6">
                            <span className="text-muted-foreground text-sm">Application Reference Number</span>
                            <div className="text-3xl font-bold text-primary mt-1">
                                APP-{id?.toString().padStart(6, '0')}
                            </div>
                        </div>

                        <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm border border-blue-100 flex items-start gap-3">
                            <Mail size={20} className="flex-shrink-0 mt-0.5" />
                            <div>
                                <span className="font-medium">Confirmation Email Sent</span>
                                <p className="mt-1 text-blue-600">
                                    A confirmation email has been sent to your registered email address. Please keep this for your records.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Next Steps */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock size={20} className="text-primary" />
                            What Happens Next?
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-primary font-bold text-sm">1</span>
                                </div>
                                <div>
                                    <h3 className="font-medium text-foreground">Application Review</h3>
                                    <p className="text-muted-foreground text-sm mt-1">
                                        Our admissions team will review your application within 5-7 business days.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-primary font-bold text-sm">2</span>
                                </div>
                                <div>
                                    <h3 className="font-medium text-foreground">Document Verification</h3>
                                    <p className="text-muted-foreground text-sm mt-1">
                                        We may contact you if additional documents or information are required.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-primary font-bold text-sm">3</span>
                                </div>
                                <div>
                                    <h3 className="font-medium text-foreground">Decision Notification</h3>
                                    <p className="text-muted-foreground text-sm mt-1">
                                        You will receive an email with the admission decision once the review is complete.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <CheckCircle2 size={16} className="text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-foreground">Enrollment</h3>
                                    <p className="text-muted-foreground text-sm mt-1">
                                        If accepted, you'll receive instructions on how to complete your enrollment.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Information */}
                <Card className="mb-8 bg-muted/30">
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <FileText size={18} className="text-primary" />
                            Questions?
                        </h3>
                        <p className="text-muted-foreground text-sm">
                            If you have any questions about your application, please contact our admissions office at{' '}
                            <a href="mailto:admissions@ainshams.edu" className="text-primary hover:underline">
                                admissions@ainshams.edu
                            </a>
                            {' '}or call{' '}
                            <a href="tel:+20226390000" className="text-primary hover:underline">
                                +20 2 2639 0000
                            </a>
                        </p>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        variant="outline"
                        onClick={() => window.location.href = '/admissions'}
                        className="gap-2"
                        asChild
                    >
                        <Link to="/admissions">
                            <Home size={18} />
                            Back to Admissions
                        </Link>
                    </Button>
                    <Button
                        onClick={() => window.location.href = '/login'}
                        className="gap-2"
                        asChild
                    >
                        <Link to="/login">
                            Sign In to Your Account
                            <ArrowRight size={18} />
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default ApplicationConfirmationPage;
