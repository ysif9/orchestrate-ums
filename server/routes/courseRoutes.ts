import express, { Request, Response } from 'express';
import { RequestContext, FilterQuery } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Course, CourseType } from '../entities/Course';
import { User, UserRole } from '../entities/User';
import authenticate, { AuthRequest } from '../middleware/auth';
import authorize from '../middleware/authorize';

const router = express.Router();

// POST /api/courses - Professor and Staff only (CREATE COURSE)
router.post('/', authenticate, authorize(UserRole.Staff, UserRole.Professor), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const { code, title, description, type, credits, prerequisites, semester } = req.body;

        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const creator = await em.findOne(User, { id: parseInt(req.user.id) });
        if (!creator) return res.status(404).json({ message: 'Creator not found' });

        const course = new Course(code, title, type, credits);
        course.description = description;
        course.semester = semester;
        course.createdBy = creator;

        if (prerequisites && Array.isArray(prerequisites)) {
            for (const prereqId of prerequisites) {
                const prereq = await em.findOne(Course, { id: prereqId });
                if (prereq) {
                    course.prerequisites.add(prereq);
                }
            }
        }

        await em.persistAndFlush(course);

        res.status(201).json(course);
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
});

// PUT /api/courses/:id - Professor and Staff only
router.put('/:id', authenticate, authorize(UserRole.Staff, UserRole.Professor), async (req: Request, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const { code, title, description, type, credits, prerequisites, semester } = req.body;

        const course = await em.findOne(Course, { id: parseInt(req.params.id) }, { populate: ['prerequisites'] });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        course.code = code;
        course.title = title;
        course.description = description;
        course.type = type;
        course.credits = credits;
        course.semester = semester;

        if (prerequisites && Array.isArray(prerequisites)) {
            course.prerequisites.removeAll();
            for (const prereqId of prerequisites) {
                const prereq = await em.findOne(Course, { id: prereqId });
                if (prereq) {
                    course.prerequisites.add(prereq);
                }
            }
        }

        await em.flush();

        res.json(course);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE /api/courses/:id - Professor and Staff only
router.delete('/:id', authenticate, authorize(UserRole.Staff, UserRole.Professor), async (req: Request, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const course = await em.findOne(Course, { id: parseInt(req.params.id) });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        await em.removeAndFlush(course);

        res.json({ message: 'Course deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/courses - All authenticated users
router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const { level, credits, type, hasPrerequisites } = req.query;

        const filter: FilterQuery<Course> = {};

        if (level && level !== 'All') {
            filter.difficulty = level as any;
        }

        if (credits) {
            filter.credits = parseInt(credits as string);
        }

        if (type && type !== 'All') {
            filter.type = type as any;
        }

        // MikroORM doesn't support $exists directly in the same way for relations in simple find options easily without QueryBuilder for empty collections check
        // But we can filter in memory or use QueryBuilder. For simplicity, let's use basic filters first.
        // For prerequisites, we might need to join.

        // Let's use QueryBuilder for more complex filtering if needed, or just simple find for now.
        // Replicating Mongoose logic:
        // if (hasPrerequisites === 'true') {
        //     filter.prerequisites = { $exists: true, $ne: [] };
        // }

        // In MikroORM, checking for non-empty collection usually requires a join or a count.


        // const qb = em.getRepository(Course).createQueryBuilder().select('*');
        // Note: populate in QB is different, usually done via joins or select.
        // For simplicity, let's fetch and then populate or use find with options which is easier.
        // But sticking to QB as written:
        // qb.populate(['prerequisites']) // This method might not exist on QB directly in all versions or works differently.

        // Actually, for simple filtering, em.find is much easier and safer.
        // Let's revert to em.find with a filter object that supports operators if needed, 
        // or just use the filter object we built.

        // MikroORM find supports operators like $in, $gte, etc.
        // But for 'difficulty', 'credits', 'type', they are direct matches.

        const courses = await em.find(Course, filter, { populate: ['prerequisites'] });


        // In-memory filtering for prerequisites if needed (not efficient but works for small datasets)
        let result = courses;
        if (hasPrerequisites === 'true') {
            result = courses.filter(c => c.prerequisites.length > 0);
        } else if (hasPrerequisites === 'false') {
            result = courses.filter(c => c.prerequisites.length === 0);
        }

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/courses/:id (Get Single Course Details)
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const course = await em.findOne(Course, { id: parseInt(req.params.id) }, { populate: ['prerequisites'] });
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.json(course);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;