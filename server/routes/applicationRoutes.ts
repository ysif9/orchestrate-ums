import express, { Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Application, ApplicationStatus } from '../entities/Application';
import { Applicant } from '../entities/Applicant';
import { Program } from '../entities/Program';
import { Semester, SemesterStatus } from '../entities/Semester';
import { UserRole } from '../entities/User';
import authenticate, { AuthRequest } from '../middleware/auth';
import authorize from '../middleware/authorize';
import { toFlatObject } from '../utils/eavHelpers';

const router = express.Router();

/**
 * GET /api/applications
 * List all applications with optional filtering by status
 * Requires Staff or Professor authorization
 */
router.get('/', authenticate, authorize(UserRole.Staff, UserRole.Professor), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ success: false, message: 'EntityManager not found' });

        const { status, program, limit = 50, offset = 0 } = req.query;

        let where: any = {};

        if (status && typeof status === 'string') {
            where.status = status;
        }

        if (program && typeof program === 'string') {
            where.program = { name: { $like: `%${program}%` } };
        }

        const [applications, total] = await em.findAndCount(Application, where, {
            limit: Number(limit),
            offset: Number(offset),
            orderBy: { submissionDate: 'DESC' },
            populate: ['applicant', 'applicant.attributes', 'applicant.attributes.attribute', 'semester', 'program', 'program.attributes', 'program.attributes.attribute'],
        });

        const formattedApplications = applications.map(app => {
            const data = { ...app } as any;
            if (app.applicant) {
                data.applicant = toFlatObject(app.applicant);
            }
            if (app.semester) {
                data.semester = app.semester.name;
            }
            return data;
        });

        res.json({
            success: true,
            data: formattedApplications,
            pagination: {
                total,
                limit: Number(limit),
                offset: Number(offset),
            },
        });
    } catch (error: any) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/applications/pending
 * Get all applications pending review
 * Requires Staff or Professor authorization
 */
router.get('/pending', authenticate, authorize(UserRole.Staff, UserRole.Professor), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ success: false, message: 'EntityManager not found' });

        const { limit = 50, offset = 0 } = req.query;

        const [applications, total] = await em.findAndCount(
            Application,
            { status: { $in: [ApplicationStatus.Pending, ApplicationStatus.UnderReview] } },
            {
                limit: Number(limit),
                offset: Number(offset),
                orderBy: { submissionDate: 'ASC' },
                populate: ['applicant', 'applicant.attributes', 'applicant.attributes.attribute', 'semester', 'program', 'program.attributes', 'program.attributes.attribute'],
            }
        );

        const formattedApplications = applications.map(app => {
            const data = { ...app } as any;
            if (app.applicant) {
                data.applicant = toFlatObject(app.applicant);
            }
            if (app.semester) {
                data.semester = app.semester.name;
            }
            return data;
        });

        res.json({
            success: true,
            data: formattedApplications,
            pagination: {
                total,
                limit: Number(limit),
                offset: Number(offset),
            },
        });
    } catch (error: any) {
        console.error('Error fetching pending applications:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/applications/:id
 * Get a single application by ID with all related data
 * Requires Staff or Professor authorization
 */
router.get('/:id', authenticate, authorize(UserRole.Staff, UserRole.Professor), [
    param('id').isInt().withMessage('Application ID must be an integer'),
], async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ success: false, message: 'EntityManager not found' });

        const application = await em.findOne(Application, { id: parseInt(req.params.id) }, {
            populate: ['applicant', 'applicant.attachments', 'applicant.attributes', 'applicant.attributes.attribute', 'semester', 'program', 'program.attributes', 'program.attributes.attribute'],
        });

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        const data = { ...application } as any;
        if (application.applicant) {
            data.applicant = toFlatObject(application.applicant);
        }
        if (application.semester) {
            data.semester = application.semester.name;
        }
        if (application.program) {
            data.program = toFlatObject(application.program);
        }

        res.json({ success: true, data });
    } catch (error: any) {
        console.error('Error fetching application:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/applications
 * Create a new application for an applicant
 * Requires Staff or Professor authorization
 */
router.post('/', authenticate, authorize(UserRole.Staff, UserRole.Professor), [
    body('applicantId').isInt().withMessage('Applicant ID is required and must be an integer'),
    body('program').trim().notEmpty().withMessage('Program is required'),
    body('semester').optional().trim(),
], async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ success: false, message: 'EntityManager not found' });

        const { applicantId, program, semester } = req.body;

        const applicant = await em.findOne(Applicant, { id: applicantId });
        if (!applicant) {
            return res.status(404).json({ success: false, message: 'Applicant not found' });
        }

        // Find program entity
        let programEntity: Program | null = null;
        if (!isNaN(Number(program))) {
            programEntity = await em.findOne(Program, { id: Number(program) });
        } else {
            // Map legacy strings to program names
            const programNameMap: Record<string, string> = {
                'cs': 'Computer Science',
                'ee': 'Electrical Engineering',
                'me': 'Mechanical Engineering',
                'ce': 'Civil Engineering',
                'arch': 'Architecture'
            };
            const programName = programNameMap[program] || program;
            programEntity = await em.findOne(Program, { name: programName });

            if (!programEntity) {
                // Auto-create program if it doesn't exist (optional, but convenient for migration)
                programEntity = new Program(programName);
                em.persist(programEntity);
            }
        }

        if (!programEntity) {
            return res.status(400).json({ success: false, message: 'Invalid program selection' });
        }

        // Find semester entity
        let semesterEntity = await em.findOne(Semester, { name: semester });
        if (!semesterEntity && semester && !isNaN(Number(semester))) {
            semesterEntity = await em.findOne(Semester, { id: Number(semester) });
        }

        if (!semesterEntity) {
            semesterEntity = await em.findOne(Semester, { status: SemesterStatus.Active });
            if (!semesterEntity) {
                semesterEntity = await em.findOne(Semester, {});
            }
        }

        if (!semesterEntity) {
            return res.status(400).json({ success: false, message: 'No valid semester found/defined' });
        }

        const application = new Application(applicant, programEntity, semesterEntity);

        await em.persistAndFlush(application);
        await em.populate(application, ['applicant', 'semester', 'program', 'program.attributes', 'program.attributes.attribute']);

        const responseData = { ...application } as any;
        responseData.applicant = toFlatObject(application.applicant);
        if (application.semester) {
            responseData.semester = application.semester.name;
        }
        if (application.program) {
            responseData.program = toFlatObject(application.program);
        }

        res.status(201).json({ success: true, data: responseData, message: 'Application created successfully' });
    } catch (error: any) {
        console.error('Error creating application:', error);
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                message: 'An application for this program and semester already exists for this applicant'
            });
        }
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * PUT /api/applications/:id
 * Update an application (primarily for status changes)
 * Requires Staff or Professor authorization
 */
router.put('/:id', authenticate, authorize(UserRole.Staff, UserRole.Professor), [
    param('id').isInt().withMessage('Application ID must be an integer'),
    body('status').optional().isIn(Object.values(ApplicationStatus)).withMessage('Invalid status'),
    body('program').optional().trim().notEmpty().withMessage('Program cannot be empty'),
    body('semester').optional().trim(),
], async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ success: false, message: 'EntityManager not found' });

        const application = await em.findOne(Application, { id: parseInt(req.params.id) }, {
            populate: ['applicant', 'semester', 'program', 'program.attributes', 'program.attributes.attribute'],
        });
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        const { status, program, semester } = req.body;

        if (status !== undefined) application.status = status as ApplicationStatus;

        if (program !== undefined) {
            let programEntity: Program | null = null;
            if (!isNaN(Number(program))) {
                programEntity = await em.findOne(Program, { id: Number(program) });
            } else {
                const programNameMap: Record<string, string> = {
                    'cs': 'Computer Science',
                    'ee': 'Electrical Engineering',
                    'me': 'Mechanical Engineering',
                    'ce': 'Civil Engineering',
                    'arch': 'Architecture'
                };
                const programName = programNameMap[program] || program;
                programEntity = await em.findOne(Program, { name: programName });
            }
            if (programEntity) {
                application.program = programEntity as any;
            }
        }

        if (semester !== undefined) {
            let semesterEntity = await em.findOne(Semester, { name: semester });
            if (!semesterEntity && !isNaN(Number(semester))) {
                semesterEntity = await em.findOne(Semester, { id: Number(semester) });
            }
            if (semesterEntity) {
                application.semester = semesterEntity;
            }
        }

        await em.flush();
        await em.populate(application, ['program.attributes', 'program.attributes.attribute', 'applicant.attributes', 'applicant.attributes.attribute']);

        const responseData = { ...application } as any;
        if (application.applicant) responseData.applicant = toFlatObject(application.applicant);
        if (application.semester) responseData.semester = application.semester.name;
        if (application.program) responseData.program = toFlatObject(application.program);

        res.json({ success: true, data: responseData, message: 'Application updated successfully' });
    } catch (error: any) {
        console.error('Error updating application:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * PUT /api/applications/:id/status
 * Update application status (convenience endpoint)
 * Requires Staff or Professor authorization
 */
router.put('/:id/status', authenticate, authorize(UserRole.Staff, UserRole.Professor), [
    param('id').isInt().withMessage('Application ID must be an integer'),
    body('status').isIn(Object.values(ApplicationStatus)).withMessage('Invalid status'),
], async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ success: false, message: 'EntityManager not found' });

        const application = await em.findOne(Application, { id: parseInt(req.params.id) }, {
            populate: ['applicant', 'semester', 'program', 'program.attributes', 'program.attributes.attribute'],
        });
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        application.status = req.body.status;
        await em.flush();

        const responseData = { ...application } as any;
        if (application.applicant) responseData.applicant = toFlatObject(application.applicant);
        if (application.semester) responseData.semester = application.semester.name;
        if (application.program) responseData.program = toFlatObject(application.program);

        res.json({ success: true, data: responseData, message: `Application status updated to ${req.body.status}` });
    } catch (error: any) {
        console.error('Error updating application status:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * DELETE /api/applications/:id
 * Delete an application
 * Requires Staff or Professor authorization
 */
router.delete('/:id', authenticate, authorize(UserRole.Staff, UserRole.Professor), [
    param('id').isInt().withMessage('Application ID must be an integer'),
], async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ success: false, message: 'EntityManager not found' });

        const application = await em.findOne(Application, { id: parseInt(req.params.id) });
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        await em.removeAndFlush(application);

        res.json({ success: true, message: 'Application deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting application:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;

