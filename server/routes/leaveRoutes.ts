import express, { Request, Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { LeaveRequest, LeaveType, LeaveStatus } from '../entities/LeaveRequest';
import { User, UserRole } from '../entities/User';
import authenticate, { AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Get all requests for the logged in user
router.get('/my-requests', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const requests = await em.find(LeaveRequest, { applicant: { id: parseInt(req.user.id) } }, {
            orderBy: { createdAt: 'DESC' },
            populate: ['reviewer']
        });

        res.json(requests);
    } catch (error) {
        console.error('Error fetching my requests:', error);
        res.status(500).json({ message: 'Error fetching requests' });
    }
});

// Create a new leave request
router.post('/', [
    authenticate,
    body('type').isIn(Object.values(LeaveType)).withMessage('Invalid leave type'),
    body('startDate').isISO8601().toDate().withMessage('Invalid start date'),
    body('endDate').isISO8601().toDate().withMessage('Invalid end date'),
    body('reason').optional().isString(),
], async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const user = await em.findOne(User, { id: parseInt(req.user.id) });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Only Professor and TA can submit
        if (user.role !== UserRole.Professor && user.role !== UserRole.TeachingAssistant) {
            return res.status(403).json({ message: 'Only Professors and TAs can submit leave requests' });
        }

        const { type, startDate, endDate, reason } = req.body;

        const leaveRequest = new LeaveRequest(user, type, startDate, endDate, reason);
        await em.persistAndFlush(leaveRequest);

        res.status(201).json(leaveRequest);
    } catch (error) {
        console.error('Error creating leave request:', error);
        res.status(500).json({ message: 'Error creating leave request' });
    }
});

// Get all pending requests (Staff only)
router.get('/pending', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const user = await em.findOne(User, { id: parseInt(req.user.id) });
        if (user?.role !== UserRole.Staff) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const requests = await em.find(LeaveRequest, { status: LeaveStatus.Pending }, {
            orderBy: { createdAt: 'ASC' },
            populate: ['applicant']
        });

        res.json(requests);
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        res.status(500).json({ message: 'Error fetching requests' });
    }
});

// Update status (Approve/Reject) (Staff only)
router.patch('/:id/status', [
    authenticate,
    body('status').isIn([LeaveStatus.Approved, LeaveStatus.Rejected]).withMessage('Invalid status'),
    body('rejectionReason').optional().isString(),
], async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const reviewer = await em.findOne(User, { id: parseInt(req.user.id) });
        if (reviewer?.role !== UserRole.Staff) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { id } = req.params;
        const { status, rejectionReason } = req.body;

        const request = await em.findOne(LeaveRequest, { id: parseInt(id) });
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        request.status = status;
        request.reviewer = reviewer;
        if (status === LeaveStatus.Rejected && rejectionReason) {
            request.rejectionReason = rejectionReason;
        }

        await em.flush();

        res.json(request);
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ message: 'Error updating status' });
    }
});

export default router;
