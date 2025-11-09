import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SyncJob } from './entities/sync-job.entity';
import { SyncSchedule } from './entities/sync-schedule.entity';
import { GoogleSearchConsoleService } from '../google-search-console/google-search-console.service';
import { GoogleAnalyticsService } from '../google-analytics/google-analytics.service';
import { SEOToolsManagerService } from '../third-party/seo-tools-manager.service';

/**
 * Integration Sync Service
 * Manages scheduled data synchronization across all integrations
 * with priority queues, retry logic, and conflict resolution
 */
@Injectable()
export class IntegrationSyncService {
  private readonly logger = new Logger(IntegrationSyncService.name);
  private activeJobs = new Map<string, boolean>();
  private jobQueue: SyncJob[] = [];
  private isProcessingQueue = false;

  constructor(
    @InjectRepository(SyncJob)
    private syncJobRepository: Repository<SyncJob>,
    @InjectRepository(SyncSchedule)
    private syncScheduleRepository: Repository<SyncSchedule>,
    private gscService: GoogleSearchConsoleService,
    private gaService: GoogleAnalyticsService,
    private seoToolsManager: SEOToolsManagerService,
    private eventEmitter: EventEmitter2,
  ) {
    // Start queue processor
    this.startQueueProcessor();
  }

  /**
   * Check for scheduled jobs and enqueue them
   * Runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkScheduledJobs() {
    this.logger.log('Checking for scheduled sync jobs');

    const now = new Date();

    const schedules = await this.syncScheduleRepository.find({
      where: { isActive: true },
    });

    for (const schedule of schedules) {
      if (this.shouldRunSchedule(schedule, now)) {
        await this.createJobFromSchedule(schedule);
        schedule.lastRunAt = now;
        await this.syncScheduleRepository.save(schedule);
      }
    }
  }

  /**
   * Determine if schedule should run now
   */
  private shouldRunSchedule(schedule: SyncSchedule, now: Date): boolean {
    if (!schedule.lastRunAt) return true;

    const lastRun = schedule.lastRunAt.getTime();
    const nowTime = now.getTime();

    const intervals = {
      hourly: 60 * 60 * 1000,
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000,
    };

    const interval = intervals[schedule.frequency];
    return nowTime - lastRun >= interval;
  }

  /**
   * Create sync job from schedule
   */
  private async createJobFromSchedule(
    schedule: SyncSchedule,
  ): Promise<SyncJob> {
    const job = this.syncJobRepository.create({
      tenantId: schedule.tenantId,
      projectId: schedule.projectId,
      userId: schedule.userId,
      integration: schedule.integration,
      operation: schedule.operation,
      priority: schedule.priority || 'medium',
      status: 'pending',
      config: schedule.config,
      scheduleId: schedule.id,
      retryCount: 0,
      maxRetries: 3,
    });

    await this.syncJobRepository.save(job);
    this.logger.log(`Created sync job ${job.id} from schedule ${schedule.id}`);

    // Add to queue
    this.jobQueue.push(job);
    this.sortQueue();

    return job;
  }

  /**
   * Create manual sync job
   */
  async createManualJob(params: {
    tenantId: string;
    projectId?: string;
    userId: string;
    integration: string;
    operation: string;
    config?: Record<string, any>;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }): Promise<SyncJob> {
    const job = this.syncJobRepository.create({
      ...params,
      status: 'pending',
      priority: params.priority || 'medium',
      retryCount: 0,
      maxRetries: 3,
    });

    await this.syncJobRepository.save(job);
    this.logger.log(`Created manual sync job ${job.id}`);

    // Add to queue
    this.jobQueue.push(job);
    this.sortQueue();

    return job;
  }

  /**
   * Sort queue by priority and created time
   */
  private sortQueue() {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

    this.jobQueue.sort((a, b) => {
      const priorityDiff =
        priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  /**
   * Start background queue processor
   */
  private startQueueProcessor() {
    setInterval(async () => {
      if (!this.isProcessingQueue && this.jobQueue.length > 0) {
        await this.processQueue();
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Process job queue
   */
  private async processQueue() {
    if (this.isProcessingQueue) return;

    this.isProcessingQueue = true;

    try {
      while (this.jobQueue.length > 0) {
        const job = this.jobQueue.shift();
        if (job && !this.activeJobs.get(job.id)) {
          await this.processJob(job);
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Process individual sync job
   */
  private async processJob(job: SyncJob): Promise<void> {
    this.activeJobs.set(job.id, true);

    try {
      this.logger.log(`Processing sync job ${job.id}: ${job.integration}.${job.operation}`);

      // Update status to running
      job.status = 'running';
      job.startedAt = new Date();
      await this.syncJobRepository.save(job);

      // Execute the sync operation
      const result = await this.executeSyncOperation(job);

      // Mark as completed
      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;
      await this.syncJobRepository.save(job);

      this.logger.log(`Completed sync job ${job.id}`);

      // Emit success event
      this.eventEmitter.emit('sync.job.completed', {
        jobId: job.id,
        integration: job.integration,
        operation: job.operation,
        tenantId: job.tenantId,
      });
    } catch (error) {
      this.logger.error(`Failed sync job ${job.id}: ${error.message}`, error.stack);

      // Handle retry
      if (job.retryCount < job.maxRetries) {
        await this.retryJob(job, error.message);
      } else {
        // Mark as failed
        job.status = 'failed';
        job.completedAt = new Date();
        job.error = error.message;
        await this.syncJobRepository.save(job);

        // Emit failure event
        this.eventEmitter.emit('sync.job.failed', {
          jobId: job.id,
          integration: job.integration,
          operation: job.operation,
          tenantId: job.tenantId,
          error: error.message,
        });
      }
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  /**
   * Execute sync operation based on integration and operation type
   */
  private async executeSyncOperation(job: SyncJob): Promise<any> {
    const { integration, operation, userId, tenantId, projectId, config } = job;

    switch (integration) {
      case 'google-search-console':
        return this.executeGSCOperation(operation, {
          userId,
          tenantId,
          projectId,
          config,
        });

      case 'google-analytics':
        return this.executeGAOperation(operation, {
          userId,
          tenantId,
          projectId,
          config,
        });

      case 'seo-tools':
        return this.executeSEOToolsOperation(operation, {
          tenantId,
          projectId,
          config,
        });

      default:
        throw new Error(`Unknown integration: ${integration}`);
    }
  }

  /**
   * Execute Google Search Console operations
   */
  private async executeGSCOperation(
    operation: string,
    params: any,
  ): Promise<any> {
    switch (operation) {
      case 'fetchPerformance':
        return this.gscService.fetchPerformanceData(
          params.userId,
          params.tenantId,
          params.projectId,
          params.config,
        );

      case 'fetchSitemaps':
        return this.gscService.fetchSitemaps(
          params.userId,
          params.tenantId,
          params.config.siteUrl,
        );

      default:
        throw new Error(`Unknown GSC operation: ${operation}`);
    }
  }

  /**
   * Execute Google Analytics operations
   */
  private async executeGAOperation(operation: string, params: any): Promise<any> {
    switch (operation) {
      case 'runReport':
        return this.gaService.runReport(
          params.userId,
          params.tenantId,
          params.projectId,
          params.config,
        );

      default:
        throw new Error(`Unknown GA operation: ${operation}`);
    }
  }

  /**
   * Execute SEO Tools operations
   */
  private async executeSEOToolsOperation(
    operation: string,
    params: any,
  ): Promise<any> {
    switch (operation) {
      case 'fetchBacklinks':
        return this.seoToolsManager.getBacklinks({
          tenantId: params.tenantId,
          domain: params.config.domain,
          limit: params.config.limit,
        });

      case 'fetchDomainMetrics':
        return this.seoToolsManager.getAggregatedDomainMetrics({
          tenantId: params.tenantId,
          domain: params.config.domain,
        });

      default:
        throw new Error(`Unknown SEO Tools operation: ${operation}`);
    }
  }

  /**
   * Retry failed job with exponential backoff
   */
  private async retryJob(job: SyncJob, errorMessage: string): Promise<void> {
    job.retryCount++;
    job.error = errorMessage;
    job.status = 'pending';

    // Calculate backoff delay (exponential: 2^retry * 60 seconds)
    const delayMinutes = Math.pow(2, job.retryCount) * 1;
    const retryAt = new Date(Date.now() + delayMinutes * 60 * 1000);

    job.nextRetryAt = retryAt;
    await this.syncJobRepository.save(job);

    this.logger.log(
      `Scheduled retry ${job.retryCount}/${job.maxRetries} for job ${job.id} at ${retryAt.toISOString()}`,
    );

    // Schedule retry
    setTimeout(async () => {
      this.jobQueue.push(job);
      this.sortQueue();
    }, delayMinutes * 60 * 1000);
  }

  /**
   * Create sync schedule
   */
  async createSchedule(params: {
    tenantId: string;
    projectId?: string;
    userId: string;
    integration: string;
    operation: string;
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    config?: Record<string, any>;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    isActive?: boolean;
  }): Promise<SyncSchedule> {
    const schedule = this.syncScheduleRepository.create({
      ...params,
      isActive: params.isActive !== false,
      priority: params.priority || 'medium',
    });

    return this.syncScheduleRepository.save(schedule);
  }

  /**
   * Update sync schedule
   */
  async updateSchedule(
    scheduleId: string,
    updates: Partial<SyncSchedule>,
  ): Promise<SyncSchedule> {
    await this.syncScheduleRepository.update(scheduleId, updates);
    return this.syncScheduleRepository.findOne({ where: { id: scheduleId } });
  }

  /**
   * Delete sync schedule
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    await this.syncScheduleRepository.delete(scheduleId);
  }

  /**
   * Get sync schedules for tenant
   */
  async getSchedules(
    tenantId: string,
    projectId?: string,
  ): Promise<SyncSchedule[]> {
    const query = this.syncScheduleRepository
      .createQueryBuilder('schedule')
      .where('schedule.tenantId = :tenantId', { tenantId });

    if (projectId) {
      query.andWhere('schedule.projectId = :projectId', { projectId });
    }

    return query.orderBy('schedule.createdAt', 'DESC').getMany();
  }

  /**
   * Get sync job history
   */
  async getJobHistory(
    tenantId: string,
    options?: {
      projectId?: string;
      integration?: string;
      status?: string;
      limit?: number;
    },
  ): Promise<SyncJob[]> {
    const query = this.syncJobRepository
      .createQueryBuilder('job')
      .where('job.tenantId = :tenantId', { tenantId });

    if (options?.projectId) {
      query.andWhere('job.projectId = :projectId', {
        projectId: options.projectId,
      });
    }

    if (options?.integration) {
      query.andWhere('job.integration = :integration', {
        integration: options.integration,
      });
    }

    if (options?.status) {
      query.andWhere('job.status = :status', { status: options.status });
    }

    return query
      .orderBy('job.createdAt', 'DESC')
      .limit(options?.limit || 100)
      .getMany();
  }

  /**
   * Get sync statistics
   */
  async getSyncStatistics(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    total: number;
    completed: number;
    failed: number;
    pending: number;
    running: number;
    averageDuration: number;
    successRate: number;
    byIntegration: {
      [integration: string]: {
        total: number;
        completed: number;
        failed: number;
      };
    };
  }> {
    const query = this.syncJobRepository
      .createQueryBuilder('job')
      .where('job.tenantId = :tenantId', { tenantId });

    if (startDate) {
      query.andWhere('job.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('job.createdAt <= :endDate', { endDate });
    }

    const jobs = await query.getMany();

    const stats = {
      total: jobs.length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      pending: jobs.filter(j => j.status === 'pending').length,
      running: jobs.filter(j => j.status === 'running').length,
      averageDuration: 0,
      successRate: 0,
      byIntegration: {} as any,
    };

    // Calculate average duration
    const completedJobs = jobs.filter(
      j => j.status === 'completed' && j.startedAt && j.completedAt,
    );
    if (completedJobs.length > 0) {
      const totalDuration = completedJobs.reduce((sum, j) => {
        const duration = j.completedAt.getTime() - j.startedAt.getTime();
        return sum + duration;
      }, 0);
      stats.averageDuration = totalDuration / completedJobs.length / 1000; // Convert to seconds
    }

    // Calculate success rate
    const finishedJobs = stats.completed + stats.failed;
    if (finishedJobs > 0) {
      stats.successRate = (stats.completed / finishedJobs) * 100;
    }

    // By integration
    jobs.forEach(job => {
      if (!stats.byIntegration[job.integration]) {
        stats.byIntegration[job.integration] = {
          total: 0,
          completed: 0,
          failed: 0,
        };
      }

      stats.byIntegration[job.integration].total++;
      if (job.status === 'completed') {
        stats.byIntegration[job.integration].completed++;
      } else if (job.status === 'failed') {
        stats.byIntegration[job.integration].failed++;
      }
    });

    return stats;
  }

  /**
   * Cancel pending job
   */
  async cancelJob(jobId: string): Promise<void> {
    const job = await this.syncJobRepository.findOne({ where: { id: jobId } });

    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    if (job.status !== 'pending') {
      throw new Error(`Cannot cancel job in status: ${job.status}`);
    }

    job.status = 'cancelled';
    job.completedAt = new Date();
    await this.syncJobRepository.save(job);

    // Remove from queue
    this.jobQueue = this.jobQueue.filter(j => j.id !== jobId);

    this.logger.log(`Cancelled sync job ${jobId}`);
  }

  /**
   * Retry failed job immediately
   */
  async retryJobNow(jobId: string): Promise<void> {
    const job = await this.syncJobRepository.findOne({ where: { id: jobId } });

    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    if (job.status !== 'failed') {
      throw new Error(`Cannot retry job in status: ${job.status}`);
    }

    job.status = 'pending';
    job.retryCount = 0;
    job.error = null;
    job.nextRetryAt = null;
    await this.syncJobRepository.save(job);

    // Add to queue
    this.jobQueue.push(job);
    this.sortQueue();

    this.logger.log(`Queued failed job ${jobId} for immediate retry`);
  }
}
