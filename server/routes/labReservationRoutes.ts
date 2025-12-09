// @ts-ignore
import express, { Response } from 'express';
// @ts-ignore
import { RequestContext } from '@mikro-orm/core';
import { LabStation, LabStationStatus } from '../entities/LabStation';
import { LabStationReservation, ReservationStatus, MAX_RESERVATION_DURATION_HOURS } from '../entities/LabStationReservation';
import { User, UserRole } from '../entities/User';
import authenticate, { AuthRequest } from '../middleware/auth';
import authorize from '../middleware/authorize';

const router = express.Router();

// Helper function to check if a student has an active reservation
async function hasActiveReservation(em: any, studentId: number): Promise<LabStationReservation | null> {
    const now = new Date();
    const activeReservation = await em.findOne(LabStationReservation, {
        student: { id: studentId },
        status: ReservationStatus.Active,
        endTime: { $gt: now }
    }, {
        populate: ['station', 'station.lab']
    });
    return activeReservation;
}

// Helper function to check if a station is available for a time slot
async function isStationAvailable(em: any, stationId: number, startTime: Date, endTime: Date, excludeReservationId?: number): Promise<boolean> {
    const query: any = {
        station: { id: stationId },
        status: ReservationStatus.Active,
        $or: [
            { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
            { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
            { startTime: { $gte: startTime }, endTime: { $lte: endTime } }
        ]
    };

    if (excludeReservationId) {
        query.id = { $ne: excludeReservationId };
    }

    const conflictingReservations = await em.find(LabStationReservation, query);
    return conflictingReservations.length === 0;
}

// Helper function to expire old reservations
async function expireOldReservations(em: any): Promise<LabStationReservation[]> {
    const now = new Date();
    
    const expiredReservations = await em.find(LabStationReservation, {
        status: ReservationStatus.Active,
        endTime: { $lte: now }
    }, {
        populate: ['station', 'student']
    });

    for (const reservation of expiredReservations) {
        reservation.status = ReservationStatus.Expired;
        
        const station = reservation.station.getEntity();
        const otherActiveReservations = await em.find(LabStationReservation, {
            station: { id: station.id },
            status: ReservationStatus.Active,
            id: { $ne: reservation.id }
        });
        
        if (otherActiveReservations.length === 0) {
            station.status = LabStationStatus.Available;
        }
    }

    if (expiredReservations.length > 0) {
        await em.flush();
    }

    return expiredReservations;
}

// GET /api/lab-reservations - Get all reservations (with optional filters)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        await expireOldReservations(em);

        const { stationId, studentId, status, myReservations } = req.query;

        const filter: any = {};

        if (stationId) {
            filter.station = { id: parseInt(stationId as string) };
        }

        if (studentId) {
            filter.student = { id: parseInt(studentId as string) };
        }

        if (status) {
            filter.status = status;
        }

        if (myReservations === 'true' && req.user) {
            filter.student = { id: parseInt(req.user.id) };
        }

        const reservations = await em.find(LabStationReservation, filter, {
            populate: ['station', 'station.lab', 'student'],
            orderBy: { startTime: 'DESC' }
        });

        res.json({ success: true, reservations });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/lab-reservations/my-active - Get current user's active reservation
router.get('/my-active', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        await expireOldReservations(em);

        const activeReservation = await hasActiveReservation(em, parseInt(req.user.id));

        res.json({ 
            success: true, 
            hasActiveReservation: !!activeReservation,
            reservation: activeReservation 
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/lab-reservations/:id - Get single reservation
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const reservation = await em.findOne(LabStationReservation, { id: parseInt(req.params.id) }, {
            populate: ['station', 'station.lab', 'student']
        });

        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        res.json({ success: true, reservation });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/lab-reservations - Create a new reservation (Students only)
router.post('/', authenticate, authorize(UserRole.Student), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        await expireOldReservations(em);

        const { stationId, startTime, endTime, purpose, notes } = req.body;

        if (!stationId || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'Station ID, start time, and end time are required'
            });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);
        const now = new Date();

        // Validate times
        if (start >= end) {
            return res.status(400).json({
                success: false,
                message: 'End time must be after start time'
            });
        }

        if (start < now) {
            return res.status(400).json({
                success: false,
                message: 'Cannot make a reservation in the past'
            });
        }

        // Check max duration (4 hours)
        const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        if (durationHours > MAX_RESERVATION_DURATION_HOURS) {
            return res.status(400).json({
                success: false,
                message: `Reservation duration cannot exceed ${MAX_RESERVATION_DURATION_HOURS} hours`
            });
        }

        // Check if student already has an active reservation
        const existingReservation = await hasActiveReservation(em, parseInt(req.user.id));
        if (existingReservation) {
            const stationInfo = existingReservation.station.getEntity();
            const labInfo = stationInfo.lab.getEntity();
            return res.status(409).json({
                success: false,
                message: `You already have an active reservation at ${labInfo.name}, Station ${stationInfo.stationNumber}. Please complete or cancel your current reservation before making a new one.`,
                existingReservation: {
                    id: existingReservation.id,
                    stationNumber: stationInfo.stationNumber,
                    labName: labInfo.name,
                    endTime: existingReservation.endTime
                }
            });
        }

        // Check if station exists and is active
        const station = await em.findOne(LabStation, { id: stationId, isActive: true });
        if (!station) {
            return res.status(404).json({ success: false, message: 'Station not found or inactive' });
        }

        // Check if station is available for the time slot
        const available = await isStationAvailable(em, stationId, start, end);
        if (!available) {
            return res.status(409).json({
                success: false,
                message: 'This station is already reserved for the selected time slot'
            });
        }

        // Get the student
        const student = await em.findOne(User, { id: parseInt(req.user.id) });
        if (!student) return res.status(404).json({ message: 'User not found' });

        // Create the reservation
        const reservation = new LabStationReservation(station, student, start, end);
        reservation.purpose = purpose;
        reservation.notes = notes;

        // Update station status
        station.status = LabStationStatus.Reserved;

        await em.persistAndFlush(reservation);
        await em.populate(reservation, ['station', 'station.lab', 'student']);

        res.status(201).json({
            success: true,
            message: 'Reservation created successfully',
            reservation
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/lab-reservations/:id/cancel - Cancel a reservation
router.put('/:id/cancel', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const reservation = await em.findOne(LabStationReservation, { id: parseInt(req.params.id) }, {
            populate: ['station', 'student']
        });

        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        // Check if user is the owner or staff
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        const isOwner = reservation.student.id === parseInt(req.user.id);
        const isStaff = req.user.role === UserRole.Staff;

        if (!isOwner && !isStaff) {
            return res.status(403).json({
                success: false,
                message: 'You can only cancel your own reservations'
            });
        }

        if (reservation.status !== ReservationStatus.Active) {
            return res.status(400).json({
                success: false,
                message: 'Only active reservations can be cancelled'
            });
        }

        reservation.status = ReservationStatus.Cancelled;

        // Update station status
        const station = reservation.station.getEntity();
        const otherActiveReservations = await em.find(LabStationReservation, {
            station: { id: station.id },
            status: ReservationStatus.Active,
            id: { $ne: reservation.id }
        });

        if (otherActiveReservations.length === 0) {
            station.status = LabStationStatus.Available;
        }

        await em.flush();

        res.json({ success: true, message: 'Reservation cancelled successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/lab-reservations/check-expiring - Check for expiring reservations (for alerts)
router.get('/check-expiring', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const now = new Date();
        const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

        // Find reservations expiring within 30 minutes
        const expiringReservation = await em.findOne(LabStationReservation, {
            student: { id: parseInt(req.user.id) },
            status: ReservationStatus.Active,
            endTime: { $lte: thirtyMinutesFromNow, $gt: now },
            expirationAlertSent: { $ne: true }
        }, {
            populate: ['station', 'station.lab']
        });

        if (expiringReservation) {
            expiringReservation.expirationAlertSent = true;
            await em.flush();
        }

        res.json({
            success: true,
            hasExpiringReservation: !!expiringReservation,
            reservation: expiringReservation
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;

