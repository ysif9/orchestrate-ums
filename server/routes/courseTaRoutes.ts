import express, { Request, Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Course } from '../entities/Course';
import { CourseTA } from '../entities/CourseTA';
import { TeachingAssistant } from '../entities/TeachingAssistant';
import { UserRole } from '../entities/User';
import authenticate, { AuthRequest } from '../middleware/auth';
import authorize from '../middleware/authorize';

const router = express.Router({ mergeParams: true });

// GET /api/courses/my-assignments - Get courses assigned to the current TA
router.get('/my-assignments', authenticate, authorize(UserRole.TeachingAssistant), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        const taId = req.user?.id;

        if (!taId) return res.status(401).json({ message: 'Unauthorized' });

        const assignments = await em.find(CourseTA, { ta: { id: parseInt(taId) } }, { populate: ['course'] });
        res.json(assignments);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/courses/:courseId/tas - Get TAs for a course
router.get('/:courseId/tas', authenticate, async (req: Request, res: Response) => {
    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        const { courseId } = req.params;
        const tas = await em.find(CourseTA, { course: { id: parseInt(courseId) } }, { populate: ['ta'] });
        res.json(tas);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/courses/:courseId/tas - Assign a TA
router.post('/:courseId/tas', authenticate, authorize(UserRole.Staff, UserRole.Professor), async (req: Request, res: Response) => {
    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        const { courseId } = req.params;
        const { taId, responsibilities } = req.body;

        const course = await em.findOne(Course, { id: parseInt(courseId) });
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const ta = await em.findOne(TeachingAssistant, { id: parseInt(taId) });
        if (!ta) return res.status(404).json({ message: 'Teaching Assistant not found' });

        const existingAssignment = await em.findOne(CourseTA, { course, ta });
        if (existingAssignment) {
            return res.status(400).json({ message: 'TA already assigned to this course' });
        }

        const assignment = new CourseTA(ta, course, responsibilities);
        await em.persistAndFlush(assignment);

        res.status(201).json(assignment);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /api/courses/:courseId/tas/:taId - Remove a TA assignment
// Note: taId here refers to the User ID of the TA, not the assignment ID, for easier usage
router.delete('/:courseId/tas/:taId', authenticate, authorize(UserRole.Staff, UserRole.Professor), async (req: Request, res: Response) => {
    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        const { courseId, taId } = req.params;

        const assignment = await em.findOne(CourseTA, {
            course: { id: parseInt(courseId) },
            ta: { id: parseInt(taId) }
        });

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        await em.removeAndFlush(assignment);
        res.json({ message: 'TA removed from course' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
