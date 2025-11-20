
const express = require('express');
const Assessment = require('../models/Assessment');
const Grade = require('../models/Grade');
const Enrollment = require('../models/Enrollment');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

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
      createdBy: req.user.id
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
      createdBy: req.user.id 
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

// ADMIN (Professor): See all grades for one assessment (shows ungraded students too)
router.get('/:assessmentId/grades', authenticate, authorize('admin'), async (req, res) => {
  try {
    const assessment = await Assessment.findOne({
      _id: req.params.assessmentId,
      createdBy: req.user.id
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