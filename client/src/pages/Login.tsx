import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService.js';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"

function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState<any>({});
    const [apiError, setApiError] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect to appropriate home if already authenticated
    useEffect(() => {
        if (authService.isAuthenticated()) {
            const user = authService.getCurrentUser();
            if (user?.role === 'teaching_assistant') {
                navigate('/ta-dashboard', { replace: true });
            } else if (user?.role === 'parent') {
                navigate('/parent/home', { replace: true });
            } else {
                const isAdminOrStaff = user?.role === 'professor' || user?.role === 'staff';
                navigate(isAdminOrStaff ? '/admin/home' : '/home', { replace: true });
            }
        }
    }, [navigate]);

    const validateForm = () => {
        const newErrors: any = {};

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors((prev: any) => ({
                ...prev,
                [name]: ''
            }));
        }
        // Clear API error when user starts typing
        if (apiError) {
            setApiError('');
        }
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setApiError('');

        try {
            const response = await authService.login({
                email: formData.email,
                password: formData.password
            });

            if (response.success) {
                // Redirect based on user role
                const user = response.user;
                if (user?.role === 'teaching_assistant') {
                    navigate('/ta-dashboard');
                } else if (user?.role === 'parent') {
                    navigate('/parent/home');
                } else {
                    const isAdminOrStaff = user?.role === 'professor' || user?.role === 'staff';
                    navigate(isAdminOrStaff ? '/admin/home' : '/home');
                }
            }
        } catch (error: any) {
            console.error('Login error:', error);

            // Handle different error types
            if (error.response) {
                // Server responded with error
                const message = error.response.data?.message || 'Login failed. Please try again.';
                setApiError(message);
            } else if (error.request) {
                // Request made but no response
                setApiError('Unable to connect to server. Please check your connection.');
            } else {
                // Other errors
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
                    <CardTitle className="text-3xl font-bold text-primary">Welcome Back</CardTitle>
                    <CardDescription>Sign in to your Orchestrate UMS account</CardDescription>
                </CardHeader>
                <CardContent>
                    {apiError && (
                        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-6 text-sm border border-destructive/20">
                            {apiError}
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit}>
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
                            {errors.email && (
                                <span className="text-destructive text-sm">{errors.email}</span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                disabled={loading}
                                className={errors.password ? "border-destructive" : ""}
                            />
                            {errors.password && (
                                <span className="text-destructive text-sm">{errors.password}</span>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full mt-4"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
                    <p>
                        Parent? <Link to="/parent-login" className="text-primary hover:underline font-medium">Access Parent Portal</Link>
                    </p>
                    <p>
                        Prospective student? <Link to="/admissions" className="text-primary hover:underline font-medium">Apply for admission</Link>
                    </p>
                    <p>
                        Don&apos;t have an account? <Link to="/signup" className="text-primary hover:underline font-medium">Sign up here</Link>
                    </p>
                    <div className="mt-4 pt-4 border-t w-full">
                        <Link to="/news" className="text-primary hover:underline font-medium flex items-center justify-center gap-2">
                            View University Updates (News & Events)
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

export default Login;
