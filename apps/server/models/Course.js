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
        semester: {
            type: String,
            trim: true,
            validate: {
                validator: function(v) {
                    if (!v) return true; // allow courses without an assigned semester
                    return /^(Spring|Summer|Fall|Winter) \d{4}$/.test(v);
                },
                message: props => `${props.value} is not a valid semester. Use format 'Fall 2024'.`
            }
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
courseSchema.index({semester: 1});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;