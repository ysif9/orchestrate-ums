import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { admissionService } from '../services/admissionService.js';
import {
    User,
    GraduationCap,
    FileCheck,
    ArrowLeft,
    CheckCircle,
    Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

/**
 * ApplicationFormPage - Multi-step application form for prospective students
 */
function ApplicationFormPage() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [admissionInfo, setAdmissionInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<any>({});
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
        // Personal Info (additional)
        dateOfBirth: '',
        nationality: '',
    });

    const steps = [
        { id: 1, title: 'Personal Information', icon: User },
        { id: 2, title: 'Academic History', icon: GraduationCap },
        { id: 3, title: 'Program Selection', icon: FileCheck },
        { id: 4, title: 'Review & Submit', icon: CheckCircle },
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

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        updateFormData(name, value);
    };

    const updateFormData = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field
        if (errors[name]) {
            setErrors((prev: any) => ({ ...prev, [name]: '' }));
        }
        if (apiError) {
            setApiError('');
        }
    };

    const validateStep = (step: number) => {
        const newErrors: any = {};

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
        } catch (err: any) {
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

    return (
        <div className="min-h-screen pb-12 bg-background">
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
                        to="/admissions"
                        className="text-primary-foreground/90 hover:text-primary-foreground text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft size={16} />
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
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground'
                                            }`}>
                                        <step.icon size={20} />
                                    </div>
                                    <span className={`text-xs mt-2 text-center hidden sm:block ${currentStep >= step.id
                                        ? 'text-primary font-medium'
                                        : 'text-muted-foreground'
                                        }`}>
                                        {step.title}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`h-1 flex-1 mx-2 rounded ${currentStep > step.id
                                        ? 'bg-primary'
                                        : 'bg-muted'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">{steps[currentStep - 1].title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                        {apiError && (
                            <div
                                className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-6 text-sm border border-destructive/20">
                                {apiError}
                            </div>
                        )}

                        {/* Step 1: Personal Information */}
                        {currentStep === 1 && (
                            <div className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name *</Label>
                                        <Input
                                            type="text"
                                            id="firstName"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            placeholder="Enter your first name"
                                            className={errors.firstName ? 'border-destructive' : ''}
                                        />
                                        {errors.firstName && <span className="text-destructive text-sm">{errors.firstName}</span>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name *</Label>
                                        <Input
                                            type="text"
                                            id="lastName"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            placeholder="Enter your last name"
                                            className={errors.lastName ? 'border-destructive' : ''}
                                        />
                                        {errors.lastName && <span className="text-destructive text-sm">{errors.lastName}</span>}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address *</Label>
                                    <Input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="your.email@example.com"
                                        className={errors.email ? 'border-destructive' : ''}
                                    />
                                    {errors.email && <span className="text-destructive text-sm">{errors.email}</span>}
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="+20 123 456 7890"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                        <Input
                                            type="date"
                                            id="dateOfBirth"
                                            name="dateOfBirth"
                                            value={formData.dateOfBirth}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="nationality">Nationality</Label>
                                        <Input
                                            type="text"
                                            id="nationality"
                                            name="nationality"
                                            value={formData.nationality}
                                            onChange={handleChange}
                                            placeholder="Enter your nationality"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address">Address</Label>
                                        <Input
                                            type="text"
                                            id="address"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            placeholder="City, Country"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Academic History */}
                        {currentStep === 2 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="previousDegree">Previous Degree / Diploma *</Label>
                                    <Input
                                        type="text"
                                        id="previousDegree"
                                        name="previousDegree"
                                        value={formData.previousDegree}
                                        onChange={handleChange}
                                        placeholder="e.g., High School Diploma, Bachelor's in Science"
                                        className={errors.previousDegree ? 'border-destructive' : ''}
                                    />
                                    {errors.previousDegree &&
                                        <span className="text-destructive text-sm">{errors.previousDegree}</span>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="institution">Institution / School Name *</Label>
                                    <Input
                                        type="text"
                                        id="institution"
                                        name="institution"
                                        value={formData.institution}
                                        onChange={handleChange}
                                        placeholder="Enter your school or institution name"
                                        className={errors.institution ? 'border-destructive' : ''}
                                    />
                                    {errors.institution && <span className="text-destructive text-sm">{errors.institution}</span>}
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="gpa">GPA / Grade</Label>
                                        <Input
                                            type="text"
                                            id="gpa"
                                            name="gpa"
                                            value={formData.gpa}
                                            onChange={handleChange}
                                            placeholder="e.g., 3.5/4.0 or 85%"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="graduationYear">Graduation Year</Label>
                                        <Input
                                            type="text"
                                            id="graduationYear"
                                            name="graduationYear"
                                            value={formData.graduationYear}
                                            onChange={handleChange}
                                            placeholder="e.g., 2024"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Program Selection */}
                        {currentStep === 3 && admissionInfo && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Select Discovery Program *</Label>
                                    <RadioGroup
                                        className="grid gap-3 mt-2"
                                        value={formData.program}
                                        onValueChange={(val) => updateFormData('program', val)}
                                    >
                                        {admissionInfo.programs.map((program: any) => (
                                            <div key={program.id}>
                                                <RadioGroupItem
                                                    value={program.id}
                                                    id={program.id}
                                                    className="peer sr-only"
                                                />
                                                <Label
                                                    htmlFor={program.id}
                                                    className="flex flex-row items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-4 h-4 rounded-full border border-primary flex items-center justify-center ${formData.program === program.id ? 'bg-primary' : ''}`}>
                                                            {formData.program === program.id && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{program.name}</div>
                                                            <div className="text-muted-foreground text-sm">{program.department}</div>
                                                        </div>
                                                    </div>
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                    {errors.program && <span className="text-destructive text-sm">{errors.program}</span>}
                                </div>

                            </div>
                        )}

                        {/* Step 4: Review & Submit */}
                        {currentStep === 4 && (
                            <div className="space-y-6">
                                <Card className="bg-muted/30">
                                    <CardContent className="p-6">
                                        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                            <User size={18} className="text-primary" />
                                            Personal Information
                                        </h3>
                                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                                            <div><span className="text-muted-foreground">Name:</span> <span
                                                className="text-foreground font-medium">{formData.firstName} {formData.lastName}</span>
                                            </div>
                                            <div><span className="text-muted-foreground">Email:</span> <span
                                                className="text-foreground font-medium">{formData.email}</span></div>
                                            {formData.phone && <div><span className="text-muted-foreground">Phone:</span> <span
                                                className="text-foreground font-medium">{formData.phone}</span></div>}
                                            {formData.dateOfBirth &&
                                                <div><span className="text-muted-foreground">DOB:</span> <span
                                                    className="text-foreground font-medium">{formData.dateOfBirth}</span></div>}
                                            {formData.nationality &&
                                                <div><span className="text-muted-foreground">Nationality:</span> <span
                                                    className="text-foreground font-medium">{formData.nationality}</span></div>}
                                            {formData.address &&
                                                <div><span className="text-muted-foreground">Address:</span> <span
                                                    className="text-foreground font-medium">{formData.address}</span></div>}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-muted/30">
                                    <CardContent className="p-6">
                                        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                            <GraduationCap size={18} className="text-primary" />
                                            Academic History
                                        </h3>
                                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                                            <div><span className="text-muted-foreground">Degree:</span> <span
                                                className="text-foreground font-medium">{formData.previousDegree}</span></div>
                                            <div><span className="text-muted-foreground">Institution:</span> <span
                                                className="text-foreground font-medium">{formData.institution}</span></div>
                                            {formData.gpa && <div><span className="text-muted-foreground">GPA:</span> <span
                                                className="text-foreground font-medium">{formData.gpa}</span></div>}
                                            {formData.graduationYear &&
                                                <div><span className="text-muted-foreground">Graduation:</span> <span
                                                    className="text-foreground font-medium">{formData.graduationYear}</span></div>}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-muted/30">
                                    <CardContent className="p-6">
                                        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                            <FileCheck size={18} className="text-primary" />
                                            Program Selection
                                        </h3>
                                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                                            <div><span className="text-muted-foreground">Program:</span> <span
                                                className="text-foreground font-medium">
                                                {admissionInfo?.programs.find((p: any) => p.id === formData.program)?.name || formData.program}
                                            </span></div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div
                                    className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm border border-blue-100">
                                    Please review all information carefully before submitting. You will receive a
                                    confirmation email once your application is submitted.
                                </div>
                            </div>
                        )
                        }

                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-8 pt-6 border-t border-border">
                            {currentStep > 1 ? (
                                <Button
                                    type="button"
                                    onClick={handleBack}
                                    variant="outline"
                                >
                                    Back
                                </Button>
                            ) : (
                                <div />
                            )}

                            {currentStep < 4 ? (
                                <Button
                                    type="button"
                                    onClick={handleNext}
                                >
                                    Next
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={18} className="mr-2 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={18} className="mr-2" />
                                            Submit Application
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </CardContent >
                </Card >
            </div >
        </div >
    );
}

export default ApplicationFormPage;
