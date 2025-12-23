
import { EntityManager } from '@mikro-orm/postgresql';
import { User, UserRole } from './entities/User';
import { Student, StudentStatus } from './entities/Student';
import { Professor } from './entities/Professor';
import { Parent } from './entities/Parent';
import { Course, CourseType, Difficulty } from './entities/Course';
import { Semester, SemesterStatus } from './entities/Semester';
import { Enrollment, EnrollmentStatus } from './entities/Enrollment';
import { ParentStudentLink } from './entities/ParentStudentLink';
import { Room, RoomType } from './entities/Room';
import { LabStation, LabStationStatus } from './entities/LabStation';
import { Maintenance_Ticket, ticket_status, issue_type } from './entities/Maintenance_Ticket';
// import { Staff } from './entities/Staff'; // If needed later

const PASSWORD = 'password123';

export async function seedData(em: EntityManager) {
    console.log('Running seed data check...');

    // --- 1. SEMESTERS ---
    let fall24 = await em.findOne(Semester, { name: 'Fall 2024' });
    if (!fall24) {
        console.log('Seeding Fall 2024 Semester...');
        fall24 = new Semester('Fall 2024', new Date(2024, 8, 1), new Date(2024, 11, 31));
        fall24.status = SemesterStatus.Active;
        em.persist(fall24);
    }

    let spring25 = await em.findOne(Semester, { name: 'Spring 2025' });
    if (!spring25) {
        console.log('Seeding Spring 2025 Semester...');
        spring25 = new Semester('Spring 2025', new Date(2025, 0, 1), new Date(2025, 4, 30));
        em.persist(spring25);
    }

    // Flush semesters so we can use them
    await em.flush();

    // --- 2. ROOMS & STATIONS ---
    // Check if rooms exist, if not create a few
    const roomsCount = await em.count(Room);
    let lab101: Room;

    if (roomsCount === 0) {
        console.log('Seeding Rooms...');

        lab101 = new Room('Lab 101', 'Engineering', 1, 30, RoomType.Lab);
        const room102 = new Room('Room 102', 'Engineering', 1, 50, RoomType.Classroom);
        const hallA = new Room('Hall A', 'Main Building', 1, 200, RoomType.LectureHall);

        em.persist([lab101, room102, hallA]);
        await em.flush();

        // Add Stations to Lab 101
        console.log('Seeding Lab Stations...');
        const stations = [];
        for (let i = 1; i <= 10; i++) {
            const station = new LabStation(`PC-${i}`, lab101);
            station.description = `Workstation ${i}`;
            stations.push(station);
        }
        em.persist(stations);
        await em.flush();
    } else {
        // Find a lab for later use if needed (checking first lab)
        lab101 = (await em.findOne(Room, { type: RoomType.Lab }))!;
    }

    // --- 3. PROFESSORS ---
    const profs: Professor[] = [];
    for (let i = 1; i <= 5; i++) {
        const email = `prof${i}@university.edu`;
        let prof = await em.findOne(Professor, { email });
        if (!prof) {
            console.log(`Seeding Professor ${i}...`);
            prof = new Professor(
                `Dr. Professor ${i}`,
                email,
                PASSWORD
            );
            prof.phone = `555-010${i}`;
            prof.officeLocation = `Room 10${i}`;
            em.persist(prof);
        }
        profs.push(prof);
    }
    await em.flush();

    // --- 4. COURSES ---
    // Ensure courses exist for Fall 2024
    const subjects = ['Mathematics', 'Physics', 'Computer Science', 'History', 'Biology'];
    const exisitingCourses = await em.find(Course, { semester: fall24 });
    const courses: Course[] = [...exisitingCourses];

    if (exisitingCourses.length === 0) {
        console.log('Seeding Courses...');
        for (const [index, prof] of profs.entries()) {
            const course = new Course(
                `CS${100 + index}`,
                `Intro to ${subjects[index]}`,
                CourseType.Core,
                3
            );
            course.professor = prof;
            course.semester = fall24!;
            course.description = `A comprehensive introduction to ${subjects[index]}.`;
            course.difficulty = Difficulty.Intermediate;
            em.persist(course);
            courses.push(course);
        }
        await em.flush();
    }

    // --- 5. STUDENTS & PARENTS ---
    const students: Student[] = [];

    // Create 10 students
    for (let i = 1; i <= 10; i++) {
        const email = `student${i}@university.edu`;
        let student = await em.findOne(Student, { email });
        if (!student) {
            console.log(`Seeding Student ${i}...`);
            student = new Student(
                `Student ${i}`,
                email,
                PASSWORD
            );
            student.status = StudentStatus.Active;
            student.generateLinkingCode();
            em.persist(student);
        }
        students.push(student);
    }
    await em.flush();

    // Specific Parent Setup
    const parentEmail = 'parent1@gmail.com';
    let parent = await em.findOne(Parent, { email: parentEmail });
    if (!parent) {
        console.log('Seeding Parent 1...');
        parent = new Parent(
            `Parent of Student 1`,
            parentEmail,
            PASSWORD
        );
        parent.generateLinkingCode();
        em.persist(parent);
        await em.flush();
    }

    // --- 6. LINK PARENT <-> STUDENT ---
    if (students.length > 0 && parent) {
        const targetStudent = students[0];
        const existingLink = await em.findOne(ParentStudentLink, { parent, student: targetStudent });

        if (!existingLink) {
            console.log('Linking Parent 1 to Student 1...');
            const link = new ParentStudentLink(parent, targetStudent, targetStudent.linkingCode);
            em.persist(link);
            await em.flush();
        }
    }

    // --- 7. ENROLLMENTS ---
    // Enroll students if they have no enrollments
    console.log('Checking Enrollments...');
    for (const student of students) {
        const enrollmentCount = await em.count(Enrollment, { student });
        if (enrollmentCount === 0 && courses.length > 0) {
            // Enroll in 2 random courses
            const shuffled = [...courses].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 2);

            for (const c of selected) {
                const enrollment = new Enrollment(student, c, fall24!);
                enrollment.status = EnrollmentStatus.Enrolled;
                em.persist(enrollment);
            }
        }
    }
    await em.flush();

    // --- 8. TICKETS ---
    if (students.length > 0 && lab101!) {
        const existingTicket = await em.findOne(Maintenance_Ticket, { user: students[0] as any });
        if (!existingTicket) {
            console.log('Seeding Maintenance Ticket...');
            const ticket = new Maintenance_Ticket(lab101!, students[0], "Monitor not working at station 5");
            ticket.status = ticket_status.open;
            ticket.issue_type = issue_type.hardware;
            em.persist(ticket);
            await em.flush();
        }
    }


    console.log('------------------------------------------------');
    console.log('Seeding Check Completed.');
    console.log('Credentials Summary:');
    console.log(' - Parent: parent1@gmail.com / password123');
    console.log(' - Students: student1@university.edu (to student10) / password123');
    console.log(' - Professors: prof1@university.edu (to prof5) / password123');
    console.log('------------------------------------------------');
}
