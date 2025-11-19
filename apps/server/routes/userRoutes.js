const express = require('express');
const User = require('../models/User');

const router = express.Router();

// POST /api/users
router.post('/', async (req, res) => {
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