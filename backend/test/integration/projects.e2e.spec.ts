import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { ProjectModule } from '../../src/modules/project/project.module';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { Project, ProjectStatus } from '../../src/database/entities/project.entity';
import { User } from '../../src/database/entities/user.entity';
import { Tenant } from '../../src/database/entities/tenant.entity';
import { UserTenant } from '../../src/database/entities/user-tenant.entity';
import { getTestDatabaseConfig } from '../setup';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantContextMiddleware } from '../../src/common/middleware/tenant-context.middleware';

describe('Projects E2E', () => {
  let app: INestApplication;
  let projectRepository: Repository<Project>;
  let userRepository: Repository<User>;
  let tenantRepository: Repository<Tenant>;
  let accessToken: string;
  let tenantId: string;
  let userId: string;

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
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.use(new TenantContextMiddleware().use);

    projectRepository = moduleFixture.get<Repository<Project>>(getRepositoryToken(Project));
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    tenantRepository = moduleFixture.get<Repository<Tenant>>(getRepositoryToken(Tenant));

    await app.init();

    // Register a user and get auth token
    const registerDto = {
      email: 'projecttest@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
      tenantName: 'Test Tenant',
    };

    const authResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto);

    accessToken = authResponse.body.accessToken;
    tenantId = authResponse.body.tenant.id;
    userId = authResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up projects before each test
    await projectRepository.query('DELETE FROM projects');
  });

  describe('/projects (POST)', () => {
    it('should create a new project', async () => {
      const createProjectDto = {
        name: 'Test Project',
        domain: 'example.com',
        targetKeywords: ['keyword1', 'keyword2'],
        targetCountries: ['US', 'UK'],
        targetLanguages: ['en'],
      };

      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createProjectDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(createProjectDto.name);
      expect(response.body.domain).toBe(createProjectDto.domain);
      expect(response.body.tenantId).toBe(tenantId);
      expect(response.body.status).toBe(ProjectStatus.ACTIVE);

      // Verify project was created in database
      const project = await projectRepository.findOne({
        where: { id: response.body.id },
      });
      expect(project).toBeDefined();
      expect(project.tenantId).toBe(tenantId);
    });

    it('should return 401 without authentication', async () => {
      const createProjectDto = {
        name: 'Test Project',
        domain: 'example.com',
      };

      await request(app.getHttpServer())
        .post('/projects')
        .send(createProjectDto)
        .expect(401);
    });

    it('should return 400 for invalid domain', async () => {
      const createProjectDto = {
        name: 'Test Project',
        domain: 'not a domain',
      };

      await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createProjectDto)
        .expect(400);
    });

    it('should return 409 for duplicate project name in same tenant', async () => {
      const createProjectDto = {
        name: 'Duplicate Project',
        domain: 'example.com',
      };

      // Create first project
      await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createProjectDto)
        .expect(201);

      // Try to create duplicate
      await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createProjectDto)
        .expect(409);
    });
  });

  describe('/projects (GET)', () => {
    beforeEach(async () => {
      // Create test projects
      await projectRepository.save([
        projectRepository.create({
          name: 'Project 1',
          slug: 'project-1',
          domain: 'example1.com',
          protocol: 'https',
          status: ProjectStatus.ACTIVE,
          tenantId,
          targetKeywords: [],
          competitorDomains: [],
          targetCountries: ['US'],
          targetLanguages: ['en'],
        }),
        projectRepository.create({
          name: 'Project 2',
          slug: 'project-2',
          domain: 'example2.com',
          protocol: 'https',
          status: ProjectStatus.ACTIVE,
          tenantId,
          targetKeywords: [],
          competitorDomains: [],
          targetCountries: ['US'],
          targetLanguages: ['en'],
        }),
      ]);
    });

    it('should return all projects for authenticated tenant', async () => {
      const response = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0].tenantId).toBe(tenantId);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/projects')
        .expect(401);
    });

    it('should not return projects from other tenants', async () => {
      // Create another tenant and project
      const otherTenant = await tenantRepository.save(
        tenantRepository.create({
          name: 'Other Tenant',
          slug: 'other-tenant',
          active: true,
          maxProjects: 10,
          maxUsers: 10,
          maxKeywords: 100,
        }),
      );

      await projectRepository.save(
        projectRepository.create({
          name: 'Other Project',
          slug: 'other-project',
          domain: 'other.com',
          protocol: 'https',
          status: ProjectStatus.ACTIVE,
          tenantId: otherTenant.id,
          targetKeywords: [],
          competitorDomains: [],
          targetCountries: ['US'],
          targetLanguages: ['en'],
        }),
      );

      const response = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.length).toBe(2); // Should only see own tenant's projects
      expect(response.body.every((p) => p.tenantId === tenantId)).toBe(true);
    });
  });

  describe('/projects/:id (GET)', () => {
    let projectId: string;

    beforeEach(async () => {
      const project = await projectRepository.save(
        projectRepository.create({
          name: 'Single Project',
          slug: 'single-project',
          domain: 'single.com',
          protocol: 'https',
          status: ProjectStatus.ACTIVE,
          tenantId,
          targetKeywords: ['keyword1', 'keyword2'],
          competitorDomains: ['competitor.com'],
          targetCountries: ['US'],
          targetLanguages: ['en'],
        }),
      );
      projectId = project.id;
    });

    it('should return a project by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(projectId);
      expect(response.body.name).toBe('Single Project');
      expect(response.body.targetKeywords).toHaveLength(2);
    });

    it('should return 404 for non-existent project', async () => {
      await request(app.getHttpServer())
        .get('/projects/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 404 for project from different tenant', async () => {
      // Create another tenant and project
      const otherTenant = await tenantRepository.save(
        tenantRepository.create({
          name: 'Other Tenant',
          slug: 'other-tenant-2',
          active: true,
          maxProjects: 10,
          maxUsers: 10,
          maxKeywords: 100,
        }),
      );

      const otherProject = await projectRepository.save(
        projectRepository.create({
          name: 'Other Project',
          slug: 'other-project',
          domain: 'other.com',
          protocol: 'https',
          status: ProjectStatus.ACTIVE,
          tenantId: otherTenant.id,
          targetKeywords: [],
          competitorDomains: [],
          targetCountries: ['US'],
          targetLanguages: ['en'],
        }),
      );

      await request(app.getHttpServer())
        .get(`/projects/${otherProject.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('/projects/:id (PATCH)', () => {
    let projectId: string;

    beforeEach(async () => {
      const project = await projectRepository.save(
        projectRepository.create({
          name: 'Update Project',
          slug: 'update-project',
          domain: 'update.com',
          protocol: 'https',
          status: ProjectStatus.ACTIVE,
          tenantId,
          targetKeywords: [],
          competitorDomains: [],
          targetCountries: ['US'],
          targetLanguages: ['en'],
        }),
      );
      projectId = project.id;
    });

    it('should update a project', async () => {
      const updateDto = {
        name: 'Updated Name',
        targetKeywords: ['new-keyword'],
      };

      const response = await request(app.getHttpServer())
        .patch(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe(updateDto.name);
      expect(response.body.targetKeywords).toContain('new-keyword');
    });

    it('should return 404 for non-existent project', async () => {
      await request(app.getHttpServer())
        .patch('/projects/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated' })
        .expect(404);
    });
  });

  describe('/projects/:id (DELETE)', () => {
    let projectId: string;

    beforeEach(async () => {
      const project = await projectRepository.save(
        projectRepository.create({
          name: 'Delete Project',
          slug: 'delete-project',
          domain: 'delete.com',
          protocol: 'https',
          status: ProjectStatus.ACTIVE,
          tenantId,
          targetKeywords: [],
          competitorDomains: [],
          targetCountries: ['US'],
          targetLanguages: ['en'],
        }),
      );
      projectId = project.id;
    });

    it('should soft delete a project', async () => {
      await request(app.getHttpServer())
        .delete(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const project = await projectRepository.findOne({
        where: { id: projectId },
        withDeleted: true,
      });
      expect(project.deletedAt).toBeDefined();
      expect(project.status).toBe(ProjectStatus.ARCHIVED);
    });

    it('should return 404 for non-existent project', async () => {
      await request(app.getHttpServer())
        .delete('/projects/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
