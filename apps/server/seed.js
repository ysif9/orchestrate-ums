const mongoose = require('mongoose');
const Course = require('./models/Course');
const User = require('./models/User');
const Enrollment = require('./models/Enrollment');
const path = require('path');

// --- FIX: Load .env from the current directory (apps/server) ---
require('dotenv').config({ path: path.join(__dirname, '.env') });

const seedData = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing in .env file");
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // 1. Clear existing data
        await Course.deleteMany({});
        await Enrollment.deleteMany({});
        await User.deleteMany({});
        console.log('Old data cleared');

        // 2. Create a Student
        const student = await User.create({
            name: "Student Demo",
            email: "student@test.com",
            password: "password123",
            role: "student"
        });
        console.log(`Created Student ID: ${student._id}`);

        // 3. Create Courses
        
        // Course 1: Math 1 (No prerequisites)
        const math1 = await Course.create({
            code: "MATH101",
            title: "Calculus I",
            description: "Limits, derivatives, and integrals.",
            type: "Core",
            credits: 4,
            professor: "Dr. Newton",
            totalMarks: 100,
            passingMarks: 40,
            lessons: [{ title: "Derivatives", duration: "1h" }]
        });

        // Course 2: Math 2 (Requires Math 1)
        const math2 = await Course.create({
            code: "MATH102",
            title: "Calculus II",
            description: "Integration techniques and sequences.",
            type: "Core",
            credits: 4,
            prerequisites: [math1._id], // <--- LINKED HERE
            professor: "Dr. Leibniz",
            lessons: [{ title: "Series", duration: "1.5h" }]
        });

        // Course 3: CS 101 (No prereq)
        const cs1 = await Course.create({
            code: "CS101",
            title: "Intro to Programming",
            description: "Basics of Python.",
            type: "Core",
            credits: 3,
            professor: "Dr. Lovelace"
        });

        // Course 4: CS 102 (Requires CS 101)
        const cs2 = await Course.create({
            code: "CS102",
            title: "Data Structures",
            description: "Trees, Graphs, and Hash Maps.",
            type: "Core",
            credits: 3,
            prerequisites: [cs1._id], // <--- LINKED HERE
            professor: "Dr. Turing"
        });

        // Course 5: English (No prereq)
        const eng = await Course.create({
            code: "ENG101",
            title: "Academic Writing",
            description: "Essay writing fundamentals.",
            type: "Elective",
            credits: 2,
            professor: "Prof. Shakespeare"
        });

        // Course 6: History (No prereq)
        const hist = await Course.create({
            code: "HIST101",
            title: "World History",
            description: "Ancient civilizations.",
            type: "Elective",
            credits: 2,
            professor: "Prof. Herodotus"
        });

        // 4. Enroll the student in Math 1 and COMPLETE it (so Math 2 unlocks)
        await Enrollment.create({
            student: student._id,
            course: math1._id,
            semester: "Fall 2024",
            status: "completed" // <--- Important: They finished Math 1
        });

        console.log('Database Seeded Successfully!');
        console.log('-----------------------------------');
        console.log('Copy this ID for the Frontend:', student._id.toString());
        console.log('-----------------------------------');
        
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedData();