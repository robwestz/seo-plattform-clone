import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { Audit } from './entities/audit.entity';
import { AuditIssue } from './entities/audit-issue.entity';
import { Project } from '../../database/entities/project.entity';
import { IssueDetectorService } from './issue-detector.service';
import { PageSpeedService } from './page-speed.service';
import { StructuredDataValidator } from './structured-data.validator';

/**
 * Audit Module
 * Provides technical SEO audit functionality
 */
@Module({
  imports: [TypeOrmModule.forFeature([Audit, AuditIssue, Project])],
  controllers: [AuditController],
  providers: [
    AuditService,
    IssueDetectorService,
    PageSpeedService,
    StructuredDataValidator,
  ],
  exports: [AuditService, PageSpeedService],
})
export class AuditModule {}
