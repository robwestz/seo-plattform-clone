import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ProjectService } from '../../src/modules/project/project.service';
import { Project, ProjectStatus } from '../../src/database/entities/project.entity';
import { Tenant } from '../../src/database/entities/tenant.entity';
import { createMockRepository } from '../helpers/test-helpers';
import { createTestProject, createTestTenant } from '../helpers/factories';

describe('ProjectService', () => {
  let service: ProjectService;
  let projectRepository: any;
  let tenantRepository: any;

  const tenantId = 'test-tenant-id';

  beforeEach(async () => {
    projectRepository = createMockRepository<Project>();
    tenantRepository = createMockRepository<Tenant>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        { provide: getRepositoryToken(Project), useValue: projectRepository },
        { provide: getRepositoryToken(Tenant), useValue: tenantRepository },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new project', async () => {
      const createProjectDto = {
        name: 'New Project',
        domain: 'example.com',
        targetKeywords: ['keyword1', 'keyword2'],
      };

      const tenant = createTestTenant({ maxProjects: 10 });
      tenantRepository.findOne.mockResolvedValue(tenant);
      projectRepository.count.mockResolvedValue(2); // Current project count
      projectRepository.findOne.mockResolvedValue(null); // No existing project with same slug

      const project = createTestProject(tenantId, createProjectDto);
      projectRepository.create.mockReturnValue(project);
      projectRepository.save.mockResolvedValue(project);

      const result = await service.create(createProjectDto, tenantId);

      expect(result).toBeDefined();
      expect(result.name).toBe(createProjectDto.name);
      expect(result.domain).toBe(createProjectDto.domain);
      expect(projectRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if tenant does not exist', async () => {
      const createProjectDto = {
        name: 'New Project',
        domain: 'example.com',
      };

      tenantRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createProjectDto, tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if project limit reached', async () => {
      const createProjectDto = {
        name: 'New Project',
        domain: 'example.com',
      };

      const tenant = createTestTenant({ maxProjects: 5 });
      tenantRepository.findOne.mockResolvedValue(tenant);
      projectRepository.count.mockResolvedValue(5); // At limit

      await expect(service.create(createProjectDto, tenantId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException if project with same slug exists', async () => {
      const createProjectDto = {
        name: 'Existing Project',
        domain: 'example.com',
      };

      const tenant = createTestTenant({ maxProjects: 10 });
      const existingProject = createTestProject(tenantId, createProjectDto);

      tenantRepository.findOne.mockResolvedValue(tenant);
      projectRepository.count.mockResolvedValue(2);
      projectRepository.findOne.mockResolvedValue(existingProject);

      await expect(service.create(createProjectDto, tenantId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all projects for a tenant', async () => {
      const projects = [
        createTestProject(tenantId, { name: 'Project 1' }),
        createTestProject(tenantId, { name: 'Project 2' }),
      ];

      projectRepository.find.mockResolvedValue(projects);

      const result = await service.findAll(tenantId);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Project 1');
      expect(result[1].name).toBe('Project 2');
      expect(projectRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId }),
        }),
      );
    });

    it('should return empty array if no projects exist', async () => {
      projectRepository.find.mockResolvedValue([]);

      const result = await service.findAll(tenantId);

      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a project by ID', async () => {
      const project = createTestProject(tenantId);

      projectRepository.findOne.mockResolvedValue(project);

      const result = await service.findOne(project.id, tenantId);

      expect(result).toBeDefined();
      expect(result.id).toBe(project.id);
    });

    it('should throw NotFoundException if project does not exist', async () => {
      const projectId = 'non-existent-id';

      projectRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(projectId, tenantId)).rejects.toThrow(NotFoundException);
    });

    it('should enforce tenant isolation', async () => {
      const projectId = 'test-project-id';
      const differentTenantId = 'different-tenant-id';

      projectRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(projectId, differentTenantId)).rejects.toThrow(
        NotFoundException,
      );

      expect(projectRepository.findOne).toHaveBeenCalledWith({
        where: { id: projectId, tenantId: differentTenantId, deletedAt: expect.anything() },
      });
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const project = createTestProject(tenantId, { name: 'Original Name' });
      const updateDto = { name: 'Updated Name' };

      projectRepository.findOne
        .mockResolvedValueOnce(project)
        .mockResolvedValueOnce(null); // For slug check

      const updatedProject = { ...project, ...updateDto };
      projectRepository.save.mockResolvedValue(updatedProject);

      const result = await service.update(project.id, updateDto, tenantId);

      expect(result.name).toBe(updateDto.name);
      expect(projectRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if project does not exist', async () => {
      const projectId = 'non-existent-id';
      const updateDto = { name: 'Updated Name' };

      projectRepository.findOne.mockResolvedValue(null);

      await expect(service.update(projectId, updateDto, tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if new name conflicts', async () => {
      const project = createTestProject(tenantId, { name: 'Original Name' });
      const existingProject = createTestProject(tenantId, { name: 'Existing Name' });
      const updateDto = { name: 'Existing Name' };

      projectRepository.findOne
        .mockResolvedValueOnce(project)
        .mockResolvedValueOnce(existingProject);

      await expect(service.update(project.id, updateDto, tenantId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a project', async () => {
      const project = createTestProject(tenantId);

      projectRepository.findOne.mockResolvedValue(project);
      projectRepository.save.mockResolvedValue({
        ...project,
        deletedAt: new Date(),
        status: ProjectStatus.ARCHIVED,
      });

      await service.remove(project.id, tenantId);

      expect(projectRepository.save).toHaveBeenCalled();
      const savedProject = projectRepository.save.mock.calls[0][0];
      expect(savedProject.deletedAt).toBeDefined();
      expect(savedProject.status).toBe(ProjectStatus.ARCHIVED);
    });

    it('should throw NotFoundException if project does not exist', async () => {
      const projectId = 'non-existent-id';

      projectRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(projectId, tenantId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('archive', () => {
    it('should archive a project', async () => {
      const project = createTestProject(tenantId, { status: ProjectStatus.ACTIVE });

      projectRepository.findOne.mockResolvedValue(project);
      projectRepository.save.mockResolvedValue({
        ...project,
        status: ProjectStatus.ARCHIVED,
      });

      const result = await service.archive(project.id, tenantId);

      expect(result.status).toBe(ProjectStatus.ARCHIVED);
    });
  });

  describe('pause', () => {
    it('should pause a project', async () => {
      const project = createTestProject(tenantId, { status: ProjectStatus.ACTIVE });

      projectRepository.findOne.mockResolvedValue(project);
      projectRepository.save.mockResolvedValue({
        ...project,
        status: ProjectStatus.PAUSED,
      });

      const result = await service.pause(project.id, tenantId);

      expect(result.status).toBe(ProjectStatus.PAUSED);
    });
  });

  describe('resume', () => {
    it('should resume a paused project', async () => {
      const project = createTestProject(tenantId, { status: ProjectStatus.PAUSED });

      projectRepository.findOne.mockResolvedValue(project);
      projectRepository.save.mockResolvedValue({
        ...project,
        status: ProjectStatus.ACTIVE,
      });

      const result = await service.resume(project.id, tenantId);

      expect(result.status).toBe(ProjectStatus.ACTIVE);
    });
  });

  describe('getStatistics', () => {
    it('should return project statistics', async () => {
      const project = createTestProject(tenantId, {
        targetKeywords: ['keyword1', 'keyword2', 'keyword3'],
        competitorDomains: ['competitor1.com', 'competitor2.com'],
        lastCrawledAt: new Date('2025-01-01'),
        lastAuditAt: new Date('2025-01-02'),
        lastRankCheckAt: new Date('2025-01-03'),
        googleAnalyticsId: 'GA-123456',
      });

      projectRepository.findOne.mockResolvedValue(project);

      const result = await service.getStatistics(project.id, tenantId);

      expect(result.targetKeywordsCount).toBe(3);
      expect(result.competitorDomainsCount).toBe(2);
      expect(result.hasAnalytics).toBe(true);
      expect(result.lastCrawledAt).toEqual(project.lastCrawledAt);
    });
  });
});
