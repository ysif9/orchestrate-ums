const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true
        },
        title: {
            type: String,
            required: true
        },
        description: String,
        type: {
            type: String,
            enum: ['Core', 'Elective'],
            required: true
        },
        credits: {
            type: Number,
            required: true
        },
        // --- NEW FIELDS ---
        professor: {
            type: String, // For simplicity, storing name. Could be ObjectId ref to User(staff)
            default: "TBA"
        },
        totalMarks: {
            type: Number,
            default: 100
        },
        passingMarks: {
            type: Number,
            default: 40
        },
        lessons: [{
            title: { type: String },
            content: { type: String }, // Simple description or link
            duration: { type: String } // e.g., "1h 30m"
        }],
        // ------------------
        prerequisites: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        }],
    },
    {
        timestamps: true,
    }
);

courseSchema.index({code: 1}, {unique: true});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;