import express, { Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { Student, StudentStatus } from '../entities/Student';
import { Enrollment, EnrollmentStatus } from '../entities/Enrollment';
import { Grade } from '../entities/Grade';
import { Assessment } from '../entities/Assessment';
import { User, UserRole } from '../entities/User';
import authenticate, { AuthRequest } from '../middleware/auth';
import authorize from '../middleware/authorize';

const router = express.Router();

// Current semester constant (can be made configurable later)
const CURRENT_SEMESTER = 'Fall 2024';
const MIN_REGISTRATION_CREDITS = 12; // Minimum credits for full-time registration

// Helper function to calculate GPA from percentage (reused from transcriptRoutes)
function calculateGPA(percentage: number): number {
    if (percentage >= 90) return 4.0;
    if (percentage >= 80) return 3.0;
    if (percentage >= 70) return 2.0;
    if (percentage >= 60) return 1.0;
    return 0.0;
}

// Helper function to get letter grade from percentage
function getLetterGrade(percentage: number): string {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
}

// Helper function to calculate student GPA (reused from transcriptRoutes)
async function calculateStudentGPA(studentId: number): Promise<{ gpa: number | null; totalCredits: number }> {
    const em = RequestContext.getEntityManager();
    if (!em) throw new Error('EntityManager not found');

    // Get all completed enrollments
    const completedEnrollments = await em.find(Enrollment, {
        student: { id: studentId },
        status: EnrollmentStatus.Completed
    }, {
        populate: ['course']
    });

    let totalCredits = 0;
    let totalGPAPoints = 0;
    let totalCreditsForGPA = 0;

    for (const enrollment of completedEnrollments) {
        const course = enrollment.course;
        
        // Get all assessments for this course
        const assessments = await em.find(Assessment, {
            course: { id: course.id }
        });

        // Get all grades for this student in this course
        const grades = await em.find(Grade, {
            student: { id: studentId },
            assessment: { course: { id: course.id } }
        }, {
            populate: ['assessment']
        });

        // Calculate course average percentage
        let totalScore = 0;
        let totalMarks = 0;

        for (const assessment of assessments) {
            const grade = grades.find(g => g.assessment.id === assessment.id);
            const score = grade?.score ?? null;

            if (score !== null) {
                totalScore += score;
                totalMarks += assessment.totalMarks;
            }
        }

        const coursePercentage = totalMarks > 0 ? (totalScore / totalMarks) * 100 : null;
        const courseGPA = coursePercentage !== null ? calculateGPA(coursePercentage) : null;

        if (courseGPA !== null) {
            totalGPAPoints += courseGPA * course.credits;
            totalCreditsForGPA += course.credits;
        }

        totalCredits += course.credits;
    }

    const overallGPA = totalCreditsForGPA > 0 ? totalGPAPoints / totalCreditsForGPA : null;

    return {
        gpa: overallGPA !== null ? parseFloat(overallGPA.toFixed(2)) : null,
        totalCredits
    };
}

// Helper function to determine registration status
function getRegistrationStatus(registeredCredits: number): string {
    if (registeredCredits === 0) return 'Not Registered';
    if (registeredCredits >= MIN_REGISTRATION_CREDITS) return 'Fully Registered';
    return 'Partially Registered';
}

// GET /api/student-records/search?studentId=:id - Search student by ID
router.get('/search', authenticate, authorize(UserRole.Staff), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const studentId = req.query.studentId;
        if (!studentId) {
            return res.status(400).json({ success: false, message: 'Student ID is required' });
        }

        const student = await em.findOne(Student, { id: parseInt(studentId as string) });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Get current term enrollments
        const currentTermEnrollments = await em.find(Enrollment, {
            student: { id: student.id },
            semester: CURRENT_SEMESTER
        }, {
            populate: ['course']
        });

        const registeredCredits = currentTermEnrollments
            .filter(e => e.status === EnrollmentStatus.Enrolled)
            .reduce((sum, e) => sum + (e.course?.credits || 0), 0);

        const registrationStatus = getRegistrationStatus(registeredCredits);

        // Calculate GPA
        const { gpa, totalCredits } = await calculateStudentGPA(student.id);

        res.json({
            success: true,
            student: {
                id: student.id,
                name: student.name,
                email: student.email,
                status: student.status,
                maxCredits: student.maxCredits
            },
            currentTermRegistration: {
                semester: CURRENT_SEMESTER,
                registeredCredits,
                registrationStatus,
                enrolledCourses: currentTermEnrollments
                    .filter(e => e.status === EnrollmentStatus.Enrolled)
                    .map(e => ({
                        id: e.course.id,
                        code: e.course.code,
                        title: e.course.title,
                        credits: e.course.credits
                    }))
            },
            academicSummary: {
                gpa,
                totalCredits
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/student-records/:id/summary - Generate full student record summary
router.get('/:id/summary', authenticate, authorize(UserRole.Staff), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const studentId = parseInt(req.params.id);
        const student = await em.findOne(Student, { id: studentId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Get all enrollments grouped by semester
        const allEnrollments = await em.find(Enrollment, {
            student: { id: studentId }
        }, {
            populate: ['course'],
            orderBy: { semester: 'ASC', createdAt: 'ASC' }
        });

        // Calculate GPA
        const { gpa, totalCredits } = await calculateStudentGPA(student.id);

        // Get current term enrollments
        const currentTermEnrollments = allEnrollments.filter(e => e.semester === CURRENT_SEMESTER);
        const registeredCredits = currentTermEnrollments
            .filter(e => e.status === EnrollmentStatus.Enrolled)
            .reduce((sum, e) => sum + (e.course?.credits || 0), 0);

        const registrationStatus = getRegistrationStatus(registeredCredits);

        // Group enrollments by semester
        const enrollmentsBySemester: { [key: string]: any[] } = {};
        for (const enrollment of allEnrollments) {
            if (!enrollmentsBySemester[enrollment.semester]) {
                enrollmentsBySemester[enrollment.semester] = [];
            }
            enrollmentsBySemester[enrollment.semester].push(enrollment);
        }

        // Build course history with grades
        const courseHistory = [];
        for (const [semester, enrollments] of Object.entries(enrollmentsBySemester)) {
            const semesterCourses = [];
            
            for (const enrollment of enrollments) {
                const course = enrollment.course;
                
                // Get grades for completed courses
                let courseGrade = null;
                let coursePercentage = null;
                let letterGrade = null;

                if (enrollment.status === EnrollmentStatus.Completed) {
                    const assessments = await em.find(Assessment, {
                        course: { id: course.id }
                    });

                    const grades = await em.find(Grade, {
                        student: { id: studentId },
                        assessment: { course: { id: course.id } }
                    }, {
                        populate: ['assessment']
                    });

                    let totalScore = 0;
                    let totalMarks = 0;

                    for (const assessment of assessments) {
                        const grade = grades.find(g => g.assessment.id === assessment.id);
                        const score = grade?.score ?? null;

                        if (score !== null) {
                            totalScore += score;
                            totalMarks += assessment.totalMarks;
                        }
                    }

                    coursePercentage = totalMarks > 0 ? (totalScore / totalMarks) * 100 : null;
                    letterGrade = coursePercentage !== null ? getLetterGrade(coursePercentage) : null;
                }

                semesterCourses.push({
                    id: course.id,
                    code: course.code,
                    title: course.title,
                    credits: course.credits,
                    status: enrollment.status,
                    enrollmentDate: enrollment.createdAt,
                    grade: letterGrade,
                    percentage: coursePercentage
                });
            }

            courseHistory.push({
                semester,
                courses: semesterCourses,
                totalCredits: enrollments.reduce((sum, e) => sum + (e.course?.credits || 0), 0)
            });
        }

        // Determine active holds based on status
        const activeHolds = [];
        if (student.status === StudentStatus.OnHold) {
            activeHolds.push('Administrative Hold');
        }
        if (student.status === StudentStatus.Suspended) {
            activeHolds.push('Suspension');
        }

        res.json({
            success: true,
            student: {
                id: student.id,
                name: student.name,
                email: student.email,
                status: student.status,
                maxCredits: student.maxCredits,
                createdAt: student.createdAt
            },
            academicSummary: {
                gpa,
                totalCredits,
                completedCourses: allEnrollments.filter(e => e.status === EnrollmentStatus.Completed).length,
                totalEnrollments: allEnrollments.length
            },
            currentTermRegistration: {
                semester: CURRENT_SEMESTER,
                registeredCredits,
                registrationStatus,
                enrolledCourses: currentTermEnrollments
                    .filter(e => e.status === EnrollmentStatus.Enrolled)
                    .map(e => ({
                        id: e.course.id,
                        code: e.course.code,
                        title: e.course.title,
                        credits: e.course.credits,
                        enrollmentDate: e.createdAt
                    }))
            },
            courseHistory,
            activeHolds
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;

