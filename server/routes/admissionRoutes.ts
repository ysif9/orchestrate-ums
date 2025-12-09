import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Applicant } from '../entities/Applicant';
import { Application, ApplicationStatus } from '../entities/Application';

const router = express.Router();

/**
 * Available programs for admission
 */
const PROGRAMS = [
    { id: 'cs', name: 'Computer Science', department: 'Engineering' },
    { id: 'ee', name: 'Electrical Engineering', department: 'Engineering' },
    { id: 'me', name: 'Mechanical Engineering', department: 'Engineering' },
    { id: 'ce', name: 'Civil Engineering', department: 'Engineering' },
    { id: 'arch', name: 'Architecture', department: 'Engineering' },
];

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
        res.json({
            success: true,
            data: ADMISSION_INFO,
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
            applicant = new Applicant(firstName, lastName, email);
            if (phone) applicant.phone = phone;
            if (address) applicant.address = address;
            if (academicHistory) applicant.academicHistory = academicHistory;
            if (personalInfo) applicant.personalInfo = personalInfo;

            await em.persistAndFlush(applicant);
        } else {
            // Update existing applicant's information
            applicant.firstName = firstName;
            applicant.lastName = lastName;
            if (phone) applicant.phone = phone;
            if (address) applicant.address = address;
            if (academicHistory) applicant.academicHistory = academicHistory;
            if (personalInfo) applicant.personalInfo = personalInfo;

            await em.flush();
        }

        // Check if an application for this program/semester already exists
        const existingApplication = await em.findOne(Application, {
            applicant,
            program,
            semester,
        });

        if (existingApplication) {
            return res.status(400).json({
                success: false,
                message: 'You have already submitted an application for this program and semester',
            });
        }

        // Create new application
        const application = new Application(applicant, program);
        application.semester = semester;
        application.status = ApplicationStatus.Pending;
        application.submissionDate = new Date();

        await em.persistAndFlush(application);

        res.status(201).json({
            success: true,
            data: {
                applicationId: application.id,
                applicantId: applicant.id,
                program,
                semester,
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
        });

        res.json({
            success: true,
            data: {
                applicantName: `${applicant.firstName} ${applicant.lastName}`,
                applications: applications.map(app => ({
                    id: app.id,
                    program: app.program,
                    semester: app.semester,
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
