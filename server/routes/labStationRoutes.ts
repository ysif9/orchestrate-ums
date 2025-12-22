import express, { Response } from 'express';
import { RequestContext, wrap } from '@mikro-orm/core';
import { LabStation, LabStationStatus } from '../entities/LabStation';
import { LabStationReservation, ReservationStatus, MAX_RESERVATION_DURATION_HOURS } from '../entities/LabStationReservation';
import { Room, RoomType } from '../entities/Room';
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
            // New reservation starts during existing reservation
            { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
            // New reservation ends during existing reservation
            { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
            // New reservation completely contains existing reservation
            { startTime: { $gte: startTime }, endTime: { $lte: endTime } }
        ]
    };

    if (excludeReservationId) {
        query.id = { $ne: excludeReservationId };
    }

    const conflictingReservations = await em.find(LabStationReservation, query);
    return conflictingReservations.length === 0;
}

// Helper function to expire old reservations and update station status
async function expireOldReservations(em: any): Promise<void> {
    const now = new Date();

    // Find all active reservations that have passed their end time
    const expiredReservations = await em.find(LabStationReservation, {
        status: ReservationStatus.Active,
        endTime: { $lte: now }
    }, {
        populate: ['station']
    });

    for (const reservation of expiredReservations) {
        reservation.status = ReservationStatus.Expired;

        // Update station status to available if no other active reservations
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
}

// GET /api/lab-stations - Get all lab stations (with optional filters)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        // Expire old reservations first
        await expireOldReservations(em);

        const { labId, status, isActive } = req.query;

        const filter: any = {};

        if (labId) {
            filter.lab = { id: parseInt(labId as string) };
        }

        if (status) {
            filter.status = status;
        }

        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }

        const stations = await em.find(LabStation, filter, {
            populate: ['lab'],
            orderBy: { stationNumber: 'ASC' }
        });

        res.json({ success: true, stations });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/lab-stations/labs - Get all labs (rooms of type 'lab')
router.get('/labs', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const labs = await em.find(Room, {
            type: RoomType.Lab,
            isAvailable: true
        }, {
            orderBy: { building: 'ASC', name: 'ASC' }
        });

        res.json({ success: true, labs });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/lab-stations/lab/:labId - Get all stations for a specific lab
router.get('/lab/:labId', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        // Expire old reservations first
        await expireOldReservations(em);

        const labId = parseInt(req.params.labId);

        // Verify lab exists and is of type 'lab'
        const lab = await em.findOne(Room, { id: labId, type: RoomType.Lab });
        if (!lab) {
            return res.status(404).json({ success: false, message: 'Lab not found' });
        }

        const stations = await em.find(LabStation, {
            lab: { id: labId },
            isActive: true
        }, {
            orderBy: { stationNumber: 'ASC' }
        });

        // Get current reservations for each station
        const now = new Date();
        const stationsWithReservations = await Promise.all(stations.map(async (station) => {
            const currentReservation = await em.findOne(LabStationReservation, {
                station: { id: station.id },
                status: ReservationStatus.Active,
                startTime: { $lte: now },
                endTime: { $gt: now }
            }, {
                populate: ['student']
            });

            return {
                ...station,
                currentReservation: currentReservation ? {
                    id: currentReservation.id,
                    startTime: currentReservation.startTime,
                    endTime: currentReservation.endTime,
                    studentName: currentReservation.student.getEntity().name
                } : null
            };
        }));

        res.json({ success: true, lab, stations: stationsWithReservations });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

import { Attribute, AttributeDataType } from '../entities/Attribute';
import { LabStationAttributeValue } from '../entities/LabStationAttributeValue';
// ... imports

// Helper function to upsert attribute
async function upsertAttribute(em: any, station: LabStation, key: string, value: any, dataType: AttributeDataType) {
    if (value === undefined || value === null) return;

    let attr = await em.findOne(Attribute, { name: key, entityType: 'LabStation' });
    if (!attr) {
        attr = new Attribute(key, key.charAt(0).toUpperCase() + key.slice(1), dataType, 'LabStation');
        await em.persist(attr);
    }

    const existingVal = station.attributes.getItems().find(a => a.attribute.name === key);
    if (existingVal) {
        existingVal.setValue(value);
    } else {
        const newVal = new LabStationAttributeValue(station);
        newVal.attribute = attr;
        newVal.setValue(value);
        station.attributes.add(newVal);
        em.persist(newVal);
    }
}

// ... existing GET ...
// GET /api/lab-stations/:id - Get single station
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const station = await em.findOne(LabStation, { id: parseInt(req.params.id) }, {
            populate: ['lab', 'reservations', 'attributes', 'attributes.attribute']
        });

        if (!station) {
            return res.status(404).json({ success: false, message: 'Station not found' });
        }

        const stationObj = wrap(station).toJSON() as any;
        // Flatten attributes
        station.attributes.getItems().forEach(attrVal => {
            if (attrVal.attribute.name === 'equipment') {
                try {
                    stationObj['equipment'] = JSON.parse(attrVal.value);
                } catch (e) {
                    stationObj['equipment'] = [];
                }
            } else {
                stationObj[attrVal.attribute.name] = attrVal.value;
            }
        });

        res.json({ success: true, station: stationObj });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// POST /api/lab-stations - Create a new lab station (Staff only)
router.post('/', authenticate, authorize(UserRole.Staff), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const { stationNumber, labId, description, equipment } = req.body;

        if (!stationNumber || !labId) {
            return res.status(400).json({
                success: false,
                message: 'Station number and lab ID are required'
            });
        }

        // Verify lab exists and is of type 'lab'
        const lab = await em.findOne(Room, { id: labId, type: RoomType.Lab });
        if (!lab) {
            return res.status(404).json({ success: false, message: 'Lab not found' });
        }

        // Check if station number already exists in this lab
        const existingStation = await em.findOne(LabStation, {
            stationNumber,
            lab: { id: labId }
        });
        if (existingStation) {
            return res.status(409).json({
                success: false,
                message: 'A station with this number already exists in this lab'
            });
        }

        const station = new LabStation(stationNumber, lab);
        station.description = description || ''; // Description is now a property on LabStation, but let's keep it safe. 
        // Wait, description is a property on LabStation in previous step? 
        // Let's check LabStation.ts again. 
        // Yes, I see: @Property({ default: '' }) description: string = '';
        // So description is NOT EAV. Equipment IS EAV (it was remove from entity).

        await em.persist(station); // Needed for attributes if any

        if (equipment) {
            // array of strings assumed
            await upsertAttribute(em, station, 'equipment', JSON.stringify(equipment), AttributeDataType.String);
        }

        await em.flush();
        await em.populate(station, ['lab', 'attributes', 'attributes.attribute']);

        res.status(201).json({
            success: true,
            message: 'Lab station created successfully',
            station
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/lab-stations/:id - Update a lab station (Staff only)
router.put('/:id', authenticate, authorize(UserRole.Staff), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const station = await em.findOne(LabStation, { id: parseInt(req.params.id) }, {
            populate: ['attributes', 'attributes.attribute']
        });
        if (!station) {
            return res.status(404).json({ success: false, message: 'Station not found' });
        }

        const { stationNumber, description, equipment, status, isActive } = req.body;

        if (stationNumber) station.stationNumber = stationNumber;
        if (description !== undefined) station.description = description; // Valid property
        if (status) station.status = status as LabStationStatus;
        if (isActive !== undefined) station.isActive = isActive;

        if (equipment !== undefined) {
            await upsertAttribute(em, station, 'equipment', JSON.stringify(equipment), AttributeDataType.String);
        }

        await em.flush();
        await em.populate(station, ['lab', 'attributes', 'attributes.attribute']);

        res.json({ success: true, message: 'Station updated successfully', station });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/lab-stations/:id - Delete a lab station (Staff only)
router.delete('/:id', authenticate, authorize(UserRole.Staff), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const station = await em.findOne(LabStation, { id: parseInt(req.params.id) });
        if (!station) {
            return res.status(404).json({ success: false, message: 'Station not found' });
        }

        // Soft delete - mark as inactive
        station.isActive = false;
        await em.flush();

        res.json({ success: true, message: 'Station deactivated successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;

