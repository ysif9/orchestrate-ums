import express, { Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { ApplicationReview, FinalDecision } from '../entities/ApplicationReview';
import { Application, ApplicationStatus } from '../entities/Application';
import { User, UserRole } from '../entities/User';
import authenticate, { AuthRequest } from '../middleware/auth';
import authorize from '../middleware/authorize';
import { updateEntityAttributes, toFlatObject } from '../utils/eavHelpers';

const router = express.Router();

/**
 * GET /api/reviews
 * List all application reviews
 * Requires Staff or Professor authorization
 */
router.get('/', authenticate, authorize(UserRole.Staff, UserRole.Professor), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ success: false, message: 'EntityManager not found' });

        const { applicationId, reviewerId, limit = 50, offset = 0 } = req.query;

        let where: any = {};

        if (applicationId) {
            where.application = { id: Number(applicationId) };
        }

        if (reviewerId) {
            where.reviewer = { id: Number(reviewerId) };
        }

        const [reviews, total] = await em.findAndCount(ApplicationReview, where, {
            limit: Number(limit),
            offset: Number(offset),
            orderBy: { reviewedAt: 'DESC' },
            populate: ['application', 'application.applicant', 'reviewer', 'attributes', 'attributes.attribute'],
        });

        res.json({
            success: true,
            data: reviews.map(r => toFlatObject(r)),
            pagination: {
                total,
                limit: Number(limit),
                offset: Number(offset),
            },
        });
    } catch (error: any) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/reviews/application/:applicationId
 * Get all reviews for a specific application
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

        const reviews = await em.find(
            ApplicationReview,
            { application: { id: parseInt(req.params.applicationId) } },
            {
                orderBy: { reviewedAt: 'DESC' },
                populate: ['reviewer', 'attributes', 'attributes.attribute'],
            }
        );

        res.json({ success: true, data: reviews.map(r => toFlatObject(r)) });
    } catch (error: any) {
        console.error('Error fetching reviews for application:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/reviews/:id
 * Get a single review by ID
 * Requires Staff or Professor authorization
 */
router.get('/:id', authenticate, authorize(UserRole.Staff, UserRole.Professor), [
    param('id').isInt().withMessage('Review ID must be an integer'),
], async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ success: false, message: 'EntityManager not found' });

        const review = await em.findOne(ApplicationReview, { id: parseInt(req.params.id) }, {
            populate: ['application', 'application.applicant', 'reviewer', 'attributes', 'attributes.attribute'],
        });

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        res.json({ success: true, data: toFlatObject(review) });
    } catch (error: any) {
        console.error('Error fetching review:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/reviews
 * Submit a new application review
 * Requires Staff or Professor authorization
 * Automatically updates application status based on decision
 */
router.post('/', authenticate, authorize(UserRole.Staff, UserRole.Professor), [
    body('applicationId').isInt().withMessage('Application ID is required and must be an integer'),
    body('finalDecision').isInt().withMessage('Valid final decision (integer) is required'),
    body('scoringRubric').optional().isObject().withMessage('Scoring rubric must be an object'),
    body('comments').optional().trim(),
], async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ success: false, message: 'EntityManager not found' });

        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const { applicationId, finalDecision, scoringRubric, comments } = req.body;

        // Find the application
        const application = await em.findOne(Application, { id: applicationId }, {
            populate: ['applicant'],
        });
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Find the reviewer (current user)
        const reviewer = await em.findOne(User, { id: parseInt(req.user.id) });
        if (!reviewer) {
            return res.status(404).json({ success: false, message: 'Reviewer not found' });
        }

        // Create the review
        const review = new ApplicationReview(application, reviewer, Number(finalDecision));
        await em.persist(review);

        // Update EAV attributes
        const eavData: any = {};
        if (scoringRubric) Object.assign(eavData, scoringRubric);
        if (comments) eavData.comments = comments;

        if (Object.keys(eavData).length > 0) {
            await updateEntityAttributes(em, review, 'ApplicationReview', eavData);
        }

        // Update application status based on decision
        const statusMap: Record<number, ApplicationStatus> = {
            [FinalDecision.Accepted]: ApplicationStatus.Accepted,
            [FinalDecision.Rejected]: ApplicationStatus.Rejected,
            [FinalDecision.Waitlisted]: ApplicationStatus.Waitlisted,
        };
        application.status = statusMap[Number(finalDecision)];

        await em.flush();
        await em.populate(review, ['attributes', 'attributes.attribute']);

        res.status(201).json({
            success: true,
            data: toFlatObject(review),
            message: `Review submitted successfully. Application status updated to ${application.status}`,
        });
    } catch (error: any) {
        console.error('Error creating review:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * PUT /api/reviews/:id
 * Update an existing review
 * Requires Staff or Professor authorization
 * Only the original reviewer or staff can update
 */
router.put('/:id', authenticate, authorize(UserRole.Staff, UserRole.Professor), [
    param('id').isInt().withMessage('Review ID must be an integer'),
    body('finalDecision').optional().isInt().withMessage('Invalid final decision (must be integer)'),
    body('scoringRubric').optional().isObject().withMessage('Scoring rubric must be an object'),
    body('comments').optional().trim(),
], async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ success: false, message: 'EntityManager not found' });

        const review = await em.findOne(ApplicationReview, { id: parseInt(req.params.id) }, {
            populate: ['application', 'reviewer'],
        });
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        const { finalDecision, scoringRubric, comments } = req.body;

        if (finalDecision !== undefined) {
            review.finalDecision = Number(finalDecision);

            // Update application status based on new decision
            const statusMap: Record<number, ApplicationStatus> = {
                [FinalDecision.Accepted]: ApplicationStatus.Accepted,
                [FinalDecision.Rejected]: ApplicationStatus.Rejected,
                [FinalDecision.Waitlisted]: ApplicationStatus.Waitlisted,
            };
            review.application.status = statusMap[Number(finalDecision)];
        }

        // Update EAV attributes
        const eavData: any = {};
        if (scoringRubric) Object.assign(eavData, scoringRubric);
        if (comments) eavData.comments = comments;

        if (Object.keys(eavData).length > 0) {
            await updateEntityAttributes(em, review, 'ApplicationReview', eavData);
        }

        // Update the reviewed timestamp
        review.reviewedAt = new Date();

        await em.flush();
        await em.populate(review, ['attributes', 'attributes.attribute']);

        res.json({ success: true, data: toFlatObject(review), message: 'Review updated successfully' });
    } catch (error: any) {
        console.error('Error updating review:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * DELETE /api/reviews/:id
 * Delete a review
 * Requires Staff or Professor authorization
 */
router.delete('/:id', authenticate, authorize(UserRole.Staff, UserRole.Professor), [
    param('id').isInt().withMessage('Review ID must be an integer'),
], async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ success: false, message: 'EntityManager not found' });

        const review = await em.findOne(ApplicationReview, { id: parseInt(req.params.id) }, {
            populate: ['application'],
        });
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        // Reset application status to under_review when review is deleted
        review.application.status = ApplicationStatus.UnderReview;

        await em.removeAndFlush(review);

        res.json({ success: true, message: 'Review deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting review:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;

