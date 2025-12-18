// index.ts
import express from 'express';
import cors from 'cors';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';
import dotenv from 'dotenv';
import mikroOrmConfig from './mikro-orm.config';
import { Semester, SemesterStatus } from './entities/Semester';
import { Enrollment } from './entities/Enrollment';
import resourceRoutes from './routes/resourceRoutes';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import courseRoutes from './routes/courseRoutes';
import courseTaRoutes from './routes/courseTaRoutes';
import enrollmentRoutes from './routes/enrollmentRoutes';
import assessmentRoutes from './routes/assessmentRoutes';
import applicantRoutes from './routes/applicantRoutes';
import applicationRoutes from './routes/applicationRoutes';
import applicationReviewRoutes from './routes/applicationReviewRoutes';
import decisionLetterRoutes from './routes/decisionLetterRoutes';
import transcriptRoutes from './routes/transcriptRoutes';
import roomRoutes from './routes/roomRoutes';
import bookingRoutes from './routes/bookingRoutes';
import studentRecordRoutes from './routes/studentRecordRoutes';
import labStationRoutes from './routes/labStationRoutes';
import labReservationRoutes from './routes/labReservationRoutes';
import maintenanceTicketAdminRoutes from './routes/maintenanceTicketAdminRoute';
import maintenanceTicketRoutes from './routes/maintenanceTicketRoute';
import admissionRoutes from './routes/admissionRoutes';
import pdRoutes from './routes/pdRoutes';
import semesterRoutes from './routes/semesterRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Migration function to handle existing enrollments
async function migrateEnrollmentsToSemesters(em: any) {
    try {
        const connection = em.getConnection();
        
        // Check if old semester column (string) still exists
        const hasOldColumn = await connection.execute(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='enrollment' AND column_name='semester' AND data_type='character varying'
        `).then((result: any) => result.length > 0).catch(() => false);

        if (!hasOldColumn) {
            console.log('No old semester column found, migration not needed');
            return;
        }

        // Get all unique semester strings from the old column
        const semesterStrings = await connection.execute(`
            SELECT DISTINCT semester 
            FROM enrollment 
            WHERE semester IS NOT NULL AND semester != ''
        `).then((result: any) => result.map((r: any) => r.semester)).catch(() => []);

        console.log(`Found ${semesterStrings.length} unique semester strings to migrate`);

        // Create Semester entities for each unique semester string
        const semesterMap: { [key: string]: Semester } = {};
        
        for (const semesterName of semesterStrings) {
            let semester = await em.findOne(Semester, { name: semesterName });
            
            if (!semester) {
                // Create a semester with default dates based on the name
                const now = new Date();
                let startDate: Date;
                let endDate: Date;

                // Try to parse semester name (e.g., "Fall 2024", "Spring 2025")
                const yearMatch = semesterName.match(/(\d{4})/);
                const year = yearMatch ? parseInt(yearMatch[1]) : now.getFullYear();
                
                if (semesterName.toLowerCase().includes('fall')) {
                    startDate = new Date(year, 8, 1); // September
                    endDate = new Date(year, 11, 31); // December
                } else if (semesterName.toLowerCase().includes('spring')) {
                    startDate = new Date(year, 0, 1); // January
                    endDate = new Date(year, 4, 30); // May
                } else if (semesterName.toLowerCase().includes('summer')) {
                    startDate = new Date(year, 5, 1); // June
                    endDate = new Date(year, 7, 31); // August
                } else {
                    // Default to current year fall semester
                    startDate = new Date(year, 8, 1);
                    endDate = new Date(year, 11, 31);
                }

                semester = new Semester(semesterName, startDate, endDate);
                semester.status = SemesterStatus.Inactive;
                await em.persistAndFlush(semester);
                console.log(`Created semester: ${semesterName}`);
            }
            
            semesterMap[semesterName] = semester;
        }

        // Update all enrollments to use the new semester_id
        for (const [semesterName, semester] of Object.entries(semesterMap)) {
            await connection.execute(
                `UPDATE enrollment SET semester_id = $1 WHERE semester = $2 AND semester_id IS NULL`,
                [semester.id, semesterName]
            );
        }

        // Drop the old semester column
        await connection.execute(`ALTER TABLE enrollment DROP COLUMN IF EXISTS semester`);
        
        console.log('Enrollment migration completed successfully');
    } catch (error: any) {
        console.error('Error during enrollment migration:', error.message);
        console.error(error.stack);
        // Don't fail startup if migration fails - we'll handle it gracefully
    }
}

export const init = async () => {
    const orm = await MikroORM.init<PostgreSqlDriver>(mikroOrmConfig);

    const generator = orm.getSchemaGenerator();
    await generator.updateSchema();
    console.log('Database schema synchronized');

    // Migrate existing enrollments to use Semester entity
    await migrateEnrollmentsToSemesters(orm.em);

    app.use(cors());
    app.use(express.json());

    app.use((req, res, next) => {
        RequestContext.create(orm.em, next);
    });

    app.get('/', (req, res) => {
        res.json({ message: 'Hello from the Backend!' });
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/courses', courseTaRoutes); // Register under /api/courses so it matches /api/courses/:courseId/tas
    app.use('/api/courses', courseRoutes);
    app.use('/api/enrollments', enrollmentRoutes);
    app.use('/api/assessments', assessmentRoutes);
    app.use('/api/transcript-requests', transcriptRoutes);
    app.use('/api/rooms', roomRoutes);
    app.use('/api/bookings', bookingRoutes);
    app.use('/api/student-records', studentRecordRoutes);
    app.use('/api/applicants', applicantRoutes);
    app.use('/api/applications', applicationRoutes);
    app.use('/api/reviews', applicationReviewRoutes);
    app.use('/api/decision-letters', decisionLetterRoutes);
    app.use('/api/lab-stations', labStationRoutes);
    app.use('/api/lab-reservations', labReservationRoutes);
    app.use('/api/tickets', maintenanceTicketRoutes);
    app.use('/api/admin/tickets', maintenanceTicketAdminRoutes);
    app.use('/api/resources', resourceRoutes);
    app.use('/api/admissions', admissionRoutes);
    app.use('/api/pd', pdRoutes);
    app.use('/api/semesters', semesterRoutes);

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
};

init().catch(err => {
    console.error('Error starting server:', err);
});
