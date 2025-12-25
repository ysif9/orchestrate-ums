import express, { Request, Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { Enrollment, EnrollmentStatus } from '../entities/Enrollment';
import { Course } from '../entities/Course';
import { User, UserRole } from '../entities/User';
import { Semester, SemesterStatus } from '../entities/Semester';
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
                populate: ['course', 'student', 'semester']
            });
        } else {
            // Staff and admin can see all enrollments
            enrollments = await em.find(Enrollment, {}, {
                populate: ['course', 'student', 'semester']
            });
        }

        res.json(enrollments);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/enrollments/course/:courseId - Get enrollments for a specific course
// Professors can see their course enrollments, staff can see all
router.get('/course/:courseId', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const courseId = parseInt(req.params.courseId);

        // Get the course to verify access
        const course = await em.findOne(Course, { id: courseId }, { populate: ['professor'] });
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Professors can only see enrollments for their own courses
        if (req.user.role === UserRole.Professor) {
            if (course.professor?.id !== parseInt(req.user.id)) {
                return res.status(403).json({ message: 'You can only view enrollments for your own courses' });
            }
        } else if (req.user.role !== UserRole.Staff) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const enrollments = await em.find(
            Enrollment,
            { course: { id: courseId } },
            {
                populate: ['student', 'semester'],
                orderBy: { student: { name: 'ASC' } }
            }
        );

        res.json({
            success: true,
            course: {
                id: course.id,
                code: course.code,
                title: course.title,
                credits: course.credits
            },
            enrollments: enrollments.map(e => ({
                id: e.id,
                studentId: e.student.id,
                studentName: e.student.name,
                studentEmail: e.student.email,
                status: e.status,
                semester: e.semester ? {
                    id: e.semester.id,
                    name: e.semester.name
                } : null,
                enrolledAt: e.createdAt
            })),
            totalStudents: enrollments.length
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});
// Validates prerequisites before allowing enrollment
router.post('/', authenticate, authorize(UserRole.Student), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const { course_code, semester_id } = req.body;

        // Use authenticated user's ID as the student
        const studentId = parseInt(req.user.id);

        // Verify the user exists and is a student
        const student = await em.findOne(User, { id: studentId });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Get active semester (or use provided semester_id if staff is enrolling)
        let semester: Semester | null = null;
        if (semester_id) {
            semester = await em.findOne(Semester, { id: parseInt(semester_id) });
            if (!semester) {
                return res.status(404).json({ message: 'Semester not found' });
            }
        } else {
            // For students, use active semester
            semester = await em.findOne(Semester, { status: SemesterStatus.Active });
            if (!semester) {
                return res.status(400).json({ message: 'No active semester found. Please contact staff.' });
            }
        }

        // Prevent enrollment in finalized semesters
        if (semester.status === SemesterStatus.Finalized) {
            return res.status(400).json({ message: 'Cannot enroll in a finalized semester' });
        }

        // Find the course by code and populate prerequisites
        const course = await em.findOne(Course, { code: course_code }, { populate: ['prerequisites'] });
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if student is already enrolled in this course for this semester
        const existingEnrollment = await em.findOne(Enrollment, {
            student: { id: studentId },
            course: { id: course.id },
            semester: { id: semester.id }
        });

        if (existingEnrollment) {
            // If enrollment exists, return error (handled by unique constraint, but provide better message)
            return res.status(400).json({
                message: 'You are already enrolled in this course for this semester'
            });
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

        // Create the enrollment (semester is required for new enrollments)
        if (!semester) {
            return res.status(400).json({ message: 'Semester is required for enrollment' });
        }
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
        await em.populate(enrollment, ['course', 'student', 'semester']);

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

// PUT /api/enrollments/:id - Update enrollment status (Staff only)
// Prevents changes to finalized semesters
router.put('/:id', authenticate, authorize(UserRole.Staff), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const enrollmentId = parseInt(req.params.id);
        const enrollment = await em.findOne(Enrollment, { id: enrollmentId }, {
            populate: ['semester']
        });

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }

        // Prevent changes to finalized semesters
        if (!enrollment.semester) {
            return res.status(400).json({
                message: 'Enrollment is missing semester information'
            });
        }
        if (enrollment.semester.status === SemesterStatus.Finalized) {
            return res.status(400).json({
                message: 'Cannot modify enrollment in a finalized semester'
            });
        }

        const { status } = req.body;
        if (status && Object.values(EnrollmentStatus).includes(status)) {
            enrollment.status = status as EnrollmentStatus;
            await em.flush();
        }

        await em.populate(enrollment, ['course', 'student', 'semester']);
        res.json(enrollment);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

export default router;