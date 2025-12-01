const mongoose = require('mongoose');
const Course = require('./models/Course');
const User = require('./models/User');
const Enrollment = require('./models/Enrollment');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const seedData = async () => {
    try {
        if (!process.env.MONGO_URI) throw new Error("MONGO_URI missing");
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        await Course.deleteMany({});
        await Enrollment.deleteMany({});
        await User.deleteMany({});

        // Create Student
        const student = await User.create({
            name: "Eng. Student",
            email: "student@eng.asu.edu.eg",
            password: "password123",
            role: "student"
        });

        // Create Staff
        const staff = await User.create({
            name: "Admin Staff",
            email: "staff@eng.asu.edu.eg",
            password: "password123",
            role: "staff"
        });

        // Create Professor
        const professor = await User.create({
            name: "Dr. Professor",
            email: "professor@eng.asu.edu.eg",
            password: "password123",
            role: "professor"
        });

        // --- 1. COMPUTER ENGINEERING ---
        // Prerequisite
        const comp1 = await Course.create({
            code: "CSE101",
            title: "Intro to Software Engineering",
            description: "Software development life cycle, version control with Git, and agile methodologies.",
            type: "Core",
            credits: 3,
            subjectArea: "Computer",
            difficulty: "Introductory",
            professor: "Dr. M. Hassan",
            image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80",
            lessons: [{ title: "SDLC Models", duration: "2h" }]
        });
        // Advanced (Locked)
        const comp2 = await Course.create({
            code: "CSE302",
            title: "Artificial Intelligence & ML",
            description: "Neural networks, deep learning architectures, and computer vision applications.",
            type: "Elective",
            credits: 4,
            subjectArea: "Computer",
            difficulty: "Advanced",
            prerequisites: [comp1._id],
            professor: "Dr. A. Zaki",
            image: "https://images.unsplash.com/photo-1555255707-c07966088b7b?w=800&q=80",
        });

        // --- 2. MECHATRONICS ---
        const mech = await Course.create({
            code: "MCT201",
            title: "Robotics and Automation",
            description: "Kinematics, dynamics of robotic arms, and PLC programming for industrial automation.",
            type: "Core",
            credits: 4,
            subjectArea: "Mechatronics",
            difficulty: "Intermediate",
            professor: "Dr. S. El-Sayed",
            // UPDATED IMAGE LINK HERE:
            image: "https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?w=800&q=80",
        });

        // --- 3. COMMUNICATION ---
        const comm = await Course.create({
            code: "ECE205",
            title: "Signals and Systems",
            description: "Continuous and discrete time signals, Fourier analysis, and system stability.",
            type: "Core",
            credits: 3,
            subjectArea: "Communication",
            difficulty: "Intermediate",
            professor: "Dr. N. Fawzy",
            image: "https://images.unsplash.com/photo-1562408590-e32931084e23?w=800&q=80",
        });

        // --- 4. ARCHITECTURE ---
        const arch = await Course.create({
            code: "ARC101",
            title: "Architectural Design Studio I",
            description: "Fundamentals of 2D and 3D design, spatial thinking, and architectural drafting.",
            type: "Core",
            credits: 5,
            subjectArea: "Architecture",
            difficulty: "Introductory",
            professor: "Dr. H. Kamel",
            image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80",
        });

        // --- 5. CIVIL ---
        const civil = await Course.create({
            code: "CVE202",
            title: "Structural Analysis",
            description: "Analysis of beams, trusses, and frames. Calculating shear and bending moments.",
            type: "Core",
            credits: 4,
            subjectArea: "Civil",
            difficulty: "Intermediate",
            professor: "Dr. T. Mahmoud",
            image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80",
        });

        // --- 6. ENERGY ---
        const energy = await Course.create({
            code: "EP301",
            title: "Renewable Energy Systems",
            description: "Solar PV, wind energy conversion, and grid integration of renewable sources.",
            type: "Elective",
            credits: 3,
            subjectArea: "Energy",
            difficulty: "Advanced",
            professor: "Dr. R. Soliman",
            image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80",
        });

        // Enroll student in Computer 1 to unlock Computer 2
        await Enrollment.create({
            student: student._id,
            course: comp1._id,
            semester: "Spring 2024",
            status: "completed"
        });

        console.log('Database Seeded with Ain Shams Engineering Data!');
        console.log('Use this Student ID:', student._id.toString());
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedData();