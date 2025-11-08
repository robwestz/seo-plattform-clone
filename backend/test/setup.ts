import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

/**
 * Global Test Setup
 * Provides utilities for setting up test modules and database connections
 */

// Test database configuration
export const getTestDatabaseConfig = () => ({
  type: 'postgres' as const,
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5433', 10),
  username: process.env.TEST_DB_USER || 'test_user',
  password: process.env.TEST_DB_PASSWORD || 'test_password',
  database: process.env.TEST_DB_NAME || 'seo_platform_test',
  entities: [__dirname + '/../src/**/*.entity.{ts,js}'],
  synchronize: true,
  dropSchema: true,
  logging: false,
});

// Global test timeout
jest.setTimeout(30000);

// Clean up after all tests
afterAll(async () => {
  // Wait for all pending operations
  await new Promise((resolve) => setTimeout(resolve, 500));
});
