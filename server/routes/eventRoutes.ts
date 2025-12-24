import express, { Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import authenticate, { AuthRequest } from '../middleware/auth';
import { Event, EventStatus, EventPriority, EventAudience } from '../entities/Event';
import { Staff } from '../entities/Staff';
import { UserRole } from '../entities/User';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Helper to convert enum value to name for responses
const statusToString = (status: EventStatus): string => {
    switch (status) {
        case EventStatus.Draft: return 'Draft';
        case EventStatus.Published: return 'Published';
        case EventStatus.Ongoing: return 'Ongoing';
        case EventStatus.Completed: return 'Completed';
        case EventStatus.Cancelled: return 'Cancelled';
        default: return 'Unknown';
    }
};

const priorityToString = (priority: EventPriority): string => {
    switch (priority) {
        case EventPriority.Low: return 'Low';
        case EventPriority.Normal: return 'Normal';
        case EventPriority.High: return 'High';
        case EventPriority.Featured: return 'Featured';
        default: return 'Unknown';
    }
};

const audienceToString = (audience: EventAudience): string => {
    switch (audience) {
        case EventAudience.All: return 'All';
        case EventAudience.Students: return 'Students';
        case EventAudience.Staff: return 'Staff';
        case EventAudience.Professors: return 'Professors';
        case EventAudience.Parents: return 'Parents';
        default: return 'Unknown';
    }
};

// Helper to format event for response
const formatEvent = (e: Event) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    organizer: {
        id: e.organizer.id,
        name: e.organizer.name,
        email: e.organizer.email
    },
    status: e.status,
    statusName: statusToString(e.status),
    priority: e.priority,
    priorityName: priorityToString(e.priority),
    audience: e.audience,
    audienceName: audienceToString(e.audience),
    startDate: e.startDate,
    endDate: e.endDate,
    location: e.location,
    publishedAt: e.publishedAt,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt
});

// Staff-only middleware
const staffOnly = (req: AuthRequest, res: Response, next: Function) => {
    if (req.user?.role !== UserRole.Staff) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only staff members can manage events.'
        });
    }
    next();
};

// Auto-archive completed events helper
const autoArchiveCompletedEvents = async (em: EntityManager) => {
    const now = new Date();
    // Find all published or ongoing events that have ended
    const eventsToComplete = await em.find(Event, {
        status: { $in: [EventStatus.Published, EventStatus.Ongoing] },
        endDate: { $lt: now }
    });

    for (const event of eventsToComplete) {
        event.status = EventStatus.Completed;
    }

    if (eventsToComplete.length > 0) {
        await em.flush();
    }
};

// GET /api/events - Get all events (filtered by user role for visibility)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    const em = RequestContext.getEntityManager() as EntityManager;
    const userRole = req.user!.role;

    try {
        // Auto-archive completed events
        await autoArchiveCompletedEvents(em);

        // Determine which audience values the user can see
        const audienceFilter: EventAudience[] = [EventAudience.All];

        switch (userRole) {
            case UserRole.Student:
                audienceFilter.push(EventAudience.Students);
                break;
            case UserRole.Staff:
                audienceFilter.push(EventAudience.Staff);
                break;
            case UserRole.Professor:
                audienceFilter.push(EventAudience.Professors);
                break;
            case UserRole.Parent:
                audienceFilter.push(EventAudience.Parents);
                break;
        }

        // Staff can see all events (including drafts)
        // Others can only see published/ongoing events
        const isStaff = userRole === UserRole.Staff;

        const whereConditions: any = {
            audience: { $in: audienceFilter }
        };

        if (!isStaff) {
            whereConditions.status = { $in: [EventStatus.Published, EventStatus.Ongoing] };
        }

        const events = await em.find(
            Event,
            whereConditions,
            {
                populate: ['organizer'],
                orderBy: { startDate: 'ASC' }
            }
        );

        return res.json({
            success: true,
            data: events.map(formatEvent)
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching events'
        });
    }
});

// GET /api/events/staff - Get all events for staff management
router.get('/staff', authenticate, staffOnly, async (req: AuthRequest, res: Response) => {
    const em = RequestContext.getEntityManager() as EntityManager;

    try {
        // Auto-archive completed events
        await autoArchiveCompletedEvents(em);

        const events = await em.find(
            Event,
            {},
            {
                populate: ['organizer'],
                orderBy: { startDate: 'ASC' }
            }
        );

        return res.json({
            success: true,
            data: events.map(formatEvent)
        });
    } catch (error) {
        console.error('Error fetching events for staff:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching events'
        });
    }
});

// GET /api/events/:id - Get single event
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    const em = RequestContext.getEntityManager() as EntityManager;
    const id = Number(req.params.id);

    try {
        const event = await em.findOne(
            Event,
            { id },
            { populate: ['organizer'] }
        );

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        return res.json({
            success: true,
            data: formatEvent(event)
        });
    } catch (error) {
        console.error('Error fetching event:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching event'
        });
    }
});

// POST /api/events - Create event (staff only)
router.post(
    '/',
    authenticate,
    staffOnly,
    body('title').isString().notEmpty().withMessage('Title is required'),
    body('description').isString().notEmpty().withMessage('Description is required'),
    body('startDate').isISO8601().withMessage('Start date is required'),
    body('endDate').isISO8601().withMessage('End date is required'),
    body('status').optional().isInt({ min: 0, max: 4 }),
    body('priority').optional().isInt({ min: 0, max: 3 }),
    body('audience').optional().isInt({ min: 0, max: 4 }),
    body('location').optional({ nullable: true }).isString(),
    async (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const em = RequestContext.getEntityManager() as EntityManager;
        const userId = Number(req.user!.id);

        try {
            const organizer = await em.findOne(Staff, { id: userId });
            if (!organizer) {
                return res.status(404).json({
                    success: false,
                    message: 'Staff member not found'
                });
            }

            const {
                title,
                description,
                startDate,
                endDate,
                status = EventStatus.Draft,
                priority = EventPriority.Normal,
                audience = EventAudience.All,
                location
            } = req.body;

            // Validate end date is after start date
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (end <= start) {
                return res.status(400).json({
                    success: false,
                    message: 'End date must be after start date'
                });
            }

            const event = new Event(
                title,
                description,
                organizer,
                start,
                end,
                status,
                priority,
                audience
            );

            if (location) {
                event.location = location;
            }

            // If publishing immediately, set publishedAt
            if (status === EventStatus.Published) {
                event.publishedAt = new Date();
            }

            await em.persistAndFlush(event);

            // Reload with organizer populated
            await em.populate(event, ['organizer']);

            return res.status(201).json({
                success: true,
                message: 'Event created successfully',
                data: formatEvent(event)
            });
        } catch (error) {
            console.error('Error creating event:', error);
            return res.status(500).json({
                success: false,
                message: 'Error creating event'
            });
        }
    }
);

// PUT /api/events/:id - Update event (staff only)
router.put(
    '/:id',
    authenticate,
    staffOnly,
    body('title').optional().isString().notEmpty(),
    body('description').optional().isString().notEmpty(),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('status').optional().isInt({ min: 0, max: 4 }),
    body('priority').optional().isInt({ min: 0, max: 3 }),
    body('audience').optional().isInt({ min: 0, max: 4 }),
    body('location').optional({ nullable: true }).custom((value) => {
        if (value === null || value === '' || value === undefined) return true;
        return typeof value === 'string';
    }),
    async (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const em = RequestContext.getEntityManager() as EntityManager;
        const id = Number(req.params.id);

        try {
            const event = await em.findOne(
                Event,
                { id },
                { populate: ['organizer'] }
            );

            if (!event) {
                return res.status(404).json({
                    success: false,
                    message: 'Event not found'
                });
            }

            const { title, description, startDate, endDate, status, priority, audience, location } = req.body;

            if (title !== undefined) event.title = title;
            if (description !== undefined) event.description = description;
            if (priority !== undefined) event.priority = priority;
            if (audience !== undefined) event.audience = audience;

            if (startDate !== undefined) {
                event.startDate = new Date(startDate);
            }

            if (endDate !== undefined) {
                event.endDate = new Date(endDate);
            }

            // Validate end date is after start date
            if (event.endDate <= event.startDate) {
                return res.status(400).json({
                    success: false,
                    message: 'End date must be after start date'
                });
            }

            if (location !== undefined) {
                event.location = location || undefined;
            }

            // Handle status changes
            if (status !== undefined && status !== event.status) {
                event.status = status;

                // If publishing now, set publishedAt
                if (status === EventStatus.Published && !event.publishedAt) {
                    event.publishedAt = new Date();
                }
            }

            await em.flush();

            return res.json({
                success: true,
                message: 'Event updated successfully',
                data: formatEvent(event)
            });
        } catch (error) {
            console.error('Error updating event:', error);
            return res.status(500).json({
                success: false,
                message: 'Error updating event'
            });
        }
    }
);

// DELETE /api/events/:id - Delete event (staff only)
router.delete('/:id', authenticate, staffOnly, async (req: AuthRequest, res: Response) => {
    const em = RequestContext.getEntityManager() as EntityManager;
    const id = Number(req.params.id);

    try {
        const event = await em.findOne(Event, { id });

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        await em.removeAndFlush(event);

        return res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting event:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting event'
        });
    }
});

// POST /api/events/:id/publish - Publish an event immediately (staff only)
router.post('/:id/publish', authenticate, staffOnly, async (req: AuthRequest, res: Response) => {
    const em = RequestContext.getEntityManager() as EntityManager;
    const id = Number(req.params.id);

    try {
        const event = await em.findOne(
            Event,
            { id },
            { populate: ['organizer'] }
        );

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        event.status = EventStatus.Published;
        event.publishedAt = new Date();

        await em.flush();

        return res.json({
            success: true,
            message: 'Event published successfully',
            data: formatEvent(event)
        });
    } catch (error) {
        console.error('Error publishing event:', error);
        return res.status(500).json({
            success: false,
            message: 'Error publishing event'
        });
    }
});

export default router;
