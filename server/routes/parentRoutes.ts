import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import authenticate, { AuthRequest } from '../middleware/auth';
import authorize from '../middleware/authorize';
import { UserRole } from '../entities/User';
import { Parent } from '../entities/Parent';
import { Student } from '../entities/Student';
import { ParentStudentLink } from '../entities/ParentStudentLink';

const router = express.Router();

/**
 * POST /api/parents/link-student
 * Link a parent to a student using the student's linking code
 */
router.post('/link-student', authenticate, authorize(UserRole.Parent), [
    body('linkingCode').trim().notEmpty().withMessage('Linking code is required'),
], async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const { linkingCode } = req.body;
        const parentId = parseInt(req.user!.id);

        // Find the parent
        const parent = await em.findOne(Parent, { id: parentId });
        if (!parent) {
            return res.status(404).json({
                success: false,
                message: 'Parent not found'
            });
        }

        // Find the student by linking code
        const student = await em.findOne(Student, { linkingCode: linkingCode.toUpperCase() });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Invalid linking code'
            });
        }

        // Check if student is already linked to ANY parent
        // We want 1-to-1 relationship (one student can only belong to one parent account)
        const existingLink = await em.findOne(ParentStudentLink, {
            student
        });

        if (existingLink) {
            // Check if it's already linked to THIS parent (idempotent success)
            if (existingLink.parent.id === parentId) {
                return res.status(200).json({
                    success: true,
                    message: 'Student is already linked to your account'
                });
            }

            return res.status(400).json({
                success: false,
                message: 'This student is already linked to a parent account. A student can only be linked to one parent.'
            });
        }

        // Create the link
        const link = new ParentStudentLink(parent, student, linkingCode);
        await em.persistAndFlush(link);

        res.status(201).json({
            success: true,
            message: 'Student linked successfully',
            link: {
                id: link.id,
                studentId: student.id,
                studentName: student.name,
                studentEmail: student.email,
                linkedAt: link.linkedAt
            }
        });
    } catch (error) {
        console.error('Link student error:', error);
        res.status(500).json({
            success: false,
            message: 'Error linking student'
        });
    }
});

/**
 * GET /api/parents/linked-students
 * Get all students linked to the authenticated parent
 */
router.get('/linked-students', authenticate, authorize(UserRole.Parent), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const parentId = parseInt(req.user!.id);

        // Find all links for this parent
        const links = await em.find(ParentStudentLink, { parent: parentId }, {
            populate: ['student']
        });

        const linkedStudents = links.map(link => ({
            linkId: link.id,
            studentId: link.student.id,
            studentName: link.student.name,
            studentEmail: link.student.email,
            studentStatus: link.student.status,
            linkedAt: link.linkedAt
        }));

        res.json({
            success: true,
            students: linkedStudents
        });
    } catch (error) {
        console.error('Get linked students error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching linked students'
        });
    }
});

/**
 * DELETE /api/parents/unlink-student/:linkId
 * Unlink a student from the parent account
 */
router.delete('/unlink-student/:linkId', authenticate, authorize(UserRole.Parent), async (req: AuthRequest, res: Response) => {
    try {
        const em = RequestContext.getEntityManager() as EntityManager;
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const parentId = parseInt(req.user!.id);
        const linkId = parseInt(req.params.linkId);

        // Find the link and verify it belongs to this parent
        const link = await em.findOne(ParentStudentLink, { id: linkId, parent: parentId });

        if (!link) {
            return res.status(404).json({
                success: false,
                message: 'Link not found or does not belong to you'
            });
        }

        await em.removeAndFlush(link);

        res.json({
            success: true,
            message: 'Student unlinked successfully'
        });
    } catch (error) {
        console.error('Unlink student error:', error);
        res.status(500).json({
            success: false,
            message: 'Error unlinking student'
        });
    }
});

export default router;

