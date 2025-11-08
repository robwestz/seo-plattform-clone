import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UsageEvent, UsageEventType } from './entities/usage-event.entity';
import { UsageAggregate, AggregationPeriod } from './entities/usage-aggregate.entity';
import { RecordUsageDto } from './dto/record-usage.dto';
import { UsageReportDto } from './dto/usage-report.dto';

/**
 * Usage Service
 * Tracks and aggregates usage events for billing and analytics
 */
@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(
    @InjectRepository(UsageEvent)
    private usageEventRepository: Repository<UsageEvent>,
    @InjectRepository(UsageAggregate)
    private usageAggregateRepository: Repository<UsageAggregate>,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Record a usage event
   */
  async recordEvent(
    tenantId: string,
    userId: string | null,
    recordDto: RecordUsageDto,
    request?: any,
  ): Promise<UsageEvent> {
    const event = this.usageEventRepository.create({
      tenantId,
      userId,
      eventType: recordDto.eventType,
      resource: recordDto.resource,
      resourceId: recordDto.resourceId,
      quantity: recordDto.quantity || 1,
      apiEndpoint: request?.route?.path,
      httpMethod: request?.method,
      statusCode: request?.res?.statusCode,
      ipAddress: request?.ip,
      userAgent: request?.headers?.['user-agent'],
      metadata: recordDto.metadata || {},
    });

    const saved = await this.usageEventRepository.save(event);

    // Emit event for real-time processing
    this.eventEmitter.emit('usage.recorded', { event: saved, tenantId });

    return saved;
  }

  /**
   * Record API call usage
   */
  async recordApiCall(
    tenantId: string,
    userId: string | null,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTimeMs: number,
    request?: any,
  ): Promise<UsageEvent> {
    const eventType =
      statusCode >= 200 && statusCode < 300
        ? UsageEventType.API_CALL_SUCCESS
        : UsageEventType.API_CALL_ERROR;

    const event = this.usageEventRepository.create({
      tenantId,
      userId,
      eventType,
      resource: 'api',
      apiEndpoint: endpoint,
      httpMethod: method,
      statusCode,
      responseTimeMs,
      ipAddress: request?.ip,
      userAgent: request?.headers?.['user-agent'],
      quantity: 1,
    });

    const saved = await this.usageEventRepository.save(event);

    // Also record general API_CALL event
    await this.usageEventRepository.save({
      ...event,
      id: undefined,
      eventType: UsageEventType.API_CALL,
    });

    return saved;
  }

  /**
   * Get usage statistics for tenant
   */
  async getUsageStats(tenantId: string, days = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await this.usageEventRepository
      .createQueryBuilder('event')
      .where('event.tenantId = :tenantId', { tenantId })
      .andWhere('event.createdAt >= :startDate', { startDate })
      .getMany();

    // Group by event type
    const byEventType = events.reduce((acc, event) => {
      if (!acc[event.eventType]) {
        acc[event.eventType] = { count: 0, quantity: 0 };
      }
      acc[event.eventType].count++;
      acc[event.eventType].quantity += event.quantity;
      return acc;
    }, {} as Record<string, { count: number; quantity: number }>);

    // Calculate totals
    const totalEvents = events.length;
    const totalApiCalls = events.filter((e) => e.eventType === UsageEventType.API_CALL).length;
    const totalKeywords = events.filter((e) => e.eventType === UsageEventType.KEYWORD_TRACKED).length;
    const totalPageAudits = events.filter((e) => e.eventType === UsageEventType.PAGE_AUDIT).length;

    return {
      period: {
        start: startDate,
        end: new Date(),
        days,
      },
      summary: {
        totalEvents,
        totalApiCalls,
        totalKeywords,
        totalPageAudits,
      },
      byEventType,
    };
  }

  /**
   * Get current month usage for limit checking
   */
  async getCurrentMonthUsage(tenantId: string, eventType?: UsageEventType): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const query = this.usageEventRepository
      .createQueryBuilder('event')
      .where('event.tenantId = :tenantId', { tenantId })
      .andWhere('event.createdAt >= :startOfMonth', { startOfMonth })
      .andWhere('event.createdAt <= :endOfMonth', { endOfMonth });

    if (eventType) {
      query.andWhere('event.eventType = :eventType', { eventType });
    }

    return query.getCount();
  }

  /**
   * Get API calls count for current month
   */
  async getApiCallsThisMonth(tenantId: string): Promise<number> {
    return this.getCurrentMonthUsage(tenantId, UsageEventType.API_CALL);
  }

  /**
   * Get usage report
   */
  async getReport(tenantId: string, reportDto: UsageReportDto): Promise<any> {
    const startDate = reportDto.startDate ? new Date(reportDto.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = reportDto.endDate ? new Date(reportDto.endDate) : new Date();

    const query = this.usageEventRepository
      .createQueryBuilder('event')
      .where('event.tenantId = :tenantId', { tenantId })
      .andWhere('event.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (reportDto.eventType) {
      query.andWhere('event.eventType = :eventType', { eventType: reportDto.eventType });
    }

    const events = await query.orderBy('event.createdAt', 'DESC').getMany();

    // Group by date
    const byDate = events.reduce((acc, event) => {
      const date = event.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { count: 0, quantity: 0, events: [] };
      }
      acc[date].count++;
      acc[date].quantity += event.quantity;
      acc[date].events.push(event.eventType);
      return acc;
    }, {} as Record<string, { count: number; quantity: number; events: string[] }>);

    return {
      period: { start: startDate, end: endDate },
      totalEvents: events.length,
      byDate,
      events: events.slice(0, 100), // Limit to recent 100
    };
  }

  /**
   * Aggregate usage data (called by scheduled job)
   */
  async aggregateUsage(period: AggregationPeriod = AggregationPeriod.DAILY): Promise<void> {
    this.logger.log(`Aggregating usage data for period: ${period}`);

    const { periodStart, periodEnd } = this.getPeriodDates(period);

    // Get all events in period
    const events = await this.usageEventRepository.find({
      where: {
        createdAt: Between(periodStart, periodEnd),
      },
    });

    // Group by tenant and event type
    const groups = events.reduce((acc, event) => {
      const key = `${event.tenantId}-${event.eventType}`;
      if (!acc[key]) {
        acc[key] = {
          tenantId: event.tenantId,
          eventType: event.eventType,
          events: [],
        };
      }
      acc[key].events.push(event);
      return acc;
    }, {} as Record<string, { tenantId: string; eventType: UsageEventType; events: UsageEvent[] }>);

    // Create aggregates
    for (const group of Object.values(groups)) {
      const uniqueUsers = new Set(group.events.map((e) => e.userId).filter(Boolean)).size;
      const uniqueProjects = new Set(group.events.map((e) => e.projectId).filter(Boolean)).size;
      const responseTimes = group.events
        .map((e) => e.responseTimeMs)
        .filter((t) => t !== null && t !== undefined);
      const avgResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
          : null;

      const aggregate = this.usageAggregateRepository.create({
        tenantId: group.tenantId,
        eventType: group.eventType,
        period,
        periodStart,
        periodEnd,
        eventCount: group.events.length,
        totalQuantity: group.events.reduce((sum, e) => sum + e.quantity, 0),
        uniqueUsers,
        uniqueProjects,
        avgResponseTimeMs: avgResponseTime,
        successCount: group.events.filter((e) => e.eventType === UsageEventType.API_CALL_SUCCESS)
          .length,
        errorCount: group.events.filter((e) => e.eventType === UsageEventType.API_CALL_ERROR).length,
      });

      await this.usageAggregateRepository.save(aggregate);
    }

    this.logger.log(`Aggregated ${Object.keys(groups).length} usage groups`);
  }

  /**
   * Get period dates based on aggregation period
   */
  private getPeriodDates(period: AggregationPeriod): { periodStart: Date; periodEnd: Date } {
    const now = new Date();

    switch (period) {
      case AggregationPeriod.HOURLY:
        return {
          periodStart: new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - 1),
          periodEnd: new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()),
        };

      case AggregationPeriod.DAILY:
        return {
          periodStart: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
          periodEnd: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        };

      case AggregationPeriod.MONTHLY:
        return {
          periodStart: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          periodEnd: new Date(now.getFullYear(), now.getMonth(), 1),
        };
    }
  }

  /**
   * Get aggregated usage data
   */
  async getAggregatedUsage(
    tenantId: string,
    period: AggregationPeriod,
    startDate: Date,
    endDate: Date,
  ): Promise<UsageAggregate[]> {
    return this.usageAggregateRepository.find({
      where: {
        tenantId,
        period,
        periodStart: Between(startDate, endDate),
      },
      order: { periodStart: 'ASC' },
    });
  }
}
