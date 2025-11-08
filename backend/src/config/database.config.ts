import { registerAs } from '@nestjs/config';

/**
 * Database configuration
 * Loads PostgreSQL connection settings from environment variables
 */
export const databaseConfig = registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  name: process.env.DATABASE_NAME || 'seo_platform',
  schema: process.env.DATABASE_SCHEMA || 'public',
  sync: process.env.DATABASE_SYNC === 'true',
  logging: process.env.DATABASE_LOGGING === 'true',
}));
