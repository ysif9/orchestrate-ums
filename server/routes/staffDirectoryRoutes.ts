// routes/staffDirectoryRoutes.ts
import express, { Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import authenticate, { AuthRequest } from '../middleware/auth';
import authorize from '../middleware/authorize';
import { User, UserRole } from '../entities/User';
import { PayrollDetails, PaymentFrequency } from '../entities/PayrollDetails';
import { Department } from '../entities/Department';
import { OfficeHours } from '../entities/OfficeHours';
import { Publication } from '../entities/Publication';

const router = express.Router();

// GET /api/staff-directory?search=...
router.get(
  '/',
  authenticate, // now: any authenticated user (student, professor, staff)
  async (req: AuthRequest, res: Response) => {
    const em = RequestContext.getEntityManager() as EntityManager;
    const search = String(req.query.search || '').trim().toLowerCase();

    try {
      const where: any = {
        role: { $in: [UserRole.Professor, UserRole.TeachingAssistant] },
      };

      if (search) {
        where.$or = [
          { name: { $ilike: `%${search}%` } },
          { email: { $ilike: `%${search}%` } },
          { researchInterests: { $ilike: `%${search}%` } },
        ];
      }

      const staff = await em.find(
        User,
        where,
        { populate: ['department'], orderBy: { name: 'ASC' } },
      );

      return res.json({
        success: true,
        data: staff.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          phone: u.phone,
          officeLocation: u.officeLocation,
          department: u.department
            ? { id: u.department.id, name: u.department.name }
            : null,
        })),
      });
    } catch (err) {
      console.error('Error listing academic staff:', err);
      return res
        .status(500)
        .json({ success: false, message: 'Error loading staff directory' });
    }
  },
);

// GET /api/staff-directory/:id
router.get(
  '/:id',
  authenticate, // now: any authenticated user can view a profile
  async (req: AuthRequest, res: Response) => {
    const em = RequestContext.getEntityManager() as EntityManager;
    const id = Number(req.params.id);

    try {
      const user = await em.findOne(
        User,
        { id, role: { $in: [UserRole.Professor, UserRole.TeachingAssistant] } },
        { populate: ['department'] },
      );

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: 'Staff member not found' });
      }

      // Cast to any to access subclass properties not on the abstract User entity
      const userWithDetails = user as any;

      // TODO: populate assigned courses once your Course entity is available.
      const assignedCourses: any[] = [];

      // New: office hours for professors
      let officeHours: any[] = [];
      let publications: any[] = []; // New: publications

      if (user.role === UserRole.Professor) {
        const slots = await em.find(
          OfficeHours,
          { professor: user.id },
          { orderBy: { dayOfWeek: 'ASC', startTime: 'ASC' } },
        );

        officeHours = slots.map((s) => ({
          id: s.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          location: s.location,
        }));

        const pubs = await em.find(Publication,
          { professor: user.id },
          { orderBy: { year: 'DESC', title: 'ASC' } }
        );
        publications = pubs;
      }

      return res.json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: userWithDetails.phone,
          officeLocation: userWithDetails.officeLocation,
          department: user.department
            ? { id: user.department.id, name: user.department.name }
            : null,
          assignedCourses,
          officeHours,
          publications, // new field
          researchInterests: user.researchInterests,
        },
      });
    } catch (err) {
      console.error('Error fetching staff profile:', err);
      return res
        .status(500)
        .json({ success: false, message: 'Error fetching staff profile' });
    }
  },
);

import { body, validationResult } from 'express-validator';
import { Professor } from '../entities/Professor';
import { TeachingAssistant } from '../entities/TeachingAssistant'; // if you have this

const sendValidationErrors = (res: Response, errorsArray: any[]) =>
  res.status(400).json({ success: false, errors: errorsArray });

// POST /api/staff-directory
router.post(
  '/',
  authenticate,
  authorize(UserRole.Staff), // unchanged: only staff can create
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn([UserRole.Professor, UserRole.TeachingAssistant]),
  body('departmentId').optional().isInt(),
  body('phone').optional().isString(),
  body('officeLocation').optional().isString(),
  body('researchInterests').optional().isString(),
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationErrors(res, errors.array());

    const em = RequestContext.getEntityManager() as EntityManager;
    const { name, email, password, role, departmentId, phone, officeLocation, researchInterests } =
      req.body;

    try {
      let user: any;

      if (role === UserRole.Professor) {
        user = new Professor(name, email, password);
      } else {
        // assuming you have a TeachingAssistant entity
        user = new TeachingAssistant(name, email, password);
      }

      user.phone = phone || undefined;
      user.officeLocation = officeLocation || undefined;
      user.researchInterests = researchInterests || undefined;

      if (departmentId) {
        const dept = await em.findOne(Department, Number(departmentId));
        if (!dept) {
          return res
            .status(400)
            .json({ success: false, message: 'Department not found' });
        }
        user.department = dept;
      }

      await em.persistAndFlush(user);

      // Create default payroll
      let baseSalary = 0;
      let taxRate = 0;
      let insurance = 0;
      let otherDeductions = 0;

      if (user.role === UserRole.Professor) {
        baseSalary = 25000.00;
        taxRate = 18.00;
        insurance = 800.00;
        otherDeductions = 500.00;
      } else if (user.role === UserRole.TeachingAssistant) {
        baseSalary = 8000.00;
        taxRate = 10.00;
        insurance = 300.00;
        otherDeductions = 100.00;
      }

      if (baseSalary > 0) {
        const payroll = new PayrollDetails(user, baseSalary);
        payroll.taxRate = taxRate;
        payroll.insuranceAmount = insurance;
        payroll.otherDeductions = otherDeductions;
        payroll.paymentFrequency = PaymentFrequency.Monthly;
        await em.persistAndFlush(payroll);
      }

      return res.status(201).json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error('Error creating staff member:', err);
      return res
        .status(500)
        .json({ success: false, message: 'Error creating staff member' });
    }
  },
);

// PUT /api/staff-directory/:id
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.Staff), // unchanged: only staff can edit
  body('email').optional().isEmail(),
  body('phone').optional().isString(),
  body('officeLocation').optional().isString(),
  body('departmentId').optional().isInt(),
  body('researchInterests').optional().isString(),
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationErrors(res, errors.array());

    const em = RequestContext.getEntityManager() as EntityManager;
    const id = Number(req.params.id);
    const { email, phone, officeLocation, departmentId, researchInterests } = req.body;

    try {
      const user = await em.findOne(
        User,
        { id, role: { $in: [UserRole.Professor, UserRole.TeachingAssistant] } },
        { populate: ['department'] },
      );

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: 'Staff member not found' });
      }

      const userAny = user as any;
      if (email) user.email = email;
      if (phone !== undefined) userAny.phone = phone;
      if (officeLocation !== undefined) userAny.officeLocation = officeLocation;
      if (researchInterests !== undefined) user.researchInterests = researchInterests;

      if (departmentId !== undefined) {
        if (departmentId === null) {
          user.department = undefined;
        } else {
          const dept = await em.findOne(Department, Number(departmentId));
          if (!dept) {
            return res
              .status(400)
              .json({ success: false, message: 'Department not found' });
          }
          user.department = dept;
        }
      }

      await em.persistAndFlush(user);

      return res.json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: userAny.phone,
          officeLocation: userAny.officeLocation,
          researchInterests: user.researchInterests,
          department: user.department
            ? { id: user.department.id, name: user.department.name }
            : null,
        },
      });
    } catch (err) {
      console.error('Error updating staff profile:', err);
      return res
        .status(500)
        .json({ success: false, message: 'Error updating staff profile' });
    }
  },
);

export default router;
