import {useState, useEffect} from 'react';
import {useNavigate, Link} from 'react-router-dom';
import {admissionService} from '../services/admissionService.js';
import {
    User,
    GraduationCap,
    FileCheck,
    ArrowLeft,
    ArrowRight,
    CheckCircle,
    Loader2
} from 'lucide-react';

/**
 * ApplicationFormPage - Multi-step application form for prospective students
 */
function ApplicationFormPage() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [admissionInfo, setAdmissionInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');

    const [formData, setFormData] = useState({
        // Step 1: Personal Information
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        // Step 2: Academic History
        previousDegree: '',
        institution: '',
        gpa: '',
        graduationYear: '',
        // Step 3: Program Selection
        program: '',
        semester: '',
        // Personal Info (additional)
        dateOfBirth: '',
        nationality: '',
    });

    const steps = [
        {id: 1, title: 'Personal Information', icon: User},
        {id: 2, title: 'Academic History', icon: GraduationCap},
        {id: 3, title: 'Program Selection', icon: FileCheck},
        {id: 4, title: 'Review & Submit', icon: CheckCircle},
    ];

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const response = await admissionService.getAdmissionInfo();
                if (response.success) {
                    setAdmissionInfo(response.data);
                }
            } catch (err) {
                console.error('Error fetching admission info:', err);
                setApiError('Unable to load admission information. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchInfo();
    }, []);

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({...prev, [name]: ''}));
        }
        if (apiError) {
            setApiError('');
        }
    };

    const validateStep = (step) => {
        const newErrors = {};

        if (step === 1) {
            if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
            if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
            if (!formData.email.trim()) {
                newErrors.email = 'Email is required';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                newErrors.email = 'Please enter a valid email address';
            }
        }

        if (step === 2) {
            if (!formData.previousDegree.trim()) newErrors.previousDegree = 'Previous degree is required';
            if (!formData.institution.trim()) newErrors.institution = 'Institution name is required';
        }

        if (step === 3) {
            if (!formData.program) newErrors.program = 'Please select a program';
            if (!formData.semester) newErrors.semester = 'Please select a semester';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setApiError('');

        try {
            const applicationData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone || undefined,
                address: formData.address || undefined,
                program: formData.program,
                semester: formData.semester,
                academicHistory: {
                    previousDegree: formData.previousDegree,
                    institution: formData.institution,
                    gpa: formData.gpa,
                    graduationYear: formData.graduationYear,
                },
                personalInfo: {
                    dateOfBirth: formData.dateOfBirth,
                    nationality: formData.nationality,
                },
            };

            const response = await admissionService.submitApplication(applicationData);

            if (response.success) {
                navigate(`/apply/confirmation/${response.data.applicationId}`);
            }
        } catch (err) {
            console.error('Error submitting application:', err);
            const message = err.response?.data?.message || 'Failed to submit application. Please try again.';
            setApiError(message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    const inputClassName = "px-4 py-3 border border-border rounded-lg text-base bg-surface text-content transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 w-full";
    const labelClassName = "text-content font-medium text-sm mb-1 block";
    const errorClassName = "text-error-600 text-sm mt-1";

    return (
        <div className="min-h-screen pb-12">
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
                        to="/admissions"
                        className="text-white/90 hover:text-white text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft size={16}/>
                        Back to Admissions
                    </Link>
                </div>
            </nav>

            <div className="max-w-3xl mx-auto px-8 py-8">
                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <div
                                    className={`flex flex-col items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}>
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${currentStep >= step.id
                                            ? 'bg-brand-500 text-white'
                                            : 'bg-surface-tertiary text-content-secondary'
                                        }`}>
                                        <step.icon size={20}/>
                                    </div>
                                    <span className={`text-xs mt-2 text-center hidden sm:block ${currentStep >= step.id
                                        ? 'text-brand-600 font-medium'
                                        : 'text-content-tertiary'
                                    }`}>
                                        {step.title}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`h-1 flex-1 mx-2 rounded ${currentStep > step.id
                                        ? 'bg-brand-500'
                                        : 'bg-surface-tertiary'
                                    }`}/>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-surface rounded-xl shadow-card p-8 border border-border">
                    <h2 className="text-2xl font-bold text-content mb-6">
                        {steps[currentStep - 1].title}
                    </h2>

                    {apiError && (
                        <div
                            className="bg-error-100 text-error-700 px-4 py-3 rounded-lg mb-6 text-sm border border-error-200">
                            {apiError}
                        </div>
                    )}

                    {/* Step 1: Personal Information */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClassName}>First Name *</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        placeholder="Enter your first name"
                                        className={inputClassName}
                                    />
                                    {errors.firstName && <span className={errorClassName}>{errors.firstName}</span>}
                                </div>
                                <div>
                                    <label className={labelClassName}>Last Name *</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        placeholder="Enter your last name"
                                        className={inputClassName}
                                    />
                                    {errors.lastName && <span className={errorClassName}>{errors.lastName}</span>}
                                </div>
                            </div>
                            <div>
                                <label className={labelClassName}>Email Address *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="your.email@example.com"
                                    className={inputClassName}
                                />
                                {errors.email && <span className={errorClassName}>{errors.email}</span>}
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClassName}>Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+20 123 456 7890"
                                        className={inputClassName}
                                    />
                                </div>
                                <div>
                                    <label className={labelClassName}>Date of Birth</label>
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        value={formData.dateOfBirth}
                                        onChange={handleChange}
                                        className={inputClassName}
                                    />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClassName}>Nationality</label>
                                    <input
                                        type="text"
                                        name="nationality"
                                        value={formData.nationality}
                                        onChange={handleChange}
                                        placeholder="Enter your nationality"
                                        className={inputClassName}
                                    />
                                </div>
                                <div>
                                    <label className={labelClassName}>Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="City, Country"
                                        className={inputClassName}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Academic History */}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label className={labelClassName}>Previous Degree / Diploma *</label>
                                <input
                                    type="text"
                                    name="previousDegree"
                                    value={formData.previousDegree}
                                    onChange={handleChange}
                                    placeholder="e.g., High School Diploma, Bachelor's in Science"
                                    className={inputClassName}
                                />
                                {errors.previousDegree &&
                                    <span className={errorClassName}>{errors.previousDegree}</span>}
                            </div>
                            <div>
                                <label className={labelClassName}>Institution / School Name *</label>
                                <input
                                    type="text"
                                    name="institution"
                                    value={formData.institution}
                                    onChange={handleChange}
                                    placeholder="Enter your school or institution name"
                                    className={inputClassName}
                                />
                                {errors.institution && <span className={errorClassName}>{errors.institution}</span>}
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClassName}>GPA / Grade</label>
                                    <input
                                        type="text"
                                        name="gpa"
                                        value={formData.gpa}
                                        onChange={handleChange}
                                        placeholder="e.g., 3.5/4.0 or 85%"
                                        className={inputClassName}
                                    />
                                </div>
                                <div>
                                    <label className={labelClassName}>Graduation Year</label>
                                    <input
                                        type="text"
                                        name="graduationYear"
                                        value={formData.graduationYear}
                                        onChange={handleChange}
                                        placeholder="e.g., 2024"
                                        className={inputClassName}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Program Selection */}
                    {currentStep === 3 && admissionInfo && (
                        <div className="space-y-6">
                            <div>
                                <label className={labelClassName}>Select Program *</label>
                                <div className="grid gap-3 mt-2">
                                    {admissionInfo.programs.map((program) => (
                                        <label
                                            key={program.id}
                                            className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.program === program.id
                                                ? 'border-brand-500 bg-brand-50'
                                                : 'border-border hover:border-brand-300'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="program"
                                                value={program.id}
                                                checked={formData.program === program.id}
                                                onChange={handleChange}
                                                className="sr-only"
                                            />
                                            <div
                                                className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${formData.program === program.id
                                                    ? 'border-brand-500 bg-brand-500'
                                                    : 'border-border-dark'
                                                }`}>
                                                {formData.program === program.id && (
                                                    <div className="w-2 h-2 rounded-full bg-white"/>
                                                )}
                                            </div>
                                            <div>
                                                <span className="font-medium text-content">{program.name}</span>
                                                <span
                                                    className="text-content-secondary text-sm ml-2">({program.department})</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                {errors.program && <span className={errorClassName}>{errors.program}</span>}
                            </div>

                            <div>
                                <label className={labelClassName}>Select Semester *</label>
                                <select
                                    name="semester"
                                    value={formData.semester}
                                    onChange={handleChange}
                                    className={inputClassName}
                                >
                                    <option value="">Choose a semester</option>
                                    {admissionInfo.semesters.map((sem) => (
                                        <option key={sem.id} value={sem.id}>{sem.name}</option>
                                    ))}
                                </select>
                                {errors.semester && <span className={errorClassName}>{errors.semester}</span>}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Review & Submit */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div className="bg-surface-secondary rounded-lg p-6 border border-border">
                                <h3 className="font-semibold text-content mb-4 flex items-center gap-2">
                                    <User size={18} className="text-brand-500"/>
                                    Personal Information
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                    <div><span className="text-content-secondary">Name:</span> <span
                                        className="text-content font-medium">{formData.firstName} {formData.lastName}</span>
                                    </div>
                                    <div><span className="text-content-secondary">Email:</span> <span
                                        className="text-content font-medium">{formData.email}</span></div>
                                    {formData.phone && <div><span className="text-content-secondary">Phone:</span> <span
                                        className="text-content font-medium">{formData.phone}</span></div>}
                                    {formData.dateOfBirth &&
                                        <div><span className="text-content-secondary">DOB:</span> <span
                                            className="text-content font-medium">{formData.dateOfBirth}</span></div>}
                                    {formData.nationality &&
                                        <div><span className="text-content-secondary">Nationality:</span> <span
                                            className="text-content font-medium">{formData.nationality}</span></div>}
                                    {formData.address &&
                                        <div><span className="text-content-secondary">Address:</span> <span
                                            className="text-content font-medium">{formData.address}</span></div>}
                                </div>
                            </div>

                            <div className="bg-surface-secondary rounded-lg p-6 border border-border">
                                <h3 className="font-semibold text-content mb-4 flex items-center gap-2">
                                    <GraduationCap size={18} className="text-brand-500"/>
                                    Academic History
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                    <div><span className="text-content-secondary">Degree:</span> <span
                                        className="text-content font-medium">{formData.previousDegree}</span></div>
                                    <div><span className="text-content-secondary">Institution:</span> <span
                                        className="text-content font-medium">{formData.institution}</span></div>
                                    {formData.gpa && <div><span className="text-content-secondary">GPA:</span> <span
                                        className="text-content font-medium">{formData.gpa}</span></div>}
                                    {formData.graduationYear &&
                                        <div><span className="text-content-secondary">Graduation:</span> <span
                                            className="text-content font-medium">{formData.graduationYear}</span></div>}
                                </div>
                            </div>

                            <div className="bg-surface-secondary rounded-lg p-6 border border-border">
                                <h3 className="font-semibold text-content mb-4 flex items-center gap-2">
                                    <FileCheck size={18} className="text-brand-500"/>
                                    Program Selection
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                    <div><span className="text-content-secondary">Program:</span> <span
                                        className="text-content font-medium">
                                        {admissionInfo?.programs.find(p => p.id === formData.program)?.name || formData.program}
                                    </span></div>
                                    <div><span className="text-content-secondary">Semester:</span> <span
                                        className="text-content font-medium">
                                        {admissionInfo?.semesters.find(s => s.id === formData.semester)?.name || formData.semester}
                                    </span></div>
                                </div>
                            </div>

                            <div
                                className="bg-info-50 text-info-700 px-4 py-3 rounded-lg text-sm border border-info-100">
                                Please review all information carefully before submitting. You will receive a
                                confirmation email once your application is submitted.
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-border">
                        {currentStep > 1 ? (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="flex items-center gap-2 px-6 py-3 text-content-secondary hover:text-content transition-colors"
                            >
                                <ArrowLeft size={18}/>
                                Back
                            </button>
                        ) : (
                            <div/>
                        )}

                        {currentStep < 4 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-button hover:shadow-button-hover"
                            >
                                Next
                                <ArrowRight size={18}/>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex items-center gap-2 bg-success-600 hover:bg-success-700 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-button disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin"/>
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={18}/>
                                        Submit Application
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ApplicationFormPage;
