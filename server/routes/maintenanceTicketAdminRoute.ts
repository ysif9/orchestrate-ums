

// @ts-ignore
import { RequestContext } from '@mikro-orm/core';
import { Maintenance_Ticket ,ticket_status, issue_type} from '../entities/Maintenance_Ticket';
import { User, UserRole } from '../entities/User';
import authenticate, { AuthRequest } from '../middleware/auth';
import authorize from '../middleware/authorize';
import express, { Response } from 'express';

const router = express.Router();

// GET /api/admin/tickets - Get all tickets
router.get('/',authenticate, authorize(UserRole.Staff), async (req: AuthRequest, res: Response) => {
try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });


console.log('Getting all tickets');

const tickets = await em.find(
    Maintenance_Ticket,
    {}
    ,
    {
        populate: ['room'],
        orderBy: { room: { name: 'ASC' } }
    }
);

        res.json({ success: true, tickets });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// PATCH /api/admin/tickets/:id - update ticket status
router.patch('/:id', authenticate, authorize(UserRole.Staff), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: "Status is required" });
        }

        const ticket = await em.findOne(Maintenance_Ticket, { id: Number(id) });
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        ticket.status = status as ticket_status;

        await em.flush();

        return res.json({ success: true, ticket });
    }
    catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
});





export default router;