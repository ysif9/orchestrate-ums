const express = require('express');
const User = require('../models/User');
const {body, validationResult} = require('express-validator');

const router = express.Router();

// POST /api/users
router.post('/', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({min: 8}).withMessage('Password must be at least 8 characters'),
    body('role').isIn(['admin', 'staff', 'student']).withMessage('Valid role is required'),
    body('maxCredits').optional().isInt({min: 0}).withMessage('Max credits must be a positive integer'),
], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }

    try {
        const {name, email, password, role, maxCredits} = req.body;

        const user = new User({name, email, password, role, maxCredits});
        await user.save();

        res.status(201).json(user);
    } catch (error) {
        console.error(error);
        res.status(400).json({message: error.message});
    }
});

// GET /api/users
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

module.exports = router;