import express, { Request, Response } from 'express';
import { RequestContext } from '@mikro-orm/core';
import { Assessment, AssessmentType } from '../entities/Assessment';
import { Grade } from '../entities/Grade';
import { Enrollment } from '../entities/Enrollment';
import { Course } from '../entities/Course';
import { Semester, SemesterStatus } from '../entities/Semester';
import { User, UserRole } from '../entities/User';
import authenticate, { AuthRequest } from '../middleware/auth';
import authorize from '../middleware/authorize';

const router = express.Router();

// ==========================================================
// NEW ROUTES FOR GRADEBOOK FRONTEND DATA POPULATION 
// ==========================================================

// ADMIN: Get all courses created/taught by the logged-in user (professor/admin)
// Endpoint: GET /api/assessments/courses/my-teaching-courses
router.get('/courses/my-teaching-courses', authenticate, authorize(UserRole.Staff, UserRole.Professor), async (req: AuthRequest, res: Response) => {
  try {
    const em = RequestContext.getEntityManager();
    if (!em) return res.status(500).json({ message: 'EntityManager not found' });

    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    let courses;
    if (req.user.role === UserRole.Staff) {
      courses = await em.find(Course, {}, { fields: ['title', 'code', 'id'] });
    } else {
      courses = await em.find(Course, {
        createdBy: { id: parseInt(req.user.id) }
      }, { fields: ['title', 'code', 'id'] });
    }

    res.json({
      success: true,
      courses
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error loading teaching courses: ' + error.message });
  }
});

// ADMIN: Get all assessments for a specific course ID
// Endpoint: GET /api/assessments/course/:courseId/assessments
router.get('/course/:courseId/assessments', authenticate, authorize(UserRole.Staff, UserRole.Professor), async (req: AuthRequest, res: Response) => {
  try {
    const em = RequestContext.getEntityManager();
    if (!em) return res.status(500).json({ message: 'EntityManager not found' });

    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const assessments = await em.find(Assessment, {
      course: { id: parseInt(req.params.courseId) },
      createdBy: { id: parseInt(req.user.id) }
    }, { fields: ['title', 'totalMarks', 'id'] });

    res.json({
      success: true,
      assessments
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error loading course assessments: ' + error.message });
  }
});


// ==========================================================
// EXISTING ROUTES FOR ASSESSMENT CREATION AND GRADING
// ==========================================================

// CREATE ASSESSMENT (Admin = Professor only)
router.post('/', authenticate, authorize(UserRole.Staff, UserRole.Professor), async (req: AuthRequest, res: Response) => {
  try {
    const em = RequestContext.getEntityManager();
    if (!em) return res.status(500).json({ message: 'EntityManager not found' });

    const { title, description, type, course, totalMarks, dueDate } = req.body;

    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const courseEntity = await em.findOne(Course, { id: course });
    if (!courseEntity) return res.status(404).json({ message: 'Course not found' });

    const creator = await em.findOne(User, { id: parseInt(req.user.id) });
    if (!creator) return res.status(404).json({ message: 'Creator not found' });

    const assessment = new Assessment(title, courseEntity, totalMarks, creator);
    assessment.description = description;
    assessment.type = type !== undefined ? type : AssessmentType.Assignment;
    assessment.dueDate = dueDate;

    await em.persistAndFlush(assessment);

    // Populate course for response
    await em.populate(assessment, ['course']);

    res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      assessment
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ADMIN (Professor): Grade a student + add feedback
router.post('/grade', authenticate, authorize(UserRole.Staff, UserRole.Professor), async (req: AuthRequest, res: Response) => {
  try {
    const em = RequestContext.getEntityManager();
    if (!em) return res.status(500).json({ message: 'EntityManager not found' });

    const { assessmentId, studentId, score, feedback } = req.body;

    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const assessment = await em.findOne(Assessment, {
      id: assessmentId,
      createdBy: { id: parseInt(req.user.id) }
    });

    if (!assessment) {
      return res.status(403).json({
        success: false,
        message: 'You can only grade assessments you created'
      });
    }

    const enrollment = await em.findOne(Enrollment, {
      student: { id: studentId },
      course: assessment.course
    }, {
      populate: ['semester']
    });

    if (!enrollment) {
      return res.status(400).json({
        success: false,
        message: 'Student is not enrolled in this course'
      });
    }

    // Prevent grade changes for finalized semesters
    if (!enrollment.semester) {
      return res.status(400).json({
        success: false,
        message: 'Enrollment is missing semester information'
      });
    }
    if (enrollment.semester.status === SemesterStatus.Finalized) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify grades for a finalized semester'
      });
    }

    let grade = await em.findOne(Grade, {
      assessment: assessmentId,
      student: studentId
    });

    const grader = await em.findOne(User, { id: parseInt(req.user.id) });

    if (!grade) {
      const student = await em.findOne(User, { id: studentId });
      if (!student) return res.status(404).json({ message: 'Student not found' });
      grade = new Grade(assessment, student);
    }

    grade.score = score;
    grade.feedback = feedback;
    grade.gradedBy = grader || undefined;
    grade.gradedAt = new Date();

    await em.persistAndFlush(grade);

    await em.populate(grade, ['student', 'assessment']);

    res.json({
      success: true,
      message: 'Grade and feedback saved',
      grade
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// STUDENT: View all my grades + feedback
router.get('/my-grades', authenticate, authorize(UserRole.Student), async (req: AuthRequest, res: Response) => {
  try {
    const em = RequestContext.getEntityManager();
    if (!em) return res.status(500).json({ message: 'EntityManager not found' });

    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const grades = await em.find(Grade, { student: { id: parseInt(req.user.id) } }, {
      populate: ['assessment.course', 'gradedBy'],
      orderBy: { gradedAt: 'DESC' }
    });

    res.json({ success: true, grades });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ADMIN (Professor): See all grades for one assessment
router.get('/:assessmentId/grades', authenticate, authorize(UserRole.Staff, UserRole.Professor), async (req: AuthRequest, res: Response) => {
  try {
    const em = RequestContext.getEntityManager();
    if (!em) return res.status(500).json({ message: 'EntityManager not found' });

    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const assessment = await em.findOne(Assessment, {
      id: parseInt(req.params.assessmentId),
      createdBy: { id: parseInt(req.user.id) }
    });

    if (!assessment) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const grades = await em.find(Grade, { assessment: { id: parseInt(req.params.assessmentId) } }, {
      populate: ['student']
    });

    const enrolled = await em.find(Enrollment, { course: assessment.course }, {
      populate: ['student']
    });

    const result = enrolled.map(en => {
      const g = grades.find(gr => gr.student.id === en.student.id);
      return {
        student: en.student,
        score: g ? g.score : null,
        feedback: g ? g.feedback : null,
        gradedAt: g ? g.gradedAt : null
      };
    });

    res.json({
      success: true,
      assessment: { title: assessment.title, totalMarks: assessment.totalMarks },
      grades: result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;