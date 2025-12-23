import express, { Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import authenticate, { AuthRequest } from '../middleware/auth';
import { Message } from '../entities/Message';
import { User, UserRole } from '../entities/User';
import { Course } from '../entities/Course';
import { body, validationResult } from 'express-validator';
import { Parent } from '../entities/Parent';
import { Enrollment, EnrollmentStatus } from '../entities/Enrollment';
import { ParentStudentLink } from '../entities/ParentStudentLink';
import { Student } from '../entities/Student';
import { MessageRelatedStudent } from '../entities/MessageRelatedStudent';

const router = express.Router();

// GET /api/messages/unread/check - Check if user has unread messages
router.get('/unread/check', authenticate, async (req: AuthRequest, res: Response) =\u003e {
    const em = RequestContext.getEntityManager() as EntityManager;
    const userId = Number(req.user!.id);

    try {
        const unreadCount = await em.count(Message, {
            receiver: { id: userId } as any,
            isRead: false
        });

        return res.json({
            success: true,
            hasUnread: unreadCount \u003e 0,
            count: unreadCount
        });
    } catch(err) {
        console.error('Error checking unread messages:', err);
        return res.status(500).json({ success: false, message: 'Error checking unread messages' });
    }
});

// GET /api/messages - Get top-level messages for the logged-in user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    const em = RequestContext.getEntityManager() as EntityManager;
    const userId = Number(req.user!.id);

    try {
        // Fetch where user is receiver OR sender, but only top-level (parent is null)
        const messages = await em.find(
            Message,
            {
                $or: [
                    { receiver: { id: userId } as any },
                    { sender: { id: userId } as any }
                ],
                parent: null
            },
            {
                populate: ['sender', 'receiver', 'course', 'replies', 'replies.sender'],
                orderBy: { createdAt: 'DESC' },
            }
        );

        return res.json({
            success: true,
            data: messages.map((m) => {
                const replies = m.replies.getItems();
                const allMessages = [m, ...replies];
                const latestMessage = allMessages.reduce((latest, current) =>
                    new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
                );

                const hasUnreadInThread = allMessages.some(msg =>
                    !msg.isRead && msg.receiver.id === userId
                );

                const latestMessageSentByCurrentUser = latestMessage.sender.id === userId;
                const shouldMarkAsUnread = hasUnreadInThread && !latestMessageSentByCurrentUser;

                return {
                    id: m.id,
                    sender: {
                        id: m.sender.id,
                        name: m.sender.name,
                        role: m.sender.role,
                    },
                    receiver: {
                        id: m.receiver.id,
                        name: m.receiver.name,
                    },
                    content: latestMessage.content,
                    course: m.course
                        ? { id: m.course.id, name: (m.course as any).name, code: (m.course as any).code }
                        : null,
                    createdAt: latestMessage.createdAt,
                    isRead: !shouldMarkAsUnread,
                    replyCount: replies.length,
                };
            }),
        });
    } catch (err) {
        console.error('Error fetching messages:', err);
        return res
            .status(500)
            .json({ success: false, message: 'Error fetching messages' });
    }
});

// GET /api/messages/:id/thread - Get full thread
router.get('/:id/thread', authenticate, async (req: AuthRequest, res: Response) => {
    const em = RequestContext.getEntityManager() as EntityManager;
    const userId = Number(req.user!.id);
    const messageId = Number(req.params.id);

    try {
        const root = await em.findOne(Message, { id: messageId }, { populate: ['sender', 'receiver', 'course'] });
        if (!root) return res.status(404).json({ success: false, message: 'Message not found' });

        if (root.sender.id !== userId && root.receiver.id !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const replies = await em.find(
            Message,
            { parent: messageId },
            {
                populate: ['sender', 'receiver'],
                orderBy: { createdAt: 'ASC' }
            }
        );

        const thread = [root, ...replies];

        return res.json({
            success: true,
            data: thread.map(m => ({
                id: m.id,
                sender: { id: m.sender.id, name: m.sender.name, role: m.sender.role },
                receiver: { id: m.receiver.id, name: m.receiver.name },
                content: m.content,
                createdAt: m.createdAt,
                isRead: m.isRead,
                parentId: m.parent?.id
            }))
        });

    } catch (err) {
        console.error("Error fetching thread:", err);
        return res.status(500).json({ success: false, message: "Error fetching thread" });
    }
});

// GET /api/messages/recipients/parent
// For a parent, get list of eligible professors to contact, grouped by Child.
router.get('/recipients/parent', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const parentId = parseInt(req.user?.id || '0');

        // Fetch valid parent with student links
        const parent = await em.findOne(Parent, { id: parentId }, { populate: ['studentLinks.student'] });

        if (!parent) {
            return res.status(404).json({ message: 'Parent account not found' });
        }

        const opportunities: any[] = [];

        // For each child
        for (const link of parent.studentLinks) {
            const student = link.student;

            // Find active enrollments where student is enrolled
            const enrollments = await em.find(Enrollment, {
                student: student.id,
                status: EnrollmentStatus.Enrolled
            }, {
                populate: ['course', 'course.professor']
            });

            // Map to contact opportunities
            for (const enrollment of enrollments) {
                if (enrollment.course && enrollment.course.professor) {
                    const prof = enrollment.course.professor;

                    const opportunity = {
                        studentId: student.id,
                        studentName: student.name,
                        courseCode: enrollment.course.code,
                        courseName: enrollment.course.title,
                        courseId: enrollment.course.id,
                        professorId: prof.id,
                        professorName: prof.name
                    };
                    opportunities.push(opportunity);
                }
            }
        }

        res.json({ success: true, recipients: opportunities });

    } catch (err) {
        console.error('Error fetching recipients:', err);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});



// POST /api/messages - Send a message or reply
router.post(
    '/',
    authenticate,
    body('content').isString().notEmpty(),
    // receiverId is optional if replying (inferred from parent)
    body('receiverId').optional().isInt(),
    body('parentId').optional().isInt(),
    body('courseId').optional().isInt(),
    body('relatedStudentId').optional().isInt(),
    async (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const em = RequestContext.getEntityManager() as EntityManager;
        const senderId = req.user!.id; // number
        const { receiverId, content, courseId, parentId, relatedStudentId } = req.body;

        try {
            const sender = await em.findOneOrFail(User, Number(senderId));
            let receiver: User | null = null;
            let parent: Message | null = null;
            let course: Course | undefined;
            // let relatedStudent: Student | undefined; 
            // We use MessageRelatedStudent entity now

            let relatedStudentIdResolved: number | undefined = relatedStudentId;

            if (parentId) {
                // Reply flow
                parent = await em.findOne(Message, parentId, { populate: ['sender', 'receiver', 'course', 'relatedStudentRef', 'relatedStudentRef.student'] });
                if (!parent) return res.status(404).json({ success: false, message: 'Parent message not found' });

                if (parent.sender.id === Number(senderId)) {
                    receiver = parent.receiver;
                } else {
                    receiver = parent.sender;
                }

                course = parent.course;
                // Inherit related student from parent context if exists
                if (parent.relatedStudentRef) {
                    relatedStudentIdResolved = parent.relatedStudentRef.student.id;
                }

            } else {
                // New thread flow
                if (!receiverId) return res.status(400).json({ success: false, message: 'Receiver ID required for new threads' });
                receiver = await em.findOne(User, receiverId);
                if (!receiver) return res.status(404).json({ success: false, message: 'Receiver not found' });

                if (courseId) {
                    course = await em.findOne(Course, courseId) || undefined;
                }
            }

            if (!receiver) return res.status(500).json({ success: false, message: "Could not determine receiver" });

            const message = new Message(sender, receiver, content, course, parent || undefined);
            await em.persist(message); // Persist message first to get ID for OneToOne? 
            // Actually MessageRelatedStudent needs message. 
            // We can persist both. 

            if (relatedStudentIdResolved) {
                const student = await em.findOne(Student, relatedStudentIdResolved);
                if (student) {
                    const relatedRef = new MessageRelatedStudent(message, student);
                    await em.persist(relatedRef);
                }
            }

            await em.flush();

            return res.status(201).json({
                success: true,
                data: {
                    id: message.id,
                    createdAt: message.createdAt
                },
                message: 'Message sent successfully'
            });
        } catch (err) {
            console.error('Error sending message:', err);
            return res
                .status(500)
                .json({ success: false, message: 'Error sending message' });
        }
    }
);

// PUT /api/messages/:id/read - Mark as read
router.put('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
    const em = RequestContext.getEntityManager() as EntityManager;
    const userId = req.user!.id; // Current user (receiver)
    const messageId = Number(req.params.id);

    try {
        const message = await em.findOne(Message, { id: messageId, receiver: { id: userId } as any });

        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        message.isRead = true;
        await em.flush();

        return res.json({ success: true, message: 'Message marked as read' });
    } catch (err) {
        console.error('Error updating message status:', err);
        return res.status(500).json({ success: false, message: 'Error updating message status' });
    }
});

export default router;
