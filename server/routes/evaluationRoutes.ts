import express, { Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { PerformanceEvaluation } from '../entities/PerformanceEvaluation';
import { User, UserRole } from '../entities/User';
import authenticate, { AuthRequest } from '../middleware/auth';
import authorize from '../middleware/authorize';

const router = express.Router();

// GET /api/evaluations/my-evaluations
// Get evaluations for the current logged-in user (Faculty view)
router.get('/my-evaluations', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        const { userId } = req.query; // Assuming userId is passed via query or auth middleware should attach it.
        // In this project, it seems some routes expect userId in query for simplicity or client passes it.
        // Ideally, we use req.user.id from middleware.

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const evaluationRepo = em?.getRepository(PerformanceEvaluation);
        const parsedId = parseInt(userId as string);
        const evaluations = await evaluationRepo?.find(
            { evaluatee: { id: parsedId } },
            {
                populate: ['evaluator', 'evaluatee'],
                orderBy: { date: 'DESC' }
            }
        );

        res.json(evaluations);
    } catch (error) {
        console.error('Error fetching my evaluations:', error);
        res.status(500).json({ message: 'Error fetching evaluations' });
    }
});

// GET /api/evaluations/faculty/:facultyId
// Get evaluations for a specific faculty member (Staff view)
router.get('/faculty/:facultyId', authenticate, authorize(UserRole.Staff), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        const { facultyId } = req.params;

        const evaluationRepo = em?.getRepository(PerformanceEvaluation);
        const parsedFacultyId = parseInt(facultyId);
        const evaluations = await evaluationRepo?.find(
            { evaluatee: { id: parsedFacultyId } },
            {
                populate: ['evaluator'],
                orderBy: { date: 'DESC' }
            }
        );

        res.json(evaluations);
    } catch (error) {
        console.error('Error fetching faculty evaluations:', error);
        res.status(500).json({ message: 'Error fetching evaluations' });
    }
});

// POST /api/evaluations
// Create a new evaluation (Staff only)
router.post('/', authenticate, authorize(UserRole.Staff), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        const { evaluatorId, evaluateeId, date, ratings, comments } = req.body;

        if (!evaluatorId || !evaluateeId || !date) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Validate ratings if provided
        if (ratings) {
            const validRatingKeys = ['teaching', 'research', 'service'];
            for (const key of validRatingKeys) {
                if (ratings[key] !== undefined) {
                    const rating = Number(ratings[key]);
                    if (isNaN(rating) || rating < 1 || rating > 5) {
                        return res.status(400).json({
                            message: `Invalid rating for ${key}. Ratings must be between 1 and 5.`
                        });
                    }
                }
            }
        }

        const userRepo = em?.getRepository(User);
        const evaluator = await userRepo?.findOne({ id: Number(evaluatorId) });
        const evaluatee = await userRepo?.findOne({ id: Number(evaluateeId) });

        if (!evaluator || !evaluatee) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Optional: specific role checks
        // if (evaluator.role !== UserRole.Staff) { ... }

        const evaluation = new PerformanceEvaluation(
            evaluator,
            evaluatee,
            new Date(date),
            ratings,
            comments
        );

        await em?.persistAndFlush(evaluation);
        res.status(201).json(evaluation);
    } catch (error: any) {
        console.error('Error creating evaluation:', error);
        res.status(500).json({ message: 'Error creating evaluation', error: error.message || String(error) });
    }
});

export default router;
