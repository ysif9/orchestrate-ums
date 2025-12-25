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
import { Grade } from '../entities/Grade';
import { Assessment } from '../entities/Assessment';
import { Course } from '../entities/Course';
import { Enrollment, EnrollmentStatus } from '../entities/Enrollment';

const router = express.Router();

/**
 * POST /api/parents/link-student
 * Link a parent to a student using the student's linking code
 */
router.post(
  '/link-student',
  authenticate,
  authorize(UserRole.Parent),
  [body('linkingCode').trim().notEmpty().withMessage('Linking code is required')],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
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
          message: 'Parent not found',
        });
      }

      // Find the student by linking code
      const student = await em.findOne(Student, { linkingCode: linkingCode.toUpperCase() });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Invalid linking code',
        });
      }

      // Check if student is already linked to ANY parent
      const existingLink = await em.findOne(ParentStudentLink, { student });

      if (existingLink) {
        // Already linked to THIS parent (idempotent success)
        if (existingLink.parent.id === parentId) {
          return res.status(200).json({
            success: true,
            message: 'Student is already linked to your account',
          });
        }

        return res.status(400).json({
          success: false,
          message:
            'This student is already linked to a parent account. A student can only be linked to one parent.',
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
          linkedAt: link.linkedAt,
        },
      });
    } catch (error) {
      console.error('Link student error:', error);
      res.status(500).json({
        success: false,
        message: 'Error linking student',
      });
    }
  }
);

/**
 * GET /api/parents/linked-students
 * Get all students linked to the authenticated parent
 */
router.get(
  '/linked-students',
  authenticate,
  authorize(UserRole.Parent),
  async (req: AuthRequest, res: Response) => {
    try {
      const em = RequestContext.getEntityManager() as EntityManager;
      if (!em) return res.status(500).json({ message: 'EntityManager not found' });

      const parentId = parseInt(req.user!.id);

      // Find all links for this parent
      const links = await em.find(
        ParentStudentLink,
        { parent: parentId },
        { populate: ['student'] }
      );

      const linkedStudents = links.map((link) => ({
        linkId: link.id,
        studentId: link.student.id,
        studentName: link.student.name,
        studentEmail: link.student.email,
        studentStatus: link.student.status,
        linkedAt: link.linkedAt,
      }));

      res.json({
        success: true,
        students: linkedStudents,
      });
    } catch (error) {
      console.error('Get linked students error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching linked students',
      });
    }
  }
);

/**
 * DELETE /api/parents/unlink-student/:linkId
 * Unlink a student from the parent account
 */
router.delete(
  '/unlink-student/:linkId',
  authenticate,
  authorize(UserRole.Parent),
  async (req: AuthRequest, res: Response) => {
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
          message: 'Link not found or does not belong to you',
        });
      }

      await em.removeAndFlush(link);

      res.json({
        success: true,
        message: 'Student unlinked successfully',
      });
    } catch (error) {
      console.error('Unlink student error:', error);
      res.status(500).json({
        success: false,
        message: 'Error unlinking student',
      });
    }
  }
);

/**
 * GET /api/parents/linked-students/:studentId/academic-summary
 * Aggregate course + grade data for a parent's linked student
 */
router.get(
  '/linked-students/:studentId/academic-summary',
  authenticate,
  authorize(UserRole.Parent),
  async (req: AuthRequest, res: Response) => {
    try {
      const em = RequestContext.getEntityManager() as EntityManager;
      if (!em) {
        return res.status(500).json({ success: false, message: 'EntityManager not found' });
      }

      const parentId = parseInt(req.user!.id);
      const studentId = parseInt(req.params.studentId);

      // 1) Security: ensure this student is actually linked to this parent
      const link = await em.findOne(
        ParentStudentLink,
        { parent: parentId, student: studentId },
        { populate: ['student'] }
      );

      if (!link) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this student’s academic summary',
        });
      }

      const student = link.student as unknown as Student;

      // 2) Current enrollments for this student
      const enrollments = await em.find(
        Enrollment,
        { student: studentId, status: EnrollmentStatus.Enrolled },
        { populate: ['course', 'semester'] }
      );

      if (enrollments.length === 0) {
        return res.json({
          success: true,
          student: { id: student.id, name: student.name, email: student.email },
          summary: { gpa: null, completedCredits: 0, courses: [] },
        });
      }

      const courseIds = enrollments.map((e) => e.course.id);

      // 3) Assessments for those courses
      const assessments = await em.find(
        Assessment,
        { course: { $in: courseIds } },
        { populate: ['course'] }
      );

      if (assessments.length === 0) {
        return res.json({
          success: true,
          student: { id: student.id, name: student.name, email: student.email },
          summary: { gpa: null, completedCredits: 0, courses: [] },
        });
      }

      const assessmentIds = assessments.map((a) => a.id);

      // 4) Grades for this student on those assessments
      const grades = await em.find(
        Grade,
        { student: studentId, assessment: { $in: assessmentIds } },
        { populate: ['assessment', 'assessment.course'] }
      );

      type CourseSummary = {
        id: number;
        code: string;
        name: string;
        term?: string;
        runningAverage: number;
        credits: number;
        assignments: {
          id: number;
          name: string;
          score: number;
          maxScore: number;
          weight?: number | null;
        }[];
      };

      const coursesMap = new Map<number, CourseSummary>();

      for (const g of grades) {
        const a = g.assessment as any as Assessment;
        const c = a.course as any as Course;

        if (!coursesMap.has(c.id)) {
          const enrollment = enrollments.find((e) => e.course.id === c.id);

          // Fallback: 3 credits if not present
          const credits =
            (enrollment as any)?.credits != null
              ? Number((enrollment as any).credits)
              : 3;

          coursesMap.set(c.id, {
            id: c.id,
            code: (c as any).code ?? c.id.toString(),
            name: (c as any).title ?? (c as any).name ?? 'Course',
            term: enrollment?.semester ? (enrollment.semester as any).name : undefined,
            runningAverage: 0,
            credits,
            assignments: [],
          });
        }

        const cs = coursesMap.get(c.id)!;

        cs.assignments.push({
          id: a.id,
          name: (a as any).title ?? 'Assessment',
          score: g.score,
          maxScore: a.totalMarks,
          weight: null, // you don't have a weight field yet; keep null for now
        });
      }

      // 5) Compute running averages per course (simple mean of percentages)
      for (const cs of coursesMap.values()) {
        if (cs.assignments.length === 0) {
          cs.runningAverage = 0;
          continue;
        }

        let totalPct = 0;
        for (const a of cs.assignments) {
          totalPct += (a.score / a.maxScore) * 100;
        }
        cs.runningAverage = totalPct / cs.assignments.length;
      }

      // 6) Compute GPA on a 4.0 scale, credit‑weighted
      const toFourPoint = (pct: number) => {
        if (pct >= 90) return 4.0;
        if (pct >= 80) return 3.0;
        if (pct >= 70) return 2.0;
        if (pct >= 60) return 1.0;
        return 0.0;
      };

      let totalQualityPoints = 0;
      let totalCredits = 0;

      for (const cs of coursesMap.values()) {
        if (cs.runningAverage <= 0) continue;
        const courseGpa = toFourPoint(cs.runningAverage);
        totalQualityPoints += courseGpa * cs.credits;
        totalCredits += cs.credits;
      }

      const gpa = totalCredits > 0 ? totalQualityPoints / totalCredits : null;

      return res.json({
        success: true,
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
        },
        summary: {
          gpa,
          completedCredits: totalCredits,
          courses: Array.from(coursesMap.values()).map(({ credits, ...rest }) => rest),
        },
      });
    } catch (error) {
      console.error('Get academic summary error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching academic summary',
      });
    }
  }
);

export default router;
