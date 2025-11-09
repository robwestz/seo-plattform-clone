import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GoogleSearchConsoleService } from './google-search-console.service';
import { GSCData, GSCDataType } from './entities/gsc-data.entity';
import { GSCSyncConfig } from './entities/gsc-sync-config.entity';

/**
 * Google Search Console Data Sync Service
 * Handles automated data synchronization, scheduling, and historical data management
 */
@Injectable()
export class GSCSyncService {
  private readonly logger = new Logger(GSCSyncService.name);
  private activeSyncs = new Map<string, boolean>();

  constructor(
    @InjectRepository(GSCData)
    private gscDataRepository: Repository<GSCData>,
    @InjectRepository(GSCSyncConfig)
    private syncConfigRepository: Repository<GSCSyncConfig>,
    private gscService: GoogleSearchConsoleService,
  ) {}

  /**
   * Scheduled job to sync GSC data for all active configurations
   * Runs every 6 hours
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async syncAllActiveConfigs() {
    this.logger.log('Starting scheduled GSC data sync for all active configs');

    const activeConfigs = await this.syncConfigRepository.find({
      where: { isActive: true },
      relations: ['project'],
    });

    this.logger.log(`Found ${activeConfigs.length} active sync configurations`);

    const syncPromises = activeConfigs.map(config =>
      this.syncConfig(config).catch(error => {
        this.logger.error(
          `Failed to sync config ${config.id}: ${error.message}`,
          error.stack,
        );
      }),
    );

    await Promise.allSettled(syncPromises);
    this.logger.log('Completed scheduled GSC data sync');
  }

  /**
   * Sync data for a specific configuration
   */
  async syncConfig(config: GSCSyncConfig): Promise<void> {
    const syncKey = `${config.tenantId}:${config.projectId}:${config.siteUrl}`;

    if (this.activeSyncs.get(syncKey)) {
      this.logger.warn(`Sync already in progress for ${syncKey}`);
      return;
    }

    this.activeSyncs.set(syncKey, true);

    try {
      this.logger.log(`Syncing GSC data for ${config.siteUrl}`);

      // Determine date range
      const endDate = new Date();
      const startDate = config.lastSyncDate
        ? new Date(config.lastSyncDate)
        : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Last 90 days

      // Sync performance data
      await this.syncPerformanceData(config, startDate, endDate);

      // Sync sitemaps data
      await this.syncSitemapsData(config);

      // Update last sync date
      config.lastSyncDate = endDate;
      config.lastSyncStatus = 'success';
      config.syncCount = (config.syncCount || 0) + 1;
      await this.syncConfigRepository.save(config);

      this.logger.log(
        `Successfully synced GSC data for ${config.siteUrl}. Total syncs: ${config.syncCount}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to sync GSC data for ${config.siteUrl}: ${error.message}`,
        error.stack,
      );

      config.lastSyncStatus = 'failed';
      config.lastSyncError = error.message;
      await this.syncConfigRepository.save(config);

      throw error;
    } finally {
      this.activeSyncs.delete(syncKey);
    }
  }

  /**
   * Sync performance data in batches to handle large datasets
   */
  private async syncPerformanceData(
    config: GSCSyncConfig,
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    const batchSize = 7; // Days per batch
    let currentStart = new Date(startDate);

    while (currentStart < endDate) {
      const currentEnd = new Date(currentStart);
      currentEnd.setDate(currentEnd.getDate() + batchSize);

      if (currentEnd > endDate) {
        currentEnd.setTime(endDate.getTime());
      }

      this.logger.log(
        `Fetching GSC performance data from ${currentStart.toISOString()} to ${currentEnd.toISOString()}`,
      );

      await this.gscService.fetchPerformanceData(
        config.userId,
        config.tenantId,
        config.projectId,
        {
          siteUrl: config.siteUrl,
          startDate: currentStart.toISOString().split('T')[0],
          endDate: currentEnd.toISOString().split('T')[0],
          dimensions: ['query', 'page', 'date', 'country', 'device'],
          searchType: 'web',
          rowLimit: 25000,
        },
      );

      // Move to next batch
      currentStart = new Date(currentEnd);
      currentStart.setDate(currentStart.getDate() + 1);

      // Rate limiting - wait 1 second between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * Sync sitemaps and index coverage data
   */
  private async syncSitemapsData(config: GSCSyncConfig): Promise<void> {
    try {
      const sitemaps = await this.gscService.fetchSitemaps(
        config.userId,
        config.tenantId,
        config.siteUrl,
      );

      this.logger.log(
        `Fetched ${sitemaps.length} sitemaps for ${config.siteUrl}`,
      );

      // Store sitemap data as metadata
      config.metadata = {
        ...config.metadata,
        sitemaps,
        sitemapsLastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to sync sitemaps for ${config.siteUrl}: ${error.message}`,
      );
      // Don't fail the entire sync if sitemaps fail
    }
  }

  /**
   * Create a new sync configuration
   */
  async createSyncConfig(params: {
    userId: string;
    tenantId: string;
    projectId: string;
    siteUrl: string;
    syncFrequency?: 'hourly' | 'daily' | 'weekly';
    isActive?: boolean;
  }): Promise<GSCSyncConfig> {
    const config = this.syncConfigRepository.create({
      userId: params.userId,
      tenantId: params.tenantId,
      projectId: params.projectId,
      siteUrl: params.siteUrl,
      syncFrequency: params.syncFrequency || 'daily',
      isActive: params.isActive !== false,
      syncCount: 0,
      lastSyncStatus: 'pending',
    });

    return this.syncConfigRepository.save(config);
  }

  /**
   * Update sync configuration
   */
  async updateSyncConfig(
    id: string,
    updates: Partial<GSCSyncConfig>,
  ): Promise<GSCSyncConfig> {
    await this.syncConfigRepository.update(id, updates);
    return this.syncConfigRepository.findOne({ where: { id } });
  }

  /**
   * Delete sync configuration
   */
  async deleteSyncConfig(id: string): Promise<void> {
    await this.syncConfigRepository.delete(id);
  }

  /**
   * Get all sync configurations for a tenant
   */
  async getSyncConfigs(
    tenantId: string,
    projectId?: string,
  ): Promise<GSCSyncConfig[]> {
    const query = this.syncConfigRepository
      .createQueryBuilder('config')
      .where('config.tenantId = :tenantId', { tenantId });

    if (projectId) {
      query.andWhere('config.projectId = :projectId', { projectId });
    }

    return query.orderBy('config.createdAt', 'DESC').getMany();
  }

  /**
   * Manually trigger sync for a specific configuration
   */
  async triggerSync(configId: string): Promise<void> {
    const config = await this.syncConfigRepository.findOne({
      where: { id: configId },
    });

    if (!config) {
      throw new Error(`Sync configuration not found: ${configId}`);
    }

    await this.syncConfig(config);
  }

  /**
   * Get sync statistics for a tenant
   */
  async getSyncStatistics(tenantId: string): Promise<{
    totalConfigs: number;
    activeConfigs: number;
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    lastSyncDate: Date | null;
  }> {
    const configs = await this.syncConfigRepository.find({
      where: { tenantId },
    });

    const stats = {
      totalConfigs: configs.length,
      activeConfigs: configs.filter(c => c.isActive).length,
      totalSyncs: configs.reduce((sum, c) => sum + (c.syncCount || 0), 0),
      successfulSyncs: configs.filter(c => c.lastSyncStatus === 'success')
        .length,
      failedSyncs: configs.filter(c => c.lastSyncStatus === 'failed').length,
      lastSyncDate: configs.reduce((latest, c) => {
        if (!c.lastSyncDate) return latest;
        if (!latest) return c.lastSyncDate;
        return c.lastSyncDate > latest ? c.lastSyncDate : latest;
      }, null as Date | null),
    };

    return stats;
  }

  /**
   * Backfill historical data for a specific date range
   */
  async backfillHistoricalData(params: {
    userId: string;
    tenantId: string;
    projectId: string;
    siteUrl: string;
    startDate: Date;
    endDate: Date;
  }): Promise<number> {
    this.logger.log(
      `Starting historical data backfill for ${params.siteUrl} from ${params.startDate.toISOString()} to ${params.endDate.toISOString()}`,
    );

    const batchSize = 7; // Days per batch
    let currentStart = new Date(params.startDate);
    let totalRows = 0;

    while (currentStart < params.endDate) {
      const currentEnd = new Date(currentStart);
      currentEnd.setDate(currentEnd.getDate() + batchSize);

      if (currentEnd > params.endDate) {
        currentEnd.setTime(params.endDate.getTime());
      }

      const result = await this.gscService.fetchPerformanceData(
        params.userId,
        params.tenantId,
        params.projectId,
        {
          siteUrl: params.siteUrl,
          startDate: currentStart.toISOString().split('T')[0],
          endDate: currentEnd.toISOString().split('T')[0],
          dimensions: ['query', 'page', 'date', 'country', 'device'],
          searchType: 'web',
          rowLimit: 25000,
        },
      );

      totalRows += result.totalRows;

      // Move to next batch
      currentStart = new Date(currentEnd);
      currentStart.setDate(currentStart.getDate() + 1);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.logger.log(
      `Completed historical data backfill. Total rows: ${totalRows}`,
    );

    return totalRows;
  }

  /**
   * Detect anomalies in GSC data
   */
  async detectAnomalies(
    tenantId: string,
    projectId: string,
  ): Promise<
    Array<{
      type: 'click_drop' | 'impression_drop' | 'position_drop' | 'ctr_drop';
      severity: 'low' | 'medium' | 'high';
      query?: string;
      url?: string;
      date: Date;
      change: number;
      baseline: number;
      current: number;
    }>
  > {
    const anomalies = [];

    // Get last 30 days of data
    const endDate = new Date();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const recentData = await this.gscDataRepository
      .createQueryBuilder('gsc')
      .where('gsc.tenantId = :tenantId', { tenantId })
      .andWhere('gsc.projectId = :projectId', { projectId })
      .andWhere('gsc.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('gsc.date', 'DESC')
      .getMany();

    // Group by query
    const queryMetrics = new Map<string, { clicks: number; date: Date }[]>();
    recentData.forEach(row => {
      if (!row.query) return;
      if (!queryMetrics.has(row.query)) {
        queryMetrics.set(row.query, []);
      }
      queryMetrics.get(row.query).push({
        clicks: row.clicks,
        date: row.date,
      });
    });

    // Detect click drops
    queryMetrics.forEach((metrics, query) => {
      if (metrics.length < 7) return; // Need at least a week of data

      const recent = metrics
        .slice(0, 3)
        .reduce((sum, m) => sum + m.clicks, 0) / 3;
      const baseline = metrics
        .slice(3, 10)
        .reduce((sum, m) => sum + m.clicks, 0) / 7;

      if (baseline > 10 && recent < baseline * 0.5) {
        // 50% drop
        anomalies.push({
          type: 'click_drop' as const,
          severity: recent < baseline * 0.3 ? ('high' as const) : ('medium' as const),
          query,
          date: metrics[0].date,
          change: ((recent - baseline) / baseline) * 100,
          baseline,
          current: recent,
        });
      }
    });

    return anomalies;
  }

  /**
   * Compare performance between two date ranges
   */
  async comparePerformance(params: {
    tenantId: string;
    projectId: string;
    currentStartDate: Date;
    currentEndDate: Date;
    previousStartDate: Date;
    previousEndDate: Date;
  }): Promise<{
    current: {
      totalClicks: number;
      totalImpressions: number;
      avgCtr: number;
      avgPosition: number;
    };
    previous: {
      totalClicks: number;
      totalImpressions: number;
      avgCtr: number;
      avgPosition: number;
    };
    changes: {
      clicksChange: number;
      impressionsChange: number;
      ctrChange: number;
      positionChange: number;
    };
  }> {
    // Get current period data
    const currentData = await this.gscDataRepository
      .createQueryBuilder('gsc')
      .select('SUM(gsc.clicks)', 'totalClicks')
      .addSelect('SUM(gsc.impressions)', 'totalImpressions')
      .addSelect('AVG(gsc.ctr)', 'avgCtr')
      .addSelect('AVG(gsc.position)', 'avgPosition')
      .where('gsc.tenantId = :tenantId', { tenantId: params.tenantId })
      .andWhere('gsc.projectId = :projectId', {
        projectId: params.projectId,
      })
      .andWhere('gsc.date BETWEEN :startDate AND :endDate', {
        startDate: params.currentStartDate,
        endDate: params.currentEndDate,
      })
      .getRawOne();

    // Get previous period data
    const previousData = await this.gscDataRepository
      .createQueryBuilder('gsc')
      .select('SUM(gsc.clicks)', 'totalClicks')
      .addSelect('SUM(gsc.impressions)', 'totalImpressions')
      .addSelect('AVG(gsc.ctr)', 'avgCtr')
      .addSelect('AVG(gsc.position)', 'avgPosition')
      .where('gsc.tenantId = :tenantId', { tenantId: params.tenantId })
      .andWhere('gsc.projectId = :projectId', {
        projectId: params.projectId,
      })
      .andWhere('gsc.date BETWEEN :startDate AND :endDate', {
        startDate: params.previousStartDate,
        endDate: params.previousEndDate,
      })
      .getRawOne();

    const current = {
      totalClicks: parseInt(currentData.totalClicks) || 0,
      totalImpressions: parseInt(currentData.totalImpressions) || 0,
      avgCtr: parseFloat(currentData.avgCtr) || 0,
      avgPosition: parseFloat(currentData.avgPosition) || 0,
    };

    const previous = {
      totalClicks: parseInt(previousData.totalClicks) || 0,
      totalImpressions: parseInt(previousData.totalImpressions) || 0,
      avgCtr: parseFloat(previousData.avgCtr) || 0,
      avgPosition: parseFloat(previousData.avgPosition) || 0,
    };

    const changes = {
      clicksChange:
        previous.totalClicks > 0
          ? ((current.totalClicks - previous.totalClicks) /
              previous.totalClicks) *
            100
          : 0,
      impressionsChange:
        previous.totalImpressions > 0
          ? ((current.totalImpressions - previous.totalImpressions) /
              previous.totalImpressions) *
            100
          : 0,
      ctrChange:
        previous.avgCtr > 0
          ? ((current.avgCtr - previous.avgCtr) / previous.avgCtr) * 100
          : 0,
      positionChange:
        previous.avgPosition > 0
          ? ((current.avgPosition - previous.avgPosition) /
              previous.avgPosition) *
            100
          : 0,
    };

    return { current, previous, changes };
  }
}
