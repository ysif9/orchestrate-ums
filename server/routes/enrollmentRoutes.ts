import express, { Request, Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { Enrollment, EnrollmentStatus } from '../entities/Enrollment';
import { Course } from '../entities/Course';
import { User, UserRole } from '../entities/User';
import authenticate, { AuthRequest } from '../middleware/auth';
import authorize from '../middleware/authorize';

const router = express.Router();

// GET /api/enrollments - All authenticated users
// Students see only their enrollments, staff/admin see all
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        let enrollments;

        // If user is a student, only show their enrollments
        if (req.user.role === UserRole.Student) {
            enrollments = await em.find(Enrollment, { student: { id: parseInt(req.user.id) } }, {
                populate: ['course', 'student']
            });
        } else {
            // Staff and admin can see all enrollments
            enrollments = await em.find(Enrollment, {}, {
                populate: ['course', 'student']
            });
        }

        res.json(enrollments);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/enrollments - Students only
// Validates prerequisites before allowing enrollment
router.post('/', authenticate, authorize(UserRole.Student), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const { course_code, semester } = req.body;

        // Use authenticated user's ID as the student
        const studentId = parseInt(req.user.id);

        // Verify the user exists and is a student
        const student = await em.findOne(User, { id: studentId });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Find the course by code and populate prerequisites
        const course = await em.findOne(Course, { code: course_code }, { populate: ['prerequisites'] });
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check prerequisites if the course has any
        if (course.prerequisites.length > 0) {
            // Get all completed enrollments for this student
            const completedEnrollments = await em.find(Enrollment, {
                student: { id: studentId },
                status: EnrollmentStatus.Completed
            }, { populate: ['course'] });

            const completedCourseIds = completedEnrollments.map(e => e.course.id);

            // Check if all prerequisites are met
            const missingPrerequisites = course.prerequisites.getItems().filter(
                prereq => !completedCourseIds.includes(prereq.id)
            );

            if (missingPrerequisites.length > 0) {
                const missingCourseNames = missingPrerequisites.map(p => `${p.code} - ${p.title}`).join(', ');

                return res.status(400).json({
                    message: `Cannot enroll: You must complete the following prerequisite course(s) first: ${missingCourseNames}`,
                    missingPrerequisites: missingPrerequisites.map(p => ({
                        code: p.code,
                        title: p.title
                    }))
                });
            }
        }

        // Create the enrollment
        const enrollment = new Enrollment(student, course, semester);

        try {
            await em.persistAndFlush(enrollment);
        } catch (e: any) {
            if (e.code === '23505') { // Unique violation code for Postgres
                return res.status(400).json({
                    message: 'You are already enrolled in this course for this semester'
                });
            }
            throw e;
        }

        // Populate the enrollment before sending response
        await em.populate(enrollment, ['course', 'student']);

        res.status(201).json(enrollment);
    } catch (error: any) {
        // Handle duplicate enrollment error (generic catch if specific code check fails or for other DBs)
        if (error.message.includes('unique constraint')) {
            return res.status(400).json({
                message: 'You are already enrolled in this course for this semester'
            });
        }
        res.status(400).json({ message: error.message });
    }
});

export default router;