import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService.js';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function Signup() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
        maxCredits: 18
    });
    const [errors, setErrors] = useState<any>({});
    const [apiError, setApiError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (authService.isAuthenticated()) {
            const user = authService.getCurrentUser();
            const isAdminOrStaff = user?.role === 'professor' || user?.role === 'staff';
            navigate(isAdminOrStaff ? '/admin/home' : '/home', { replace: true });
        }
    }, [navigate]);

    const validatePassword = (password: string) => {
        if (password.length < 8) {
            return 'Password must be at least 8 characters';
        }
        if (!/[A-Z]/.test(password)) {
            return 'Password must contain at least one uppercase letter';
        }
        if (!/[a-z]/.test(password)) {
            return 'Password must contain at least one lowercase letter';
        }
        if (!/[0-9]/.test(password)) {
            return 'Password must contain at least one number';
        }
        return null;
    };

    const validateForm = () => {
        const newErrors: any = {};

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else {
            const passwordError = validatePassword(formData.password);
            if (passwordError) {
                newErrors.password = passwordError;
            }
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        // Max credits validation for students
        if (formData.role === 'student') {
            if (!formData.maxCredits || formData.maxCredits < 1) {
                newErrors.maxCredits = 'Max credits must be at least 1';
            } else if (formData.maxCredits > 30) {
                newErrors.maxCredits = 'Max credits cannot exceed 30';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        const newValue = name === 'maxCredits' ? parseInt(value) || '' : value;

        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));

        if (errors[name]) {
            setErrors((prev: any) => ({
                ...prev,
                [name]: ''
            }));
        }

        if (apiError) {
            setApiError('');
        }
    };

    const handleRoleChange = (value: string) => {
        setFormData(prev => ({ ...prev, role: value }));
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setApiError('');

        try {
            const signupData: any = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role
            };

            if (formData.role === 'student') {
                signupData.maxCredits = formData.maxCredits;
            }

            const response = await authService.signup(signupData);

            if (response.success) {
                const user = response.user;
                const isAdminOrStaff = user?.role === 'professor' || user?.role === 'staff';
                navigate(isAdminOrStaff ? '/admin/home' : '/home');
            }
        } catch (error: any) {
            console.error('Signup error:', error);
            if (error.response) {
                const message = error.response.data?.message || 'Registration failed. Please try again.';
                setApiError(message);
            } else if (error.request) {
                setApiError('Unable to connect to server. Please check your connection.');
            } else {
                setApiError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-muted/20">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-3xl font-bold text-primary">Create Account</CardTitle>
                    <CardDescription>Join Orchestrate UMS today</CardDescription>
                </CardHeader>
                <CardContent>
                    {apiError && (
                        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-6 text-sm border border-destructive/20">
                            {apiError}
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                                disabled={loading}
                                className={errors.name ? "border-destructive" : ""}
                            />
                            {errors.name && <span className="text-destructive text-sm">{errors.name}</span>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                disabled={loading}
                                className={errors.email ? "border-destructive" : ""}
                            />
                            {errors.email && <span className="text-destructive text-sm">{errors.email}</span>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                                onValueChange={handleRoleChange}
                                defaultValue={formData.role}
                                disabled={loading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="student">Student</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                    <SelectItem value="professor">Professor</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.role === 'student' && (
                            <div className="space-y-2">
                                <Label htmlFor="maxCredits">Maximum Credits</Label>
                                <Input
                                    type="number"
                                    id="maxCredits"
                                    name="maxCredits"
                                    value={formData.maxCredits}
                                    onChange={handleChange}
                                    placeholder="Enter max credits (e.g., 18)"
                                    min={1}
                                    max={30}
                                    disabled={loading}
                                    className={errors.maxCredits ? "border-destructive" : ""}
                                />
                                {errors.maxCredits && <span className="text-destructive text-sm">{errors.maxCredits}</span>}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Create a strong password"
                                disabled={loading}
                                className={errors.password ? "border-destructive" : ""}
                            />
                            {errors.password && <span className="text-destructive text-sm">{errors.password}</span>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Re-enter your password"
                                disabled={loading}
                                className={errors.confirmPassword ? "border-destructive" : ""}
                            />
                            {errors.confirmPassword && <span className="text-destructive text-sm">{errors.confirmPassword}</span>}
                        </div>

                        <Button
                            type="submit"
                            className="w-full mt-4"
                            disabled={loading}
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="text-center text-sm text-muted-foreground justify-center">
                    <p>
                        Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Sign in here</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

export default Signup;
