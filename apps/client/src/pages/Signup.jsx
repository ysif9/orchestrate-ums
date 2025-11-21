import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import '../styles/Auth.css';

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
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Create Account</h1>
                    <p>Join Orchestrate UMS today</p>
                </div>

                {apiError && (
                    <div className="auth-error">
                        {apiError}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            disabled={loading}
                        />
                        {errors.name && (
                            <span style={{ color: 'var(--auth-danger)', fontSize: '0.875rem' }}>
                                {errors.name}
                            </span>
                        )}
                    </div>

                    <div className="auth-form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            disabled={loading}
                        />
                        {errors.email && (
                            <span style={{ color: 'var(--auth-danger)', fontSize: '0.875rem' }}>
                                {errors.email}
                            </span>
                        )}
                    </div>

                    <div className="auth-form-group">
                        <label htmlFor="role">Role</label>
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            disabled={loading}
                        >
                            <option value="student">Student</option>
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    {formData.role === 'student' && (
                        <div className="auth-form-group">
                            <label htmlFor="maxCredits">Maximum Credits</label>
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
                            />
                            {errors.maxCredits && (
                                <span style={{ color: 'var(--auth-danger)', fontSize: '0.875rem' }}>
                                    {errors.maxCredits}
                                </span>
                            )}
                        </div>
                    )}

                    <div className="auth-form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a strong password"
                            disabled={loading}
                        />
                        {errors.password && (
                            <span style={{ color: 'var(--auth-danger)', fontSize: '0.875rem' }}>
                                {errors.password}
                            </span>
                        )}
                    </div>

                    <div className="auth-form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Re-enter your password"
                            disabled={loading}
                        />
                        {errors.confirmPassword && (
                            <span style={{ color: 'var(--auth-danger)', fontSize: '0.875rem' }}>
                                {errors.confirmPassword}
                            </span>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        className="auth-submit-btn"
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account? <Link to="/login">Sign in here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Signup;

