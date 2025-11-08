import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, In } from 'typeorm';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { Tenant } from '../tenant/entities/tenant.entity';
import { User } from '../user/entities/user.entity';
import { Subscription } from '../subscription/entities/subscription.entity';
import { UsageEvent } from '../usage/entities/usage-event.entity';
import { Invoice } from '../billing/entities/invoice.entity';
import { SubscriptionService } from '../subscription/subscription.service';
import { UsageTrackingService } from '../usage/usage-tracking.service';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Tenant Query DTO
 */
export interface TenantQuery {
  page?: number;
  limit?: number;
  search?: string;
  plan?: string;
  status?: string;
  sortBy?: 'createdAt' | 'name' | 'revenue';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Tenant List Response
 */
export interface TenantListResponse {
  tenants: Array<{
    id: string;
    name: string;
    email: string;
    plan: string;
    status: string;
    createdAt: Date;
    userCount: number;
    projectCount: number;
    revenue: number;
  }>;
  total: number;
  page: number;
  limit: number;
}

/**
 * System Health Response
 */
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: Date;
  services: {
    database: ServiceStatus;
    redis: ServiceStatus;
    kafka: ServiceStatus;
    crawler: ServiceStatus;
    ml: ServiceStatus;
  };
  metrics: {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    activeUsers: number;
    requestsPerMinute: number;
    averageResponseTime: number;
  };
}

interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  message?: string;
}

/**
 * Feature Flag
 */
export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  rolloutPercentage: number;
  tenantIds?: string[];
}

/**
 * Revenue Analytics
 */
export interface RevenueAnalytics {
  period: string;
  totalRevenue: number;
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  growth: number; // Percentage growth
  churnRate: number;
  newCustomers: number;
  cancelledCustomers: number;
  byPlan: Record<string, {
    count: number;
    revenue: number;
    percentage: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    newRevenue: number;
    churnedRevenue: number;
  }>;
}

/**
 * Admin Service
 * Provides administrative tools and analytics
 */
@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private readonly FEATURE_FLAGS_KEY = 'feature_flags';

  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(UsageEvent)
    private usageEventRepository: Repository<UsageEvent>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRedis() private readonly redis: Redis,
    private subscriptionService: SubscriptionService,
    private usageTrackingService: UsageTrackingService,
  ) {}

  /**
   * List tenants with pagination and filtering
   */
  async listTenants(query: TenantQuery): Promise<TenantListResponse> {
    const {
      page = 1,
      limit = 20,
      search,
      plan,
      status,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const qb = this.tenantRepository.createQueryBuilder('tenant')
      .leftJoinAndSelect('tenant.subscription', 'subscription');

    // Search filter
    if (search) {
      qb.where('tenant.name LIKE :search OR tenant.email LIKE :search', {
        search: `%${search}%`,
      });
    }

    // Plan filter
    if (plan) {
      qb.andWhere('subscription.plan = :plan', { plan });
    }

    // Status filter
    if (status) {
      qb.andWhere('tenant.status = :status', { status });
    }

    // Sorting
    qb.orderBy(`tenant.${sortBy}`, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [tenants, total] = await qb.getManyAndCount();

    // Enrich with additional data
    const enriched = await Promise.all(
      tenants.map(async (tenant) => {
        const [userCount, projectCount, revenue] = await Promise.all([
          this.userRepository.count({ where: { tenantId: tenant.id } }),
          // Project count would come from projects table
          Promise.resolve(0),
          this.calculateTenantRevenue(tenant.id),
        ]);

        return {
          id: tenant.id,
          name: tenant.name,
          email: tenant.email,
          plan: tenant.subscription?.plan || 'free',
          status: tenant.status,
          createdAt: tenant.createdAt,
          userCount,
          projectCount,
          revenue,
        };
      }),
    );

    return {
      tenants: enriched,
      total,
      page,
      limit,
    };
  }

  /**
   * Get tenant details
   */
  async getTenantDetails(tenantId: string): Promise<any> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
      relations: ['subscription'],
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const [users, usage, invoices] = await Promise.all([
      this.userRepository.find({ where: { tenantId } }),
      this.usageTrackingService.getCurrentUsage(tenantId, 'month'),
      this.invoiceRepository.find({
        where: { tenantId },
        order: { createdAt: 'DESC' },
        take: 10,
      }),
    ]);

    return {
      tenant,
      users,
      usage,
      invoices,
      revenue: await this.calculateTenantRevenue(tenantId),
    };
  }

  /**
   * Disable tenant
   */
  async disableTenant(tenantId: string, reason?: string): Promise<void> {
    this.logger.log(`Disabling tenant ${tenantId}. Reason: ${reason}`);

    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    tenant.status = 'disabled' as any;
    tenant.metadata = {
      ...tenant.metadata,
      disabledAt: new Date().toISOString(),
      disabledReason: reason,
    };

    await this.tenantRepository.save(tenant);

    this.logger.log(`Tenant ${tenantId} disabled successfully`);
  }

  /**
   * Enable tenant
   */
  async enableTenant(tenantId: string): Promise<void> {
    this.logger.log(`Enabling tenant ${tenantId}`);

    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    tenant.status = 'active' as any;

    await this.tenantRepository.save(tenant);

    this.logger.log(`Tenant ${tenantId} enabled successfully`);
  }

  /**
   * Get system health
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const [
      database,
      redis,
      kafka,
      crawler,
      ml,
      tenantMetrics,
      userMetrics,
      performanceMetrics,
    ] = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkRedisHealth(),
      this.checkKafkaHealth(),
      this.checkCrawlerHealth(),
      this.checkMLServiceHealth(),
      this.getTenantMetrics(),
      this.getUserMetrics(),
      this.getPerformanceMetrics(),
    ]);

    const overallStatus =
      database.status === 'down' || redis.status === 'down'
        ? 'down'
        : kafka.status === 'down' || crawler.status === 'degraded'
        ? 'degraded'
        : 'healthy';

    return {
      status: overallStatus,
      timestamp: new Date(),
      services: {
        database,
        redis,
        kafka,
        crawler,
        ml,
      },
      metrics: {
        totalTenants: tenantMetrics.total,
        activeTenants: tenantMetrics.active,
        totalUsers: userMetrics.total,
        activeUsers: userMetrics.active,
        requestsPerMinute: performanceMetrics.requestsPerMinute,
        averageResponseTime: performanceMetrics.averageResponseTime,
      },
    };
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(period: 'month' | 'quarter' | 'year'): Promise<RevenueAnalytics> {
    const now = new Date();
    const startDate = this.getStartDate(period);

    const subscriptions = await this.subscriptionRepository.find({
      where: {
        createdAt: Between(startDate, now),
      },
    });

    const totalRevenue = await this.calculateTotalRevenue(startDate, now);
    const mrr = await this.calculateMRR();
    const arr = mrr * 12;

    const previousPeriod = this.getPreviousPeriod(period);
    const previousRevenue = await this.calculateTotalRevenue(
      previousPeriod.start,
      previousPeriod.end,
    );
    const growth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    const churnRate = await this.calculateChurnRate(period);

    const newCustomers = await this.subscriptionRepository.count({
      where: {
        createdAt: Between(startDate, now),
      },
    });

    const cancelledCustomers = await this.subscriptionRepository.count({
      where: {
        status: 'cancelled',
        cancelledAt: Between(startDate, now),
      },
    });

    const byPlan = await this.getRevenueByPlan();
    const revenueByMonth = await this.getRevenueByMonth(period);

    return {
      period,
      totalRevenue,
      mrr,
      arr,
      growth: Math.round(growth * 100) / 100,
      churnRate,
      newCustomers,
      cancelledCustomers,
      byPlan,
      revenueByMonth,
    };
  }

  /**
   * Manage feature flags
   */
  async getFeatureFlags(): Promise<FeatureFlag[]> {
    const flags = await this.redis.get(this.FEATURE_FLAGS_KEY);
    return flags ? JSON.parse(flags) : this.getDefaultFeatureFlags();
  }

  async updateFeatureFlag(
    flagName: string,
    updates: Partial<FeatureFlag>,
  ): Promise<FeatureFlag[]> {
    const flags = await this.getFeatureFlags();
    const flagIndex = flags.findIndex((f) => f.name === flagName);

    if (flagIndex === -1) {
      throw new NotFoundException('Feature flag not found');
    }

    flags[flagIndex] = { ...flags[flagIndex], ...updates };

    await this.redis.set(this.FEATURE_FLAGS_KEY, JSON.stringify(flags));

    return flags;
  }

  async isFeatureEnabled(flagName: string, tenantId?: string): Promise<boolean> {
    const flags = await this.getFeatureFlags();
    const flag = flags.find((f) => f.name === flagName);

    if (!flag) return false;
    if (!flag.enabled) return false;

    // Check tenant-specific override
    if (tenantId && flag.tenantIds && flag.tenantIds.length > 0) {
      return flag.tenantIds.includes(tenantId);
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const hash = this.hashTenantId(tenantId || '');
      return hash < flag.rolloutPercentage;
    }

    return true;
  }

  /**
   * Get platform statistics
   */
  async getPlatformStats(): Promise<any> {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);

    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalSubscriptions,
      totalRevenue,
      totalEvents,
    ] = await Promise.all([
      this.tenantRepository.count(),
      this.tenantRepository.count({ where: { status: 'active' } }),
      this.userRepository.count(),
      this.subscriptionRepository.count({ where: { status: 'active' } }),
      this.calculateTotalRevenue(thirtyDaysAgo, now),
      this.usageEventRepository.count({
        where: {
          timestamp: Between(thirtyDaysAgo, now),
        },
      }),
    ]);

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      totalSubscriptions,
      totalRevenue,
      totalEvents,
      averageEventsPerTenant: Math.round(totalEvents / (totalTenants || 1)),
    };
  }

  /**
   * Helper: Calculate tenant revenue
   */
  private async calculateTenantRevenue(tenantId: string): Promise<number> {
    const result = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.amountPaid)', 'total')
      .where('invoice.tenantId = :tenantId', { tenantId })
      .andWhere('invoice.status = :status', { status: 'paid' })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }

  /**
   * Helper: Calculate total revenue
   */
  private async calculateTotalRevenue(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.amountPaid)', 'total')
      .where('invoice.paidAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('invoice.status = :status', { status: 'paid' })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }

  /**
   * Helper: Calculate MRR (Monthly Recurring Revenue)
   */
  private async calculateMRR(): Promise<number> {
    const result = await this.subscriptionRepository
      .createQueryBuilder('subscription')
      .select('SUM(subscription.priceAmount)', 'total')
      .where('subscription.status = :status', { status: 'active' })
      .andWhere('subscription.billingInterval = :interval', { interval: 'monthly' })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }

  /**
   * Helper: Calculate churn rate
   */
  private async calculateChurnRate(period: 'month' | 'quarter' | 'year'): Promise<number> {
    const startDate = this.getStartDate(period);
    const now = new Date();

    const startingCustomers = await this.subscriptionRepository.count({
      where: {
        createdAt: Between(new Date(0), startDate),
        status: 'active',
      },
    });

    const churnedCustomers = await this.subscriptionRepository.count({
      where: {
        status: 'cancelled',
        cancelledAt: Between(startDate, now),
      },
    });

    return startingCustomers > 0 ? (churnedCustomers / startingCustomers) * 100 : 0;
  }

  /**
   * Helper: Get revenue by plan
   */
  private async getRevenueByPlan(): Promise<Record<string, any>> {
    const result = await this.subscriptionRepository
      .createQueryBuilder('subscription')
      .select('subscription.plan', 'plan')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(subscription.priceAmount)', 'revenue')
      .where('subscription.status = :status', { status: 'active' })
      .groupBy('subscription.plan')
      .getRawMany();

    const totalRevenue = result.reduce((sum, r) => sum + parseFloat(r.revenue || '0'), 0);

    const byPlan: Record<string, any> = {};

    result.forEach((r) => {
      const revenue = parseFloat(r.revenue || '0');
      byPlan[r.plan] = {
        count: parseInt(r.count, 10),
        revenue,
        percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
      };
    });

    return byPlan;
  }

  /**
   * Helper: Get revenue by month
   */
  private async getRevenueByMonth(period: 'month' | 'quarter' | 'year'): Promise<any[]> {
    const months = period === 'year' ? 12 : period === 'quarter' ? 3 : 1;
    const result = [];

    for (let i = 0; i < months; i++) {
      const monthDate = subMonths(new Date(), i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);

      const revenue = await this.calculateTotalRevenue(start, end);

      result.unshift({
        month: format(monthDate, 'MMM yyyy'),
        revenue: Math.round(revenue * 100) / 100,
        newRevenue: 0, // Would calculate new subscriptions
        churnedRevenue: 0, // Would calculate churned subscriptions
      });
    }

    return result;
  }

  /**
   * Helper: Health check methods
   */
  private async checkDatabaseHealth(): Promise<ServiceStatus> {
    const start = Date.now();
    try {
      await this.tenantRepository.count();
      return {
        status: 'up',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'down',
        message: error.message,
      };
    }
  }

  private async checkRedisHealth(): Promise<ServiceStatus> {
    const start = Date.now();
    try {
      await this.redis.ping();
      return {
        status: 'up',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'down',
        message: error.message,
      };
    }
  }

  private async checkKafkaHealth(): Promise<ServiceStatus> {
    // In production, check Kafka connection
    return { status: 'up', responseTime: 0 };
  }

  private async checkCrawlerHealth(): Promise<ServiceStatus> {
    // In production, ping crawler service
    return { status: 'up', responseTime: 0 };
  }

  private async checkMLServiceHealth(): Promise<ServiceStatus> {
    // In production, ping ML service
    return { status: 'up', responseTime: 0 };
  }

  private async getTenantMetrics(): Promise<{ total: number; active: number }> {
    const [total, active] = await Promise.all([
      this.tenantRepository.count(),
      this.tenantRepository.count({ where: { status: 'active' } }),
    ]);
    return { total, active };
  }

  private async getUserMetrics(): Promise<{ total: number; active: number }> {
    const total = await this.userRepository.count();
    // Active users = logged in within last 30 days
    const active = total; // Simplified
    return { total, active };
  }

  private async getPerformanceMetrics(): Promise<{
    requestsPerMinute: number;
    averageResponseTime: number;
  }> {
    // In production, get from monitoring system
    return {
      requestsPerMinute: 0,
      averageResponseTime: 0,
    };
  }

  private getStartDate(period: 'month' | 'quarter' | 'year'): Date {
    const now = new Date();
    if (period === 'year') return subMonths(now, 12);
    if (period === 'quarter') return subMonths(now, 3);
    return subMonths(now, 1);
  }

  private getPreviousPeriod(period: 'month' | 'quarter' | 'year'): { start: Date; end: Date } {
    const offset = period === 'year' ? 12 : period === 'quarter' ? 3 : 1;
    const end = this.getStartDate(period);
    const start = subMonths(end, offset);
    return { start, end };
  }

  private getDefaultFeatureFlags(): FeatureFlag[] {
    return [
      {
        id: '1',
        name: 'ai_recommendations',
        enabled: true,
        description: 'Enable AI-powered SEO recommendations',
        rolloutPercentage: 100,
      },
      {
        id: '2',
        name: 'advanced_reporting',
        enabled: true,
        description: 'Advanced reporting features',
        rolloutPercentage: 100,
      },
      {
        id: '3',
        name: 'beta_features',
        enabled: false,
        description: 'Beta features testing',
        rolloutPercentage: 10,
      },
    ];
  }

  private hashTenantId(tenantId: string): number {
    let hash = 0;
    for (let i = 0; i < tenantId.length; i++) {
      const char = tenantId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash % 100);
  }
}
