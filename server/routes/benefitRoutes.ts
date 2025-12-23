import express from 'express';
import { Request, Response } from 'express';
import { Benefit } from '../entities/Benefit';
import { User, UserRole } from '../entities/User';
import authenticate from '../middleware/auth';
import { RequestContext } from '@mikro-orm/core';

const router = express.Router();

// Helper for default benefits
const getDefaultBenefits = (role: string) => {
    const commonBenefits = [
        { name: 'Health Insurance', category: 'Health', description: 'Standard medical coverage', value: 'Active' },
        { name: 'Social Security', category: 'Finance', description: 'Mandatory social security contribution', value: 'Enrolled' }
    ];

    if (role === UserRole.Professor) {
        return [
            ...commonBenefits,
            { name: 'Research Grant Eligibility', category: 'Academic', description: 'Eligible for internal research grants', value: 'Level A' },
            { name: 'Sabbatical Leave', category: 'Time Off', description: 'Eligible after 5 years of service', value: 'Accruing' },
            { name: 'Housing Allowance', category: 'Finance', description: 'Monthly housing stipend', value: '$1200' },
            { name: 'Conference Travel Budget', category: 'Academic', description: 'Annual budget for conference travel', value: '$3000' }
        ];
    } else if (role === UserRole.TeachingAssistant) {
        return [
            ...commonBenefits,
            { name: 'Tuition Waiver', category: 'Education', description: 'Partial tuition waiver for graduate studies', value: '50%' },
            { name: 'Semester Bonus', category: 'Finance', description: 'Performance-based bonus per semester', value: 'Pending' }
        ];
    } else if (role === 'staff') { // 'staff' string used in UserRole.Staff enum
        return [
            ...commonBenefits,
            { name: 'Overtime Pay', category: 'Finance', description: 'Eligible for overtime compensation', value: '1.5x' },
            { name: 'Transportation Allowance', category: 'Finance', description: 'Monthly transport stipend', value: '$200' },
            { name: 'Annual Leave', category: 'Time Off', description: 'Paid annual leave days', value: '21 Days' }
        ];
    }

    return commonBenefits;
};

router.get('/', authenticate, async (req: any, res: Response) => {
    try {
        const em = RequestContext.getEntityManager();
        const userId = req.user!.id;
        const user = await em?.findOne(User, { id: userId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check for existing benefits
        let benefits = await em?.find(Benefit, { user: user });

        // Auto-seed if empty
        if (!benefits || benefits.length === 0) {
            const defaults = getDefaultBenefits(user.role);

            benefits = defaults.map(d => new Benefit(user, d.name, d.category, d.description, d.value));

            await em?.persistAndFlush(benefits);
        }

        res.json(benefits);
    } catch (error) {
        console.error('Error fetching benefits:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
