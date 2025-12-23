import express, { Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { PayrollDetails } from '../entities/PayrollDetails';
import authenticate, { AuthRequest } from '../middleware/auth';
import { UserRole } from '../entities/User';

const router = express.Router();

// GET /api/payroll/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        // Access Control: Allow Staff, Professor, and TeachingAssistant
        const allowedRoles = [UserRole.Staff, UserRole.Professor, UserRole.TeachingAssistant];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only academic staff can view payroll.'
            });
        }

        const payroll = await em.findOne(PayrollDetails, { user: parseInt(req.user.id) });

        if (!payroll) {
            return res.status(404).json({
                success: false,
                message: 'Payroll details not found for this user'
            });
        }

        res.json({
            success: true,
            data: payroll
        });
    } catch (error) {
        console.error('Get payroll error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payroll details'
        });
    }
});

export default router;
