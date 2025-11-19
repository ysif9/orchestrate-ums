const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true
        }, // e.g., CS101
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
        prerequisites: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        }],
    },
    {
        timestamps: true, // adds createdAt and updatedAt
    }
);

courseSchema.index({code: 1}, {unique: true});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;