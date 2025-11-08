import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { UserTenant, UserRole } from '../../database/entities/user-tenant.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

/**
 * User Service
 * Manages user CRUD operations within tenant context
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserTenant)
    private userTenantRepository: Repository<UserTenant>,
  ) {}

  /**
   * Create a new user
   * @param createUserDto - User creation data
   * @returns Created user
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`Creating user: ${createUserDto.email}`);

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  /**
   * Get all users for a tenant
   * @param tenantId - Tenant ID
   * @returns List of users in the tenant
   */
  async findAllInTenant(tenantId: string): Promise<any[]> {
    this.logger.log(`Finding all users in tenant: ${tenantId}`);

    const userTenants = await this.userTenantRepository.find({
      where: { tenantId, active: true },
      relations: ['user'],
    });

    return userTenants.map((ut) => ({
      ...ut.user,
      role: ut.role,
      permissions: ut.permissions,
      joinedAt: ut.joinedAt,
    }));
  }

  /**
   * Get a specific user by ID
   * @param id - User ID
   * @param tenantId - Tenant ID (for context)
   * @returns User details
   */
  async findOne(id: string, tenantId: string): Promise<any> {
    this.logger.log(`Finding user: ${id} in tenant: ${tenantId}`);

    const userTenant = await this.userTenantRepository.findOne({
      where: { userId: id, tenantId, active: true },
      relations: ['user'],
    });

    if (!userTenant) {
      throw new NotFoundException('User not found in this tenant');
    }

    return {
      ...userTenant.user,
      role: userTenant.role,
      permissions: userTenant.permissions,
      joinedAt: userTenant.joinedAt,
    };
  }

  /**
   * Update a user
   * @param id - User ID
   * @param updateUserDto - Update data
   * @param currentUserId - Current user ID (for authorization)
   * @param tenantId - Tenant ID (for context)
   * @returns Updated user
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUserId: string,
    tenantId: string,
  ): Promise<User> {
    this.logger.log(`Updating user: ${id}`);

    // Check if user exists in tenant
    const userTenant = await this.userTenantRepository.findOne({
      where: { userId: id, tenantId, active: true },
    });

    if (!userTenant) {
      throw new NotFoundException('User not found in this tenant');
    }

    // Only allow users to update themselves unless they're admin/owner
    if (id !== currentUserId) {
      const currentUserTenant = await this.userTenantRepository.findOne({
        where: { userId: currentUserId, tenantId, active: true },
      });

      if (!currentUserTenant || ![UserRole.OWNER, UserRole.ADMIN].includes(currentUserTenant.role)) {
        throw new ForbiddenException('You can only update your own profile');
      }
    }

    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  /**
   * Remove a user from a tenant
   * @param id - User ID
   * @param tenantId - Tenant ID
   * @param currentUserId - Current user ID (for authorization)
   */
  async remove(id: string, tenantId: string, currentUserId: string): Promise<void> {
    this.logger.log(`Removing user: ${id} from tenant: ${tenantId}`);

    // Check authorization
    const currentUserTenant = await this.userTenantRepository.findOne({
      where: { userId: currentUserId, tenantId, active: true },
    });

    if (!currentUserTenant || ![UserRole.OWNER, UserRole.ADMIN].includes(currentUserTenant.role)) {
      throw new ForbiddenException('You do not have permission to remove users');
    }

    const userTenant = await this.userTenantRepository.findOne({
      where: { userId: id, tenantId, active: true },
    });

    if (!userTenant) {
      throw new NotFoundException('User not found in this tenant');
    }

    // Prevent removing yourself
    if (id === currentUserId) {
      throw new ForbiddenException('You cannot remove yourself from the tenant');
    }

    // Soft delete by deactivating
    userTenant.active = false;
    await this.userTenantRepository.save(userTenant);
  }

  /**
   * Update user role in a tenant
   * @param userId - User ID
   * @param tenantId - Tenant ID
   * @param role - New role
   * @param currentUserId - Current user ID (for authorization)
   */
  async updateRole(
    userId: string,
    tenantId: string,
    role: UserRole,
    currentUserId: string,
  ): Promise<UserTenant> {
    this.logger.log(`Updating role for user: ${userId} in tenant: ${tenantId} to: ${role}`);

    // Check authorization - only owners can change roles
    const currentUserTenant = await this.userTenantRepository.findOne({
      where: { userId: currentUserId, tenantId, active: true },
    });

    if (!currentUserTenant || currentUserTenant.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only tenant owners can change user roles');
    }

    const userTenant = await this.userTenantRepository.findOne({
      where: { userId, tenantId, active: true },
    });

    if (!userTenant) {
      throw new NotFoundException('User not found in this tenant');
    }

    userTenant.role = role;
    return this.userTenantRepository.save(userTenant);
  }
}
