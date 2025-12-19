import express, { Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Applicant } from '../entities/Applicant';
import { UserRole } from '../entities/User';
import authenticate, { AuthRequest } from '../middleware/auth';
import authorize from '../middleware/authorize';
import { updateEntityAttributes, toFlatObject } from '../utils/eavHelpers';

const router = express.Router();

/**
 * GET /api/applicants
 * List all applicants with optional filtering
 * Requires Staff or Professor authorization
 */
router.get('/', authenticate, authorize(UserRole.Staff, UserRole.Professor), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ success: false, message: 'EntityManager not found' });

        const { search, limit = 50, offset = 0 } = req.query;

        let where: any = {};

        // Search by name or email
        if (search && typeof search === 'string') {
            where = {
                $or: [
                    { firstName: { $like: `%${search}%` } },
                    { lastName: { $like: `%${search}%` } },
                    { email: { $like: `%${search}%` } },
                ],
            };
        }

        const [applicants, total] = await em.findAndCount(Applicant, where, {
            limit: Number(limit),
            offset: Number(offset),
            orderBy: { createdAt: 'DESC' },
            populate: ['attachments'],
        });

        res.json({
            success: true,
            data: applicants.map(a => toFlatObject(a)),
            pagination: {
                total,
                limit: Number(limit),
                offset: Number(offset),
            },
        });
    } catch (error: any) {
        console.error('Error fetching applicants:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/applicants/:id
 * Get a single applicant by ID with all related data
 * Requires Staff or Professor authorization
 */
router.get('/:id', authenticate, authorize(UserRole.Staff, UserRole.Professor), [
    param('id').isInt().withMessage('Applicant ID must be an integer'),
], async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ success: false, message: 'EntityManager not found' });

        const applicant = await em.findOne(Applicant, { id: parseInt(req.params.id) }, {
            populate: ['attachments', 'attributes', 'attributes.attribute'],
        });

        if (!applicant) {
            return res.status(404).json({ success: false, message: 'Applicant not found' });
        }

        res.json({ success: true, data: toFlatObject(applicant) });
    } catch (error: any) {
        console.error('Error fetching applicant:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/applicants
 * Create a new applicant
 * Requires Staff or Professor authorization
 */
router.post('/', authenticate, authorize(UserRole.Staff, UserRole.Professor), [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').optional().trim(),
    body('address').optional().trim(),
    body('academicHistory').optional().isObject().withMessage('Academic history must be an object'),
    body('personalInfo').optional().isObject().withMessage('Personal info must be an object'),
    body('documents').optional().isObject().withMessage('Documents must be an object'),
], async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ success: false, message: 'EntityManager not found' });

        const { firstName, lastName, email, phone, address, academicHistory, personalInfo, documents } = req.body;

        // Check if applicant with email already exists
        const existingApplicant = await em.findOne(Applicant, { email });
        if (existingApplicant) {
            return res.status(400).json({ success: false, message: 'An applicant with this email already exists' });
        }

        const applicant = new Applicant(firstName, lastName, email, phone || '');
        if (address) applicant.address = address;

        await em.persist(applicant);

        // Update EAV attributes
        const eavData = { ...academicHistory, ...personalInfo, ...documents };
        await updateEntityAttributes(em, applicant, 'Applicant', eavData);

        await em.flush();

        await em.populate(applicant, ['attributes', 'attributes.attribute']);
        res.status(201).json({ success: true, data: toFlatObject(applicant), message: 'Applicant created successfully' });
    } catch (error: any) {
        console.error('Error creating applicant:', error);
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: 'An applicant with this email already exists' });
        }
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * PUT /api/applicants/:id
 * Update an existing applicant
 * Requires Staff or Professor authorization
 */
router.put('/:id', authenticate, authorize(UserRole.Staff, UserRole.Professor), [
    param('id').isInt().withMessage('Applicant ID must be an integer'),
    body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('phone').optional().trim(),
    body('address').optional().trim(),
    body('academicHistory').optional().isObject().withMessage('Academic history must be an object'),
    body('personalInfo').optional().isObject().withMessage('Personal info must be an object'),
    body('documents').optional().isObject().withMessage('Documents must be an object'),
], async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ success: false, message: 'EntityManager not found' });

        const applicant = await em.findOne(Applicant, { id: parseInt(req.params.id) }, {
            populate: ['attributes', 'attributes.attribute']
        });
        if (!applicant) {
            return res.status(404).json({ success: false, message: 'Applicant not found' });
        }

        const { firstName, lastName, email, phone, address, academicHistory, personalInfo, documents } = req.body;

        if (firstName !== undefined) applicant.firstName = firstName;
        if (lastName !== undefined) applicant.lastName = lastName;
        if (email !== undefined) applicant.email = email;
        if (phone !== undefined) applicant.phone = phone;
        if (address !== undefined) applicant.address = address;

        // Update EAV attributes
        const eavData = { ...academicHistory, ...personalInfo, ...documents };
        await updateEntityAttributes(em, applicant, 'Applicant', eavData);

        await em.flush();

        res.json({ success: true, data: toFlatObject(applicant), message: 'Applicant updated successfully' });
    } catch (error: any) {
        console.error('Error updating applicant:', error);
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: 'An applicant with this email already exists' });
        }
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * DELETE /api/applicants/:id
 * Delete an applicant
 * Requires Staff or Professor authorization
 */
router.delete('/:id', authenticate, authorize(UserRole.Staff, UserRole.Professor), [
    param('id').isInt().withMessage('Applicant ID must be an integer'),
], async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ success: false, message: 'EntityManager not found' });

        const applicant = await em.findOne(Applicant, { id: parseInt(req.params.id) });
        if (!applicant) {
            return res.status(404).json({ success: false, message: 'Applicant not found' });
        }

        await em.removeAndFlush(applicant);

        res.json({ success: true, message: 'Applicant deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting applicant:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;

