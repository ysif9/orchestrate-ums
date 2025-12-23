import express, { Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import authenticate, { AuthRequest } from '../middleware/auth';
import { ParentInquiry, InquiryMessage, InquiryStatus } from '../entities/ParentInquiry';
import { Parent } from '../entities/Parent';
import { Student } from '../entities/Student';
import { Course } from '../entities/Course';
import { User, UserRole } from '../entities/User';
import { Enrollment } from '../entities/Enrollment';
import { body, validationResult } from 'express-validator';

const router = express.Router();

/**
 * GET /api/parent-inquiries
 * Get all inquiries for the logged-in parent, grouped by student
 * Only returns non-archived inquiries by default
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    const em = RequestContext.getEntityManager() as EntityManager;
    const userId = Number(req.user!.id);

    try {
        // Verify user is a parent
        const parent = await em.findOne(Parent, { id: userId });
        if (!parent) {
            return res.status(403).json({ success: false, message: 'Access denied. Parents only.' });
        }

        // Get all inquiries for this parent
        const inquiries = await em.find(
            ParentInquiry,
            {
                parent: { id: userId } as any,
                status: { $ne: InquiryStatus.Archived } // Exclude archived by default
            },
            {
                populate: ['student', 'course', 'professor', 'messages', 'messages.sender'],
                orderBy: { lastMessageAt: 'DESC' }
            }
        );

        // Group by student
        const groupedByStudent = inquiries.reduce((acc, inquiry) => {
            const studentId = inquiry.student.id;
            if (!acc[studentId]) {
                acc[studentId] = {
                    studentId: inquiry.student.id,
                    studentName: inquiry.student.name,
                    inquiries: []
                };
            }

            const messages = inquiry.messages.getItems();
            const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;

            acc[studentId].inquiries.push({
                id: inquiry.id,
                subject: inquiry.subject,
                course: {
                    id: inquiry.course.id,
                    code: (inquiry.course as any).code,
                    title: (inquiry.course as any).title
                },
                professor: {
                    id: inquiry.professor.id,
                    name: inquiry.professor.name
                },
                status: inquiry.status,
                lastMessageAt: inquiry.lastMessageAt,
                hasUnread: inquiry.hasUnreadProfessorMessages,
                messageCount: messages.length,
                latestMessage: latestMessage ? {
                    content: latestMessage.content,
                    isFromParent: latestMessage.isFromParent,
                    createdAt: latestMessage.createdAt
                } : null
            });

            return acc;
        }, {} as Record<number, any>);

        return res.json({
            success: true,
            data: Object.values(groupedByStudent)
        });
    } catch (err) {
        console.error('Error fetching parent inquiries:', err);
        return res.status(500).json({ success: false, message: 'Error fetching inquiries' });
    }
});

/**
 * GET /api/parent-inquiries/unread-count
 * Get count of unread messages for the logged-in parent
 */
router.get('/unread-count', authenticate, async (req: AuthRequest, res: Response) => {
    const em = RequestContext.getEntityManager() as EntityManager;
    const userId = Number(req.user!.id);

    try {
        const parent = await em.findOne(Parent, { id: userId });
        if (!parent) {
            return res.status(403).json({ success: false, message: 'Access denied. Parents only.' });
        }

        const unreadCount = await em.count(ParentInquiry, {
            parent: { id: userId } as any,
            hasUnreadProfessorMessages: true,
            status: { $ne: InquiryStatus.Archived }
        });

        return res.json({
            success: true,
            data: { unreadCount }
        });
    } catch (err) {
        console.error('Error fetching unread count:', err);
        return res.status(500).json({ success: false, message: 'Error fetching unread count' });
    }
});

/**
 * GET /api/parent-inquiries/:id/thread
 * Get full conversation thread for a specific inquiry
 */
router.get('/:id/thread', authenticate, async (req: AuthRequest, res: Response) => {
    const em = RequestContext.getEntityManager() as EntityManager;
    const userId = Number(req.user!.id);
    const inquiryId = Number(req.params.id);

    try {
        const inquiry = await em.findOne(
            ParentInquiry,
            { id: inquiryId },
            {
                populate: ['parent', 'student', 'course', 'professor', 'messages', 'messages.sender']
            }
        );

        if (!inquiry) {
            return res.status(404).json({ success: false, message: 'Inquiry not found' });
        }

        // Security: verify user is the parent or the professor
        const isParent = inquiry.parent.id === userId;
        const isProfessor = inquiry.professor.id === userId;

        if (!isParent && !isProfessor) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        // Mark messages as read
        const messages = inquiry.messages.getItems();
        let hasUpdates = false;

        messages.forEach(msg => {
            if (!msg.isRead) {
                // If parent is viewing, mark professor messages as read
                if (isParent && !msg.isFromParent) {
                    msg.isRead = true;
                    hasUpdates = true;
                }
                // If professor is viewing, mark parent messages as read
                if (isProfessor && msg.isFromParent) {
                    msg.isRead = true;
                    hasUpdates = true;
                }
            }
        });

        // Update inquiry unread flags
        if (isParent && inquiry.hasUnreadProfessorMessages) {
            inquiry.hasUnreadProfessorMessages = false;
            hasUpdates = true;
        }
        if (isProfessor && inquiry.hasUnreadParentMessages) {
            inquiry.hasUnreadParentMessages = false;
            hasUpdates = true;
        }

        if (hasUpdates) {
            await em.flush();
        }

        return res.json({
            success: true,
            data: {
                id: inquiry.id,
                subject: inquiry.subject,
                parent: {
                    id: inquiry.parent.id,
                    name: inquiry.parent.name
                },
                student: {
                    id: inquiry.student.id,
                    name: inquiry.student.name
                },
                course: {
                    id: inquiry.course.id,
                    code: (inquiry.course as any).code,
                    title: (inquiry.course as any).title
                },
                professor: {
                    id: inquiry.professor.id,
                    name: inquiry.professor.name
                },
                status: inquiry.status,
                messages: messages.map(msg => ({
                    id: msg.id,
                    sender: {
                        id: msg.sender.id,
                        name: msg.sender.name,
                        role: msg.sender.role
                    },
                    content: msg.content,
                    isFromParent: msg.isFromParent,
                    isRead: msg.isRead,
                    createdAt: msg.createdAt
                }))
            }
        });
    } catch (err) {
        console.error('Error fetching inquiry thread:', err);
        return res.status(500).json({ success: false, message: 'Error fetching thread' });
    }
});

/**
 * POST /api/parent-inquiries
 * Create a new inquiry (parent only)
 */
router.post(
    '/',
    authenticate,
    body('studentId').isInt(),
    body('courseId').isInt(),
    body('subject').isString().notEmpty(),
    body('message').isString().notEmpty(),
    async (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const em = RequestContext.getEntityManager() as EntityManager;
        const userId = Number(req.user!.id);
        const { studentId, courseId, subject, message } = req.body;

        try {
            // Verify user is a parent
            const parent = await em.findOne(Parent, { id: userId }, { populate: ['studentLinks', 'studentLinks.student'] });
            if (!parent) {
                return res.status(403).json({ success: false, message: 'Access denied. Parents only.' });
            }

            // Verify student is linked to this parent
            const studentLink = parent.studentLinks.getItems().find(link => link.student.id === Number(studentId));
            if (!studentLink) {
                return res.status(403).json({ success: false, message: 'Student not linked to your account' });
            }

            const student = studentLink.student;

            // Verify student is enrolled in the course
            const enrollment = await em.findOne(
                Enrollment,
                {
                    student: { id: student.id } as any,
                    course: { id: Number(courseId) } as any
                },
                { populate: ['course', 'course.professor'] }
            );

            if (!enrollment) {
                return res.status(404).json({ success: false, message: 'Student not enrolled in this course' });
            }

            const course = enrollment.course;
            if (!course.professor) {
                return res.status(404).json({ success: false, message: 'Course has no assigned professor' });
            }

            const professor = course.professor;

            // Create inquiry
            const inquiry = new ParentInquiry(parent, student, course, professor, subject);
            inquiry.hasUnreadParentMessages = true; // New inquiry has unread message from parent

            // Create first message
            const firstMessage = new InquiryMessage(inquiry, parent, message, true);
            inquiry.messages.add(firstMessage);

            await em.persistAndFlush(inquiry);

            return res.status(201).json({
                success: true,
                data: { id: inquiry.id },
                message: 'Inquiry created successfully'
            });
        } catch (err) {
            console.error('Error creating inquiry:', err);
            return res.status(500).json({ success: false, message: 'Error creating inquiry' });
        }
    }
);

/**
 * POST /api/parent-inquiries/:id/reply
 * Reply to an inquiry (parent or professor)
 */
router.post(
    '/:id/reply',
    authenticate,
    body('message').isString().notEmpty(),
    async (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const em = RequestContext.getEntityManager() as EntityManager;
        const userId = Number(req.user!.id);
        const inquiryId = Number(req.params.id);
        const { message } = req.body;

        try {
            const inquiry = await em.findOne(
                ParentInquiry,
                { id: inquiryId },
                { populate: ['parent', 'professor', 'messages'] }
            );

            if (!inquiry) {
                return res.status(404).json({ success: false, message: 'Inquiry not found' });
            }

            // Determine if user is parent or professor
            const isParent = inquiry.parent.id === userId;
            const isProfessor = inquiry.professor.id === userId;

            if (!isParent && !isProfessor) {
                return res.status(403).json({ success: false, message: 'Unauthorized' });
            }

            // Get sender
            const sender = await em.findOneOrFail(User, userId);

            // Create reply message
            const replyMessage = new InquiryMessage(inquiry, sender, message, isParent);
            inquiry.messages.add(replyMessage);

            // Update inquiry metadata
            inquiry.lastMessageAt = new Date();

            if (isParent) {
                inquiry.hasUnreadParentMessages = true;
                inquiry.hasUnreadProfessorMessages = false; // Parent has read all professor messages by replying
            } else {
                inquiry.hasUnreadProfessorMessages = true;
                inquiry.hasUnreadParentMessages = false; // Professor has read all parent messages by replying
            }

            // Reopen if resolved
            if (inquiry.status === InquiryStatus.Resolved) {
                inquiry.status = InquiryStatus.Open;
            }

            await em.flush();

            return res.status(201).json({
                success: true,
                data: { messageId: replyMessage.id },
                message: 'Reply sent successfully'
            });
        } catch (err) {
            console.error('Error sending reply:', err);
            return res.status(500).json({ success: false, message: 'Error sending reply' });
        }
    }
);

/**
 * PUT /api/parent-inquiries/:id/archive
 * Archive an inquiry (parent only)
 */
router.put('/:id/archive', authenticate, async (req: AuthRequest, res: Response) => {
    const em = RequestContext.getEntityManager() as EntityManager;
    const userId = Number(req.user!.id);
    const inquiryId = Number(req.params.id);

    try {
        const inquiry = await em.findOne(
            ParentInquiry,
            { id: inquiryId },
            { populate: ['parent'] }
        );

        if (!inquiry) {
            return res.status(404).json({ success: false, message: 'Inquiry not found' });
        }

        // Only parent can archive
        if (inquiry.parent.id !== userId) {
            return res.status(403).json({ success: false, message: 'Only the parent can archive this inquiry' });
        }

        inquiry.status = InquiryStatus.Archived;
        await em.flush();

        return res.json({
            success: true,
            message: 'Inquiry archived successfully'
        });
    } catch (err) {
        console.error('Error archiving inquiry:', err);
        return res.status(500).json({ success: false, message: 'Error archiving inquiry' });
    }
});

/**
 * PUT /api/parent-inquiries/:id/resolve
 * Mark inquiry as resolved (professor only)
 */
router.put('/:id/resolve', authenticate, async (req: AuthRequest, res: Response) => {
    const em = RequestContext.getEntityManager() as EntityManager;
    const userId = Number(req.user!.id);
    const inquiryId = Number(req.params.id);

    try {
        const inquiry = await em.findOne(
            ParentInquiry,
            { id: inquiryId },
            { populate: ['professor'] }
        );

        if (!inquiry) {
            return res.status(404).json({ success: false, message: 'Inquiry not found' });
        }

        // Only professor can resolve
        if (inquiry.professor.id !== userId) {
            return res.status(403).json({ success: false, message: 'Only the professor can resolve this inquiry' });
        }

        inquiry.status = InquiryStatus.Resolved;
        await em.flush();

        return res.json({
            success: true,
            message: 'Inquiry marked as resolved'
        });
    } catch (err) {
        console.error('Error resolving inquiry:', err);
        return res.status(500).json({ success: false, message: 'Error resolving inquiry' });
    }
});

/**
 * GET /api/parent-inquiries/available-courses/:studentId
 * Get courses for which a parent can create inquiries for a specific student
 */
router.get('/available-courses/:studentId', authenticate, async (req: AuthRequest, res: Response) => {
    const em = RequestContext.getEntityManager() as EntityManager;
    const userId = Number(req.user!.id);
    const studentId = Number(req.params.studentId);

    try {
        // Verify user is a parent
        const parent = await em.findOne(Parent, { id: userId }, { populate: ['studentLinks', 'studentLinks.student'] });
        if (!parent) {
            return res.status(403).json({ success: false, message: 'Access denied. Parents only.' });
        }

        // Verify student is linked to this parent
        const studentLink = parent.studentLinks.getItems().find(link => link.student.id === studentId);
        if (!studentLink) {
            return res.status(403).json({ success: false, message: 'Student not linked to your account' });
        }

        // Get all courses the student is enrolled in with professors
        const enrollments = await em.find(
            Enrollment,
            { student: { id: studentId } as any },
            { populate: ['course', 'course.professor'] }
        );

        const courses = enrollments
            .filter(e => e.course.professor) // Only courses with professors
            .map(e => ({
                id: e.course.id,
                code: (e.course as any).code,
                title: (e.course as any).title,
                professor: {
                    id: e.course.professor!.id,
                    name: e.course.professor!.name
                }
            }));

        return res.json({
            success: true,
            data: courses
        });
    } catch (err) {
        console.error('Error fetching available courses:', err);
        return res.status(500).json({ success: false, message: 'Error fetching courses' });
    }
});

/**
 * GET /api/parent-inquiries/professor
 * Get all inquiries for the logged-in professor
 */
router.get('/professor', authenticate, async (req: AuthRequest, res: Response) => {
    const em = RequestContext.getEntityManager() as EntityManager;
    const userId = Number(req.user!.id);

    try {
        // Verify user is a professor
        const user = await em.findOne(User, { id: userId });
        if (!user || user.role !== UserRole.Professor) {
            return res.status(403).json({ success: false, message: 'Access denied. Professors only.' });
        }

        // Get all inquiries for this professor
        const inquiries = await em.find(
            ParentInquiry,
            {
                professor: { id: userId } as any,
                status: { $ne: InquiryStatus.Archived } // Exclude archived
            },
            {
                populate: ['parent', 'student', 'course', 'messages', 'messages.sender'],
                orderBy: { lastMessageAt: 'DESC' }
            }
        );

        // Format response
        const formattedInquiries = inquiries.map(inquiry => {
            const messages = inquiry.messages.getItems();
            const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;

            return {
                id: inquiry.id,
                subject: inquiry.subject,
                parent: {
                    id: inquiry.parent.id,
                    name: inquiry.parent.name
                },
                student: {
                    id: inquiry.student.id,
                    name: inquiry.student.name
                },
                course: {
                    id: inquiry.course.id,
                    code: (inquiry.course as any).code,
                    title: (inquiry.course as any).title
                },
                status: inquiry.status,
                lastMessageAt: inquiry.lastMessageAt,
                hasUnread: inquiry.hasUnreadParentMessages,
                messageCount: messages.length,
                latestMessage: latestMessage ? {
                    content: latestMessage.content,
                    isFromParent: latestMessage.isFromParent,
                    createdAt: latestMessage.createdAt
                } : null
            };
        });

        return res.json({
            success: true,
            data: formattedInquiries
        });
    } catch (err) {
        console.error('Error fetching professor inquiries:', err);
        return res.status(500).json({ success: false, message: 'Error fetching inquiries' });
    }
});

export default router;
