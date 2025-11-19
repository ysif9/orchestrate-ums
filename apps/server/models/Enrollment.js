const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
        },
        semester: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['enrolled', 'completed', 'dropped'],
            default: 'enrolled',
        },
    },
    {
        timestamps: true, // adds createdAt and updatedAt
    }
);

// Prevent duplicate enrollment in the same semester
enrollmentSchema.index({student: 1, course: 1, semester: 1}, {unique: true});

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

module.exports = Enrollment;
