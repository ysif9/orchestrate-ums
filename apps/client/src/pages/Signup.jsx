import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';

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
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect to appropriate home if already authenticated
    useEffect(() => {
        if (authService.isAuthenticated()) {
            const user = authService.getCurrentUser();
            const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';
            navigate(isAdminOrStaff ? '/admin/home' : '/home', { replace: true });
        }
    }, [navigate]);

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {string|null} Error message or null if valid
     */
    const validatePassword = (password) => {
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

    /**
     * Validate form fields
     * @returns {boolean} True if form is valid
     */
    const validateForm = () => {
        const newErrors = {};

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

    /**
     * Handle input change
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        const newValue = name === 'maxCredits' ? parseInt(value) || '' : value;
        
        setFormData(prev => ({
            ...prev,
            [name]: newValue
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
            // Prepare data for API
            const signupData = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role
            };

            // Add maxCredits only for students
            if (formData.role === 'student') {
                signupData.maxCredits = formData.maxCredits;
            }

            const response = await authService.signup(signupData);

            if (response.success) {
                // Redirect based on user role
                const user = response.user;
                const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';
                navigate(isAdminOrStaff ? '/admin/home' : '/home');
            }
        } catch (error) {
            console.error('Signup error:', error);
            
            // Handle different error types
            if (error.response) {
                // Server responded with error
                const message = error.response.data?.message || 'Registration failed. Please try again.';
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
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
            <div className="bg-surface rounded-xl shadow-card p-12 max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl mb-2 text-brand-500">Create Account</h1>
                    <p className="text-content-secondary">Join Orchestrate UMS today</p>
                </div>

                {apiError && (
                    <div className="bg-error-100 text-error-700 px-4 py-3 rounded-lg mb-6 text-sm border border-error-200">
                        {apiError}
                    </div>
                )}

                <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="name" className="text-content font-medium text-sm">
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            disabled={loading}
                            className="px-4 py-3 border border-border rounded-lg text-base bg-surface text-content transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-surface-tertiary disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        {errors.name && (
                            <span className="text-error-600 text-sm">
                                {errors.name}
                            </span>
                        )}
                    </div>

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
                        <label htmlFor="role" className="text-content font-medium text-sm">
                            Role
                        </label>
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            disabled={loading}
                            className="px-4 py-3 border border-border rounded-lg text-base bg-surface text-content transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-surface-tertiary disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <option value="student">Student</option>
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    {formData.role === 'student' && (
                        <div className="flex flex-col gap-2">
                            <label htmlFor="maxCredits" className="text-content font-medium text-sm">
                                Maximum Credits
                            </label>
                            <input
                                type="number"
                                id="maxCredits"
                                name="maxCredits"
                                value={formData.maxCredits}
                                onChange={handleChange}
                                placeholder="Enter max credits (e.g., 18)"
                                min="1"
                                max="30"
                                disabled={loading}
                                className="px-4 py-3 border border-border rounded-lg text-base bg-surface text-content transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-surface-tertiary disabled:cursor-not-allowed disabled:opacity-60"
                            />
                            {errors.maxCredits && (
                                <span className="text-error-600 text-sm">
                                    {errors.maxCredits}
                                </span>
                            )}
                        </div>
                    )}

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
                            placeholder="Create a strong password"
                            disabled={loading}
                            className="px-4 py-3 border border-border rounded-lg text-base bg-surface text-content transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-surface-tertiary disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        {errors.password && (
                            <span className="text-error-600 text-sm">
                                {errors.password}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="confirmPassword" className="text-content font-medium text-sm">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Re-enter your password"
                            disabled={loading}
                            className="px-4 py-3 border border-border rounded-lg text-base bg-surface text-content transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-surface-tertiary disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        {errors.confirmPassword && (
                            <span className="text-error-600 text-sm">
                                {errors.confirmPassword}
                            </span>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-content-inverse font-medium py-3 px-6 rounded-lg transition-colors shadow-button hover:shadow-button-hover disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <p className="text-content-secondary text-sm">
                        Already have an account? <Link to="/login" className="text-brand-500 hover:text-brand-600 font-medium underline">Sign in here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Signup;

