import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { TenantService } from '../../src/modules/tenant/tenant.service';
import { Tenant } from '../../src/database/entities/tenant.entity';
import { UserTenant, UserRole } from '../../src/database/entities/user-tenant.entity';
import { createMockRepository } from '../helpers/test-helpers';
import { createTestTenant, createTestUserTenant } from '../helpers/factories';

describe('TenantService', () => {
  let service: TenantService;
  let tenantRepository: any;
  let userTenantRepository: any;

  const userId = 'test-user-id';

  beforeEach(async () => {
    tenantRepository = createMockRepository<Tenant>();
    userTenantRepository = createMockRepository<UserTenant>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        { provide: getRepositoryToken(Tenant), useValue: tenantRepository },
        { provide: getRepositoryToken(UserTenant), useValue: userTenantRepository },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new tenant', async () => {
      const createTenantDto = {
        name: 'New Tenant',
      };

      tenantRepository.findOne.mockResolvedValue(null);
      const tenant = createTestTenant(createTenantDto);
      tenantRepository.create.mockReturnValue(tenant);
      tenantRepository.save.mockResolvedValue(tenant);

      const result = await service.create(createTenantDto, userId);

      expect(result).toBeDefined();
      expect(result.name).toBe(createTenantDto.name);
      expect(tenantRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if tenant with same slug exists', async () => {
      const createTenantDto = {
        name: 'Existing Tenant',
      };

      const existingTenant = createTestTenant(createTenantDto);
      tenantRepository.findOne.mockResolvedValue(existingTenant);

      await expect(service.create(createTenantDto, userId)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAllForUser', () => {
    it('should return all tenants for a user', async () => {
      const tenant1 = createTestTenant({ name: 'Tenant 1' });
      const tenant2 = createTestTenant({ name: 'Tenant 2' });

      const userTenant1 = createTestUserTenant(userId, tenant1.id);
      const userTenant2 = createTestUserTenant(userId, tenant2.id);
      userTenant1.tenant = tenant1;
      userTenant2.tenant = tenant2;

      userTenantRepository.find.mockResolvedValue([userTenant1, userTenant2]);

      const result = await service.findAllForUser(userId);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Tenant 1');
      expect(result[1].name).toBe('Tenant 2');
    });

    it('should return empty array if user has no tenants', async () => {
      userTenantRepository.find.mockResolvedValue([]);

      const result = await service.findAllForUser(userId);

      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a tenant by ID', async () => {
      const tenant = createTestTenant();
      const userTenant = createTestUserTenant(userId, tenant.id);

      userTenantRepository.findOne.mockResolvedValue(userTenant);
      tenantRepository.findOne.mockResolvedValue(tenant);

      const result = await service.findOne(tenant.id, userId);

      expect(result).toBeDefined();
      expect(result.id).toBe(tenant.id);
    });

    it('should throw ForbiddenException if user does not have access to tenant', async () => {
      const tenantId = 'test-tenant-id';

      userTenantRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(tenantId, userId)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if tenant does not exist', async () => {
      const tenantId = 'test-tenant-id';
      const userTenant = createTestUserTenant(userId, tenantId);

      userTenantRepository.findOne.mockResolvedValue(userTenant);
      tenantRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(tenantId, userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a tenant', async () => {
      const tenant = createTestTenant({ name: 'Original Name' });
      const userTenant = createTestUserTenant(userId, tenant.id);
      const updateDto = { name: 'Updated Name' };

      userTenantRepository.findOne.mockResolvedValue(userTenant);
      tenantRepository.findOne
        .mockResolvedValueOnce(tenant)
        .mockResolvedValueOnce(null); // For slug check

      const updatedTenant = { ...tenant, ...updateDto };
      tenantRepository.save.mockResolvedValue(updatedTenant);

      const result = await service.update(tenant.id, updateDto, userId);

      expect(result.name).toBe(updateDto.name);
      expect(tenantRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user does not have access', async () => {
      const tenantId = 'test-tenant-id';
      const updateDto = { name: 'Updated Name' };

      userTenantRepository.findOne.mockResolvedValue(null);

      await expect(service.update(tenantId, updateDto, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException if new name conflicts with existing tenant', async () => {
      const tenant = createTestTenant({ name: 'Original Name' });
      const existingTenant = createTestTenant({ name: 'Existing Name' });
      const userTenant = createTestUserTenant(userId, tenant.id);
      const updateDto = { name: 'Existing Name' };

      userTenantRepository.findOne.mockResolvedValue(userTenant);
      tenantRepository.findOne
        .mockResolvedValueOnce(tenant)
        .mockResolvedValueOnce(existingTenant);

      await expect(service.update(tenant.id, updateDto, userId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a tenant', async () => {
      const tenant = createTestTenant();
      const userTenant = createTestUserTenant(userId, tenant.id);

      userTenantRepository.findOne.mockResolvedValue(userTenant);
      tenantRepository.findOne.mockResolvedValue(tenant);
      tenantRepository.save.mockResolvedValue({ ...tenant, deletedAt: new Date() });

      await service.remove(tenant.id, userId);

      expect(tenantRepository.save).toHaveBeenCalled();
      const savedTenant = tenantRepository.save.mock.calls[0][0];
      expect(savedTenant.deletedAt).toBeDefined();
      expect(savedTenant.active).toBe(false);
    });

    it('should throw ForbiddenException if user does not have access', async () => {
      const tenantId = 'test-tenant-id';

      userTenantRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(tenantId, userId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getStatistics', () => {
    it('should return tenant statistics', async () => {
      const tenant = createTestTenant();
      tenant.userTenants = [
        createTestUserTenant('user1', tenant.id),
        createTestUserTenant('user2', tenant.id),
        createTestUserTenant('user3', tenant.id, UserRole.MEMBER, { active: false }),
      ];
      tenant.projects = [
        { id: 'project1', deletedAt: null } as any,
        { id: 'project2', deletedAt: null } as any,
        { id: 'project3', deletedAt: new Date() } as any,
      ];

      const userTenant = createTestUserTenant(userId, tenant.id);

      userTenantRepository.findOne.mockResolvedValue(userTenant);
      tenantRepository.findOne.mockResolvedValue(tenant);

      const result = await service.getStatistics(tenant.id, userId);

      expect(result.totalUsers).toBe(3);
      expect(result.activeUsers).toBe(2);
      expect(result.totalProjects).toBe(3);
      expect(result.activeProjects).toBe(2);
      expect(result.subscriptionTier).toBe(tenant.subscriptionTier);
    });
  });
});
