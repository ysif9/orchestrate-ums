const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
    {
        code: { type: String, required: true, unique: true },
        title: { type: String, required: true },
        description: String,
        type: { type: String, enum: ['Core', 'Elective'], required: true },
        credits: { type: Number, required: true },
        
        // --- NEW FIELDS FOR HARVARD UI ---
        image: { type: String, default: "https://placehold.co/600x400" }, // URL for card image
        subjectArea: { type: String, default: "Science" }, // e.g., "Data Science", "Humanities"
        difficulty: { type: String, enum: ['Introductory', 'Intermediate', 'Advanced'], default: 'Introductory' },
        pace: { type: String, default: "Self-paced" },
        // ---------------------------------

        professor: { type: String, default: "TBA" },
        totalMarks: { type: Number, default: 100 },
        passingMarks: { type: Number, default: 40 },
        lessons: [{
            title: { type: String },
            content: { type: String },
            duration: { type: String }
        }],
        prerequisites: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        }],
    },
    { timestamps: true }
);

courseSchema.index({code: 1}, {unique: true});
const Course = mongoose.model('Course', courseSchema);
module.exports = Course;