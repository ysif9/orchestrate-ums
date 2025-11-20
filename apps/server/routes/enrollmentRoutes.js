const express = require('express');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

// GET /api/enrollments - All authenticated users
// Students see only their enrollments, staff/admin see all
router.get('/', authenticate, async (req, res) => {
    try {
        let enrollments;

        // If user is a student, only show their enrollments
        if (req.user.role === 'student') {
            enrollments = await Enrollment.find({ student: req.user.id })
                .populate('course')
                .populate('student', '-password');
        } else {
            // Staff and admin can see all enrollments
            enrollments = await Enrollment.find()
                .populate('course')
                .populate('student', '-password');
        }

        res.json(enrollments);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

// POST /api/enrollments - Students only
router.post('/', authenticate, authorize('student'), async (req, res) => {
    try {
        const {course_code, semester} = req.body;

        // Use authenticated user's ID as the student
        const studentId = req.user.id;

        // Verify the user exists and is a student
        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({message: 'Student not found'});
        }

        if (student.role !== 'student') {
            return res.status(403).json({message: 'Only students can enroll in courses'});
        }

        // Find the course by code
        const course = await Course.findOne({code: course_code});
        if (!course) {
            return res.status(404).json({message: 'Course not found'});
        }

        // Create the enrollment
        const enrollment = new Enrollment({
            student: studentId,
            course: course._id,
            semester
        });
        await enrollment.save();

        // Populate the enrollment before sending response
        await enrollment.populate('course');
        await enrollment.populate('student', '-password');

        res.status(201).json(enrollment);
    } catch (error) {
        // Handle duplicate enrollment error
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'You are already enrolled in this course for this semester'
            });
        }
        res.status(400).json({message: error.message});
    }
});

module.exports = router;