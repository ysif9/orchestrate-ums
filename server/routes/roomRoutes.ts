import express, { Request, Response } from 'express';
import { RequestContext, wrap } from '@mikro-orm/core';
import { Room, RoomType } from '../entities/Room';
import { UserRole } from '../entities/User';
import authenticate, { AuthRequest } from '../middleware/auth';
import authorize from '../middleware/authorize';
import { Attribute, AttributeDataType } from '../entities/Attribute';
import { RoomAttributeValue } from '../entities/RoomAttributeValue';

const router = express.Router();

function flattenRoom(room: Room): any {
    const obj = wrap(room).toJSON() as any;
    if (room.attributes && room.attributes.isInitialized()) {
        room.attributes.getItems().forEach(attrVal => {
            // Basic flattening
            obj[attrVal.attribute.name] = attrVal.value;
            try {
                // Try to parse json if looks like list, though amenities is string list usually
                if (attrVal.attribute.name === 'amenities') {
                    obj['amenities'] = JSON.parse(attrVal.value);
                }
            } catch (e) {
                // ignore
            }
        });
    }
    return obj;
}

// Helper function to upsert attribute
async function upsertAttribute(em: any, room: Room, key: string, value: any, dataType: AttributeDataType) {
    if (value === undefined || value === null) return;

    let attr = await em.findOne(Attribute, { name: key, entityType: 'Room' });
    if (!attr) {
        attr = new Attribute(key, key.charAt(0).toUpperCase() + key.slice(1), dataType, 'Room');
        await em.persist(attr);
    }

    const existingVal = room.attributes.getItems().find(a => a.attribute.name === key);
    if (existingVal) {
        existingVal.setValue(value);
    } else {
        const newVal = new RoomAttributeValue(room);
        newVal.attribute = attr;
        newVal.setValue(value);
        room.attributes.add(newVal);
        em.persist(newVal);
    }
}

// GET /api/rooms - Get all rooms
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const rooms = await em.find(Room, {}, {
            populate: ['attributes', 'attributes.attribute'],
            orderBy: { building: 'ASC', name: 'ASC' }
        });

        res.json({ success: true, rooms: rooms.map(flattenRoom) });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/rooms/:id - Get single room
router.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const room = await em.findOne(Room, { id: parseInt(req.params.id) }, {
            populate: ['attributes', 'attributes.attribute']
        });

        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        res.json({ success: true, room: flattenRoom(room) });
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

        // RoomType is now an Int Enum. Ensure type is passed as number or converted if string
        // Assuming frontend might send string "classroom", we might need mapping if not handled.
        // But requested change said "Switch to EAV and INT", implying frontend should send correct values or we map.
        // For safety, let's assume exact match if frontend is updated, or simple cast if it sends numbers.

        const room = new Room(name, building, floor, capacity, type as RoomType);
        await em.persist(room); // Persist first to have ID for attributes if needed (though not strictly required for cascade)

        if (description) {
            await upsertAttribute(em, room, 'description', description, AttributeDataType.String);
        }

        if (amenities) {
            // Arrays usually stored as JsonB in EAV is tricky, but we can store as stringified JSON or separate attributes.
            // Given previous implementation was string[], let's assume we store it as a single string attribute "amenities" (JSON string)
            // OR strictly sticking to EAV "Value" types. 
            // Best EAV approach for Array: Multiple entries? Or JSON string?
            // BaseAttributeValue has no JSON type. Let's store as String (JSON.stringify) for now as quick fix.
            await upsertAttribute(em, room, 'amenities', JSON.stringify(amenities), AttributeDataType.String);
        }

        await em.flush();
        await em.populate(room, ['attributes', 'attributes.attribute']);

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

        const room = await em.findOne(Room, { id: parseInt(req.params.id) }, {
            populate: ['attributes', 'attributes.attribute']
        });

        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        const { name, building, floor, capacity, type, description, amenities, isAvailable } = req.body;

        if (name) room.name = name;
        if (building) room.building = building;
        if (floor !== undefined) room.floor = floor;
        if (capacity) room.capacity = capacity;
        if (type) room.type = type as RoomType;
        if (isAvailable !== undefined) room.isAvailable = isAvailable;

        if (description !== undefined) {
            await upsertAttribute(em, room, 'description', description, AttributeDataType.String);
        }
        if (amenities !== undefined) {
            await upsertAttribute(em, room, 'amenities', JSON.stringify(amenities), AttributeDataType.String);
        }

        await em.flush();
        await em.populate(room, ['attributes', 'attributes.attribute']);

        res.json({ success: true, message: 'Room updated successfully', room });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;

