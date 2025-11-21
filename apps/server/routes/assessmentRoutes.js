const express = require('express');
const mongoose = require('mongoose'); // <-- Mongoose imported for ObjectId conversion
const Assessment = require('../models/Assessment');
const Grade = require('../models/Grade');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course'); 
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

// ==========================================================
// NEW ROUTES FOR GRADEBOOK FRONTEND DATA POPULATION 
// ==========================================================

// ADMIN: Get all courses created/taught by the logged-in user (professor/admin)
// Endpoint: GET /api/assessments/courses/my-teaching-courses
router.get('/courses/my-teaching-courses', authenticate, authorize('admin'), async (req, res) => {
    try {
        // Filter restored: Querying ONLY courses created by the user, with ID conversion.
        const courses = await Course.find({ 
          createdBy: new mongoose.Types.ObjectId(req.user.id) 
        }).select('title code _id'); 

        res.json({
            success: true,
            courses
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error loading teaching courses: ' + error.message });
    }
});

// ADMIN: Get all assessments for a specific course ID
// Endpoint: GET /api/assessments/course/:courseId/assessments
router.get('/course/:courseId/assessments', authenticate, authorize('admin'), async (req, res) => {
    try {
        // Filter restored: Querying by course ID AND the user's ID.
        const assessments = await Assessment.find({ 
            course: req.params.courseId,
            createdBy: new mongoose.Types.ObjectId(req.user.id) 
        }).select('title totalMarks _id'); 

        res.json({
            success: true,
            assessments
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error loading course assessments: ' + error.message });
    }
});


// ==========================================================
// EXISTING ROUTES FOR ASSESSMENT CREATION AND GRADING
// ==========================================================

// CREATE ASSESSMENT (Admin = Professor only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { title, description, type, course, totalMarks, dueDate } = req.body;

    const assessment = new Assessment({
      title,
      description,
      type: type || 'assignment',
      course,
      totalMarks,
      dueDate,
      // Fix applied: Ensure the creator ID is saved correctly with conversion
      createdBy: new mongoose.Types.ObjectId(req.user.id) 
    });

    await assessment.save();
    await assessment.populate('course', 'code title');

    res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      assessment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ADMIN (Professor): Grade a student + add feedback
router.post('/grade', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { assessmentId, studentId, score, feedback } = req.body;

    const assessment = await Assessment.findOne({ 
      _id: assessmentId, 
      createdBy: new mongoose.Types.ObjectId(req.user.id) // ID Conversion applied for authorization
    });

    if (!assessment) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only grade assessments you created' 
      });
    }

    const enrollment = await Enrollment.findOne({ 
      student: studentId, 
      course: assessment.course 
    });
    if (!enrollment) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student is not enrolled in this course' 
      });
    }

    const grade = await Grade.findOneAndUpdate(
      { assessment: assessmentId, student: studentId },
      { score, feedback, gradedBy: req.user.id, gradedAt: Date.now() },
      { upsert: true, new: true }
    )
    .populate('student', 'name email')
    .populate('assessment', 'title');

    res.json({
      success: true,
      message: 'Grade and feedback saved',
      grade
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// STUDENT: View all my grades + feedback
router.get('/my-grades', authenticate, authorize('student'), async (req, res) => {
  try {
    const grades = await Grade.find({ student: req.user.id })
      .populate({
        path: 'assessment',
        populate: { path: 'course', select: 'code title' }
      })
      .populate('gradedBy', 'name')
      .sort({ gradedAt: -1 });

    res.json({ success: true, grades });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ADMIN (Professor): See all grades for one assessment 
router.get('/:assessmentId/grades', authenticate, authorize('admin'), async (req, res) => {
  try {
    const assessment = await Assessment.findOne({
      _id: req.params.assessmentId,
      createdBy: new mongoose.Types.ObjectId(req.user.id) // ID Conversion applied for authorization
    });

    if (!assessment) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const grades = await Grade.find({ assessment: req.params.assessmentId })
      .populate('student', 'name email');

    const enrolled = await Enrollment.find({ course: assessment.course })
      .populate('student', 'name email');

    const result = enrolled.map(en => {
      const g = grades.find(gr => gr.student._id.toString() === en.student._id.toString());
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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;