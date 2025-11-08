import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Project, ProjectStatus } from '../../database/entities/project.entity';
import { Tenant } from '../../database/entities/tenant.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

/**
 * Project Service
 * Manages project CRUD operations with tenant isolation
 */
@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {}

  /**
   * Create a new project
   * @param createProjectDto - Project creation data
   * @param tenantId - Tenant ID
   * @returns Created project
   */
  async create(createProjectDto: CreateProjectDto, tenantId: string): Promise<Project> {
    this.logger.log(`Creating project: ${createProjectDto.name} for tenant: ${tenantId}`);

    // Verify tenant exists
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check project limit
    const projectCount = await this.projectRepository.count({
      where: { tenantId, deletedAt: IsNull() },
    });

    if (projectCount >= tenant.maxProjects) {
      throw new ForbiddenException(
        `Project limit reached. Maximum ${tenant.maxProjects} projects allowed for your subscription.`,
      );
    }

    const slug = this.generateSlug(createProjectDto.name);

    // Check if project with same slug exists in tenant
    const existingProject = await this.projectRepository.findOne({
      where: { tenantId, slug, deletedAt: IsNull() },
    });

    if (existingProject) {
      throw new ConflictException('Project with this name already exists in your tenant');
    }

    const project = this.projectRepository.create({
      ...createProjectDto,
      slug,
      tenantId,
      protocol: createProjectDto.protocol || 'https',
      status: createProjectDto.status || ProjectStatus.ACTIVE,
    });

    return this.projectRepository.save(project);
  }

  /**
   * Get all projects for a tenant
   * @param tenantId - Tenant ID
   * @returns List of projects
   */
  async findAll(tenantId: string): Promise<Project[]> {
    this.logger.log(`Finding all projects for tenant: ${tenantId}`);

    return this.projectRepository.find({
      where: { tenantId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get a specific project by ID
   * @param id - Project ID
   * @param tenantId - Tenant ID (for isolation)
   * @returns Project details
   */
  async findOne(id: string, tenantId: string): Promise<Project> {
    this.logger.log(`Finding project: ${id} in tenant: ${tenantId}`);

    const project = await this.projectRepository.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  /**
   * Update a project
   * @param id - Project ID
   * @param updateProjectDto - Update data
   * @param tenantId - Tenant ID (for isolation)
   * @returns Updated project
   */
  async update(id: string, updateProjectDto: UpdateProjectDto, tenantId: string): Promise<Project> {
    this.logger.log(`Updating project: ${id}`);

    const project = await this.projectRepository.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Update slug if name changed
    if (updateProjectDto.name && updateProjectDto.name !== project.name) {
      const slug = this.generateSlug(updateProjectDto.name);
      const existingProject = await this.projectRepository.findOne({
        where: { tenantId, slug, deletedAt: IsNull() },
      });

      if (existingProject && existingProject.id !== id) {
        throw new ConflictException('Project with this name already exists in your tenant');
      }

      project.slug = slug;
    }

    Object.assign(project, updateProjectDto);
    return this.projectRepository.save(project);
  }

  /**
   * Soft delete a project
   * @param id - Project ID
   * @param tenantId - Tenant ID (for isolation)
   */
  async remove(id: string, tenantId: string): Promise<void> {
    this.logger.log(`Deleting project: ${id}`);

    const project = await this.projectRepository.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Soft delete
    project.deletedAt = new Date();
    project.status = ProjectStatus.ARCHIVED;
    await this.projectRepository.save(project);
  }

  /**
   * Archive a project
   * @param id - Project ID
   * @param tenantId - Tenant ID (for isolation)
   * @returns Archived project
   */
  async archive(id: string, tenantId: string): Promise<Project> {
    this.logger.log(`Archiving project: ${id}`);

    const project = await this.findOne(id, tenantId);
    project.status = ProjectStatus.ARCHIVED;
    return this.projectRepository.save(project);
  }

  /**
   * Pause a project
   * @param id - Project ID
   * @param tenantId - Tenant ID (for isolation)
   * @returns Paused project
   */
  async pause(id: string, tenantId: string): Promise<Project> {
    this.logger.log(`Pausing project: ${id}`);

    const project = await this.findOne(id, tenantId);
    project.status = ProjectStatus.PAUSED;
    return this.projectRepository.save(project);
  }

  /**
   * Resume a project
   * @param id - Project ID
   * @param tenantId - Tenant ID (for isolation)
   * @returns Resumed project
   */
  async resume(id: string, tenantId: string): Promise<Project> {
    this.logger.log(`Resuming project: ${id}`);

    const project = await this.findOne(id, tenantId);
    project.status = ProjectStatus.ACTIVE;
    return this.projectRepository.save(project);
  }

  /**
   * Get project statistics
   * @param id - Project ID
   * @param tenantId - Tenant ID (for isolation)
   * @returns Project statistics
   */
  async getStatistics(id: string, tenantId: string) {
    this.logger.log(`Getting statistics for project: ${id}`);

    const project = await this.findOne(id, tenantId);

    return {
      id: project.id,
      name: project.name,
      domain: project.domain,
      status: project.status,
      targetKeywordsCount: project.targetKeywords.length,
      competitorDomainsCount: project.competitorDomains.length,
      lastCrawledAt: project.lastCrawledAt,
      lastAuditAt: project.lastAuditAt,
      lastRankCheckAt: project.lastRankCheckAt,
      createdAt: project.createdAt,
      hasAnalytics: !!project.googleAnalyticsId,
      hasSearchConsole: !!project.googleSearchConsoleId,
    };
  }

  /**
   * Generate URL-friendly slug from string
   * @param text - Text to convert to slug
   * @returns URL-friendly slug
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
