// index.ts
import express from 'express';
import cors from 'cors';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';
import dotenv from 'dotenv';
import mikroOrmConfig from './mikro-orm.config';
import resourceRoutes from './routes/resourceRoutes';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import courseRoutes from './routes/courseRoutes';
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

export const init = async () => {
    const orm = await MikroORM.init<PostgreSqlDriver>(mikroOrmConfig);

    const generator = orm.getSchemaGenerator();
    await generator.updateSchema();
    console.log('Database schema synchronized');

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
    app.use('/api/resources', resourceRoutes);

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
};

init().catch(err => {
    console.error('Error starting server:', err);
});
