const express = require('express');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const authenticate = require('../middleware/auth');

const router = express.Router();

// GET /api/enrollments - All authenticated users
router.get('/', authenticate, async (req, res) => {
    try {
        const enrollments = await Enrollment.find();
        res.json(enrollments);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

// POST /api/enrollments - All authenticated users
router.post('/', authenticate, async (req, res) => {
    try {
        const {course_code, semester, student_id} = req.body;
        // TODO: Remove student hardcoded
        const student = await User.findById(student_id);
        //
        // if (student.role !== 'student') {
        //     return res.status(403).json({message: 'Only students can enroll in courses'});
        // }
        const course = await Course.findOne({code: course_code});
        if (!course) {
            return res.status(404).json({message: 'Course not found'});
        }

        const enrollment = new Enrollment({student, course, semester});
        await enrollment.save();

        res.status(201).json(enrollment);
    } catch (error) {
        res.status(400).json({message: error.message});
    }
});

module.exports = router;