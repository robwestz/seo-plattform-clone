import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../database/entities/user-tenant.entity';

/**
 * User Controller
 * Manages user CRUD operations within tenant context
 */
@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Create a new user
   * @param createUserDto - User creation data
   * @returns Created user
   */
  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  /**
   * Get all users in current tenant
   * @param tenantId - Current tenant ID
   * @returns List of users
   */
  @Get()
  @ApiOperation({ summary: 'Get all users in tenant' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  findAll(@CurrentTenant() tenantId: string) {
    return this.userService.findAllInTenant(tenantId);
  }

  /**
   * Get a specific user by ID
   * @param id - User ID
   * @param tenantId - Current tenant ID
   * @returns User details
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.userService.findOne(id, tenantId);
  }

  /**
   * Update a user
   * @param id - User ID
   * @param updateUserDto - Update data
   * @param currentUserId - Current user ID
   * @param tenantId - Current tenant ID
   * @returns Updated user
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser('id') currentUserId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.userService.update(id, updateUserDto, currentUserId, tenantId);
  }

  /**
   * Update user role in tenant
   * @param id - User ID
   * @param role - New role
   * @param currentUserId - Current user ID
   * @param tenantId - Current tenant ID
   * @returns Updated user tenant
   */
  @Patch(':id/role')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Update user role' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  updateRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
    @CurrentUser('id') currentUserId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.userService.updateRole(id, tenantId, role, currentUserId);
  }

  /**
   * Remove a user from tenant
   * @param id - User ID
   * @param tenantId - Current tenant ID
   * @param currentUserId - Current user ID
   * @returns Success message
   */
  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove user from tenant' })
  @ApiResponse({ status: 204, description: 'User removed successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  remove(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.userService.remove(id, tenantId, currentUserId);
  }
}
