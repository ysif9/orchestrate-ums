import express, { Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { Booking, BookingStatus } from '../entities/Booking';
import { Room } from '../entities/Room';
import { User, UserRole } from '../entities/User';
import authenticate, { AuthRequest } from '../middleware/auth';
import authorize from '../middleware/authorize';

const router = express.Router();

// Helper function to check for booking conflicts
async function hasConflict(em: any, roomId: number, startTime: Date, endTime: Date, excludeBookingId?: number): Promise<boolean> {
    const query: any = {
        room: { id: roomId },
        status: { $ne: BookingStatus.Cancelled },
        $or: [
            // New booking starts during existing booking
            { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
            // New booking ends during existing booking
            { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
            // New booking completely contains existing booking
            { startTime: { $gte: startTime }, endTime: { $lte: endTime } }
        ]
    };

    if (excludeBookingId) {
        query.id = { $ne: excludeBookingId };
    }

    const conflictingBookings = await em.find(Booking, query);
    return conflictingBookings.length > 0;
}

// GET /api/bookings - Get all bookings (with optional filters)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const { roomId, startDate, endDate, status, myBookings } = req.query;

        const filter: any = {};

        if (roomId) {
            filter.room = { id: parseInt(roomId as string) };
        }

        // Filter bookings that overlap with the date range
        // A booking overlaps if: booking.startTime < endDate AND booking.endTime > startDate
        if (startDate && endDate) {
            filter.$and = [
                { startTime: { $lt: new Date(endDate as string) } },
                { endTime: { $gt: new Date(startDate as string) } }
            ];
        } else if (startDate) {
            filter.endTime = { $gt: new Date(startDate as string) };
        } else if (endDate) {
            filter.startTime = { $lt: new Date(endDate as string) };
        }

        if (status) {
            filter.status = status;
        }

        // If myBookings is true, only show bookings by the current user
        if (myBookings === 'true' && req.user) {
            filter.bookedBy = { id: parseInt(req.user.id) };
        }

        const bookings = await em.find(Booking, filter, {
            populate: ['room', 'bookedBy'],
            orderBy: { startTime: 'ASC' }
        });

        res.json({ success: true, bookings });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/bookings/room/:roomId - Get bookings for a specific room
router.get('/room/:roomId', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const { startDate, endDate } = req.query;

        const filter: any = {
            room: { id: parseInt(req.params.roomId) },
            status: { $ne: BookingStatus.Cancelled }
        };

        // Filter bookings that overlap with the date range
        // A booking overlaps if: booking.startTime < endDate AND booking.endTime > startDate
        if (startDate && endDate) {
            filter.$and = [
                { startTime: { $lt: new Date(endDate as string) } },
                { endTime: { $gt: new Date(startDate as string) } }
            ];
        } else if (startDate) {
            // If only startDate provided, get bookings that end after startDate
            filter.endTime = { $gt: new Date(startDate as string) };
        } else if (endDate) {
            // If only endDate provided, get bookings that start before endDate
            filter.startTime = { $lt: new Date(endDate as string) };
        }

        const bookings = await em.find(Booking, filter, {
            populate: ['room', 'bookedBy'],
            orderBy: { startTime: 'ASC' }
        });

        res.json({ success: true, bookings });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/bookings/:id - Get single booking
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const booking = await em.findOne(Booking, { id: parseInt(req.params.id) }, {
            populate: ['room', 'bookedBy']
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        res.json({ success: true, booking });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/bookings - Create a new booking (Professors only)
router.post('/', authenticate, authorize(UserRole.Professor, UserRole.Staff), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const { title, description, roomId, startTime, endTime, notes } = req.body;

        if (!title || !roomId || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'Title, roomId, startTime, and endTime are required'
            });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        // Validate times
        if (start >= end) {
            return res.status(400).json({
                success: false,
                message: 'End time must be after start time'
            });
        }

        if (start < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot book a room in the past'
            });
        }

        // Check if room exists and is available
        const room = await em.findOne(Room, { id: roomId });
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        if (!room.isAvailable) {
            return res.status(400).json({
                success: false,
                message: 'This room is not available for booking'
            });
        }

        // Check for conflicts
        const conflict = await hasConflict(em, roomId, start, end);
        if (conflict) {
            return res.status(409).json({
                success: false,
                message: 'This room is already booked for the selected time slot'
            });
        }

        // Get the user making the booking
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        const user = await em.findOne(User, { id: parseInt(req.user.id) });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Create the booking
        const booking = new Booking(title, start, end, room, user);
        booking.description = description;
        booking.notes = notes;
        booking.status = BookingStatus.Confirmed;

        await em.persistAndFlush(booking);

        // Populate for response
        await em.populate(booking, ['room', 'bookedBy']);

        res.status(201).json({
            success: true,
            message: 'Room booked successfully',
            booking
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/bookings/:id - Update a booking (owner or staff only)
router.put('/:id', authenticate, authorize(UserRole.Professor, UserRole.Staff), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const booking = await em.findOne(Booking, { id: parseInt(req.params.id) }, {
            populate: ['bookedBy']
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Check if user is the owner or staff
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        const isOwner = booking.bookedBy.id === parseInt(req.user.id);
        const isStaff = req.user.role === UserRole.Staff;

        if (!isOwner && !isStaff) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own bookings'
            });
        }

        const { title, description, roomId, startTime, endTime, notes, status } = req.body;

        // If changing room or time, check for conflicts
        if (roomId || startTime || endTime) {
            const newRoomId = roomId || booking.room.id;
            const newStart = startTime ? new Date(startTime) : booking.startTime;
            const newEnd = endTime ? new Date(endTime) : booking.endTime;

            if (newStart >= newEnd) {
                return res.status(400).json({
                    success: false,
                    message: 'End time must be after start time'
                });
            }

            const conflict = await hasConflict(em, newRoomId, newStart, newEnd, booking.id);
            if (conflict) {
                return res.status(409).json({
                    success: false,
                    message: 'This room is already booked for the selected time slot'
                });
            }

            if (roomId && roomId !== booking.room.id) {
                const newRoom = await em.findOne(Room, { id: roomId });
                if (!newRoom) {
                    return res.status(404).json({ success: false, message: 'Room not found' });
                }
                booking.room = newRoom as any;
            }

            booking.startTime = newStart;
            booking.endTime = newEnd;
        }

        if (title) booking.title = title;
        if (description !== undefined) booking.description = description;
        if (notes !== undefined) booking.notes = notes;
        if (status) booking.status = status as BookingStatus;

        await em.flush();

        await em.populate(booking, ['room', 'bookedBy']);

        res.json({ success: true, message: 'Booking updated successfully', booking });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/bookings/:id - Cancel a booking (owner or staff only)
router.delete('/:id', authenticate, authorize(UserRole.Professor, UserRole.Staff), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const booking = await em.findOne(Booking, { id: parseInt(req.params.id) }, {
            populate: ['bookedBy']
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Check if user is the owner or staff
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        const isOwner = booking.bookedBy.id === parseInt(req.user.id);
        const isStaff = req.user.role === UserRole.Staff;

        if (!isOwner && !isStaff) {
            return res.status(403).json({
                success: false,
                message: 'You can only cancel your own bookings'
            });
        }

        // Soft delete - mark as cancelled
        booking.status = BookingStatus.Cancelled;
        await em.flush();

        res.json({ success: true, message: 'Booking cancelled successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/bookings/check-availability - Check room availability
router.post('/check-availability', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const { roomId, startTime, endTime } = req.body;

        if (!roomId || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'roomId, startTime, and endTime are required'
            });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        const conflict = await hasConflict(em, roomId, start, end);

        res.json({
            success: true,
            available: !conflict,
            message: conflict ? 'Room is not available for the selected time' : 'Room is available'
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;

