import express, { Request, Response } from 'express';
import { RequestContext, FilterQuery } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Course, CourseType, Difficulty } from '../entities/Course';
import { User, UserRole } from '../entities/User';
import { Semester } from '../entities/Semester';
import { updateEntityAttributes, toFlatObject } from '../utils/eavHelpers';
import authenticate, { AuthRequest } from '../middleware/auth';
import authorize from '../middleware/authorize';

const router = express.Router();

/**
 * Helper to identify dynamic attributes (anything not in the core entity schema)
 */
const getCourseAttributes = (body: any) => {
    const coreFields = ['code', 'title', 'description', 'type', 'credits', 'prerequisites', 'semester', 'professorId', 'difficulty', 'totalMarks', 'passingMarks', 'lessons'];
    return Object.keys(body)
        .filter(key => !coreFields.includes(key))
        .reduce((obj: any, key) => ({ ...obj, [key]: body[key] }), {});
};

// POST /api/courses - Professor and Staff only (CREATE COURSE)
router.post('/', authenticate, authorize(UserRole.Staff, UserRole.Professor), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const { code, title, description, type, credits, prerequisites, semester, professorId, difficulty } = req.body;

        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const creator = await em.findOne(User, { id: parseInt(req.user.id) });
        if (!creator) return res.status(404).json({ message: 'Creator not found' });

        // Parse enums if they come as strings
        const courseType = typeof type === 'string' ? (type === 'Core' ? CourseType.Core : CourseType.Elective) : type;
        const course = new Course(code, title, courseType, credits);

        course.description = description;
        course.createdBy = creator;

        // Lookup semester by ID if provided
        if (semester) {
            const semesterEntity = await em.findOne(Semester, { id: parseInt(semester) });
            if (semesterEntity) {
                course.semester = semesterEntity;
            }
        }

        if (difficulty) {
            course.difficulty = typeof difficulty === 'string' ? Difficulty[difficulty as keyof typeof Difficulty] : difficulty;
        }

        if (professorId) {
            const professor = await em.findOne(User, { id: parseInt(professorId), role: UserRole.Professor });
            if (professor) {
                course.professor = professor;
            }
        }

        if (prerequisites && Array.isArray(prerequisites)) {
            for (const prereqId of prerequisites) {
                const prereq = await em.findOne(Course, { id: prereqId });
                if (prereq) {
                    course.prerequisites.add(prereq);
                }
            }
        }

        await em.persistAndFlush(course);

        // Handle dynamic attributes (EAV) - course now has an ID
        const attributes = getCourseAttributes(req.body);
        await updateEntityAttributes(em, course, 'Course', attributes);

        await em.flush();

        res.status(201).json(toFlatObject(course));
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
});

// PUT /api/courses/:id - Professor and Staff only
router.put('/:id', authenticate, authorize(UserRole.Staff, UserRole.Professor), async (req: Request, res: Response) => {
    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const { code, title, description, type, credits, prerequisites, semester, professorId, difficulty } = req.body;

        const course = await em.findOne(Course, { id: parseInt(req.params.id) }, { populate: ['prerequisites'] });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (code) course.code = code;
        if (title) course.title = title;
        if (description !== undefined) course.description = description;
        if (type) course.type = typeof type === 'string' ? (type === 'Core' ? CourseType.Core : CourseType.Elective) : type;
        if (credits) course.credits = credits;

        // Lookup semester by ID if provided
        if (semester !== undefined) {
            if (semester) {
                const semesterEntity = await em.findOne(Semester, { id: parseInt(semester) });
                if (semesterEntity) {
                    course.semester = semesterEntity;
                }
            } else {
                course.semester = undefined;
            }
        }

        if (difficulty) {
            course.difficulty = typeof difficulty === 'string' ? Difficulty[difficulty as keyof typeof Difficulty] : difficulty;
        }

        if (professorId) {
            const professor = await em.findOne(User, { id: parseInt(professorId), role: UserRole.Professor });
            if (professor) {
                course.professor = professor;
            }
        } else if (professorId === null) {
            course.professor = undefined;
        }

        if (prerequisites && Array.isArray(prerequisites)) {
            course.prerequisites.removeAll();
            for (const prereqId of prerequisites) {
                const prereq = await em.findOne(Course, { id: prereqId });
                if (prereq) {
                    course.prerequisites.add(prereq);
                }
            }
        }

        // Handle dynamic attributes (EAV)
        const attributes = getCourseAttributes(req.body);
        await updateEntityAttributes(em, course, 'Course', attributes);

        await em.flush();

        res.json(toFlatObject(course));
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
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const { difficulty, credits, type, hasPrerequisites } = req.query;

        const filter: FilterQuery<Course> = {};

        if (difficulty && difficulty !== 'All') {
            filter.difficulty = (typeof difficulty === 'string' ? Difficulty[difficulty as keyof typeof Difficulty] : difficulty) as any;
        }

        if (credits) {
            filter.credits = parseInt(credits as string);
        }

        if (type && type !== 'All') {
            filter.type = (typeof type === 'string' ? (type === 'Core' ? CourseType.Core : CourseType.Elective) : type) as any;
        }

        const courses = await em.find(Course, filter, {
            populate: ['prerequisites', 'professor', 'semester', 'attributes.attribute']
        });

        let result = courses;
        if (hasPrerequisites === 'true') {
            result = courses.filter(c => c.prerequisites.length > 0);
        } else if (hasPrerequisites === 'false') {
            result = courses.filter(c => c.prerequisites.length === 0);
        }

        res.json(result.map(c => toFlatObject(c)));
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/courses/:id (Get Single Course Details)
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const course = await em.findOne(Course, { id: parseInt(req.params.id) }, {
            populate: ['prerequisites', 'professor', 'semester', 'attributes.attribute']
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.json(toFlatObject(course));
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;