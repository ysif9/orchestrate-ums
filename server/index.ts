import express from 'express';
import cors from 'cors';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';
import dotenv from 'dotenv';
import mikroOrmConfig from './mikro-orm.config';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import courseRoutes from './routes/courseRoutes';
import enrollmentRoutes from './routes/enrollmentRoutes';
import assessmentRoutes from './routes/assessmentRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

export const init = async () => {
    const orm = await MikroORM.init<PostgreSqlDriver>(mikroOrmConfig);

    // Sync database schema (creates tables if they don't exist)
    const generator = orm.getSchemaGenerator();
    await generator.updateSchema();
    console.log('Database schema synchronized');

    // Middleware
    app.use(cors());
    app.use(express.json());

    // MikroORM RequestContext middleware
    app.use((req, res, next) => {
        RequestContext.create(orm.em, next);
    });

    // Basic Route
    app.get('/', (req, res) => {
        res.json({ message: 'Hello from the Backend!' });
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/courses', courseRoutes);
    app.use('/api/enrollments', enrollmentRoutes);
    app.use('/api/assessments', assessmentRoutes);

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
};

init().catch(err => {
    console.error('Error starting server:', err);
});
