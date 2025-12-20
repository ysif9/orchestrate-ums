import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { RequestContext } from '@mikro-orm/core';
import { User, UserRole } from '../entities/User';
import { Student } from '../entities/Student';
import { Staff } from '../entities/Staff';
import { Professor } from '../entities/Professor';
import { TeachingAssistant } from '../entities/TeachingAssistant';
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
    body('role').optional().isIn(['staff', 'professor', 'student', 'teaching_assistant']).withMessage('Valid role is required'),
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

        // Map string role to integer enum
        let roleEnum: UserRole;
        let user: User;
        switch (role) {
            case 'staff': roleEnum = UserRole.Staff; break;
            case 'professor': roleEnum = UserRole.Professor; break;
            case 'teaching_assistant': roleEnum = UserRole.TeachingAssistant; break;
            case 'student':
            default: roleEnum = UserRole.Student; break;
        }

        if (roleEnum === UserRole.Student) {
            user = new Student(name, email, password);
            if (maxCredits) (user as Student).maxCredits = maxCredits;
        } else if (roleEnum === UserRole.Staff) {
            user = new Staff(name, email, password);
        } else if (roleEnum === UserRole.Professor) {
            user = new Professor(name, email, password);
        } else if (roleEnum === UserRole.TeachingAssistant) {
            user = new TeachingAssistant(name, email, password);
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
                maxCredits: user instanceof Student ? user.maxCredits : undefined
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

export default router;
