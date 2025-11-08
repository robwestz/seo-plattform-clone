import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../database/entities/tenant.entity';
import { UserTenant } from '../../database/entities/user-tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

/**
 * Tenant Service
 * Manages tenant CRUD operations and multi-tenancy logic
 */
@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(UserTenant)
    private userTenantRepository: Repository<UserTenant>,
  ) {}

  /**
   * Create a new tenant
   * @param createTenantDto - Tenant creation data
   * @param userId - ID of user creating the tenant
   * @returns Created tenant
   */
  async create(createTenantDto: CreateTenantDto, userId: string): Promise<Tenant> {
    this.logger.log(`Creating tenant: ${createTenantDto.name}`);

    const slug = this.generateSlug(createTenantDto.name);

    // Check if tenant with same slug exists
    const existingTenant = await this.tenantRepository.findOne({ where: { slug } });
    if (existingTenant) {
      throw new ConflictException('Tenant with this name already exists');
    }

    const tenant = this.tenantRepository.create({
      ...createTenantDto,
      slug,
      active: true,
    });

    return this.tenantRepository.save(tenant);
  }

  /**
   * Get all tenants for a user
   * @param userId - User ID
   * @returns List of tenants user belongs to
   */
  async findAllForUser(userId: string): Promise<Tenant[]> {
    this.logger.log(`Finding all tenants for user: ${userId}`);

    const userTenants = await this.userTenantRepository.find({
      where: { userId, active: true },
      relations: ['tenant'],
    });

    return userTenants.map((ut) => ut.tenant);
  }

  /**
   * Get a specific tenant by ID
   * @param id - Tenant ID
   * @param userId - User ID (for authorization check)
   * @returns Tenant details
   */
  async findOne(id: string, userId: string): Promise<Tenant> {
    this.logger.log(`Finding tenant: ${id}`);

    // Verify user has access to this tenant
    const userTenant = await this.userTenantRepository.findOne({
      where: { userId, tenantId: id, active: true },
    });

    if (!userTenant) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    const tenant = await this.tenantRepository.findOne({ where: { id } });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  /**
   * Update a tenant
   * @param id - Tenant ID
   * @param updateTenantDto - Update data
   * @param userId - User ID (for authorization check)
   * @returns Updated tenant
   */
  async update(id: string, updateTenantDto: UpdateTenantDto, userId: string): Promise<Tenant> {
    this.logger.log(`Updating tenant: ${id}`);

    // Verify user has access to this tenant
    const userTenant = await this.userTenantRepository.findOne({
      where: { userId, tenantId: id, active: true },
    });

    if (!userTenant) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    const tenant = await this.tenantRepository.findOne({ where: { id } });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Update slug if name changed
    if (updateTenantDto.name && updateTenantDto.name !== tenant.name) {
      const slug = this.generateSlug(updateTenantDto.name);
      const existingTenant = await this.tenantRepository.findOne({ where: { slug } });

      if (existingTenant && existingTenant.id !== id) {
        throw new ConflictException('Tenant with this name already exists');
      }

      tenant.slug = slug;
    }

    Object.assign(tenant, updateTenantDto);
    return this.tenantRepository.save(tenant);
  }

  /**
   * Soft delete a tenant
   * @param id - Tenant ID
   * @param userId - User ID (for authorization check)
   */
  async remove(id: string, userId: string): Promise<void> {
    this.logger.log(`Deleting tenant: ${id}`);

    // Verify user has access to this tenant
    const userTenant = await this.userTenantRepository.findOne({
      where: { userId, tenantId: id, active: true },
    });

    if (!userTenant) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    const tenant = await this.tenantRepository.findOne({ where: { id } });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Soft delete
    tenant.deletedAt = new Date();
    tenant.active = false;
    await this.tenantRepository.save(tenant);
  }

  /**
   * Get tenant statistics
   * @param tenantId - Tenant ID
   * @param userId - User ID (for authorization check)
   * @returns Tenant statistics
   */
  async getStatistics(tenantId: string, userId: string) {
    this.logger.log(`Getting statistics for tenant: ${tenantId}`);

    // Verify user has access to this tenant
    const userTenant = await this.userTenantRepository.findOne({
      where: { userId, tenantId, active: true },
    });

    if (!userTenant) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
      relations: ['projects', 'userTenants'],
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return {
      totalUsers: tenant.userTenants.length,
      activeUsers: tenant.userTenants.filter((ut) => ut.active).length,
      totalProjects: tenant.projects.length,
      activeProjects: tenant.projects.filter((p) => !p.deletedAt).length,
      subscriptionTier: tenant.subscriptionTier,
      maxUsers: tenant.maxUsers,
      maxProjects: tenant.maxProjects,
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
