import express, { Response } from 'express';
import { RequestContext, wrap } from '@mikro-orm/core';
import { TranscriptRequest, TranscriptRequestStatus } from '../entities/TranscriptRequest';
import { Enrollment, EnrollmentStatus } from '../entities/Enrollment';
import { Grade } from '../entities/Grade';
import { Assessment } from '../entities/Assessment';
import { User, UserRole } from '../entities/User';
import { Attribute, AttributeDataType } from '../entities/Attribute';
import { TranscriptRequestAttributeValue } from '../entities/TranscriptRequestAttributeValue';
import authenticate, { AuthRequest } from '../middleware/auth';
import authorize from '../middleware/authorize';

const router = express.Router();

function flattenTranscriptRequest(req: TranscriptRequest): any {
    const obj = wrap(req).toJSON() as any;
    if (req.attributes && req.attributes.isInitialized()) {
        req.attributes.getItems().forEach(attrVal => {
            obj[attrVal.attribute.name] = attrVal.value;
        });
    }
    return obj;
}

// Helper function to calculate GPA from percentage
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

// Helper function to generate transcript data
async function generateTranscriptData(studentId: number) {
    const em = RequestContext.getEntityManager();
    if (!em) throw new Error('EntityManager not found');

    // Get all completed enrollments
    const completedEnrollments = await em.find(Enrollment, {
        student: { id: studentId },
        status: EnrollmentStatus.Completed
    }, {
        populate: ['course', 'student', 'semester']
    });

    const courses = [];
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

        // Calculate course-level statistics
        const assessmentGrades = [];
        let totalScore = 0;
        let totalMarks = 0;

        for (const assessment of assessments) {
            const grade = grades.find(g => g.assessment.id === assessment.id);
            const score = grade?.score ?? null;
            const percentage = score !== null && assessment.totalMarks > 0
                ? (score / assessment.totalMarks) * 100
                : null;

            assessmentGrades.push({
                id: assessment.id,
                title: assessment.title,
                type: assessment.type,
                score: score,
                totalMarks: assessment.totalMarks,
                percentage: percentage,
                feedback: grade?.feedback ?? null,
                gradedAt: grade?.gradedAt ?? null
            });

            if (score !== null) {
                totalScore += score;
                totalMarks += assessment.totalMarks;
            }
        }

        // Calculate course average percentage
        const coursePercentage = totalMarks > 0 ? (totalScore / totalMarks) * 100 : null;
        const courseGPA = coursePercentage !== null ? calculateGPA(coursePercentage) : null;
        const letterGrade = coursePercentage !== null ? getLetterGrade(coursePercentage) : null;

        // Add to GPA calculation if we have a valid grade
        if (courseGPA !== null) {
            totalGPAPoints += courseGPA * course.credits;
            totalCreditsForGPA += course.credits;
        }

        totalCredits += course.credits;

        courses.push({
            enrollmentId: enrollment.id,
            courseCode: course.code,
            courseTitle: course.title,
            credits: course.credits,
            semester: enrollment.semester?.name || 'Unknown',
            enrollmentDate: enrollment.createdAt,
            completedDate: enrollment.updatedAt,
            assessments: assessmentGrades,
            coursePercentage: coursePercentage,
            courseGPA: courseGPA,
            letterGrade: letterGrade
        });
    }

    // Calculate overall GPA
    const overallGPA = totalCreditsForGPA > 0 ? totalGPAPoints / totalCreditsForGPA : null;

    return {
        courses,
        totalCredits,
        overallGPA: overallGPA !== null ? parseFloat(overallGPA.toFixed(2)) : null,
        totalCourses: courses.length
    };
}

// POST /api/transcript-requests - Students create new request
router.post('/', authenticate, authorize(UserRole.Student), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const studentId = parseInt(req.user.id);
        const student = await em.findOne(User, { id: studentId });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const request = new TranscriptRequest(student);
        await em.persistAndFlush(request);
        await em.populate(request, ['student']);

        res.status(201).json({
            success: true,
            message: 'Transcript request created successfully',
            request
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/transcript-requests - Students view all their requests
router.get('/', authenticate, authorize(UserRole.Student), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const studentId = parseInt(req.user.id);
        const requests = await em.find(TranscriptRequest, {
            student: { id: studentId }
        }, {
            populate: ['student', 'reviewedBy', 'attributes', 'attributes.attribute'],
            orderBy: { requestedAt: 'DESC' }
        });

        res.json({
            success: true,
            requests: requests.map(flattenTranscriptRequest)
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/transcript-requests/pending - Staff view all pending requests
router.get('/pending', authenticate, authorize(UserRole.Staff), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const requests = await em.find(TranscriptRequest, {
            status: TranscriptRequestStatus.PendingReview
        }, {
            populate: ['student', 'attributes', 'attributes.attribute'],
            orderBy: { requestedAt: 'ASC' }
        });

        res.json({
            success: true,
            requests: requests.map(flattenTranscriptRequest)
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/transcript-requests/:id - View specific request (includes transcript if approved)
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const requestId = parseInt(req.params.id);
        const request = await em.findOne(TranscriptRequest, { id: requestId }, {
            populate: ['student', 'reviewedBy', 'attributes', 'attributes.attribute']
        });

        if (!request) {
            return res.status(404).json({ success: false, message: 'Transcript request not found' });
        }

        // Students can only view their own requests
        if (req.user.role === UserRole.Student && request.student.id !== parseInt(req.user.id)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        let transcriptData = null;
        if (request.status === TranscriptRequestStatus.Approved) {
            transcriptData = await generateTranscriptData(request.student.id);
        }

        res.json({
            success: true,
            request: flattenTranscriptRequest(request),
            transcript: transcriptData
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/transcript-requests/:id/approve - Staff approve request
router.put('/:id/approve', authenticate, authorize(UserRole.Staff), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const requestId = parseInt(req.params.id);
        const request = await em.findOne(TranscriptRequest, { id: requestId }, {
            populate: ['student', 'attributes', 'attributes.attribute']
        });

        if (!request) {
            return res.status(404).json({ success: false, message: 'Transcript request not found' });
        }

        if (request.status !== TranscriptRequestStatus.PendingReview) {
            return res.status(400).json({
                success: false,
                message: `Request is already ${request.status}`
            });
        }

        const reviewer = await em.findOne(User, { id: parseInt(req.user.id) });
        if (!reviewer) {
            return res.status(404).json({ success: false, message: 'Reviewer not found' });
        }

        request.status = TranscriptRequestStatus.Approved;
        request.reviewedBy = reviewer;
        request.reviewedAt = new Date();

        await em.persistAndFlush(request);
        await em.populate(request, ['student', 'reviewedBy', 'attributes', 'attributes.attribute']);

        res.json({
            success: true,
            message: 'Transcript request approved successfully',
            request: flattenTranscriptRequest(request)
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ... (existing imports, but add Attribute and EAV imports)

// PUT /api/transcript-requests/:id/reject - Staff reject request
router.put('/:id/reject', authenticate, authorize(UserRole.Staff), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const { rejectionReason } = req.body;
        const requestId = parseInt(req.params.id);
        const request = await em.findOne(TranscriptRequest, { id: requestId }, {
            populate: ['student', 'attributes', 'attributes.attribute']
        });

        if (!request) {
            return res.status(404).json({ success: false, message: 'Transcript request not found' });
        }

        if (request.status !== TranscriptRequestStatus.PendingReview) {
            return res.status(400).json({
                success: false,
                message: `Request is already ${request.status}`
            });
        }

        const reviewer = await em.findOne(User, { id: parseInt(req.user.id) });
        if (!reviewer) {
            return res.status(404).json({ success: false, message: 'Reviewer not found' });
        }

        request.status = TranscriptRequestStatus.Rejected;
        request.reviewedBy = reviewer;
        request.reviewedAt = new Date();

        // Handle EAV for rejection reason
        if (rejectionReason) {
            // Find or create the attribute definition
            let reasonAttr = await em.findOne(Attribute, { name: 'rejectionReason', entityType: 'TranscriptRequest' });
            if (!reasonAttr) {
                reasonAttr = new Attribute('rejectionReason', 'Rejection Reason', AttributeDataType.String, 'TranscriptRequest');
                await em.persist(reasonAttr);
            }

            // Create attribute value
            const attrValue = new TranscriptRequestAttributeValue(request);
            attrValue.attribute = reasonAttr;
            attrValue.setValue(rejectionReason); // Use setValue
            request.attributes.add(attrValue); // Add to collection
            await em.persist(attrValue);
        }

        await em.persistAndFlush(request);
        await em.populate(request, ['student', 'reviewedBy', 'attributes', 'attributes.attribute']);

        res.json({
            success: true,
            message: 'Transcript request rejected',
            request: flattenTranscriptRequest(request)
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
