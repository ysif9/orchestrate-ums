import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { RequestContext } from '@mikro-orm/core';
import { User, UserRole } from '../entities/User';
import { Student } from '../entities/Student';
import { Staff } from '../entities/Staff';
import { Professor } from '../entities/Professor';
import { TeachingAssistant } from '../entities/TeachingAssistant';
import { Parent } from '../entities/Parent';
import { ParentStudentLink } from '../entities/ParentStudentLink';
import authenticate, { AuthRequest } from '../middleware/auth';

const router = express.Router();

const generateToken = (userId: number, role: UserRole) => {
    return jwt.sign(
        { id: userId, role },
        process.env.JWT_SECRET as string,
        { expiresIn: process.env.JWT_EXPIRE || '7d' } as jwt.SignOptions
    );
};

const validatePasswordStrength = (password: string) => {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    return minLength && hasUppercase && hasLowercase && hasNumber;
};

router.post('/signup', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').custom((value) => {
        if (!validatePasswordStrength(value)) {
            throw new Error('Password must be at least 8 characters and contain uppercase, lowercase, and number');
        }
        return true;
    }),
    body('role').optional().isIn(['staff', 'professor', 'student', 'teaching_assistant', 'parent']).withMessage('Valid role is required'),
    body('maxCredits').optional().isInt({ min: 0 }).withMessage('Max credits must be a positive integer'),
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const { name, email, password, role, maxCredits } = req.body;

        const existingUser = await em.findOne(User, { email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        let user: User;
        const userRole = role || 'student';

        if (userRole === 'student') {
            user = new Student(name, email, password);
            if (maxCredits) (user as Student).maxCredits = maxCredits;
        } else if (userRole === 'staff') {
            user = new Staff(name, email, password);
        } else if (userRole === 'professor') {
            user = new Professor(name, email, password);
        } else if (userRole === 'teaching_assistant') {
            user = new TeachingAssistant(name, email, password);
        } else if (userRole === 'parent') {
            user = new Parent(name, email, password);
        } else {
            return res.status(400).json({ message: 'Invalid role' });
        }

        await em.persistAndFlush(user);

        const token = generateToken(user.id, user.role);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                maxCredits: userRole === 'student' ? (user as Student).maxCredits : undefined
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

router.post('/login', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const { email, password } = req.body;

        const user = await em.findOne(User, { email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const token = generateToken(user.id, user.role);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                maxCredits: user instanceof Student ? user.maxCredits : undefined
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

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const user = await em.findOne(User, { id: parseInt(req.user.id) });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                maxCredits: user instanceof Student ? user.maxCredits : undefined
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

/**
 * POST /auth/parent-login
 * Authenticate a parent using their unique linking code
 * This allows parents to login without creating a traditional account
 */
router.post('/parent-login', [
    body('linkingCode').trim().notEmpty().withMessage('Linking code is required'),
    body('parentName').optional().trim().notEmpty().withMessage('Parent name is required for first-time login'),
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const { linkingCode, parentName } = req.body;

        // 1. Find the student associated with this code
        const student = await em.findOne(Student, { linkingCode: linkingCode.toUpperCase() });

        if (!student) {
            return res.status(400).json({
                success: false,
                message: 'Invalid linking code. Please check the code provided by the student.'
            });
        }

        // 2. Check if a parent is linked to this student AT ALL
        // We enforce that a student can only be linked to ONE parent.
        const existingLink = await em.findOne(ParentStudentLink, {
            student
        }, {
            populate: ['parent']
        });

        let parent: Parent;

        if (existingLink) {
            // If the student is already linked, we MUST log in the parent who owns that link
            // regardless of the code used (as long as the code was valid to find the student, which we did in step 1)
            parent = existingLink.parent;
        } else {
            // New login attempt - no existing link for this student
            if (!parentName) {
                return res.status(400).json({
                    success: false,
                    message: 'Parent name is required for first-time login'
                });
            }

            // Create new parent
            // IMPORTANT: We do NOT set the parent's linkingCode to the student's linkingCode.
            // The parent gets their own unique code generated by createWithLinkingCode/BeforeCreate
            parent = Parent.createWithLinkingCode(parentName);

            // Create the link
            const link = new ParentStudentLink(parent, student, linkingCode.toUpperCase());

            await em.persistAndFlush([parent, link]);
        }

        // Generate JWT token
        const token = generateToken(parent.id, parent.role);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: parent.id,
                name: parent.name,
                email: parent.email,
                role: parent.role,
                // We don't return linkingCode here to avoid confusion, or return parent's own code
                linkingCode: parent.linkingCode
            }
        });
    } catch (error) {
        console.error('Parent login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during parent login'
        });
    }
});

export default router;
