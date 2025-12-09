import express, { Request, Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { Room, RoomType } from '../entities/Room';
import { UserRole } from '../entities/User';
import authenticate, { AuthRequest } from '../middleware/auth';
import authorize from '../middleware/authorize';

const router = express.Router();

// GET /api/rooms - Get all rooms (authenticated users)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const { type, building, minCapacity, isAvailable } = req.query;

        const filter: any = {};

        if (type && type !== 'all') {
            filter.type = type;
        }

        if (building) {
            filter.building = building;
        }

        if (minCapacity) {
            filter.capacity = { $gte: parseInt(minCapacity as string) };
        }

        if (isAvailable !== undefined) {
            filter.isAvailable = isAvailable === 'true';
        }

        const rooms = await em.find(Room, filter, {
            orderBy: { building: 'ASC', name: 'ASC' }
        });

        res.json({ success: true, rooms });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/rooms/:id - Get single room
router.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const room = await em.findOne(Room, { id: parseInt(req.params.id) });

        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        res.json({ success: true, room });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/rooms - Create room (Staff only)
router.post('/', authenticate, authorize(UserRole.Staff), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const { name, building, floor, capacity, type, description, amenities } = req.body;

        if (!name || !building || floor === undefined || !capacity || !type) {
            return res.status(400).json({
                success: false,
                message: 'Name, building, floor, capacity, and type are required'
            });
        }

        const room = new Room(name, building, floor, capacity, type as RoomType);
        room.description = description;
        room.amenities = amenities;

        await em.persistAndFlush(room);

        res.status(201).json({ success: true, message: 'Room created successfully', room });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/rooms/:id - Update room (Staff only)
router.put('/:id', authenticate, authorize(UserRole.Staff), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const room = await em.findOne(Room, { id: parseInt(req.params.id) });

        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        const { name, building, floor, capacity, type, description, amenities, isAvailable } = req.body;

        if (name) room.name = name;
        if (building) room.building = building;
        if (floor !== undefined) room.floor = floor;
        if (capacity) room.capacity = capacity;
        if (type) room.type = type as RoomType;
        if (description !== undefined) room.description = description;
        if (amenities !== undefined) room.amenities = amenities;
        if (isAvailable !== undefined) room.isAvailable = isAvailable;

        await em.flush();

        res.json({ success: true, message: 'Room updated successfully', room });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/rooms/:id - Delete room (Staff only)
router.delete('/:id', authenticate, authorize(UserRole.Staff), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const room = await em.findOne(Room, { id: parseInt(req.params.id) });

        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        await em.removeAndFlush(room);

        res.json({ success: true, message: 'Room deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;

