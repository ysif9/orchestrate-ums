// @ts-ignore
import express, { Response } from 'express';
// @ts-ignore
import { RequestContext } from '@mikro-orm/core';
import { Maintenance_Ticket ,ticket_status, issue_type} from '../entities/Maintenance_Ticket';
import { User, UserRole } from '../entities/User';
import authenticate, { AuthRequest } from '../middleware/auth';
import authorize from '../middleware/authorize';
import {Room} from "../entities/Room";

const router = express.Router();

// GET /api/tickets/rooms - Get all rooms
router.get('/rooms/', authenticate, async (req: AuthRequest, res: Response) => {
try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });




        const rooms = await em.find(Room, {},{
            orderBy: { building: 'ASC', name: 'ASC' }
        });

        res.json({ success: true, rooms });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// POST /api/tickets/rooms/tickets - Create a new ticket
router.post('/rooms/tickets', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const { roomId, description, issue_type } = req.body;

        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const room = await em.findOne(Room, { id: Number(roomId) });
        if (!room) return res.status(404).json({ message: 'Room not found' });

        const user = await em.findOne(User, { id: Number(req.user.id) });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const ticket = new Maintenance_Ticket(room, user, description);
        ticket.issue_type = issue_type;

        await em.persistAndFlush(ticket);
        return res.status(201).json({ success: true, ticket });

    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});





export default router;