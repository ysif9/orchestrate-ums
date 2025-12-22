import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { RequestContext } from '@mikro-orm/core';
import { User, UserRole } from '../entities/User';
import { Student } from '../entities/Student';
import { Staff } from '../entities/Staff';
import { Professor } from '../entities/Professor';
import { TeachingAssistant } from '../entities/TeachingAssistant';
import { Parent } from '../entities/Parent';
import authenticate from '../middleware/auth';
import authorize from '../middleware/authorize';

const router = express.Router();

// POST /api/users - Professor and Staff only
router.post('/', authenticate, authorize(UserRole.Staff, UserRole.Professor), [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(['staff', 'professor', 'student', 'teaching_assistant', 'parent']).withMessage('Valid role is required'),
    body('maxCredits').optional().isInt({ min: 0 }).withMessage('Max credits must be a positive integer'),
], async (req: Request, res: Response) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const { name, email, password, role, maxCredits } = req.body;

        // Map string role to integer enum
        let roleEnum: UserRole;
        let user: User;
        switch (role) {
            case 'staff': roleEnum = UserRole.Staff; break;
            case 'professor': roleEnum = UserRole.Professor; break;
            case 'teaching_assistant': roleEnum = UserRole.TeachingAssistant; break;
            case 'parent': roleEnum = UserRole.Parent; break;
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
        } else if (roleEnum === UserRole.Parent) {
            user = new Parent(name, email, password);
        } else {
            return res.status(400).json({ message: 'Invalid role' });
        }

        await em.persistAndFlush(user);

        res.status(201).json(user);
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
});

// GET /api/users - Professor and Staff only
router.get('/', authenticate, authorize(UserRole.Staff, UserRole.Professor), async (req: Request, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const role = req.query.role as string;
        const filter: any = {};
        if (role) {
            filter.role = role;
        }

        const users = await em.find(User, filter);
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;