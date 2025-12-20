import express, { Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import authenticate, { AuthRequest } from '../middleware/auth';
import authorize from '../middleware/authorize';
import { UserRole } from '../entities/User';
import { Student } from '../entities/Student';

const router = express.Router();

/**
 * GET /api/students/linking-code
 * Get the authenticated student's linking code for parent linking
 */
router.get('/linking-code', authenticate, authorize(UserRole.Student), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const studentId = parseInt(req.user!.id);

        const student = await em.findOne(Student, { id: studentId });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Generate linking code if it doesn't exist
        if (!student.linkingCode) {
            student.generateLinkingCode();
            await em.flush();
        }

        res.json({
            success: true,
            linkingCode: student.linkingCode
        });
    } catch (error) {
        console.error('Get linking code error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching linking code'
        });
    }
});

export default router;

