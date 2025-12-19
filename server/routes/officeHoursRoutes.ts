// routes/officeHoursRoutes.ts
import express, { Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import authenticate, { AuthRequest } from '../middleware/auth';
import authorize from '../middleware/authorize';
import { User, UserRole } from '../entities/User';
import { OfficeHours } from '../entities/OfficeHours';

const router = express.Router();

// Helper to get EM
const getEm = () => RequestContext.getEntityManager() as EntityManager;

/**
 * GET /api/my/office-hours
 * List office hour slots for the logged‑in professor.
 */
router.get(
  '/my',
  authenticate,
  authorize(UserRole.Professor),
  async (req: AuthRequest, res: Response) => {
    try {
      const em = getEm();
      const professorId = Number(req.user!.id);

      const slots = await em.find(
        OfficeHours,
        { professor: professorId },
        { orderBy: { dayOfWeek: 'ASC', startTime: 'ASC' } },
      );

      return res.json({
        success: true,
        data: slots.map((s) => ({
          id: s.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          location: s.location,
        })),
      });
    } catch (err) {
      console.error('Error listing office hours:', err);
      return res
        .status(500)
        .json({ success: false, message: 'Error loading office hours' });
    }
  },
);

/**
 * POST /api/my/office-hours
 * Create a new office hour slot for the logged‑in professor.
 */
router.post(
  '/my',
  authenticate,
  authorize(UserRole.Professor),
  async (req: AuthRequest, res: Response) => {
    const em = getEm();
    const professorId = Number(req.user!.id);
    const { dayOfWeek, startTime, endTime, location } = req.body;

    if (!dayOfWeek || !startTime || !endTime || !location) {
      return res.status(400).json({
        success: false,
        message: 'dayOfWeek, startTime, endTime, and location are required',
      });
    }

    try {
      const professor = await em.findOne(User, {
        id: professorId,
        role: UserRole.Professor,
      });
      if (!professor) {
        return res
          .status(404)
          .json({ success: false, message: 'Professor not found' });
      }

      const slot = new OfficeHours(
        professor,
        String(dayOfWeek),
        String(startTime),
        String(endTime),
        String(location),
      );

      await em.persistAndFlush(slot);

      return res.status(201).json({
        success: true,
        data: {
          id: slot.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          location: slot.location,
        },
      });
    } catch (err) {
      console.error('Error creating office hours:', err);
      return res
        .status(500)
        .json({ success: false, message: 'Error creating office hours' });
    }
  },
);

/**
 * PUT /api/my/office-hours/:id
 * Update an existing office hour slot of the logged‑in professor.
 */
router.put(
  '/my/:id',
  authenticate,
  authorize(UserRole.Professor),
  async (req: AuthRequest, res: Response) => {
    const em = getEm();
    const professorId = Number(req.user!.id);
    const id = Number(req.params.id);
    const { dayOfWeek, startTime, endTime, location } = req.body;

    try {
      const slot = await em.findOne(
        OfficeHours,
        { id, professor: professorId },
      );

      if (!slot) {
        return res
          .status(404)
          .json({ success: false, message: 'Office hour slot not found' });
      }

      if (dayOfWeek !== undefined) slot.dayOfWeek = String(dayOfWeek);
      if (startTime !== undefined) slot.startTime = String(startTime);
      if (endTime !== undefined) slot.endTime = String(endTime);
      if (location !== undefined) slot.location = String(location);

      await em.persistAndFlush(slot);

      return res.json({
        success: true,
        data: {
          id: slot.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          location: slot.location,
        },
      });
    } catch (err) {
      console.error('Error updating office hours:', err);
      return res
        .status(500)
        .json({ success: false, message: 'Error updating office hours' });
    }
  },
);

/**
 * DELETE /api/my/office-hours/:id
 * Delete an office hour slot of the logged‑in professor.
 */
router.delete(
  '/my/:id',
  authenticate,
  authorize(UserRole.Professor),
  async (req: AuthRequest, res: Response) => {
    const em = getEm();
    const professorId = Number(req.user!.id);
    const id = Number(req.params.id);

    try {
      const slot = await em.findOne(
        OfficeHours,
        { id, professor: professorId },
      );

      if (!slot) {
        return res
          .status(404)
          .json({ success: false, message: 'Office hour slot not found' });
      }

      await em.removeAndFlush(slot);

      return res.json({ success: true });
    } catch (err) {
      console.error('Error deleting office hours:', err);
      return res
        .status(500)
        .json({ success: false, message: 'Error deleting office hours' });
    }
  },
);

/**
 * GET /api/professors/:id/office-hours
 * Public read‑only view of a professor's office hours for students/staff.
 */
router.get(
  '/professors/:id',
  authenticate, // or make public if desired
  async (req: AuthRequest, res: Response) => {
    const em = getEm();
    const professorId = Number(req.params.id);

    try {
      const professor = await em.findOne(User, {
        id: professorId,
        role: UserRole.Professor,
      });
      if (!professor) {
        return res
          .status(404)
          .json({ success: false, message: 'Professor not found' });
      }

      const slots = await em.find(
        OfficeHours,
        { professor: professorId },
        { orderBy: { dayOfWeek: 'ASC', startTime: 'ASC' } },
      );

      return res.json({
        success: true,
        data: slots.map((s) => ({
          id: s.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          location: s.location,
        })),
      });
    } catch (err) {
      console.error('Error fetching professor office hours:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching professor office hours',
      });
    }
  },
);

export default router;
