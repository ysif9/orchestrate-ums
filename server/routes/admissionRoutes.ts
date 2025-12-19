import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Applicant } from '../entities/Applicant';
import { Application, ApplicationStatus } from '../entities/Application';
import { Program } from '../entities/Program';
import { Semester, SemesterStatus } from '../entities/Semester';
import { updateEntityAttributes, toFlatObject } from '../utils/eavHelpers';

const router = express.Router();

/**
 * Available programs for admission
 */
/**
 * Available programs for admission (will be fetched from DB)
 */
let PROGRAMS: any[] = [];

/**
 * Admission requirements and information
 */
const ADMISSION_INFO = {
    programs: PROGRAMS,
    requirements: [
        'High school diploma or equivalent certificate',
        'Minimum GPA of 3.0 on a 4.0 scale',
        'Completed application form with personal information',
        'Academic transcripts from previous institutions',
        'Personal statement (optional but recommended)',
        'Two letters of recommendation (optional)',
    ],
    deadlines: {
        fall: 'August 15, 2025',
        spring: 'January 15, 2026',
        summer: 'May 1, 2026',
    },
    semesters: [
        { id: 'fall-2025', name: 'Fall 2025' },
        { id: 'spring-2026', name: 'Spring 2026' },
        { id: 'summer-2026', name: 'Summer 2026' },
    ],
    contactEmail: 'admissions@ainshams.edu',
    contactPhone: '+20 2 2639 0000',
};

/**
 * GET /api/admissions/info
 * Get admission requirements and information
 * PUBLIC - No authentication required
 */
router.get('/info', async (req: Request, res: Response) => {
    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        const programs = await em.find(Program, {}, { populate: ['attributes', 'attributes.attribute'] });
        const formattedPrograms = programs.map(p => toFlatObject(p));

        res.json({
            success: true,
            data: {
                ...ADMISSION_INFO,
                programs: formattedPrograms
            },
        });
    } catch (error: any) {
        console.error('Error fetching admission info:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/admissions/apply
 * Submit a new admission application
 * PUBLIC - No authentication required
 * Creates an Applicant and Application record
 */
router.post('/apply', [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').optional().trim(),
    body('address').optional().trim(),
    body('program').trim().notEmpty().withMessage('Program selection is required'),
    body('semester').trim().notEmpty().withMessage('Semester selection is required'),
    body('academicHistory').optional().isObject().withMessage('Academic history must be an object'),
    body('personalInfo').optional().isObject().withMessage('Personal info must be an object'),
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const em = RequestContext.getEntityManager() as EntityManager;

        const {
            firstName,
            lastName,
            email,
            phone,
            address,
            program,
            semester,
            academicHistory,
            personalInfo,
        } = req.body;

        // Check if an applicant with this email already exists
        let applicant = await em.findOne(Applicant, { email });

        if (!applicant) {
            // Create new applicant
            applicant = new Applicant(firstName, lastName, email, phone || '');
            if (address) applicant.address = address;

            await em.persist(applicant);

            // Update EAV attributes
            const eavData = { ...academicHistory, ...personalInfo };
            await updateEntityAttributes(em, applicant, 'Applicant', eavData);

            await em.flush();
        } else {
            // Update existing applicant's information
            applicant.firstName = firstName;
            applicant.lastName = lastName;
            if (phone) applicant.phone = phone;
            if (address) applicant.address = address;

            // Update EAV attributes
            const eavData = { ...academicHistory, ...personalInfo };
            await updateEntityAttributes(em, applicant, 'Applicant', eavData);

            await em.flush();
        }

        // Find program entity
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

            if (!programEntity) {
                programEntity = new Program(programName);
                em.persist(programEntity);
            }
        }

        if (!programEntity) {
            return res.status(400).json({ success: false, message: 'Invalid program selection' });
        }

        // Find semester entity
        let semesterEntity = await em.findOne(Semester, { name: semester });
        if (!semesterEntity && !isNaN(Number(semester))) {
            semesterEntity = await em.findOne(Semester, { id: Number(semester) });
        }

        if (!semesterEntity) {
            // Fallback: use first active semester or any semester as default
            semesterEntity = await em.findOne(Semester, { status: SemesterStatus.Active });
            if (!semesterEntity) {
                semesterEntity = await em.findOne(Semester, {});
            }
        }

        if (!semesterEntity) {
            return res.status(400).json({ success: false, message: 'No valid semester found/defined' });
        }

        // Check if an application for this program/semester already exists
        const existingApplication = await em.findOne(Application, {
            applicant,
            program: programEntity,
            semester: semesterEntity,
        });

        if (existingApplication) {
            return res.status(400).json({
                success: false,
                message: 'You have already submitted an application for this program and semester',
            });
        }

        // Create new application
        const application = new Application(applicant, programEntity, semesterEntity);
        application.status = ApplicationStatus.Pending;
        application.submissionDate = new Date();

        await em.persistAndFlush(application);

        res.status(201).json({
            success: true,
            data: {
                applicationId: application.id,
                applicantId: applicant.id,
                program: application.program.name,
                semester: application.semester.name,
                status: application.status,
                submissionDate: application.submissionDate,
            },
            message: 'Application submitted successfully! You will receive an email confirmation shortly.',
        });
    } catch (error: any) {
        console.error('Error submitting application:', error);
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                message: 'An application with this information already exists',
            });
        }
        res.status(500).json({ success: false, message: 'Failed to submit application. Please try again.' });
    }
});

/**
 * GET /api/admissions/status/:email
 * Check application status by email
 * PUBLIC - No authentication required (simple status check)
 */
router.get('/status/:email', async (req: Request, res: Response) => {
    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        const { email } = req.params;

        const applicant = await em.findOne(Applicant, { email });

        if (!applicant) {
            return res.status(404).json({
                success: false,
                message: 'No applications found for this email address',
            });
        }

        const applications = await em.find(Application, { applicant }, {
            orderBy: { submissionDate: 'DESC' },
            populate: ['semester', 'program']
        });

        res.json({
            success: true,
            data: {
                applicantName: `${applicant.firstName} ${applicant.lastName}`,
                applications: applications.map(app => ({
                    id: app.id,
                    program: app.program.name,
                    semester: app.semester.name,
                    status: app.status,
                    submissionDate: app.submissionDate,
                })),
            },
        });
    } catch (error: any) {
        console.error('Error checking application status:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
