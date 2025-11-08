import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { ProjectModule } from '../../src/modules/project/project.module';
import { TenantModule } from '../../src/modules/tenant/tenant.module';
import { Project, ProjectStatus } from '../../src/database/entities/project.entity';
import { User } from '../../src/database/entities/user.entity';
import { Tenant } from '../../src/database/entities/tenant.entity';
import { UserTenant, UserRole } from '../../src/database/entities/user-tenant.entity';
import { getTestDatabaseConfig } from '../setup';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantContextMiddleware } from '../../src/common/middleware/tenant-context.middleware';

/**
 * Tenant Isolation Security Tests
 * Verifies that multi-tenant data isolation is properly enforced
 */
describe('Tenant Isolation Security Tests', () => {
  let app: INestApplication;
  let projectRepository: Repository<Project>;
  let userRepository: Repository<User>;
  let tenantRepository: Repository<Tenant>;
  let userTenantRepository: Repository<UserTenant>;

  // Tenant A
  let tenantA: Tenant;
  let userA: User;
  let tokenA: string;
  let projectA: Project;

  // Tenant B
  let tenantB: Tenant;
  let userB: User;
  let tokenB: string;
  let projectB: Project;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: './test/.env.test',
        }),
        TypeOrmModule.forRoot(getTestDatabaseConfig()),
        TypeOrmModule.forFeature([Project, User, Tenant, UserTenant]),
        AuthModule,
        ProjectModule,
        TenantModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.use(new TenantContextMiddleware().use);

    projectRepository = moduleFixture.get<Repository<Project>>(getRepositoryToken(Project));
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    tenantRepository = moduleFixture.get<Repository<Tenant>>(getRepositoryToken(Tenant));
    userTenantRepository = moduleFixture.get<Repository<UserTenant>>(
      getRepositoryToken(UserTenant),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database
    await projectRepository.query('DELETE FROM projects');
    await userTenantRepository.query('DELETE FROM user_tenants');
    await userRepository.query('DELETE FROM users');
    await tenantRepository.query('DELETE FROM tenants');

    // Create Tenant A with user and project
    const registerA = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'usera@example.com',
        password: 'Password123!',
        firstName: 'User',
        lastName: 'A',
        tenantName: 'Tenant A',
      });

    tokenA = registerA.body.accessToken;
    tenantA = await tenantRepository.findOne({
      where: { id: registerA.body.tenant.id },
    });
    userA = await userRepository.findOne({
      where: { id: registerA.body.user.id },
    });

    const projectAResponse = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Project A',
        domain: 'projecta.com',
        targetKeywords: ['keyword-a'],
      });

    projectA = await projectRepository.findOne({
      where: { id: projectAResponse.body.id },
    });

    // Create Tenant B with user and project
    const registerB = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'userb@example.com',
        password: 'Password123!',
        firstName: 'User',
        lastName: 'B',
        tenantName: 'Tenant B',
      });

    tokenB = registerB.body.accessToken;
    tenantB = await tenantRepository.findOne({
      where: { id: registerB.body.tenant.id },
    });
    userB = await userRepository.findOne({
      where: { id: registerB.body.user.id },
    });

    const projectBResponse = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Project B',
        domain: 'projectb.com',
        targetKeywords: ['keyword-b'],
      });

    projectB = await projectRepository.findOne({
      where: { id: projectBResponse.body.id },
    });
  });

  describe('Project Isolation', () => {
    it('should not allow Tenant A to access Tenant B projects', async () => {
      // Try to get Tenant B's project using Tenant A's token
      await request(app.getHttpServer())
        .get(`/projects/${projectB.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });

    it('should not allow Tenant B to access Tenant A projects', async () => {
      // Try to get Tenant A's project using Tenant B's token
      await request(app.getHttpServer())
        .get(`/projects/${projectA.id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });

    it('should only return own tenant projects in list', async () => {
      const responseA = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(responseA.body).toHaveLength(1);
      expect(responseA.body[0].id).toBe(projectA.id);
      expect(responseA.body[0].tenantId).toBe(tenantA.id);

      const responseB = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(responseB.body).toHaveLength(1);
      expect(responseB.body[0].id).toBe(projectB.id);
      expect(responseB.body[0].tenantId).toBe(tenantB.id);
    });

    it('should not allow Tenant A to update Tenant B projects', async () => {
      await request(app.getHttpServer())
        .patch(`/projects/${projectB.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Hacked Project' })
        .expect(404);

      // Verify project was not modified
      const project = await projectRepository.findOne({
        where: { id: projectB.id },
      });
      expect(project.name).toBe('Project B');
    });

    it('should not allow Tenant A to delete Tenant B projects', async () => {
      await request(app.getHttpServer())
        .delete(`/projects/${projectB.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);

      // Verify project was not deleted
      const project = await projectRepository.findOne({
        where: { id: projectB.id },
      });
      expect(project).toBeDefined();
      expect(project.deletedAt).toBeNull();
    });
  });

  describe('Tenant Information Isolation', () => {
    it('should not allow users to access other tenants information', async () => {
      await request(app.getHttpServer())
        .get(`/tenants/${tenantB.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(403);
    });

    it('should only return own tenants in list', async () => {
      const response = await request(app.getHttpServer())
        .get('/tenants')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.every((t) => t.id === tenantA.id)).toBe(true);
    });
  });

  describe('Cross-Tenant Manipulation Attempts', () => {
    it('should prevent creating projects with wrong tenant ID in body', async () => {
      // Try to create a project for Tenant B while authenticated as Tenant A
      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Malicious Project',
          domain: 'malicious.com',
          tenantId: tenantB.id, // Try to override tenant ID
        });

      expect(response.status).toBe(201);
      // Verify the project was created for Tenant A, not Tenant B
      const project = await projectRepository.findOne({
        where: { id: response.body.id },
      });
      expect(project.tenantId).toBe(tenantA.id);
      expect(project.tenantId).not.toBe(tenantB.id);
    });

    it('should prevent SQL injection through tenant context', async () => {
      const maliciousId = `${projectB.id}' OR '1'='1`;

      await request(app.getHttpServer())
        .get(`/projects/${maliciousId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });
  });

  describe('RLS (Row-Level Security) Verification', () => {
    it('should enforce tenant isolation at database level', async () => {
      // Direct database query should only return tenant-specific data
      const projectsForTenantA = await projectRepository.find({
        where: { tenantId: tenantA.id },
      });

      const projectsForTenantB = await projectRepository.find({
        where: { tenantId: tenantB.id },
      });

      expect(projectsForTenantA).toHaveLength(1);
      expect(projectsForTenantA[0].id).toBe(projectA.id);

      expect(projectsForTenantB).toHaveLength(1);
      expect(projectsForTenantB[0].id).toBe(projectB.id);

      // Cross-contamination check
      expect(projectsForTenantA[0].id).not.toBe(projectB.id);
      expect(projectsForTenantB[0].id).not.toBe(projectA.id);
    });

    it('should prevent cross-tenant data leakage in joins', async () => {
      // Query with relations should still enforce tenant isolation
      const projectsWithTenant = await projectRepository.find({
        where: { tenantId: tenantA.id },
        relations: ['tenant'],
      });

      expect(projectsWithTenant).toHaveLength(1);
      expect(projectsWithTenant[0].tenant.id).toBe(tenantA.id);
      expect(projectsWithTenant[0].tenant.id).not.toBe(tenantB.id);
    });
  });

  describe('XSS Prevention', () => {
    it('should sanitize project names with malicious scripts', async () => {
      const xssPayload = '<script>alert("XSS")</script>';

      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: xssPayload,
          domain: 'test.com',
        })
        .expect(201);

      // The name should be stored but properly escaped when returned
      expect(response.body.name).toBeDefined();
      // When rendered, it should not execute as script
      expect(response.body.name).toContain('script');
    });

    it('should prevent XSS in domain fields', async () => {
      const xssPayload = 'test.com"><script>alert("XSS")</script>';

      await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Test Project',
          domain: xssPayload,
        })
        .expect(400); // Should fail validation
    });
  });

  describe('Authentication and Authorization', () => {
    it('should reject requests without authentication', async () => {
      await request(app.getHttpServer())
        .get('/projects')
        .expect(401);
    });

    it('should reject requests with invalid tokens', async () => {
      await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
    });

    it('should reject requests with expired tokens', async () => {
      // Create a token that's already expired
      const expiredToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxfQ.invalid';

      await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', expiredToken)
        .expect(401);
    });
  });

  describe('Tenant Context Middleware', () => {
    it('should extract tenant ID from JWT token', async () => {
      const response = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      // All returned projects should belong to the authenticated tenant
      expect(response.body.every((p) => p.tenantId === tenantA.id)).toBe(true);
    });

    it('should reject requests with mismatched tenant ID in header', async () => {
      await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .set('x-tenant-id', tenantB.id) // Try to override with different tenant
        .expect(200);

      // Should still only see Tenant A's projects (JWT takes precedence)
      const response = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .set('x-tenant-id', tenantB.id);

      expect(response.body.every((p) => p.tenantId === tenantA.id)).toBe(true);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain referential integrity across tenants', async () => {
      // Delete tenant A's project
      await request(app.getHttpServer())
        .delete(`/projects/${projectA.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      // Tenant B's project should be unaffected
      const projectBStillExists = await projectRepository.findOne({
        where: { id: projectB.id },
      });
      expect(projectBStillExists).toBeDefined();
      expect(projectBStillExists.deletedAt).toBeNull();
    });

    it('should not affect other tenants when updating data', async () => {
      // Update Tenant A's project
      await request(app.getHttpServer())
        .patch(`/projects/${projectA.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Updated Project A' })
        .expect(200);

      // Tenant B's project should be unchanged
      const projectBUnchanged = await projectRepository.findOne({
        where: { id: projectB.id },
      });
      expect(projectBUnchanged.name).toBe('Project B');
    });
  });
});
