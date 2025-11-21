const express = require('express');
const mongoose = require('mongoose'); // <--- NEW: Added Mongoose import for ID conversion
const Course = require('../models/Course');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

// POST /api/courses - Admin and Staff only (CREATE COURSE)
router.post('/', authenticate, authorize('admin', 'staff'), async (req, res) => {
    try {
        const {code, title, description, type, credits, prerequisites, semester} = req.body;

        const course = new Course({
            code, 
            title, 
            description, 
            type, 
            credits, 
            prerequisites, 
            semester,
            // 🚨 CRITICAL FIX APPLIED: Link the course to the creator, 
            // converting the string ID to a Mongoose ObjectId for correct storage.
            createdBy: new mongoose.Types.ObjectId(req.user.id) 
        }); 
        
        await course.save();

        res.status(201).json(course);
    } catch (error) {
        console.error(error);
        res.status(400).json({message: error.message});
    }
});

// PUT /api/courses/:id - Admin and Staff only
router.put('/:id', authenticate, authorize('admin', 'staff'), async (req, res) => {
    try {
        const {code, title, description, type, credits, prerequisites, semester} = req.body;

        const course = await Course.findByIdAndUpdate(
            req.params.id,
            {code, title, description, type, credits, prerequisites, semester},
            {new: true, runValidators: true}
        );

        if (!course) {
            return res.status(404).json({message: 'Course not found'});
        }

        res.json(course);
    } catch (error) {
        res.status(400).json({message: error.message});
    }
});

// DELETE /api/courses/:id - Admin only
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id, {new: true});

        if (!course) {
            return res.status(404).json({message: 'Course not found'});
        }

        res.json({message: 'Course deleted'});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

// GET /api/courses - All authenticated users
// Supports filtering by: level (difficulty), credits, type, hasPrerequisites
router.get('/', authenticate, async (req, res) => {
    try {
        const { level, credits, type, hasPrerequisites } = req.query;

        // Build filter object
        const filter = {};

        // Filter by level (difficulty)
        if (level && level !== 'All') {
            filter.difficulty = level;
        }

        // Filter by credits
        if (credits) {
            filter.credits = parseInt(credits);
        }

        // Filter by type (Core/Elective)
        if (type && type !== 'All') {
            filter.type = type;
        }

        // Filter by prerequisite status
        if (hasPrerequisites === 'true') {
            filter.prerequisites = { $exists: true, $ne: [] };
        } else if (hasPrerequisites === 'false') {
            filter.$or = [
                { prerequisites: { $exists: false } },
                { prerequisites: { $size: 0 } }
            ];
        }

        const courses = await Course.find(filter).populate('prerequisites', 'code title');
        res.json(courses);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

// GET /api/courses/:id (Get Single Course Details)
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('prerequisites');
        if (!course) {
            return res.status(404).json({message: 'Course not found'});
        }
        res.json(course);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

module.exports = router;