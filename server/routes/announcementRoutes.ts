import express, { Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import authenticate, { AuthRequest } from '../middleware/auth';
import { Announcement, AnnouncementStatus, AnnouncementPriority, AnnouncementAudience } from '../entities/Announcement';
import { Staff } from '../entities/Staff';
import { UserRole } from '../entities/User';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Helper to convert enum value to name for responses
const statusToString = (status: AnnouncementStatus): string => {
    switch (status) {
        case AnnouncementStatus.Draft: return 'Draft';
        case AnnouncementStatus.Published: return 'Published';
        case AnnouncementStatus.Scheduled: return 'Scheduled';
        case AnnouncementStatus.Archived: return 'Archived';
        default: return 'Unknown';
    }
};

const priorityToString = (priority: AnnouncementPriority): string => {
    switch (priority) {
        case AnnouncementPriority.Low: return 'Low';
        case AnnouncementPriority.Normal: return 'Normal';
        case AnnouncementPriority.High: return 'High';
        case AnnouncementPriority.Urgent: return 'Urgent';
        default: return 'Unknown';
    }
};

const audienceToString = (audience: AnnouncementAudience): string => {
    switch (audience) {
        case AnnouncementAudience.All: return 'All';
        case AnnouncementAudience.Students: return 'Students';
        case AnnouncementAudience.Staff: return 'Staff';
        case AnnouncementAudience.Professors: return 'Professors';
        case AnnouncementAudience.Parents: return 'Parents';
        default: return 'Unknown';
    }
};

// Helper to format announcement for response
const formatAnnouncement = (a: Announcement) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    author: {
        id: a.author.id,
        name: a.author.name,
        email: a.author.email
    },
    status: a.status,
    statusName: statusToString(a.status),
    priority: a.priority,
    priorityName: priorityToString(a.priority),
    audience: a.audience,
    audienceName: audienceToString(a.audience),
    scheduledAt: a.scheduledAt,
    publishedAt: a.publishedAt,
    expiresAt: a.expiresAt,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt
});

// Staff-only middleware
const staffOnly = (req: AuthRequest, res: Response, next: Function) => {
    if (req.user?.role !== UserRole.Staff) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only staff members can manage announcements.'
        });
    }
    next();
};

// GET /api/announcements - Get all announcements (filtered by user role for visibility)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    const em = RequestContext.getEntityManager() as EntityManager;
    const userRole = req.user!.role;

    try {
        // Determine which audience values the user can see
        const audienceFilter: AnnouncementAudience[] = [AnnouncementAudience.All];

        switch (userRole) {
            case UserRole.Student:
                audienceFilter.push(AnnouncementAudience.Students);
                break;
            case UserRole.Staff:
                audienceFilter.push(AnnouncementAudience.Staff);
                break;
            case UserRole.Professor:
                audienceFilter.push(AnnouncementAudience.Professors);
                break;
            case UserRole.Parent:
                audienceFilter.push(AnnouncementAudience.Parents);
                break;
        }

        // Staff can see all announcements (including drafts)
        // Others can only see published announcements
        const isStaff = userRole === UserRole.Staff;

        const whereConditions: any = {
            audience: { $in: audienceFilter }
        };

        if (!isStaff) {
            whereConditions.status = AnnouncementStatus.Published;
            // Only show non-expired announcements
            whereConditions.$or = [
                { expiresAt: null },
                { expiresAt: { $gte: new Date() } }
            ];
        }

        const announcements = await em.find(
            Announcement,
            whereConditions,
            {
                populate: ['author'],
                orderBy: { createdAt: 'DESC' }
            }
        );

        return res.json({
            success: true,
            data: announcements.map(formatAnnouncement)
        });
    } catch (error) {
        console.error('Error fetching announcements:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching announcements'
        });
    }
});

// GET /api/announcements/staff - Get all announcements for staff management
router.get('/staff', authenticate, staffOnly, async (req: AuthRequest, res: Response) => {
    const em = RequestContext.getEntityManager() as EntityManager;

    try {
        const announcements = await em.find(
            Announcement,
            {},
            {
                populate: ['author'],
                orderBy: { createdAt: 'DESC' }
            }
        );

        return res.json({
            success: true,
            data: announcements.map(formatAnnouncement)
        });
    } catch (error) {
        console.error('Error fetching announcements for staff:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching announcements'
        });
    }
});

// GET /api/announcements/:id - Get single announcement
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    const em = RequestContext.getEntityManager() as EntityManager;
    const id = Number(req.params.id);

    try {
        const announcement = await em.findOne(
            Announcement,
            { id },
            { populate: ['author'] }
        );

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }

        return res.json({
            success: true,
            data: formatAnnouncement(announcement)
        });
    } catch (error) {
        console.error('Error fetching announcement:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching announcement'
        });
    }
});

// POST /api/announcements - Create announcement (staff only)
router.post(
    '/',
    authenticate,
    staffOnly,
    body('title').isString().notEmpty().withMessage('Title is required'),
    body('content').isString().notEmpty().withMessage('Content is required'),
    body('status').optional().isInt({ min: 0, max: 3 }),
    body('priority').optional().isInt({ min: 0, max: 3 }),
    body('audience').optional().isInt({ min: 0, max: 4 }),
    body('scheduledAt').optional({ nullable: true }).custom((value) => {
        if (value === null || value === '' || value === undefined) return true;
        return !isNaN(Date.parse(value));
    }),
    body('expiresAt').optional({ nullable: true }).custom((value) => {
        if (value === null || value === '' || value === undefined) return true;
        return !isNaN(Date.parse(value));
    }),
    async (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const em = RequestContext.getEntityManager() as EntityManager;
        const userId = Number(req.user!.id);

        try {
            const author = await em.findOne(Staff, { id: userId });
            if (!author) {
                return res.status(404).json({
                    success: false,
                    message: 'Staff member not found'
                });
            }

            const {
                title,
                content,
                status = AnnouncementStatus.Draft,
                priority = AnnouncementPriority.Normal,
                audience = AnnouncementAudience.All,
                scheduledAt,
                expiresAt
            } = req.body;

            const announcement = new Announcement(
                title,
                content,
                author,
                status,
                priority,
                audience
            );

            if (scheduledAt) {
                announcement.scheduledAt = new Date(scheduledAt);
            }

            if (expiresAt) {
                announcement.expiresAt = new Date(expiresAt);
            }

            // If publishing immediately, set publishedAt
            if (status === AnnouncementStatus.Published) {
                announcement.publishedAt = new Date();
            }

            await em.persistAndFlush(announcement);

            // Reload with author populated
            await em.populate(announcement, ['author']);

            return res.status(201).json({
                success: true,
                message: 'Announcement created successfully',
                data: formatAnnouncement(announcement)
            });
        } catch (error) {
            console.error('Error creating announcement:', error);
            return res.status(500).json({
                success: false,
                message: 'Error creating announcement'
            });
        }
    }
);

// PUT /api/announcements/:id - Update announcement (staff only)
router.put(
    '/:id',
    authenticate,
    staffOnly,
    body('title').optional().isString().notEmpty(),
    body('content').optional().isString().notEmpty(),
    body('status').optional().isInt({ min: 0, max: 3 }),
    body('priority').optional().isInt({ min: 0, max: 3 }),
    body('audience').optional().isInt({ min: 0, max: 4 }),
    body('scheduledAt').optional().custom((value) => {
        if (value === '' || value === null) return true;
        return !isNaN(Date.parse(value));
    }),
    body('expiresAt').optional().custom((value) => {
        if (value === '' || value === null) return true;
        return !isNaN(Date.parse(value));
    }),
    async (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const em = RequestContext.getEntityManager() as EntityManager;
        const id = Number(req.params.id);

        try {
            const announcement = await em.findOne(
                Announcement,
                { id },
                { populate: ['author'] }
            );

            if (!announcement) {
                return res.status(404).json({
                    success: false,
                    message: 'Announcement not found'
                });
            }

            const { title, content, status, priority, audience, scheduledAt, expiresAt } = req.body;

            if (title !== undefined) announcement.title = title;
            if (content !== undefined) announcement.content = content;
            if (priority !== undefined) announcement.priority = priority;
            if (audience !== undefined) announcement.audience = audience;

            if (scheduledAt !== undefined) {
                announcement.scheduledAt = scheduledAt ? new Date(scheduledAt) : undefined;
            }

            if (expiresAt !== undefined) {
                announcement.expiresAt = expiresAt ? new Date(expiresAt) : undefined;
            }

            // Handle status changes
            if (status !== undefined && status !== announcement.status) {
                announcement.status = status;

                // If publishing now, set publishedAt
                if (status === AnnouncementStatus.Published && !announcement.publishedAt) {
                    announcement.publishedAt = new Date();
                }
            }

            await em.flush();

            return res.json({
                success: true,
                message: 'Announcement updated successfully',
                data: formatAnnouncement(announcement)
            });
        } catch (error) {
            console.error('Error updating announcement:', error);
            return res.status(500).json({
                success: false,
                message: 'Error updating announcement'
            });
        }
    }
);

// DELETE /api/announcements/:id - Delete announcement (staff only)
router.delete('/:id', authenticate, staffOnly, async (req: AuthRequest, res: Response) => {
    const em = RequestContext.getEntityManager() as EntityManager;
    const id = Number(req.params.id);

    try {
        const announcement = await em.findOne(Announcement, { id });

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }

        await em.removeAndFlush(announcement);

        return res.json({
            success: true,
            message: 'Announcement deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting announcement'
        });
    }
});

// POST /api/announcements/:id/publish - Publish an announcement immediately (staff only)
router.post('/:id/publish', authenticate, staffOnly, async (req: AuthRequest, res: Response) => {
    const em = RequestContext.getEntityManager() as EntityManager;
    const id = Number(req.params.id);

    try {
        const announcement = await em.findOne(
            Announcement,
            { id },
            { populate: ['author'] }
        );

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }

        announcement.status = AnnouncementStatus.Published;
        announcement.publishedAt = new Date();

        await em.flush();

        return res.json({
            success: true,
            message: 'Announcement published successfully',
            data: formatAnnouncement(announcement)
        });
    } catch (error) {
        console.error('Error publishing announcement:', error);
        return res.status(500).json({
            success: false,
            message: 'Error publishing announcement'
        });
    }
});

export default router;
