import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { admissionService } from '../services/admissionService.js';
import {
    GraduationCap,
    FileText,
    Calendar,
    CheckCircle,
    ArrowRight,
    Building2,
    Clock,
    Mail,
    Phone
} from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

/**
 * AdmissionsInfoPage - Public landing page for prospective students
 * Displays admission requirements, programs, and deadlines
 */
function AdmissionsInfoPage() {
    const navigate = useNavigate();
    const [admissionInfo, setAdmissionInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const response = await admissionService.getAdmissionInfo();
                if (response.success) {
                    setAdmissionInfo(response.data);
                }
            } catch (err) {
                console.error('Error fetching admission info:', err);
                setError('Unable to load admission information. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchInfo();
    }, []);

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
            <nav className="bg-primary text-primary-foreground px-8 py-4 shadow-lg">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-primary-foreground">
                        AIN SHAMS
                        <span className="block text-xs font-normal text-primary-foreground/80 tracking-wider mt-1">
                            UNIVERSITY | FACULTY OF ENGINEERING
                        </span>
                    </h1>
                    <div className="flex items-center gap-4">
                        <Link
                            to="/login"
                            className="text-primary-foreground/90 hover:text-primary-foreground text-sm font-medium transition-colors"
                        >
                            Sign In
                        </Link>
                        <Button
                            onClick={() => navigate('/apply')}
                            variant="secondary"
                            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold"
                        >
                            Apply Now
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="bg-primary text-primary-foreground py-20 px-8">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-primary-foreground/10 px-4 py-2 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
                        <GraduationCap size={18} />
                        <span>Admissions Open for 2025-2026</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        Shape Your Future in Engineering
                    </h2>
                    <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-8">
                        Join one of the most prestigious engineering programs in the region.
                        Our world-class faculty and state-of-the-art facilities await you.
                    </p>
                    <Button
                        onClick={() => navigate('/apply')}
                        size="lg"
                        className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-lg font-bold py-6 px-8 rounded-xl shadow-lg hover:shadow-xl group"
                    >
                        Start Your Application
                        <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </section>

            {error && (
                <div className="max-w-7xl mx-auto px-8 py-4">
                    <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm border border-destructive/20">
                        {error}
                    </div>
                </div>
            )}

            {admissionInfo && (
                <>
                    {/* Programs Section */}
                    <section className="py-16 px-8 bg-background">
                        <div className="max-w-7xl mx-auto">
                            <h3 className="text-3xl font-bold text-foreground text-center mb-4">
                                Available Programs
                            </h3>
                            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
                                Choose from our comprehensive range of engineering programs designed to prepare you for success.
                            </p>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {admissionInfo.programs.map((program: any) => (
                                    <Card
                                        key={program.id}
                                        className="hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-1 duration-200"
                                        onClick={() => navigate('/apply')}
                                    >
                                        <CardContent className="p-6">
                                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                                <Building2 size={24} className="text-primary" />
                                            </div>
                                            <h4 className="text-lg font-semibold text-foreground mb-2">{program.name}</h4>
                                            <p className="text-muted-foreground text-sm">{program.department}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Requirements Section */}
                    <section className="py-16 px-8 bg-muted/30">
                        <div className="max-w-7xl mx-auto">
                            <h3 className="text-3xl font-bold text-foreground text-center mb-4">
                                Admission Requirements
                            </h3>
                            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
                                Make sure you meet all the requirements before submitting your application.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                                {admissionInfo.requirements.map((req: string, index: number) => (
                                    <Card key={index} className="border-border">
                                        <CardContent className="p-4 flex items-start gap-3">
                                            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-foreground">{req}</span>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Deadlines Section */}
                    <section className="py-16 px-8 bg-background">
                        <div className="max-w-7xl mx-auto">
                            <h3 className="text-3xl font-bold text-foreground text-center mb-4">
                                Important Deadlines
                            </h3>
                            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
                                Don&apos;t miss the application deadline for your preferred semester.
                            </p>
                            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                                {Object.entries(admissionInfo.deadlines).map(([semester, date]: [string, any]) => (
                                    <Card key={semester} className="text-center">
                                        <CardContent className="p-6">
                                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                                                <Calendar size={24} className="text-orange-600" />
                                            </div>
                                            <h4 className="text-lg font-semibold text-foreground mb-2 capitalize">{semester} Semester</h4>
                                            <p className="text-muted-foreground flex items-center justify-center gap-2">
                                                <Clock size={16} />
                                                {date}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Contact Section */}
                    <section className="py-16 px-8 bg-primary text-primary-foreground">
                        <div className="max-w-7xl mx-auto text-center">
                            <h3 className="text-3xl font-bold mb-4">
                                Need Help?
                            </h3>
                            <p className="text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
                                Our admissions team is here to answer your questions and guide you through the application process.
                            </p>
                            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                                <a
                                    href={`mailto:${admissionInfo.contactEmail}`}
                                    className="flex items-center gap-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 px-6 py-3 rounded-lg transition-colors text-primary-foreground"
                                >
                                    <Mail size={20} />
                                    {admissionInfo.contactEmail}
                                </a>
                                <a
                                    href={`tel:${admissionInfo.contactPhone}`}
                                    className="flex items-center gap-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 px-6 py-3 rounded-lg transition-colors text-primary-foreground"
                                >
                                    <Phone size={20} />
                                    {admissionInfo.contactPhone}
                                </a>
                            </div>
                        </div>
                    </section>
                </>
            )}

            {/* CTA Section */}
            <section className="py-16 px-8 text-center bg-background">
                <div className="max-w-2xl mx-auto">
                    <FileText size={48} className="text-primary mx-auto mb-6" />
                    <h3 className="text-3xl font-bold text-foreground mb-4">
                        Ready to Apply?
                    </h3>
                    <p className="text-muted-foreground mb-8">
                        Take the first step towards your engineering career. The application process takes approximately 10-15 minutes.
                    </p>
                    <Button
                        onClick={() => navigate('/apply')}
                        size="lg"
                        className="text-lg py-6 px-8 rounded-xl shadow-lg hover:shadow-xl group"
                    >
                        Start Application
                        <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </section>
        </div>
    );
}

export default AdmissionsInfoPage;
