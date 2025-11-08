import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { Project } from '../../database/entities/project.entity';
import { Tenant } from '../../database/entities/tenant.entity';

/**
 * Project Module
 * Provides project management functionality
 */
@Module({
  imports: [TypeOrmModule.forFeature([Project, Tenant])],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
