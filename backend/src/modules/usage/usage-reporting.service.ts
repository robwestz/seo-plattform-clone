import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { UsageEvent } from './entities/usage-event.entity';
import { UsageEventType, UsageTrackingService } from './usage-tracking.service';
import { format, subDays, subMonths, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';

/**
 * Usage Report DTO
 */
export interface UsageReport {
  tenantId: string;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalEvents: number;
    totalCredits: number;
    uniqueDays: number;
    averagePerDay: number;
  };
  byEventType: Record<
    UsageEventType,
    {
      count: number;
      credits: number;
      percentage: number;
    }
  >;
  dailyBreakdown: Array<{
    date: string;
    total: number;
    byType: Record<UsageEventType, number>;
  }>;
  trends: {
    growth: number; // Percentage growth compared to previous period
    peakDay: string;
    peakCount: number;
    averageDaily: number;
  };
}

/**
 * Cost Analysis Report
 */
export interface CostAnalysisReport {
  tenantId: string;
  period: {
    start: Date;
    end: Date;
  };
  costs: {
    apiCalls: number;
    crawling: number;
    ml: number;
    storage: number;
    total: number;
  };
  projectedMonthlyCost: number;
  costPerEvent: Record<UsageEventType, number>;
}

/**
 * Quota Status Report
 */
export interface QuotaStatusReport {
  tenantId: string;
  plan: string;
  quotas: Array<{
    eventType: UsageEventType;
    limit: number;
    used: number;
    remaining: number;
    percentage: number;
    status: 'ok' | 'warning' | 'critical' | 'exceeded';
  }>;
  overallStatus: 'healthy' | 'warning' | 'critical';
}

/**
 * Usage Reporting Service
 * Generates comprehensive usage reports and analytics
 */
@Injectable()
export class UsageReportingService {
  private readonly logger = new Logger(UsageReportingService.name);

  // Cost per event type (in cents)
  private readonly EVENT_COSTS: Record<UsageEventType, number> = {
    [UsageEventType.API_CALL]: 0.001,
    [UsageEventType.CRAWL_PAGE]: 0.01,
    [UsageEventType.KEYWORD_SEARCH]: 0.005,
    [UsageEventType.RANK_CHECK]: 0.01,
    [UsageEventType.BACKLINK_CHECK]: 0.008,
    [UsageEventType.AUDIT_RUN]: 0.05,
    [UsageEventType.REPORT_GENERATION]: 0.02,
    [UsageEventType.DATA_EXPORT]: 0.015,
    [UsageEventType.WEBHOOK_DELIVERY]: 0.002,
    [UsageEventType.ML_PREDICTION]: 0.03,
  };

  constructor(
    @InjectRepository(UsageEvent)
    private usageEventRepository: Repository<UsageEvent>,
    private usageTrackingService: UsageTrackingService,
  ) {}

  /**
   * Generate comprehensive usage report
   */
  async generateReport(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<UsageReport> {
    this.logger.log(
      `Generating usage report for tenant ${tenantId} from ${startDate} to ${endDate}`,
    );

    const events = await this.usageEventRepository.find({
      where: {
        tenantId,
        timestamp: Between(startDate, endDate),
      },
      order: { timestamp: 'ASC' },
    });

    // Calculate summary
    const totalEvents = events.length;
    const totalCredits = events.reduce((sum, event) => sum + event.creditsUsed, 0);
    const uniqueDays = new Set(events.map((e) => format(e.timestamp, 'yyyy-MM-dd'))).size;
    const averagePerDay = uniqueDays > 0 ? totalEvents / uniqueDays : 0;

    // Aggregate by event type
    const byEventType: Record<string, any> = {};
    Object.values(UsageEventType).forEach((type) => {
      byEventType[type] = { count: 0, credits: 0, percentage: 0 };
    });

    events.forEach((event) => {
      byEventType[event.eventType].count++;
      byEventType[event.eventType].credits += event.creditsUsed;
    });

    // Calculate percentages
    Object.keys(byEventType).forEach((type) => {
      byEventType[type].percentage =
        totalEvents > 0 ? (byEventType[type].count / totalEvents) * 100 : 0;
    });

    // Daily breakdown
    const dailyBreakdown = this.generateDailyBreakdown(events, startDate, endDate);

    // Trends analysis
    const trends = await this.analyzeTrends(tenantId, dailyBreakdown, startDate, endDate);

    return {
      tenantId,
      period: { start: startDate, end: endDate },
      summary: {
        totalEvents,
        totalCredits,
        uniqueDays,
        averagePerDay: Math.round(averagePerDay * 100) / 100,
      },
      byEventType: byEventType as any,
      dailyBreakdown,
      trends,
    };
  }

  /**
   * Generate monthly usage report
   */
  async generateMonthlyReport(tenantId: string, year: number, month: number): Promise<UsageReport> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return this.generateReport(tenantId, startDate, endDate);
  }

  /**
   * Generate cost analysis report
   */
  async generateCostAnalysis(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CostAnalysisReport> {
    const events = await this.usageEventRepository.find({
      where: {
        tenantId,
        timestamp: Between(startDate, endDate),
      },
    });

    const costs = {
      apiCalls: 0,
      crawling: 0,
      ml: 0,
      storage: 0,
      total: 0,
    };

    const costPerEvent: Record<string, number> = {};

    // Calculate costs
    events.forEach((event) => {
      const cost = this.EVENT_COSTS[event.eventType] * event.creditsUsed;
      costPerEvent[event.eventType] = (costPerEvent[event.eventType] || 0) + cost;

      switch (event.eventType) {
        case UsageEventType.API_CALL:
        case UsageEventType.WEBHOOK_DELIVERY:
          costs.apiCalls += cost;
          break;

        case UsageEventType.CRAWL_PAGE:
        case UsageEventType.KEYWORD_SEARCH:
        case UsageEventType.RANK_CHECK:
        case UsageEventType.BACKLINK_CHECK:
        case UsageEventType.AUDIT_RUN:
          costs.crawling += cost;
          break;

        case UsageEventType.ML_PREDICTION:
          costs.ml += cost;
          break;

        case UsageEventType.REPORT_GENERATION:
        case UsageEventType.DATA_EXPORT:
          costs.storage += cost;
          break;
      }
    });

    costs.total = costs.apiCalls + costs.crawling + costs.ml + costs.storage;

    // Project monthly cost based on current usage
    const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const projectedMonthlyCost = (costs.total / daysInPeriod) * 30;

    return {
      tenantId,
      period: { start: startDate, end: endDate },
      costs,
      projectedMonthlyCost: Math.round(projectedMonthlyCost * 100) / 100,
      costPerEvent: costPerEvent as any,
    };
  }

  /**
   * Generate quota status report
   */
  async generateQuotaStatus(tenantId: string): Promise<QuotaStatusReport> {
    const currentUsage = await this.usageTrackingService.getCurrentUsage(tenantId, 'month');
    const quotas = [];

    let warningCount = 0;
    let criticalCount = 0;

    for (const eventType of Object.values(UsageEventType)) {
      const limit = await this.usageTrackingService['getQuota'](tenantId, eventType);

      if (limit === -1) {
        // Unlimited
        quotas.push({
          eventType,
          limit: -1,
          used: currentUsage[eventType] || 0,
          remaining: -1,
          percentage: 0,
          status: 'ok' as const,
        });
        continue;
      }

      const used = currentUsage[eventType] || 0;
      const remaining = Math.max(0, limit - used);
      const percentage = (used / limit) * 100;

      let status: 'ok' | 'warning' | 'critical' | 'exceeded' = 'ok';

      if (percentage >= 100) {
        status = 'exceeded';
        criticalCount++;
      } else if (percentage >= 90) {
        status = 'critical';
        criticalCount++;
      } else if (percentage >= 80) {
        status = 'warning';
        warningCount++;
      }

      quotas.push({
        eventType,
        limit,
        used,
        remaining,
        percentage: Math.round(percentage * 100) / 100,
        status,
      });
    }

    const overallStatus =
      criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'healthy';

    return {
      tenantId,
      plan: 'Unknown', // Would be fetched from subscription
      quotas,
      overallStatus,
    };
  }

  /**
   * Export usage data to CSV
   */
  async exportToCSV(tenantId: string, startDate: Date, endDate: Date): Promise<string> {
    const events = await this.usageEventRepository.find({
      where: {
        tenantId,
        timestamp: Between(startDate, endDate),
      },
      order: { timestamp: 'ASC' },
    });

    const headers = ['Timestamp', 'Event Type', 'Credits Used', 'Metadata'];
    const rows = events.map((event) => [
      event.timestamp.toISOString(),
      event.eventType,
      event.creditsUsed,
      JSON.stringify(event.metadata || {}),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

    return csv;
  }

  /**
   * Get top consumers (for admin)
   */
  async getTopConsumers(
    limit: number = 10,
    eventType?: UsageEventType,
    days: number = 30,
  ): Promise<
    Array<{
      tenantId: string;
      eventCount: number;
      totalCredits: number;
      averagePerDay: number;
    }>
  > {
    const startDate = subDays(new Date(), days);
    const endDate = new Date();

    const query = this.usageEventRepository
      .createQueryBuilder('event')
      .select('event.tenantId', 'tenantId')
      .addSelect('COUNT(*)', 'eventCount')
      .addSelect('SUM(event.creditsUsed)', 'totalCredits')
      .where('event.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('event.tenantId')
      .orderBy('totalCredits', 'DESC')
      .limit(limit);

    if (eventType) {
      query.andWhere('event.eventType = :eventType', { eventType });
    }

    const results = await query.getRawMany();

    return results.map((result) => ({
      tenantId: result.tenantId,
      eventCount: parseInt(result.eventCount, 10),
      totalCredits: parseInt(result.totalCredits, 10),
      averagePerDay: Math.round((parseInt(result.totalCredits, 10) / days) * 100) / 100,
    }));
  }

  /**
   * Generate daily breakdown
   */
  private generateDailyBreakdown(
    events: UsageEvent[],
    startDate: Date,
    endDate: Date,
  ): Array<{ date: string; total: number; byType: Record<UsageEventType, number> }> {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const breakdown = [];

    days.forEach((day) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const dayEvents = events.filter(
        (e) => format(e.timestamp, 'yyyy-MM-dd') === dateKey,
      );

      const byType: Record<string, number> = {};
      Object.values(UsageEventType).forEach((type) => {
        byType[type] = 0;
      });

      dayEvents.forEach((event) => {
        byType[event.eventType] += event.creditsUsed;
      });

      breakdown.push({
        date: dateKey,
        total: dayEvents.reduce((sum, e) => sum + e.creditsUsed, 0),
        byType: byType as any,
      });
    });

    return breakdown;
  }

  /**
   * Analyze usage trends
   */
  private async analyzeTrends(
    tenantId: string,
    dailyBreakdown: Array<{ date: string; total: number }>,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    growth: number;
    peakDay: string;
    peakCount: number;
    averageDaily: number;
  }> {
    // Calculate growth compared to previous period
    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const previousStart = subDays(startDate, periodDays);
    const previousEnd = subDays(endDate, periodDays);

    const previousEvents = await this.usageEventRepository.count({
      where: {
        tenantId,
        timestamp: Between(previousStart, previousEnd),
      },
    });

    const currentEvents = dailyBreakdown.reduce((sum, day) => sum + day.total, 0);
    const growth =
      previousEvents > 0 ? ((currentEvents - previousEvents) / previousEvents) * 100 : 0;

    // Find peak day
    let peakDay = dailyBreakdown[0]?.date || '';
    let peakCount = dailyBreakdown[0]?.total || 0;

    dailyBreakdown.forEach((day) => {
      if (day.total > peakCount) {
        peakDay = day.date;
        peakCount = day.total;
      }
    });

    // Average daily usage
    const averageDaily =
      dailyBreakdown.length > 0
        ? dailyBreakdown.reduce((sum, day) => sum + day.total, 0) / dailyBreakdown.length
        : 0;

    return {
      growth: Math.round(growth * 100) / 100,
      peakDay,
      peakCount,
      averageDaily: Math.round(averageDaily * 100) / 100,
    };
  }
}
