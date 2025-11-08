import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { UsageEvent } from './entities/usage-event.entity';
import { UsageQuota } from './entities/usage-quota.entity';
import { SubscriptionService } from '../subscription/subscription.service';

/**
 * Usage Event Types
 */
export enum UsageEventType {
  API_CALL = 'api_call',
  CRAWL_PAGE = 'crawl_page',
  KEYWORD_SEARCH = 'keyword_search',
  RANK_CHECK = 'rank_check',
  BACKLINK_CHECK = 'backlink_check',
  AUDIT_RUN = 'audit_run',
  REPORT_GENERATION = 'report_generation',
  DATA_EXPORT = 'data_export',
  WEBHOOK_DELIVERY = 'webhook_delivery',
  ML_PREDICTION = 'ml_prediction',
}

/**
 * Usage tracking service
 * Tracks tenant usage in real-time using Redis counters and ClickHouse for analytics
 */
@Injectable()
export class UsageTrackingService {
  private readonly logger = new Logger(UsageTrackingService.name);
  private readonly REDIS_PREFIX = 'usage';
  private readonly QUOTA_CACHE_TTL = 3600; // 1 hour

  constructor(
    @InjectRepository(UsageEvent)
    private usageEventRepository: Repository<UsageEvent>,
    @InjectRepository(UsageQuota)
    private usageQuotaRepository: Repository<UsageQuota>,
    @InjectRedis() private readonly redis: Redis,
    private eventEmitter: EventEmitter2,
    private subscriptionService: SubscriptionService,
  ) {}

  /**
   * Track a usage event
   */
  async trackEvent(
    tenantId: string,
    eventType: UsageEventType,
    metadata?: Record<string, any>,
    creditsUsed: number = 1,
  ): Promise<void> {
    const timestamp = new Date();
    const dateKey = format(timestamp, 'yyyy-MM-dd');

    try {
      // Increment real-time counters in Redis
      await this.incrementRedisCounters(tenantId, eventType, dateKey, creditsUsed);

      // Check if approaching limit
      const limitCheck = await this.checkLimitThreshold(tenantId, eventType);
      if (limitCheck.approaching) {
        this.eventEmitter.emit('usage.limit_approaching', {
          tenantId,
          eventType,
          percentage: limitCheck.percentage,
          current: limitCheck.current,
          limit: limitCheck.limit,
        });
      }

      // Store event for analytics (async, non-blocking)
      setImmediate(async () => {
        try {
          await this.storeEvent(tenantId, eventType, timestamp, metadata, creditsUsed);
        } catch (error) {
          this.logger.error(`Failed to store usage event: ${error.message}`, error.stack);
        }
      });

      this.logger.debug(
        `Tracked ${eventType} for tenant ${tenantId}: ${creditsUsed} credits`,
      );
    } catch (error) {
      this.logger.error(`Failed to track usage event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get current usage for a tenant
   */
  async getCurrentUsage(
    tenantId: string,
    period: 'day' | 'month' = 'month',
  ): Promise<Record<UsageEventType, number>> {
    const dateKey = this.getDateKey(period);
    const usage: Record<string, number> = {};

    for (const eventType of Object.values(UsageEventType)) {
      const key = this.getRedisKey(tenantId, eventType, dateKey);
      const count = await this.redis.get(key);
      usage[eventType] = count ? parseInt(count, 10) : 0;
    }

    return usage as Record<UsageEventType, number>;
  }

  /**
   * Get usage for a specific event type
   */
  async getUsageForType(
    tenantId: string,
    eventType: UsageEventType,
    period: 'day' | 'month' = 'month',
  ): Promise<number> {
    const dateKey = this.getDateKey(period);
    const key = this.getRedisKey(tenantId, eventType, dateKey);
    const count = await this.redis.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  /**
   * Check if tenant can perform action based on quota
   */
  async checkQuota(tenantId: string, eventType: UsageEventType): Promise<boolean> {
    try {
      const [quota, currentUsage] = await Promise.all([
        this.getQuota(tenantId, eventType),
        this.getUsageForType(tenantId, eventType, 'month'),
      ]);

      // -1 means unlimited
      if (quota === -1) return true;

      return currentUsage < quota;
    } catch (error) {
      this.logger.error(`Failed to check quota: ${error.message}`);
      return false;
    }
  }

  /**
   * Enforce quota - throws if exceeded
   */
  async enforceQuota(tenantId: string, eventType: UsageEventType): Promise<void> {
    const canProceed = await this.checkQuota(tenantId, eventType);

    if (!canProceed) {
      const quota = await this.getQuota(tenantId, eventType);
      const currentUsage = await this.getUsageForType(tenantId, eventType, 'month');

      throw new Error(
        `Usage quota exceeded for ${eventType}. Current: ${currentUsage}, Limit: ${quota}. Please upgrade your plan.`,
      );
    }
  }

  /**
   * Get quota for event type from subscription limits
   */
  private async getQuota(
    tenantId: string,
    eventType: UsageEventType,
  ): Promise<number> {
    const cacheKey = `quota:${tenantId}:${eventType}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return parseInt(cached, 10);
    }

    // Get from subscription
    const subscription = await this.subscriptionService.getCurrentSubscription(tenantId);

    let quota = -1; // Unlimited by default

    // Map event types to subscription limits
    switch (eventType) {
      case UsageEventType.API_CALL:
        quota = subscription.maxApiCallsPerMonth;
        break;
      case UsageEventType.CRAWL_PAGE:
        quota = subscription.maxPages;
        break;
      case UsageEventType.KEYWORD_SEARCH:
        quota = subscription.maxKeywords;
        break;
      case UsageEventType.BACKLINK_CHECK:
        quota = subscription.maxBacklinks;
        break;
      default:
        quota = -1; // No specific limit
    }

    // Cache for 1 hour
    await this.redis.setex(cacheKey, this.QUOTA_CACHE_TTL, quota.toString());

    return quota;
  }

  /**
   * Reset usage for a tenant (new billing period)
   */
  async resetUsage(tenantId: string): Promise<void> {
    this.logger.log(`Resetting usage for tenant ${tenantId}`);

    const pattern = `${this.REDIS_PREFIX}:${tenantId}:*`;
    const keys = await this.redis.keys(pattern);

    if (keys.length > 0) {
      await this.redis.del(...keys);
    }

    this.eventEmitter.emit('usage.reset', { tenantId });
  }

  /**
   * Get usage history for analytics
   */
  async getUsageHistory(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<UsageEvent[]> {
    return this.usageEventRepository.find({
      where: {
        tenantId,
        timestamp: {
          $gte: startDate,
          $lte: endDate,
        } as any,
      },
      order: { timestamp: 'DESC' },
    });
  }

  /**
   * Get aggregated usage statistics
   */
  async getUsageStatistics(
    tenantId: string,
    days: number = 30,
  ): Promise<{
    daily: Record<string, Record<UsageEventType, number>>;
    total: Record<UsageEventType, number>;
    average: Record<UsageEventType, number>;
  }> {
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    const events = await this.getUsageHistory(tenantId, startDate, endDate);

    const daily: Record<string, Record<UsageEventType, number>> = {};
    const total: Record<string, number> = {};

    // Initialize counters
    Object.values(UsageEventType).forEach((type) => {
      total[type] = 0;
    });

    // Aggregate by day
    events.forEach((event) => {
      const dateKey = format(event.timestamp, 'yyyy-MM-dd');

      if (!daily[dateKey]) {
        daily[dateKey] = {} as Record<UsageEventType, number>;
        Object.values(UsageEventType).forEach((type) => {
          daily[dateKey][type] = 0;
        });
      }

      daily[dateKey][event.eventType] += event.creditsUsed;
      total[event.eventType] += event.creditsUsed;
    });

    // Calculate averages
    const average: Record<string, number> = {};
    Object.entries(total).forEach(([type, sum]) => {
      average[type] = Math.round(sum / days);
    });

    return {
      daily,
      total: total as Record<UsageEventType, number>,
      average: average as Record<UsageEventType, number>,
    };
  }

  /**
   * Increment Redis counters for real-time tracking
   */
  private async incrementRedisCounters(
    tenantId: string,
    eventType: UsageEventType,
    dateKey: string,
    credits: number,
  ): Promise<void> {
    const pipeline = this.redis.pipeline();

    // Daily counter
    const dailyKey = this.getRedisKey(tenantId, eventType, dateKey);
    pipeline.incrby(dailyKey, credits);
    pipeline.expire(dailyKey, 86400 * 90); // 90 days TTL

    // Monthly counter
    const monthKey = dateKey.substring(0, 7); // YYYY-MM
    const monthlyKey = this.getRedisKey(tenantId, eventType, monthKey);
    pipeline.incrby(monthlyKey, credits);
    pipeline.expire(monthlyKey, 86400 * 365); // 1 year TTL

    // Total counter (all time)
    const totalKey = `${this.REDIS_PREFIX}:${tenantId}:${eventType}:total`;
    pipeline.incrby(totalKey, credits);

    await pipeline.exec();
  }

  /**
   * Store event in database for historical analytics
   */
  private async storeEvent(
    tenantId: string,
    eventType: UsageEventType,
    timestamp: Date,
    metadata: Record<string, any> = {},
    creditsUsed: number,
  ): Promise<void> {
    const event = this.usageEventRepository.create({
      tenantId,
      eventType,
      timestamp,
      metadata,
      creditsUsed,
    });

    await this.usageEventRepository.save(event);
  }

  /**
   * Check if approaching limit threshold
   */
  private async checkLimitThreshold(
    tenantId: string,
    eventType: UsageEventType,
  ): Promise<{ approaching: boolean; percentage: number; current: number; limit: number }> {
    const quota = await this.getQuota(tenantId, eventType);

    // No limit set
    if (quota === -1) {
      return { approaching: false, percentage: 0, current: 0, limit: -1 };
    }

    const currentUsage = await this.getUsageForType(tenantId, eventType, 'month');
    const percentage = (currentUsage / quota) * 100;

    // Alert at 80% threshold
    const approaching = percentage >= 80;

    return { approaching, percentage, current: currentUsage, limit: quota };
  }

  /**
   * Get Redis key for usage counter
   */
  private getRedisKey(tenantId: string, eventType: UsageEventType, dateKey: string): string {
    return `${this.REDIS_PREFIX}:${tenantId}:${eventType}:${dateKey}`;
  }

  /**
   * Get date key for period
   */
  private getDateKey(period: 'day' | 'month'): string {
    const now = new Date();
    return period === 'day' ? format(now, 'yyyy-MM-dd') : format(now, 'yyyy-MM');
  }

  /**
   * Cron job to clean up old Redis keys
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldCounters(): Promise<void> {
    this.logger.log('Cleaning up old usage counters');

    const cutoffDate = subDays(new Date(), 90);
    const cutoffKey = format(cutoffDate, 'yyyy-MM-dd');

    // This would need a more sophisticated cleanup in production
    // For now, Redis TTL handles it automatically
    this.logger.log(`Cleanup completed. Cutoff date: ${cutoffKey}`);
  }

  /**
   * Handle subscription plan changes
   */
  @OnEvent('subscription.updated')
  async handleSubscriptionUpdate(payload: any): Promise<void> {
    const { tenantId } = payload;

    // Clear quota cache to reflect new limits
    const pattern = `quota:${tenantId}:*`;
    const keys = await this.redis.keys(pattern);

    if (keys.length > 0) {
      await this.redis.del(...keys);
    }

    this.logger.log(`Cleared quota cache for tenant ${tenantId} after subscription update`);
  }

  /**
   * Handle new billing period
   */
  @OnEvent('subscription.billing_period_renewed')
  async handleBillingPeriodRenewed(payload: { tenantId: string }): Promise<void> {
    await this.resetUsage(payload.tenantId);
  }
}
