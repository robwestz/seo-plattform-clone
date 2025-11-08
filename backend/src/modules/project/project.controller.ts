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
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../database/entities/user-tenant.entity';

/**
 * Project Controller
 * Manages project CRUD operations with tenant isolation
 */
@ApiTags('Projects')
@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  /**
   * Create a new project
   * @param createProjectDto - Project creation data
   * @param tenantId - Current tenant ID
   * @returns Created project
   */
  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 409, description: 'Project already exists' })
  @ApiResponse({ status: 403, description: 'Project limit reached' })
  create(@Body() createProjectDto: CreateProjectDto, @CurrentTenant() tenantId: string) {
    return this.projectService.create(createProjectDto, tenantId);
  }

  /**
   * Get all projects in current tenant
   * @param tenantId - Current tenant ID
   * @returns List of projects
   */
  @Get()
  @ApiOperation({ summary: 'Get all projects in tenant' })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully' })
  findAll(@CurrentTenant() tenantId: string) {
    return this.projectService.findAll(tenantId);
  }

  /**
   * Get a specific project by ID
   * @param id - Project ID
   * @param tenantId - Current tenant ID
   * @returns Project details
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.projectService.findOne(id, tenantId);
  }

  /**
   * Get project statistics
   * @param id - Project ID
   * @param tenantId - Current tenant ID
   * @returns Project statistics
   */
  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get project statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  getStatistics(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.projectService.getStatistics(id, tenantId);
  }

  /**
   * Update a project
   * @param id - Project ID
   * @param updateProjectDto - Update data
   * @param tenantId - Current tenant ID
   * @returns Updated project
   */
  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER)
  @ApiOperation({ summary: 'Update project' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.projectService.update(id, updateProjectDto, tenantId);
  }

  /**
   * Archive a project
   * @param id - Project ID
   * @param tenantId - Current tenant ID
   * @returns Archived project
   */
  @Patch(':id/archive')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Archive project' })
  @ApiResponse({ status: 200, description: 'Project archived successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  archive(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.projectService.archive(id, tenantId);
  }

  /**
   * Pause a project
   * @param id - Project ID
   * @param tenantId - Current tenant ID
   * @returns Paused project
   */
  @Patch(':id/pause')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER)
  @ApiOperation({ summary: 'Pause project' })
  @ApiResponse({ status: 200, description: 'Project paused successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  pause(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.projectService.pause(id, tenantId);
  }

  /**
   * Resume a project
   * @param id - Project ID
   * @param tenantId - Current tenant ID
   * @returns Resumed project
   */
  @Patch(':id/resume')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER)
  @ApiOperation({ summary: 'Resume project' })
  @ApiResponse({ status: 200, description: 'Project resumed successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  resume(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.projectService.resume(id, tenantId);
  }

  /**
   * Delete a project (soft delete)
   * @param id - Project ID
   * @param tenantId - Current tenant ID
   * @returns Success message
   */
  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete project' })
  @ApiResponse({ status: 204, description: 'Project deleted successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  remove(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.projectService.remove(id, tenantId);
  }
}
