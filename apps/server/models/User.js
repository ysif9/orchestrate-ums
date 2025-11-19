const mongoose = require('mongoose');

// Define the schema
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['admin', 'staff', 'student'],
            default: 'student',
        },
        // Specific fields for students
        maxCredits: {
            type: Number,
            default: 18
        },
    },
    {
        timestamps: true, // adds createdAt and updatedAt
    }
);

// Create the model
const User = mongoose.model('User', userSchema);

module.exports = User;