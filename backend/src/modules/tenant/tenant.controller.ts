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
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../database/entities/user-tenant.entity';

/**
 * Tenant Controller
 * Manages tenant CRUD operations
 */
@ApiTags('Tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  /**
   * Create a new tenant
   * @param createTenantDto - Tenant creation data
   * @param userId - Current user ID
   * @returns Created tenant
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  @ApiResponse({ status: 409, description: 'Tenant already exists' })
  create(@Body() createTenantDto: CreateTenantDto, @CurrentUser('id') userId: string) {
    return this.tenantService.create(createTenantDto, userId);
  }

  /**
   * Get all tenants for current user
   * @param userId - Current user ID
   * @returns List of tenants
   */
  @Get()
  @ApiOperation({ summary: 'Get all tenants for current user' })
  @ApiResponse({ status: 200, description: 'Tenants retrieved successfully' })
  findAll(@CurrentUser('id') userId: string) {
    return this.tenantService.findAllForUser(userId);
  }

  /**
   * Get a specific tenant by ID
   * @param id - Tenant ID
   * @param userId - Current user ID
   * @returns Tenant details
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiResponse({ status: 200, description: 'Tenant retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.tenantService.findOne(id, userId);
  }

  /**
   * Get tenant statistics
   * @param id - Tenant ID
   * @param userId - Current user ID
   * @returns Tenant statistics
   */
  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get tenant statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  getStatistics(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.tenantService.getStatistics(id, userId);
  }

  /**
   * Update a tenant
   * @param id - Tenant ID
   * @param updateTenantDto - Update data
   * @param userId - Current user ID
   * @returns Updated tenant
   */
  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update tenant' })
  @ApiResponse({ status: 200, description: 'Tenant updated successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.tenantService.update(id, updateTenantDto, userId);
  }

  /**
   * Delete a tenant (soft delete)
   * @param id - Tenant ID
   * @param userId - Current user ID
   * @returns Success message
   */
  @Delete(':id')
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete tenant' })
  @ApiResponse({ status: 204, description: 'Tenant deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.tenantService.remove(id, userId);
  }
}
