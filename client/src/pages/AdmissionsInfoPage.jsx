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

/**
 * AdmissionsInfoPage - Public landing page for prospective students
 * Displays admission requirements, programs, and deadlines
 */
function AdmissionsInfoPage() {
    const navigate = useNavigate();
    const [admissionInfo, setAdmissionInfo] = useState(null);
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
                    <div className="flex items-center gap-4">
                        <Link
                            to="/login"
                            className="text-white/90 hover:text-white text-sm font-medium transition-colors"
                        >
                            Sign In
                        </Link>
                        <button
                            onClick={() => navigate('/apply')}
                            className="bg-white text-brand-600 hover:bg-brand-50 px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-button hover:shadow-button-hover"
                        >
                            Apply Now
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-brand-500 via-brand-600 to-accent-600 text-white py-20 px-8">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
                        <GraduationCap size={18} />
                        <span>Admissions Open for 2025-2026</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        Shape Your Future in Engineering
                    </h2>
                    <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
                        Join one of the most prestigious engineering programs in the region.
                        Our world-class faculty and state-of-the-art facilities await you.
                    </p>
                    <button
                        onClick={() => navigate('/apply')}
                        className="bg-white text-brand-600 hover:bg-brand-50 px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2 group"
                    >
                        Start Your Application
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </section>

            {error && (
                <div className="max-w-7xl mx-auto px-8 py-4">
                    <div className="bg-error-100 text-error-700 px-4 py-3 rounded-lg text-sm border border-error-200">
                        {error}
                    </div>
                </div>
            )}

            {admissionInfo && (
                <>
                    {/* Programs Section */}
                    <section className="py-16 px-8">
                        <div className="max-w-7xl mx-auto">
                            <h3 className="text-3xl font-bold text-content text-center mb-4">
                                Available Programs
                            </h3>
                            <p className="text-content-secondary text-center mb-12 max-w-2xl mx-auto">
                                Choose from our comprehensive range of engineering programs designed to prepare you for success.
                            </p>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {admissionInfo.programs.map((program) => (
                                    <div
                                        key={program.id}
                                        className="bg-surface rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all border border-border group cursor-pointer"
                                        onClick={() => navigate('/apply')}
                                    >
                                        <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand-200 transition-colors">
                                            <Building2 size={24} className="text-brand-600" />
                                        </div>
                                        <h4 className="text-lg font-semibold text-content mb-2">{program.name}</h4>
                                        <p className="text-content-secondary text-sm">{program.department}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Requirements Section */}
                    <section className="py-16 px-8 bg-surface-secondary">
                        <div className="max-w-7xl mx-auto">
                            <h3 className="text-3xl font-bold text-content text-center mb-4">
                                Admission Requirements
                            </h3>
                            <p className="text-content-secondary text-center mb-12 max-w-2xl mx-auto">
                                Make sure you meet all the requirements before submitting your application.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                                {admissionInfo.requirements.map((req, index) => (
                                    <div
                                        key={index}
                                        className="bg-surface rounded-lg p-4 flex items-start gap-3 shadow-card border border-border"
                                    >
                                        <CheckCircle size={20} className="text-success-600 flex-shrink-0 mt-0.5" />
                                        <span className="text-content">{req}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Deadlines Section */}
                    <section className="py-16 px-8">
                        <div className="max-w-7xl mx-auto">
                            <h3 className="text-3xl font-bold text-content text-center mb-4">
                                Important Deadlines
                            </h3>
                            <p className="text-content-secondary text-center mb-12 max-w-2xl mx-auto">
                                Don't miss the application deadline for your preferred semester.
                            </p>
                            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                                {Object.entries(admissionInfo.deadlines).map(([semester, date]) => (
                                    <div
                                        key={semester}
                                        className="bg-surface rounded-xl p-6 shadow-card border border-border text-center"
                                    >
                                        <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                                            <Calendar size={24} className="text-accent-600" />
                                        </div>
                                        <h4 className="text-lg font-semibold text-content mb-2 capitalize">{semester} Semester</h4>
                                        <p className="text-content-secondary flex items-center justify-center gap-2">
                                            <Clock size={16} />
                                            {date}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Contact Section */}
                    <section className="py-16 px-8 bg-brand-600 text-white">
                        <div className="max-w-7xl mx-auto text-center">
                            <h3 className="text-3xl font-bold mb-4">
                                Need Help?
                            </h3>
                            <p className="text-white/90 mb-8 max-w-2xl mx-auto">
                                Our admissions team is here to answer your questions and guide you through the application process.
                            </p>
                            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                                <a
                                    href={`mailto:${admissionInfo.contactEmail}`}
                                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-lg transition-colors"
                                >
                                    <Mail size={20} />
                                    {admissionInfo.contactEmail}
                                </a>
                                <a
                                    href={`tel:${admissionInfo.contactPhone}`}
                                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-lg transition-colors"
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
            <section className="py-16 px-8 text-center">
                <div className="max-w-2xl mx-auto">
                    <FileText size={48} className="text-brand-500 mx-auto mb-6" />
                    <h3 className="text-3xl font-bold text-content mb-4">
                        Ready to Apply?
                    </h3>
                    <p className="text-content-secondary mb-8">
                        Take the first step towards your engineering career. The application process takes approximately 10-15 minutes.
                    </p>
                    <button
                        onClick={() => navigate('/apply')}
                        className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-button hover:shadow-button-hover inline-flex items-center gap-2 group"
                    >
                        Start Application
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </section>
        </div>
    );
}

export default AdmissionsInfoPage;
