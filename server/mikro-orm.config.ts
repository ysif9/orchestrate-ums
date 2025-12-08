// mikro-orm.config.ts
import { defineConfig } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
    dbName: process.env.DB_NAME || 'orchestrate',
    clientUrl: process.env.DATABASE_URL,
    entities: ['dist/entities/**/*.js'],
    entitiesTs: ['entities/**/*.ts'],
    metadataProvider: TsMorphMetadataProvider,
    debug: true,
});
