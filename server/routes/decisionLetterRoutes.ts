import express, { Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { DecisionLetter } from '../entities/DecisionLetter';
import { Application, ApplicationStatus } from '../entities/Application';
import { User, UserRole } from '../entities/User';
import authenticate, { AuthRequest } from '../middleware/auth';
import authorize from '../middleware/authorize';

const router = express.Router();

/**
 * Generate decision letter content based on application status
 */
function generateLetterContent(
    applicantName: string,
    program: string,
    status: ApplicationStatus,
    customContent?: string
): string {
    const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const templates: Record<string, string> = {
        [ApplicationStatus.Accepted]: `
Dear ${applicantName},

We are pleased to inform you that your application to the ${program} program has been accepted.

Congratulations on this achievement! Your academic credentials, personal statement, and overall application demonstrated the qualities we seek in our students.

${customContent ? `\n${customContent}\n` : ''}
Please review the enclosed enrollment information and complete the necessary steps to confirm your place in the program.

We look forward to welcoming you to our institution.

Sincerely,
Admissions Office
Date: ${date}
        `.trim(),

        [ApplicationStatus.Rejected]: `
Dear ${applicantName},

Thank you for your interest in the ${program} program and for taking the time to submit your application.

After careful consideration of your application materials, we regret to inform you that we are unable to offer you admission at this time.

${customContent ? `\n${customContent}\n` : ''}
We encourage you to continue pursuing your academic goals and wish you success in your future endeavors.

Sincerely,
Admissions Office
Date: ${date}
        `.trim(),

        [ApplicationStatus.Waitlisted]: `
Dear ${applicantName},

Thank you for your application to the ${program} program.

After reviewing your application, we have placed you on our waitlist. This means that while we cannot offer you immediate admission, you remain a strong candidate for our program.

${customContent ? `\n${customContent}\n` : ''}
We will notify you of any changes to your application status as soon as possible. In the meantime, please ensure your contact information remains current.

Sincerely,
Admissions Office
Date: ${date}
        `.trim(),
    };

    return templates[status] || `
Dear ${applicantName},

This letter is regarding your application to the ${program} program.

Your application is currently under review. We will notify you of our decision soon.

${customContent ? `\n${customContent}\n` : ''}
Sincerely,
Admissions Office
Date: ${date}
    `.trim();
}

/**
 * GET /api/decision-letters
 * List all decision letters
 * Requires Staff or Professor authorization
 */
router.get('/', authenticate, authorize(UserRole.Staff, UserRole.Professor), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ success: false, message: 'EntityManager not found' });

        const { applicationId, limit = 50, offset = 0 } = req.query;

        let where: any = {};

        if (applicationId) {
            where.application = { id: Number(applicationId) };
        }

        const [letters, total] = await em.findAndCount(DecisionLetter, where, {
            limit: Number(limit),
            offset: Number(offset),
            orderBy: { generatedAt: 'DESC' },
            populate: ['application', 'application.applicant', 'generatedBy'],
        });

        res.json({
            success: true,
            data: letters,
            pagination: {
                total,
                limit: Number(limit),
                offset: Number(offset),
            },
        });
    } catch (error: any) {
        console.error('Error fetching decision letters:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/decision-letters/application/:applicationId
 * Get all decision letters for a specific application
 * Requires Staff or Professor authorization
 */
router.get('/application/:applicationId', authenticate, authorize(UserRole.Staff, UserRole.Professor), [
    param('applicationId').isInt().withMessage('Application ID must be an integer'),
], async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ success: false, message: 'EntityManager not found' });

        const letters = await em.find(
            DecisionLetter,
            { application: { id: parseInt(req.params.applicationId) } },
            {
                orderBy: { generatedAt: 'DESC' },
                populate: ['generatedBy'],
            }
        );

        res.json({ success: true, data: letters });
    } catch (error: any) {
        console.error('Error fetching decision letters for application:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/decision-letters/:id
 * Get a single decision letter by ID
 * Requires Staff or Professor authorization
 */
router.get('/:id', authenticate, authorize(UserRole.Staff, UserRole.Professor), [
    param('id').isInt().withMessage('Letter ID must be an integer'),
], async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ success: false, message: 'EntityManager not found' });

        const letter = await em.findOne(DecisionLetter, { id: parseInt(req.params.id) }, {
            populate: ['application', 'application.applicant', 'generatedBy'],
        });

        if (!letter) {
            return res.status(404).json({ success: false, message: 'Decision letter not found' });
        }

        res.json({ success: true, data: letter });
    } catch (error: any) {
        console.error('Error fetching decision letter:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/decision-letters/generate
 * Generate a new decision letter for an application
 * Requires Staff or Professor authorization
 */
router.post('/generate', authenticate, authorize(UserRole.Staff, UserRole.Professor), [
    body('applicationId').isInt().withMessage('Application ID is required and must be an integer'),
    body('customContent').optional().trim(),
], async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ success: false, message: 'EntityManager not found' });

        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const { applicationId, customContent } = req.body;

        // Find the application with applicant data
        const application = await em.findOne(Application, { id: applicationId }, {
            populate: ['applicant', 'program'],
        });
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Check if application has a final decision
        const validStatuses = [ApplicationStatus.Accepted, ApplicationStatus.Rejected, ApplicationStatus.Waitlisted];
        if (!validStatuses.includes(application.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot generate decision letter. Application must have a final decision (accepted, rejected, or waitlisted).',
            });
        }

        // Find the user generating the letter
        const generatedBy = await em.findOne(User, { id: parseInt(req.user.id) });
        if (!generatedBy) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Generate the letter content
        const applicantName = `${application.applicant.firstName} ${application.applicant.lastName}`;
        const content = generateLetterContent(
            applicantName,
            application.program.name,
            application.status,
            customContent
        );

        // Create and save the decision letter
        const letter = new DecisionLetter(application, content, generatedBy);
        await em.persistAndFlush(letter);

        res.status(201).json({
            success: true,
            data: letter,
            message: 'Decision letter generated successfully',
        });
    } catch (error: any) {
        console.error('Error generating decision letter:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/decision-letters
 * Create a custom decision letter (with provided content)
 * Requires Staff or Professor authorization
 */
router.post('/', authenticate, authorize(UserRole.Staff, UserRole.Professor), [
    body('applicationId').isInt().withMessage('Application ID is required and must be an integer'),
    body('content').trim().notEmpty().withMessage('Letter content is required'),
], async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ success: false, message: 'EntityManager not found' });

        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const { applicationId, content } = req.body;

        const application = await em.findOne(Application, { id: applicationId });
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        const generatedBy = await em.findOne(User, { id: parseInt(req.user.id) });
        if (!generatedBy) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const letter = new DecisionLetter(application, content, generatedBy);
        await em.persistAndFlush(letter);

        res.status(201).json({
            success: true,
            data: letter,
            message: 'Decision letter created successfully',
        });
    } catch (error: any) {
        console.error('Error creating decision letter:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/decision-letters/:id/download
 * Download a decision letter as a text file
 * Requires Staff or Professor authorization
 */
router.get('/:id/download', authenticate, authorize(UserRole.Staff, UserRole.Professor), [
    param('id').isInt().withMessage('Letter ID must be an integer'),
], async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ success: false, message: 'EntityManager not found' });

        const letter = await em.findOne(DecisionLetter, { id: parseInt(req.params.id) }, {
            populate: ['application', 'application.applicant'],
        });

        if (!letter) {
            return res.status(404).json({ success: false, message: 'Decision letter not found' });
        }

        // Generate filename based on applicant name and date
        const applicantName = `${letter.application.applicant.firstName}_${letter.application.applicant.lastName}`.replace(/\s+/g, '_');
        const date = letter.generatedAt.toISOString().split('T')[0];
        const filename = `Decision_Letter_${applicantName}_${date}.txt`;

        // Set headers for file download
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', Buffer.byteLength(letter.content, 'utf8'));

        res.send(letter.content);
    } catch (error: any) {
        console.error('Error downloading decision letter:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * DELETE /api/decision-letters/:id
 * Delete a decision letter
 * Requires Staff or Professor authorization
 */
router.delete('/:id', authenticate, authorize(UserRole.Staff, UserRole.Professor), [
    param('id').isInt().withMessage('Letter ID must be an integer'),
], async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ success: false, message: 'EntityManager not found' });

        const letter = await em.findOne(DecisionLetter, { id: parseInt(req.params.id) });
        if (!letter) {
            return res.status(404).json({ success: false, message: 'Decision letter not found' });
        }

        await em.removeAndFlush(letter);

        res.json({ success: true, message: 'Decision letter deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting decision letter:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;

