import express, { Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import authenticate, { AuthRequest } from '../middleware/auth';
import { Message } from '../entities/Message';
import { User, UserRole } from '../entities/User';
import { Course } from '../entities/Course';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// GET /api/messages - Get top-level messages for the logged-in user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    const em = RequestContext.getEntityManager() as EntityManager;
    const userId = Number(req.user!.id);

    try {
        // Fetch where user is receiver OR sender, but only top-level (parent is null)
        // Actually, for an inbox, we usually want "Conversations".
        // A conversation is defined by the root message.
        // Let's return messages where (receiver=me OR sender=me) AND parent IS NULL.
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
                // Find the latest message in the thread (either root or latest reply)
                const replies = m.replies.getItems();
                const allMessages = [m, ...replies];
                const latestMessage = allMessages.reduce((latest, current) =>
                    new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
                );

                // Check if there are any unread messages in the thread for the current user
                const hasUnreadInThread = allMessages.some(msg =>
                    !msg.isRead && msg.receiver.id === userId
                );

                // If the current user sent the latest message, don't mark as unread for them
                // (they've already "read" it by sending it)
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
                    content: latestMessage.content, // Show latest message content
                    course: m.course
                        ? { id: m.course.id, name: (m.course as any).name, code: (m.course as any).code }
                        : null,
                    createdAt: latestMessage.createdAt, // Show latest message timestamp
                    isRead: !shouldMarkAsUnread, // Mark as read if no unread messages OR if current user sent the latest message
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
        // Fetch the message and its replies (recursive? or just flat list with same parent)
        // Usually replies are just 1 level deep or N levels. Entity has `replies`.
        // Let's fetch all messages where ID = root OR parent = root.
        // Assuming single-level threading for simplicity (Student <-> Professor).
        // If multi-level, we need recursive CTE or similar, but let's stick to flat thread list.

        // First find root
        const root = await em.findOne(Message, { id: messageId }, { populate: ['sender', 'receiver', 'course'] });
        if (!root) return res.status(404).json({ success: false, message: 'Message not found' });

        // Security: user must be part of thread
        if (root.sender.id !== userId && root.receiver.id !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        // Find all replies
        const replies = await em.find(
            Message,
            { parent: messageId },
            {
                populate: ['sender', 'receiver'],
                orderBy: { createdAt: 'ASC' }
            }
        );

        // Combine
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

// POST /api/messages - Send a message or reply
router.post(
    '/',
    authenticate,
    body('content').isString().notEmpty(),
    // receiverId is optional if replying (inferred from parent)
    body('receiverId').optional().isInt(),
    body('parentId').optional().isInt(),
    body('courseId').optional().isInt(),
    async (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const em = RequestContext.getEntityManager() as EntityManager;
        const senderId = req.user!.id; // number
        const { receiverId, content, courseId, parentId } = req.body;

        try {
            const sender = await em.findOneOrFail(User, Number(senderId));
            let receiver: User | null = null;
            let parent: Message | null = null;
            let course: Course | undefined;

            if (parentId) {
                // Reply flow
                parent = await em.findOne(Message, parentId, { populate: ['sender', 'receiver', 'course'] });
                if (!parent) return res.status(404).json({ success: false, message: 'Parent message not found' });

                // Determine receiver: if I am sender of parent, receiver is parent.receiver? No, that's me.
                // If I am replying to a message where I was the receiver, then receiver is the original sender.
                // If I am replying to my own message (follow up), receiver is same.
                if (parent.sender.id === Number(senderId)) {
                    receiver = parent.receiver; // I sent parent, I am following up to same person
                } else {
                    receiver = parent.sender; // I received parent, I am replying to sender
                }

                // Inherit course
                course = parent.course;

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

            // Validate permissions (e.g. Student -> Professor only)
            // Skip strict check for now to allow flexible replies

            const message = new Message(sender, receiver, content, course, parent || undefined);
            await em.persistAndFlush(message);

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
        // Allow marking any message as read if I am receiver
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
