import express, { Request, Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { Semester, SemesterStatus } from '../entities/Semester';
import { Enrollment, EnrollmentStatus } from '../entities/Enrollment';
import { Assessment } from '../entities/Assessment';
import { Grade } from '../entities/Grade';
import authenticate, { AuthRequest } from '../middleware/auth';
import authorize from '../middleware/authorize';
import { UserRole } from '../entities/User';

const router = express.Router();

// GET /api/semesters - List all semesters (Staff only)
router.get('/', authenticate, authorize(UserRole.Staff), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const semesters = await em.find(Semester, {}, {
            orderBy: { startDate: 'DESC' }
        });

        res.json(semesters);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/semesters/active - Get currently active semester
router.get('/active', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const activeSemester = await em.findOne(Semester, { status: SemesterStatus.Active });

        if (!activeSemester) {
            return res.status(404).json({ message: 'No active semester found' });
        }

        res.json(activeSemester);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/semesters - Create new semester (Staff only)
router.post('/', authenticate, authorize(UserRole.Staff), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const { name, startDate, endDate, dropDate } = req.body;

        if (!name || !startDate || !endDate) {
            return res.status(400).json({ message: 'Name, startDate, and endDate are required' });
        }

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        const drop = dropDate ? new Date(dropDate) : null;

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: 'Invalid date format' });
        }

        if (drop && isNaN(drop.getTime())) {
            return res.status(400).json({ message: 'Invalid drop date format' });
        }

        if (end <= start) {
            return res.status(400).json({ message: 'End date must be after start date' });
        }

        if (drop && (drop < start || drop > end)) {
            return res.status(400).json({ message: 'Drop date must be between start date and end date' });
        }

        // Check if name already exists
        const existingSemester = await em.findOne(Semester, { name });
        if (existingSemester) {
            return res.status(400).json({ message: 'Semester with this name already exists' });
        }

        // Check for date overlaps with ALL existing semesters (not just active ones)
        // Overlap occurs when: newStart <= existingEnd AND newEnd >= existingStart
        const allSemesters = await em.find(Semester, {});
        
        const overlappingSemester = allSemesters.find(s => {
            return start <= s.endDate && end >= s.startDate;
        });

        if (overlappingSemester) {
            return res.status(400).json({ 
                message: 'Date range overlaps with an existing semester',
                overlappingSemester: overlappingSemester.name
            });
        }

        // Deactivate all existing active semesters before creating new one
        // This ensures only one active semester exists at a time
        const activeSemesters = await em.find(Semester, {
            status: SemesterStatus.Active
        });
        for (const active of activeSemesters) {
            active.status = SemesterStatus.Inactive;
        }

        // Create new semester and automatically set it as Active
        const semester = new Semester(name, start, end, drop || undefined);
        semester.status = SemesterStatus.Active;
        await em.persistAndFlush(semester);

        res.status(201).json(semester);
    } catch (error: any) {
        console.error('Error creating semester:', error);
        // Return more detailed error information
        const errorMessage = error.message || 'Failed to create semester';
        const statusCode = error.code === '23505' ? 400 : 500; // Unique constraint violation
        res.status(statusCode).json({ 
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// PUT /api/semesters/:id - Update semester (Staff only)
router.put('/:id', authenticate, authorize(UserRole.Staff), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const semesterId = parseInt(req.params.id);
        const semester = await em.findOne(Semester, { id: semesterId });

        if (!semester) {
            return res.status(404).json({ message: 'Semester not found' });
        }

        // Prevent changes to finalized semesters
        if (semester.status === SemesterStatus.Finalized) {
            return res.status(400).json({ message: 'Cannot modify a finalized semester' });
        }

        const { name, startDate, endDate, dropDate, status } = req.body;

        if (name !== undefined) {
            // Check if name already exists (excluding current semester)
            const existingSemester = await em.findOne(Semester, { name, id: { $ne: semesterId } });
            if (existingSemester) {
                return res.status(400).json({ message: 'Semester with this name already exists' });
            }
            semester.name = name;
        }

        if (startDate !== undefined) {
            const start = new Date(startDate);
            if (isNaN(start.getTime())) {
                return res.status(400).json({ message: 'Invalid start date format' });
            }
            semester.startDate = start;
        }

        if (endDate !== undefined) {
            const end = new Date(endDate);
            if (isNaN(end.getTime())) {
                return res.status(400).json({ message: 'Invalid end date format' });
            }
            semester.endDate = end;
        }

        if (dropDate !== undefined) {
            if (dropDate === null || dropDate === '') {
                semester.dropDate = undefined;
            } else {
                const drop = new Date(dropDate);
                if (isNaN(drop.getTime())) {
                    return res.status(400).json({ message: 'Invalid drop date format' });
                }
                semester.dropDate = drop;
            }
        }

        // Validate date order
        if (semester.endDate <= semester.startDate) {
            return res.status(400).json({ message: 'End date must be after start date' });
        }

        // Validate drop date is within semester range
        if (semester.dropDate) {
            if (semester.dropDate < semester.startDate || semester.dropDate > semester.endDate) {
                return res.status(400).json({ message: 'Drop date must be between start date and end date' });
            }
        }

        // Only allow status changes to Inactive or Active (not Finalized via this endpoint)
        if (status !== undefined && status !== SemesterStatus.Finalized) {
            if (status === SemesterStatus.Active) {
                // Deactivate other active semesters
                const otherActiveSemesters = await em.find(Semester, { 
                    status: SemesterStatus.Active,
                    id: { $ne: semesterId }
                });
                for (const other of otherActiveSemesters) {
                    other.status = SemesterStatus.Inactive;
                }
            }
            semester.status = status as SemesterStatus;
        }

        await em.flush();

        res.json(semester);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

// PUT /api/semesters/:id/activate - Activate semester (deactivates others) (Staff only)
router.put('/:id/activate', authenticate, authorize(UserRole.Staff), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const semesterId = parseInt(req.params.id);
        const semester = await em.findOne(Semester, { id: semesterId });

        if (!semester) {
            return res.status(404).json({ message: 'Semester not found' });
        }

        if (semester.status === SemesterStatus.Finalized) {
            return res.status(400).json({ message: 'Cannot activate a finalized semester' });
        }

        // Deactivate all other active semesters
        const activeSemesters = await em.find(Semester, { 
            status: SemesterStatus.Active,
            id: { $ne: semesterId }
        });
        for (const active of activeSemesters) {
            active.status = SemesterStatus.Inactive;
        }

        // Activate this semester
        semester.status = SemesterStatus.Active;
        await em.flush();

        res.json(semester);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

// PUT /api/semesters/:id/finalize - Finalize semester with validation (Staff only)
router.put('/:id/finalize', authenticate, authorize(UserRole.Staff), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const semesterId = parseInt(req.params.id);
        const semester = await em.findOne(Semester, { id: semesterId }, {
            populate: []
        });

        if (!semester) {
            return res.status(404).json({ message: 'Semester not found' });
        }

        if (semester.status === SemesterStatus.Finalized) {
            return res.status(400).json({ message: 'Semester is already finalized' });
        }

        // Get all enrollments for this semester
        const enrollments = await em.find(Enrollment, { 
            semester: { id: semesterId },
            status: EnrollmentStatus.Enrolled
        }, {
            populate: ['student', 'course']
        });

        // Validate that all assessments have grades for all enrolled students
        const missingGrades: Array<{
            studentId: number;
            studentName: string;
            courseCode: string;
            courseTitle: string;
            assessmentTitle: string;
        }> = [];

        for (const enrollment of enrollments) {
            // Get all assessments for this course
            const assessments = await em.find(Assessment, {
                course: { id: enrollment.course.id }
            });

            // Check if all assessments have grades for this student
            for (const assessment of assessments) {
                const grade = await em.findOne(Grade, {
                    assessment: { id: assessment.id },
                    student: { id: enrollment.student.id }
                });

                if (!grade || grade.score === undefined || grade.score === null) {
                    missingGrades.push({
                        studentId: enrollment.student.id,
                        studentName: enrollment.student.name,
                        courseCode: enrollment.course.code,
                        courseTitle: enrollment.course.title,
                        assessmentTitle: assessment.title
                    });
                }
            }
        }

        if (missingGrades.length > 0) {
            return res.status(400).json({
                message: 'Cannot finalize semester: Some assessments are missing grades',
                missingGrades
            });
        }

        // All validations passed - finalize the semester
        // Mark all enrollments as Completed
        for (const enrollment of enrollments) {
            enrollment.status = EnrollmentStatus.Completed;
        }

        semester.status = SemesterStatus.Finalized;
        await em.flush();

        res.json({
            message: 'Semester finalized successfully',
            semester,
            enrollmentsCompleted: enrollments.length
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

// GET /api/semesters/:id - Get single semester (Staff only)
router.get('/:id', authenticate, authorize(UserRole.Staff), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const semesterId = parseInt(req.params.id);
        const semester = await em.findOne(Semester, { id: semesterId });

        if (!semester) {
            return res.status(404).json({ message: 'Semester not found' });
        }

        res.json(semester);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;

