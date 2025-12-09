import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService.js';

function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect to appropriate home if already authenticated
    useEffect(() => {
        if (authService.isAuthenticated()) {
            const user = authService.getCurrentUser();
            const isAdminOrStaff = user?.role === 'professor' || user?.role === 'staff';
            navigate(isAdminOrStaff ? '/admin/home' : '/home', { replace: true });
        }
    }, [navigate]);

    /**
     * Validate form fields
     * @returns {boolean} True if form is valid
     */
    const validateForm = () => {
        const newErrors = {};

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

    /**
     * Handle input change
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
        // Clear API error when user starts typing
        if (apiError) {
            setApiError('');
        }
    };

    /**
     * Handle form submission
     */
    const handleSubmit = async (e) => {
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
                const isAdminOrStaff = user?.role === 'professor' || user?.role === 'staff';
                navigate(isAdminOrStaff ? '/admin/home' : '/home');
            }
        } catch (error) {
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
        <div className="min-h-screen flex items-center justify-center p-8">
            <div className="bg-surface rounded-xl shadow-card p-12 max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl mb-2 text-brand-500">Welcome Back</h1>
                    <p className="text-content-secondary">Sign in to your Orchestrate UMS account</p>
                </div>

                {apiError && (
                    <div className="bg-error-100 text-error-700 px-4 py-3 rounded-lg mb-6 text-sm border border-error-200">
                        {apiError}
                    </div>
                )}

                <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="email" className="text-content font-medium text-sm">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            disabled={loading}
                            className="px-4 py-3 border border-border rounded-lg text-base bg-surface text-content transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-surface-tertiary disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        {errors.email && (
                            <span className="text-error-600 text-sm">
                                {errors.email}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="password" className="text-content font-medium text-sm">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            disabled={loading}
                            className="px-4 py-3 border border-border rounded-lg text-base bg-surface text-content transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-surface-tertiary disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        {errors.password && (
                            <span className="text-error-600 text-sm">
                                {errors.password}
                            </span>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-content-inverse font-medium py-3 px-6 rounded-lg transition-colors shadow-button hover:shadow-button-hover disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <p className="text-content-secondary text-sm mb-2">
                        Prospective student? <Link to="/admissions" className="text-brand-500 hover:text-brand-600 font-medium underline">Apply for admission</Link>
                    </p>
                    <p className="text-content-secondary text-sm">
                        Don&apos;t have an account? <Link to="/signup" className="text-brand-500 hover:text-brand-600 font-medium underline">Sign up here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;

