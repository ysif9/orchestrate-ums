const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticate = require('../middleware/auth');

const router = express.Router();

/**
 * Generate JWT token
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @returns {string} JWT token
 */
const generateToken = (userId, role) => {
    return jwt.sign(
        { id: userId, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {boolean} True if password meets requirements
 */
const validatePasswordStrength = (password) => {
    // Minimum 8 characters, at least one uppercase, one lowercase, and one number
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    return minLength && hasUppercase && hasLowercase && hasNumber;
};

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post('/signup', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').custom((value) => {
        if (!validatePasswordStrength(value)) {
            throw new Error('Password must be at least 8 characters and contain uppercase, lowercase, and number');
        }
        return true;
    }),
    body('role').optional().isIn(['staff', 'professor', 'student']).withMessage('Valid role is required'),
    body('maxCredits').optional().isInt({ min: 0 }).withMessage('Max credits must be a positive integer'),
], async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const { name, email, password, role, maxCredits } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create new user (password will be hashed by pre-save hook)
        const user = new User({
            name,
            email,
            password,
            role: role || 'student',
            maxCredits: maxCredits || 18
        });

        await user.save();

        // Generate token
        const token = generateToken(user._id, user.role);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                maxCredits: user.maxCredits
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating user'
        });
    }
});

/**
 * POST /api/auth/login
 * Authenticate user and return token
 */
router.post('/login', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password using the comparePassword method from User model
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate token
        const token = generateToken(user._id, user.role);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                maxCredits: user.maxCredits
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during login'
        });
    }
});




/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, async (req, res) => {
    try {
        // req.user is set by authenticate middleware
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                maxCredits: user.maxCredits
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user'
        });
    }
});

module.exports = router;
