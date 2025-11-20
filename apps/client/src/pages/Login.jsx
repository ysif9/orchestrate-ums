import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import '../styles/Auth.css';

function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [loading, setLoading] = useState(false);

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
                if (user.role === 'admin' || user.role === 'staff') {
                    navigate('/admin/courses');
                } else {
                    navigate('/courses');
                }
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
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Welcome Back</h1>
                    <p>Sign in to your Orchestrate UMS account</p>
                </div>

                {apiError && (
                    <div className="auth-error">
                        {apiError}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
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
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            disabled={loading}
                        />
                        {errors.password && (
                            <span style={{ color: 'var(--auth-danger)', fontSize: '0.875rem' }}>
                                {errors.password}
                            </span>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        className="auth-submit-btn"
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Don&apos;t have an account? <Link to="/signup">Sign up here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;

