import express, { Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import authenticate, { AuthRequest } from '../middleware/auth';
import { Publication } from '../entities/Publication';
import { Professor } from '../entities/Professor';
import { UserRole } from '../entities/User';
import { body, validationResult } from 'express-validator';

const router = express.Router();

const sendValidationErrors = (res: Response, errorsArray: any[]) =>
    res.status(400).json({ success: false, errors: errorsArray });

// GET /api/publications?professorId=123
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    const em = RequestContext.getEntityManager() as EntityManager;
    const professorId = req.query.professorId ? Number(req.query.professorId) : null;

    try {
        const where: any = {};
        if (professorId) {
            where.professor = professorId;
        }

        const publications = await em.find(
            Publication,
            where,
            { orderBy: { year: 'DESC', title: 'ASC' } }
        );

        return res.json({
            success: true,
            data: publications,
        });
    } catch (err) {
        console.error('Error fetching publications:', err);
        return res.status(500).json({ success: false, message: 'Error fetching publications' });
    }
});

// POST /api/publications
router.post(
    '/',
    authenticate,
    body('title').notEmpty(),
    async (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return sendValidationErrors(res, errors.array());

        const em = RequestContext.getEntityManager() as EntityManager;
        const { title, authors, journalConference, year, url } = req.body;
        const userId = Number(req.user!.id);

        try {
            // Allow if user is Professor
            // Ideally check if user.role is Professor.
            // We can fetch the user or rely on token payload if it has role (usually it does or we check DB)
            // Assuming we need to verify user is a professor to add THEIR publication.

            const professor = await em.findOne(Professor, { id: userId });
            if (!professor) {
                return res.status(403).json({ success: false, message: 'Only professors can add publications.' });
            }

            const pub = new Publication(title, professor);
            if (authors) pub.authors = authors;
            if (journalConference) pub.journalConference = journalConference;
            if (year) pub.year = Number(year);
            if (url) pub.url = url;

            await em.persistAndFlush(pub);

            return res.status(201).json({
                success: true,
                data: pub,
            });
        } catch (err) {
            console.error('Error creating publication:', err);
            return res.status(500).json({ success: false, message: 'Error creating publication' });
        }
    }
);

// PUT /api/publications/:id
router.put(
    '/:id',
    authenticate,
    async (req: AuthRequest, res: Response) => {
        const em = RequestContext.getEntityManager() as EntityManager;
        const id = Number(req.params.id);
        const userId = Number(req.user!.id);
        const { title, authors, journalConference, year, url } = req.body;

        try {
            const pub = await em.findOne(Publication, { id }, { populate: ['professor'] });
            if (!pub) {
                return res.status(404).json({ success: false, message: 'Publication not found' });
            }

            // Check ownership
            if (pub.professor.id !== userId) {
                // Or allow admin? For now restricted to owner.
                return res.status(403).json({ success: false, message: 'Not authorized to edit this publication' });
            }

            if (title !== undefined) pub.title = title;
            if (authors !== undefined) pub.authors = authors;
            if (journalConference !== undefined) pub.journalConference = journalConference;
            if (year !== undefined) pub.year = Number(year);
            if (url !== undefined) pub.url = url;

            await em.persistAndFlush(pub);

            return res.json({
                success: true,
                data: pub,
            });
        } catch (err) {
            console.error('Error updating publication:', err);
            return res.status(500).json({ success: false, message: 'Error updating publication' });
        }
    }
);

// DELETE /api/publications/:id
router.delete(
    '/:id',
    authenticate,
    async (req: AuthRequest, res: Response) => {
        const em = RequestContext.getEntityManager() as EntityManager;
        const id = Number(req.params.id);
        const userId = Number(req.user!.id);

        try {
            const pub = await em.findOne(Publication, { id }, { populate: ['professor'] });
            if (!pub) {
                return res.status(404).json({ success: false, message: 'Publication not found' });
            }

            if (pub.professor.id !== userId) {
                return res.status(403).json({ success: false, message: 'Not authorized to delete this publication' });
            }

            await em.removeAndFlush(pub);

            return res.json({
                success: true,
                message: 'Publication deleted successfully',
            });
        } catch (err) {
            console.error('Error deleting publication:', err);
            return res.status(500).json({ success: false, message: 'Error deleting publication' });
        }
    }
);

export default router;
