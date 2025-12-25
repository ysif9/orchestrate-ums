import express, { Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { PayrollDetails } from '../entities/PayrollDetails';
import authenticate, { AuthRequest } from '../middleware/auth';
import { UserRole, User } from '../entities/User';

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

        let payroll = await em.findOne(PayrollDetails, { user: parseInt(req.user.id) });

        if (!payroll) {
            // Auto-create defaults if missing (Backward Compatibility logic)
            const user = await em.findOne(User, { id: parseInt(req.user.id) });
            if (!user) return res.status(404).json({ message: 'User not found' });

            let baseSalary = 0;
            let taxRate = 0;
            let insurance = 0;
            let otherDeductions = 0;
            const role = user.role;

            if (role === UserRole.Professor) {
                baseSalary = 25000.00;
                taxRate = 18.00;
                insurance = 800.00;
                otherDeductions = 500.00;
            } else if (role === UserRole.Staff) {
                baseSalary = 15000.00;
                taxRate = 14.50;
                insurance = 500.00;
                otherDeductions = 200.00;
            } else if (role === UserRole.TeachingAssistant) {
                baseSalary = 8000.00;
                taxRate = 10.00;
                insurance = 300.00;
                otherDeductions = 100.00;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Role not eligible for payroll'
                });
            }

            payroll = new PayrollDetails(user, baseSalary);
            payroll.taxRate = taxRate;
            payroll.insuranceAmount = insurance;
            payroll.otherDeductions = otherDeductions;
            // PaymentFrequency is default Monthly in entity, so we can skip or set explicitly if imported
            // payroll.paymentFrequency = PaymentFrequency.Monthly; 

            await em.persistAndFlush(payroll);
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
