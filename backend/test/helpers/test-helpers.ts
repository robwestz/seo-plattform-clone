import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { getTestDatabaseConfig } from '../setup';

/**
 * Test Helpers
 * Utility functions for setting up tests and mocking
 */

/**
 * Create a testing module with TypeORM and ConfigModule
 */
export async function createTestingModule(
  imports: any[],
  providers: any[] = [],
  controllers: any[] = [],
): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot(getTestDatabaseConfig()),
      ...imports,
    ],
    providers,
    controllers,
  }).compile();
}

/**
 * Create a mock repository
 */
export const createMockRepository = <T = any>(): Partial<Repository<T>> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    getCount: jest.fn(),
    execute: jest.fn(),
  })),
});

/**
 * Create a mock JwtService
 */
export const createMockJwtService = (): Partial<JwtService> => ({
  sign: jest.fn().mockReturnValue('mock_token'),
  signAsync: jest.fn().mockResolvedValue('mock_token'),
  verify: jest.fn().mockReturnValue({ sub: 'user-id', email: 'test@example.com' }),
  verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-id', email: 'test@example.com' }),
  decode: jest.fn().mockReturnValue({ sub: 'user-id', email: 'test@example.com' }),
});

/**
 * Create a mock logger
 */
export const createMockLogger = () => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
});

/**
 * Generate a valid JWT token for testing
 */
export function generateTestToken(payload: any = {}): string {
  return 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJ0ZW5hbnRJZCI6InRlc3QtdGVuYW50LWlkIiwicm9sZSI6Im93bmVyIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
}

/**
 * Clean up database after tests
 */
export async function cleanDatabase(repositories: Repository<any>[]) {
  for (const repository of repositories) {
    await repository.query('TRUNCATE TABLE CASCADE');
  }
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100,
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Timeout waiting for condition');
}

/**
 * Mock external API calls
 */
export const mockExternalApis = () => {
  // Mock Google APIs
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({}),
    text: async () => '',
  });
};

/**
 * Restore external API mocks
 */
export const restoreExternalApis = () => {
  if (global.fetch && jest.isMockFunction(global.fetch)) {
    (global.fetch as jest.Mock).mockRestore();
  }
};
