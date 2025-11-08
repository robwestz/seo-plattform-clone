import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Subscription, SubscriptionStatus } from '../subscription/entities/subscription.entity';
import { SubscriptionHistory } from '../subscription/entities/subscription-history.entity';
import { Invoice, InvoiceStatus } from '../billing/entities/invoice.entity';
import { UsageEvent } from '../usage/entities/usage-event.entity';
import { Tenant } from '../../database/entities/tenant.entity';
import { AnalyticsQueryDto, AnalyticsTimeframe } from './dto/analytics-query.dto';
import { RevenueAnalyticsDto } from './dto/revenue-analytics.dto';

/**
 * Analytics Service
 * Provides business analytics and metrics
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionHistory)
    private subscriptionHistoryRepository: Repository<SubscriptionHistory>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(UsageEvent)
    private usageEventRepository: Repository<UsageEvent>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {}

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(query: AnalyticsQueryDto): Promise<RevenueAnalyticsDto> {
    this.logger.log('Calculating revenue analytics');

    const { startDate, endDate } = this.getDateRange(query);

    // Calculate MRR and ARR
    const { mrr, arr, revenueByPlan } = await this.calculateMRR();

    // Get previous period MRR for growth rate
    const previousPeriodEnd = new Date(startDate);
    previousPeriodEnd.setMonth(previousPeriodEnd.getMonth() - 1);
    const previousPeriodStart = new Date(previousPeriodEnd);
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);

    const previousMRR = await this.calculateMRRForPeriod(previousPeriodStart, previousPeriodEnd);
    const mrrGrowthRate = previousMRR > 0 ? ((mrr - previousMRR) / previousMRR) * 100 : 0;

    // Get total revenue in period
    const invoices = await this.invoiceRepository.find({
      where: {
        status: InvoiceStatus.PAID,
        paidAt: Between(startDate, endDate),
      },
    });

    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.amountPaid), 0);

    // Get new and cancelled subscriptions
    const newSubscriptions = await this.subscriptionHistoryRepository.count({
      where: {
        eventType: 'created' as any,
        createdAt: Between(startDate, endDate),
      },
    });

    const cancelledSubscriptions = await this.subscriptionHistoryRepository.count({
      where: {
        eventType: 'cancelled' as any,
        createdAt: Between(startDate, endDate),
      },
    });

    // Calculate churn rate
    const activeSubscriptionsStart = await this.subscriptionRepository.count({
      where: { status: SubscriptionStatus.ACTIVE },
    });
    const churnRate =
      activeSubscriptionsStart > 0 ? (cancelledSubscriptions / activeSubscriptionsStart) * 100 : 0;

    // Calculate ARPU (Average Revenue Per User)
    const activeSubscriptions = await this.subscriptionRepository.find({
      where: { status: SubscriptionStatus.ACTIVE },
    });
    const arpu = activeSubscriptions.length > 0 ? mrr / activeSubscriptions.length : 0;

    // Calculate LTV (simplified: ARPU / churn rate)
    const ltv = churnRate > 0 ? arpu / (churnRate / 100) : arpu * 12;

    // Get time series data
    const timeSeries = await this.getRevenueTimeSeries(startDate, endDate, query.timeframe);

    return {
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(arr * 100) / 100,
      mrrGrowthRate: Math.round(mrrGrowthRate * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      newSubscriptions,
      cancelledSubscriptions,
      churnRate: Math.round(churnRate * 100) / 100,
      arpu: Math.round(arpu * 100) / 100,
      ltv: Math.round(ltv * 100) / 100,
      revenueByPlan,
      timeSeries,
    };
  }

  /**
   * Get usage analytics for tenant
   */
  async getUsageAnalytics(tenantId: string, query: AnalyticsQueryDto) {
    this.logger.log(`Calculating usage analytics for tenant ${tenantId}`);

    const { startDate, endDate } = this.getDateRange(query);

    const events = await this.usageEventRepository.find({
      where: {
        tenantId,
        createdAt: Between(startDate, endDate),
      },
    });

    // Group by event type
    const eventsByType = events.reduce((acc, event) => {
      if (!acc[event.eventType]) {
        acc[event.eventType] = { count: 0, quantity: 0 };
      }
      acc[event.eventType].count++;
      acc[event.eventType].quantity += event.quantity;
      return acc;
    }, {} as Record<string, { count: number; quantity: number }>);

    // Get daily breakdown
    const dailyUsage = events.reduce((acc, event) => {
      const date = event.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date]++;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEvents: events.length,
      eventsByType,
      dailyUsage,
      period: { startDate, endDate },
    };
  }

  /**
   * Get growth metrics
   */
  async getGrowthMetrics(query: AnalyticsQueryDto) {
    this.logger.log('Calculating growth metrics');

    const { startDate, endDate } = this.getDateRange(query);

    // Get tenant growth
    const newTenants = await this.tenantRepository.count({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    const totalTenants = await this.tenantRepository.count({
      where: { active: true },
    });

    // Get subscription growth
    const newSubscriptions = await this.subscriptionHistoryRepository.count({
      where: {
        eventType: 'created' as any,
        createdAt: Between(startDate, endDate),
      },
    });

    // Get revenue growth
    const currentRevenue = await this.getTotalRevenue(startDate, endDate);
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
    const previousRevenue = await this.getTotalRevenue(previousPeriodStart, startDate);

    const revenueGrowthRate =
      previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    return {
      newTenants,
      totalTenants,
      tenantGrowthRate: totalTenants > 0 ? (newTenants / totalTenants) * 100 : 0,
      newSubscriptions,
      currentRevenue: Math.round(currentRevenue * 100) / 100,
      previousRevenue: Math.round(previousRevenue * 100) / 100,
      revenueGrowthRate: Math.round(revenueGrowthRate * 100) / 100,
    };
  }

  /**
   * Calculate churn risk for a tenant
   */
  async calculateChurnRisk(tenantId: string): Promise<{
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    factors: string[];
  }> {
    this.logger.log(`Calculating churn risk for tenant ${tenantId}`);

    let riskScore = 0;
    const factors: string[] = [];

    // Check subscription status
    const subscription = await this.subscriptionRepository.findOne({
      where: { tenantId, status: SubscriptionStatus.ACTIVE },
    });

    if (!subscription) {
      return { riskScore: 100, riskLevel: 'high', factors: ['No active subscription'] };
    }

    // Factor 1: Payment failures
    const recentInvoices = await this.invoiceRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 3,
    });

    const failedInvoices = recentInvoices.filter(
      (inv) => inv.status === InvoiceStatus.UNCOLLECTIBLE || inv.status === InvoiceStatus.VOID,
    );

    if (failedInvoices.length > 0) {
      riskScore += 30;
      factors.push('Recent payment failures');
    }

    // Factor 2: Usage decline
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const last60Days = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const recentUsage = await this.usageEventRepository.count({
      where: { tenantId, createdAt: Between(last30Days, new Date()) },
    });

    const previousUsage = await this.usageEventRepository.count({
      where: { tenantId, createdAt: Between(last60Days, last30Days) },
    });

    if (previousUsage > 0 && recentUsage < previousUsage * 0.5) {
      riskScore += 25;
      factors.push('Significant usage decline');
    }

    // Factor 3: Cancelled at period end
    if (subscription.cancelAtPeriodEnd) {
      riskScore += 40;
      factors.push('Subscription set to cancel');
    }

    // Factor 4: Downgrade history
    const downgrades = await this.subscriptionHistoryRepository.count({
      where: { tenantId, eventType: 'downgraded' as any },
    });

    if (downgrades > 0) {
      riskScore += 15;
      factors.push('Recent plan downgrades');
    }

    // Factor 5: Low engagement
    if (recentUsage < 10) {
      riskScore += 20;
      factors.push('Low platform engagement');
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high';
    if (riskScore >= 60) {
      riskLevel = 'high';
    } else if (riskScore >= 30) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    return {
      riskScore: Math.min(riskScore, 100),
      riskLevel,
      factors,
    };
  }

  /**
   * Get subscription analytics
   */
  async getSubscriptionAnalytics(query: AnalyticsQueryDto) {
    const subscriptions = await this.subscriptionRepository.find();

    // Group by plan
    const byPlan = subscriptions.reduce((acc, sub) => {
      if (!acc[sub.plan]) {
        acc[sub.plan] = 0;
      }
      acc[sub.plan]++;
      return acc;
    }, {} as Record<string, number>);

    // Group by status
    const byStatus = subscriptions.reduce((acc, sub) => {
      if (!acc[sub.status]) {
        acc[sub.status] = 0;
      }
      acc[sub.status]++;
      return acc;
    }, {} as Record<string, number>);

    // Group by billing interval
    const byInterval = subscriptions.reduce((acc, sub) => {
      if (!acc[sub.billingInterval]) {
        acc[sub.billingInterval] = 0;
      }
      acc[sub.billingInterval]++;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: subscriptions.length,
      byPlan,
      byStatus,
      byInterval,
    };
  }

  /**
   * Calculate MRR (Monthly Recurring Revenue)
   */
  private async calculateMRR(): Promise<{
    mrr: number;
    arr: number;
    revenueByPlan: Record<string, number>;
  }> {
    const subscriptions = await this.subscriptionRepository.find({
      where: { status: SubscriptionStatus.ACTIVE },
    });

    let mrr = 0;
    const revenueByPlan: Record<string, number> = {};

    subscriptions.forEach((sub) => {
      const monthlyAmount =
        sub.billingInterval === 'monthly' ? Number(sub.priceAmount) : Number(sub.priceAmount) / 12;

      mrr += monthlyAmount;

      if (!revenueByPlan[sub.plan]) {
        revenueByPlan[sub.plan] = 0;
      }
      revenueByPlan[sub.plan] += monthlyAmount;
    });

    return {
      mrr,
      arr: mrr * 12,
      revenueByPlan,
    };
  }

  /**
   * Calculate MRR for a specific period
   */
  private async calculateMRRForPeriod(startDate: Date, endDate: Date): Promise<number> {
    const subscriptions = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: Between(startDate, endDate),
      },
    });

    return subscriptions.reduce((sum, sub) => {
      const monthlyAmount =
        sub.billingInterval === 'monthly' ? Number(sub.priceAmount) : Number(sub.priceAmount) / 12;
      return sum + monthlyAmount;
    }, 0);
  }

  /**
   * Get total revenue for period
   */
  private async getTotalRevenue(startDate: Date, endDate: Date): Promise<number> {
    const invoices = await this.invoiceRepository.find({
      where: {
        status: InvoiceStatus.PAID,
        paidAt: Between(startDate, endDate),
      },
    });

    return invoices.reduce((sum, inv) => sum + Number(inv.amountPaid), 0);
  }

  /**
   * Get revenue time series
   */
  private async getRevenueTimeSeries(
    startDate: Date,
    endDate: Date,
    timeframe: AnalyticsTimeframe = AnalyticsTimeframe.DAY,
  ): Promise<Array<{ date: string; revenue: number; subscriptions: number }>> {
    const invoices = await this.invoiceRepository.find({
      where: {
        status: InvoiceStatus.PAID,
        paidAt: Between(startDate, endDate),
      },
      order: { paidAt: 'ASC' },
    });

    // Group by date
    const grouped = invoices.reduce((acc, invoice) => {
      const date = invoice.paidAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { revenue: 0, count: 0 };
      }
      acc[date].revenue += Number(invoice.amountPaid);
      acc[date].count++;
      return acc;
    }, {} as Record<string, { revenue: number; count: number }>);

    return Object.entries(grouped).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue * 100) / 100,
      subscriptions: data.count,
    }));
  }

  /**
   * Get date range from query
   */
  private getDateRange(query: AnalyticsQueryDto): { startDate: Date; endDate: Date } {
    let startDate = query.startDate ? new Date(query.startDate) : new Date();
    let endDate = query.endDate ? new Date(query.endDate) : new Date();

    if (!query.startDate && query.timeframe) {
      switch (query.timeframe) {
        case AnalyticsTimeframe.DAY:
          startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case AnalyticsTimeframe.WEEK:
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case AnalyticsTimeframe.MONTH:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case AnalyticsTimeframe.QUARTER:
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        case AnalyticsTimeframe.YEAR:
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    return { startDate, endDate };
  }
}
