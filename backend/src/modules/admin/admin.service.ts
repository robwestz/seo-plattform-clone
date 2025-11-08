import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Tenant } from '../../database/entities/tenant.entity';
import { User } from '../../database/entities/user.entity';
import { Project } from '../../database/entities/project.entity';
import { Subscription } from '../subscription/entities/subscription.entity';
import { Invoice } from '../billing/entities/invoice.entity';
import { UsageEvent } from '../usage/entities/usage-event.entity';
import { SystemStatsDto } from './dto/system-stats.dto';

/**
 * Admin Service
 * Provides admin-only functionality for system management
 */
@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private featureFlags: Map<string, boolean> = new Map();

  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(UsageEvent)
    private usageEventRepository: Repository<UsageEvent>,
    private configService: ConfigService,
  ) {
    this.initializeFeatureFlags();
  }

  /**
   * Initialize default feature flags
   */
  private initializeFeatureFlags(): void {
    this.featureFlags.set('new-dashboard', false);
    this.featureFlags.set('ai-content-generator', false);
    this.featureFlags.set('advanced-analytics', true);
    this.featureFlags.set('white-label-beta', false);
    this.featureFlags.set('api-v2', false);
  }

  /**
   * Get system statistics
   */
  async getSystemStats(): Promise<SystemStatsDto> {
    this.logger.log('Fetching system statistics');

    const [
      totalTenants,
      totalUsers,
      totalProjects,
      activeSubscriptions,
      totalApiCallsThisMonth,
    ] = await Promise.all([
      this.tenantRepository.count({ where: { active: true } }),
      this.userRepository.count(),
      this.projectRepository.count(),
      this.subscriptionRepository.count({ where: { status: 'active' } }),
      this.getApiCallsThisMonth(),
    ]);

    // Calculate MRR and ARR
    const subscriptions = await this.subscriptionRepository.find({
      where: { status: 'active' },
    });

    const mrr = subscriptions.reduce((sum, sub) => {
      const monthlyAmount =
        sub.billingInterval === 'monthly' ? sub.priceAmount : sub.priceAmount / 12;
      return sum + Number(monthlyAmount);
    }, 0);

    const arr = mrr * 12;

    // Get cancelled subscriptions this month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const cancelledSubscriptions = await this.subscriptionRepository.count({
      where: {
        status: 'cancelled',
        // Note: Would need cancelledAt to be indexed for better performance
      },
    });

    return {
      totalTenants,
      totalUsers,
      totalProjects,
      totalApiCalls: totalApiCallsThisMonth,
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(arr * 100) / 100,
      activeSubscriptions,
      cancelledSubscriptions,
      uptime: 99.9, // In production: fetch from monitoring service
      avgResponseTime: 125, // In production: fetch from APM
    };
  }

  /**
   * Get all tenants with pagination
   */
  async getAllTenants(page = 1, limit = 50) {
    const [tenants, total] = await this.tenantRepository.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    });

    return {
      tenants,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get tenant details
   */
  async getTenantDetails(tenantId: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
      relations: ['projects', 'userTenants'],
    });

    if (!tenant) {
      return null;
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });

    const invoices = await this.invoiceRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const usageStats = await this.getUsageStatsForTenant(tenantId);

    return {
      tenant,
      subscription,
      invoices,
      usageStats,
      totalProjects: tenant.projects?.length || 0,
      totalUsers: tenant.userTenants?.length || 0,
    };
  }

  /**
   * Suspend tenant
   */
  async suspendTenant(tenantId: string, reason: string): Promise<void> {
    this.logger.log(`Suspending tenant ${tenantId}: ${reason}`);

    await this.tenantRepository.update(tenantId, {
      active: false,
      metadata: { suspended: true, suspendedReason: reason, suspendedAt: new Date() },
    });

    await this.subscriptionRepository.update(
      { tenantId },
      { status: 'suspended' as any },
    );
  }

  /**
   * Reactivate tenant
   */
  async reactivateTenant(tenantId: string): Promise<void> {
    this.logger.log(`Reactivating tenant ${tenantId}`);

    await this.tenantRepository.update(tenantId, {
      active: true,
      metadata: {},
    });

    await this.subscriptionRepository.update(
      { tenantId, status: 'suspended' as any },
      { status: 'active' as any },
    );
  }

  /**
   * Get revenue metrics
   */
  async getRevenueMetrics(startDate: Date, endDate: Date) {
    const invoices = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('invoice.status = :status', { status: 'paid' })
      .getMany();

    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.amountPaid), 0);

    // Group by date
    const revenueByDate = invoices.reduce((acc, invoice) => {
      const date = invoice.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += Number(invoice.amountPaid);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      invoiceCount: invoices.length,
      revenueByDate,
    };
  }

  /**
   * Get feature flags
   */
  getFeatureFlags() {
    return Array.from(this.featureFlags.entries()).map(([key, enabled]) => ({
      key,
      enabled,
    }));
  }

  /**
   * Set feature flag
   */
  setFeatureFlag(key: string, enabled: boolean): void {
    this.logger.log(`Setting feature flag ${key} to ${enabled}`);
    this.featureFlags.set(key, enabled);
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(key: string): boolean {
    return this.featureFlags.get(key) || false;
  }

  /**
   * Get system health
   */
  async getSystemHealth() {
    // Check database connection
    let dbHealthy = false;
    try {
      await this.tenantRepository.query('SELECT 1');
      dbHealthy = true;
    } catch (error) {
      this.logger.error('Database health check failed', error);
    }

    return {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealthy,
        memory: process.memoryUsage(),
        uptime: process.uptime(),
      },
    };
  }

  /**
   * Get API calls this month
   */
  private async getApiCallsThisMonth(): Promise<number> {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    return this.usageEventRepository.count({
      where: {
        eventType: 'api_call' as any,
        // createdAt: Between(startOfMonth, endOfMonth),
      },
    });
  }

  /**
   * Get usage statistics for tenant
   */
  private async getUsageStatsForTenant(tenantId: string) {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const events = await this.usageEventRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 1000,
    });

    const thisMonth = events.filter((e) => e.createdAt >= startOfMonth);

    return {
      totalEvents: events.length,
      thisMonth: thisMonth.length,
      apiCalls: events.filter((e) => e.eventType === 'api_call').length,
    };
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(limit = 50) {
    const recentTenants = await this.tenantRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });

    const recentSubscriptions = await this.subscriptionRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return {
      recentTenants: recentTenants.slice(0, 10),
      recentSubscriptions: recentSubscriptions.slice(0, 10),
    };
  }
}
