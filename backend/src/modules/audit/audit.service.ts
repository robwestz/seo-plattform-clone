import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Audit, AuditStatus } from './entities/audit.entity';
import { AuditIssue, IssueSeverity, IssueCategory } from './entities/audit-issue.entity';
import { Project } from '../../database/entities/project.entity';
import { CreateAuditDto } from './dto/create-audit.dto';
import { IssueDetectorService } from './issue-detector.service';
import { PageSpeedService } from './page-speed.service';
import { StructuredDataValidator } from './structured-data.validator';

/**
 * Audit Service
 * Manages technical SEO audits
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(Audit)
    private auditRepository: Repository<Audit>,
    @InjectRepository(AuditIssue)
    private issueRepository: Repository<AuditIssue>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private issueDetector: IssueDetectorService,
    private pageSpeedService: PageSpeedService,
    private structuredDataValidator: StructuredDataValidator,
  ) {}

  /**
   * Create and run a new audit
   * @param projectId - Project ID
   * @param createAuditDto - Audit options
   * @returns Created audit
   */
  async create(projectId: string, createAuditDto: CreateAuditDto): Promise<Audit> {
    this.logger.log(`Creating audit for project: ${projectId}`);

    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const audit = this.auditRepository.create({
      projectId,
      status: AuditStatus.PENDING,
      startedAt: new Date(),
    });

    const saved = await this.auditRepository.save(audit);

    // Run audit asynchronously
    this.runAudit(saved.id, project, createAuditDto).catch((error) => {
      this.logger.error(`Audit failed: ${error.message}`);
      this.auditRepository.update(saved.id, { status: AuditStatus.FAILED });
    });

    return saved;
  }

  /**
   * Run the audit
   */
  private async runAudit(
    auditId: string,
    project: Project,
    options: CreateAuditDto,
  ): Promise<void> {
    this.logger.log(`Running audit: ${auditId}`);

    await this.auditRepository.update(auditId, { status: AuditStatus.IN_PROGRESS });

    const issues: AuditIssue[] = [];

    // Detect technical issues
    const technicalIssues = await this.issueDetector.detectIssues(project.url, options.maxPages);
    issues.push(...technicalIssues.map((issue) => this.createIssue(auditId, issue)));

    // Check page speed if enabled
    let pageSpeedMetrics = {};
    if (options.includePageSpeed) {
      pageSpeedMetrics = await this.pageSpeedService.analyze(project.url);
      const speedIssues = this.pageSpeedService.getIssuesFromMetrics(pageSpeedMetrics);
      issues.push(...speedIssues.map((issue) => this.createIssue(auditId, issue)));
    }

    // Validate structured data if enabled
    if (options.includeStructuredData) {
      const schemaIssues = await this.structuredDataValidator.validate(project.url);
      issues.push(...schemaIssues.map((issue) => this.createIssue(auditId, issue)));
    }

    // Save all issues
    await this.issueRepository.save(issues);

    // Calculate scores
    const scores = this.calculateScores(issues, pageSpeedMetrics);

    // Update audit with results
    await this.auditRepository.update(auditId, {
      status: AuditStatus.COMPLETED,
      completedAt: new Date(),
      totalIssues: issues.length,
      criticalIssues: issues.filter((i) => i.severity === IssueSeverity.CRITICAL).length,
      warnings: issues.filter((i) => i.severity === IssueSeverity.WARNING).length,
      infoItems: issues.filter((i) => i.severity === IssueSeverity.INFO).length,
      pageSpeedMetrics,
      ...scores,
    });

    this.logger.log(`Audit completed: ${auditId}`);
  }

  /**
   * Get all audits for a project
   * @param projectId - Project ID
   * @returns List of audits
   */
  async findAll(projectId: string): Promise<Audit[]> {
    return this.auditRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get a specific audit with issues
   * @param id - Audit ID
   * @param projectId - Project ID
   * @returns Audit details
   */
  async findOne(id: string, projectId: string): Promise<Audit> {
    const audit = await this.auditRepository.findOne({
      where: { id, projectId },
      relations: ['issues'],
    });

    if (!audit) {
      throw new NotFoundException('Audit not found');
    }

    return audit;
  }

  /**
   * Get audit statistics for a project
   * @param projectId - Project ID
   * @returns Audit statistics
   */
  async getStatistics(projectId: string) {
    const audits = await this.auditRepository.find({
      where: { projectId, status: AuditStatus.COMPLETED },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    if (audits.length === 0) {
      return null;
    }

    const latest = audits[0];
    const avgScore = audits.reduce((sum, a) => sum + Number(a.overallScore), 0) / audits.length;

    return {
      latestScore: Number(latest.overallScore),
      latestGrade: latest.grade,
      avgScore: Math.round(avgScore),
      totalAudits: audits.length,
      trend:
        audits.length > 1
          ? Number(latest.overallScore) - Number(audits[1].overallScore)
          : 0,
      criticalIssues: latest.criticalIssues,
      warnings: latest.warnings,
    };
  }

  /**
   * Calculate audit scores
   */
  private calculateScores(issues: AuditIssue[], pageSpeedMetrics: any) {
    const critical = issues.filter((i) => i.severity === IssueSeverity.CRITICAL).length;
    const warnings = issues.filter((i) => i.severity === IssueSeverity.WARNING).length;

    // Base score starts at 100
    let overallScore = 100;
    overallScore -= critical * 5; // -5 points per critical issue
    overallScore -= warnings * 2; // -2 points per warning

    // Category-specific scores
    const seoIssues = issues.filter((i) => i.category === IssueCategory.SEO);
    const performanceIssues = issues.filter((i) => i.category === IssueCategory.PERFORMANCE);
    const accessibilityIssues = issues.filter((i) => i.category === IssueCategory.ACCESSIBILITY);

    const seoScore = Math.max(100 - seoIssues.length * 5, 0);
    const accessibilityScore = Math.max(100 - accessibilityIssues.length * 5, 0);
    const bestPracticesScore = Math.max(100 - issues.length * 2, 0);

    // Performance score from page speed
    let performanceScore = 100;
    if (pageSpeedMetrics.lcp) {
      performanceScore = this.pageSpeedService.calculatePerformanceScore(pageSpeedMetrics);
    }

    return {
      overallScore: Math.max(overallScore, 0),
      seoScore,
      performanceScore,
      accessibilityScore,
      bestPracticesScore,
    };
  }

  /**
   * Create an issue entity
   */
  private createIssue(auditId: string, issueData: any): AuditIssue {
    const issue = new AuditIssue();
    issue.auditId = auditId;
    issue.severity = issueData.severity;
    issue.category = issueData.category;
    issue.title = issueData.title;
    issue.description = issueData.description;
    issue.recommendation = issueData.recommendation;
    issue.affectedUrls = issueData.affectedUrls || [];
    issue.affectedCount = issueData.affectedCount || 1;
    return issue;
  }
}
