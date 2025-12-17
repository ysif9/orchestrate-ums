import express from 'express';
import { RequestContext } from '@mikro-orm/core';
import { ProfessionalDevelopment, PDActivityType } from '../entities/ProfessionalDevelopment';
import { User, UserRole } from '../entities/User';

const router = express.Router();

// GET /api/pd/activities
router.get('/activities', async (req, res) => {
    try {
        const em = RequestContext.getEntityManager();
        const { userId } = req.query; // Optional filter by user ID (for staff)
        // TODO: proper auth middleware usage to get current user from request if not using args, 
        // but looking at other routes it seems we might need to rely on what's passed or assuming protected in a certain way.
        // However, usually we'd have req.user from middleware. I'll check authRoutes or similar to see how they handle it.
        // For now assuming we can filter.

        // Actually, let's check how other routes handle "current user". 
        // Usually via a middleware that populates req.user.
        // I will stick to basic implementation and refine if I see patterns in `userRoutes.ts`.

        const options: any = {};
        if (userId) {
            options.professor = userId;
        }

        const pdRepo = em?.getRepository(ProfessionalDevelopment);
        const activities = await pdRepo?.find(options, { populate: ['professor'] });

        res.json(activities);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching PD activities' });
    }
});

// POST /api/pd/activities
router.post('/activities', async (req, res) => {
    try {
        const em = RequestContext.getEntityManager();
        const { professorId, title, activityType, date, hours, provider, notes } = req.body;

        if (!professorId || !title || !activityType || !date || !hours || !provider) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const userRepo = em?.getRepository(User);
        const professor = await userRepo?.findOne({ id: professorId });

        if (!professor) {
            return res.status(404).json({ message: 'Professor not found' });
        }

        // Basic validation that user is professor or staff? 
        // The requirement says "Professional dev activities for faculty".

        const pd = new ProfessionalDevelopment(
            professor,
            title,
            activityType,
            new Date(date),
            hours,
            provider,
            notes
        );

        await em?.persistAndFlush(pd);
        res.status(201).json(pd);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating PD activity' });
    }
});

export default router;
