import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Tenant } from '../tenant/entities/tenant.entity';
import { User } from '../user/entities/user.entity';
import { Subscription } from '../subscription/entities/subscription.entity';
import { UsageEvent } from '../usage/entities/usage-event.entity';
import { Invoice } from '../billing/entities/invoice.entity';
import { UsageTrackingService } from '../usage/usage-tracking.service';
import { subDays, subMonths, differenceInDays, format } from 'date-fns';

/**
 * Tenant Analytics DTO
 */
export interface TenantAnalytics {
  tenantId: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    activeUsers: number;
    apiCalls: number;
    pagesCrawled: number;
    revenue: number;
    mrr: number;
    churnRisk: number;
  };
  growth: {
    userGrowth: number;
    revenueGrowth: number;
    usageGrowth: number;
  };
  engagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    averageSessionDuration: number;
    featureAdoption: Record<string, number>;
  };
  health: {
    score: number; // 0-100
    status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    issues: string[];
    recommendations: string[];
  };
}

/**
 * Churn Risk Analysis
 */
export interface ChurnRiskAnalysis {
  tenantId: string;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    usageDecline: number;
    engagementDrop: number;
    paymentIssues: number;
    supportTickets: number;
    lastLoginDays: number;
    featureUsageDecline: number;
  };
  predictions: {
    churnProbability: number;
    daysUntilChurn: number;
    retentionProbability: number;
  };
  recommendations: string[];
}

/**
 * Cohort Analysis
 */
export interface CohortAnalysis {
  cohortMonth: string;
  totalCustomers: number;
  retentionByMonth: Array<{
    month: number;
    retained: number;
    retentionRate: number;
  }>;
}

/**
 * Product Usage Analytics
 */
export interface ProductUsageAnalytics {
  features: Array<{
    name: string;
    users: number;
    usage: number;
    adoptionRate: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  popularPages: Array<{
    path: string;
    views: number;
    uniqueVisitors: number;
  }>;
  apiEndpoints: Array<{
    endpoint: string;
    calls: number;
    averageResponseTime: number;
    errorRate: number;
  }>;
}

/**
 * Analytics Service
 * Provides business intelligence and predictive analytics
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

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
    private usageTrackingService: UsageTrackingService,
  ) {}

  /**
   * Get comprehensive tenant analytics
   */
  async getTenantAnalytics(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TenantAnalytics> {
    this.logger.log(`Generating analytics for tenant ${tenantId}`);

    const [metrics, growth, engagement, health] = await Promise.all([
      this.calculateMetrics(tenantId, startDate, endDate),
      this.calculateGrowth(tenantId, startDate, endDate),
      this.calculateEngagement(tenantId, startDate, endDate),
      this.calculateHealth(tenantId),
    ]);

    return {
      tenantId,
      period: { start: startDate, end: endDate },
      metrics,
      growth,
      engagement,
      health,
    };
  }

  /**
   * Calculate churn risk for tenant
   */
  async calculateChurnRisk(tenantId: string): Promise<ChurnRiskAnalysis> {
    this.logger.log(`Calculating churn risk for tenant ${tenantId}`);

    // Gather risk factors
    const [
      usageDecline,
      engagementDrop,
      paymentIssues,
      supportTickets,
      lastLoginDays,
      featureUsageDecline,
    ] = await Promise.all([
      this.calculateUsageDecline(tenantId),
      this.calculateEngagementDrop(tenantId),
      this.getPaymentIssues(tenantId),
      this.getSupportTicketCount(tenantId),
      this.getLastLoginDays(tenantId),
      this.calculateFeatureUsageDecline(tenantId),
    ]);

    const factors = {
      usageDecline,
      engagementDrop,
      paymentIssues,
      supportTickets,
      lastLoginDays,
      featureUsageDecline,
    };

    // Calculate risk score (weighted)
    const weights = {
      usageDecline: 0.25,
      engagementDrop: 0.20,
      paymentIssues: 0.20,
      supportTickets: 0.10,
      lastLoginDays: 0.15,
      featureUsageDecline: 0.10,
    };

    let riskScore = 0;
    riskScore += this.normalizeToRisk(usageDecline, 50) * weights.usageDecline;
    riskScore += this.normalizeToRisk(engagementDrop, 50) * weights.engagementDrop;
    riskScore += this.normalizeToRisk(paymentIssues, 3) * weights.paymentIssues;
    riskScore += this.normalizeToRisk(supportTickets, 10) * weights.supportTickets;
    riskScore += this.normalizeToRisk(lastLoginDays, 30) * weights.lastLoginDays;
    riskScore += this.normalizeToRisk(featureUsageDecline, 40) * weights.featureUsageDecline;

    riskScore = Math.round(riskScore * 100);

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 75) riskLevel = 'critical';
    else if (riskScore >= 50) riskLevel = 'high';
    else if (riskScore >= 25) riskLevel = 'medium';
    else riskLevel = 'low';

    // Predictions using simple model (in production, use ML model)
    const churnProbability = Math.min(riskScore / 100, 0.95);
    const daysUntilChurn = Math.max(7, Math.round(90 * (1 - churnProbability)));
    const retentionProbability = 1 - churnProbability;

    const predictions = {
      churnProbability: Math.round(churnProbability * 100) / 100,
      daysUntilChurn,
      retentionProbability: Math.round(retentionProbability * 100) / 100,
    };

    // Generate recommendations
    const recommendations = this.generateChurnRecommendations(factors, riskLevel);

    return {
      tenantId,
      riskScore,
      riskLevel,
      factors,
      predictions,
      recommendations,
    };
  }

  /**
   * Perform cohort analysis
   */
  async performCohortAnalysis(cohortMonth: string): Promise<CohortAnalysis> {
    const cohortDate = new Date(cohortMonth);
    const cohortStart = new Date(cohortDate.getFullYear(), cohortDate.getMonth(), 1);
    const cohortEnd = new Date(cohortDate.getFullYear(), cohortDate.getMonth() + 1, 0);

    // Get tenants who signed up in this cohort
    const cohortTenants = await this.subscriptionRepository.find({
      where: {
        createdAt: Between(cohortStart, cohortEnd),
      },
    });

    const totalCustomers = cohortTenants.length;
    const retentionByMonth: Array<any> = [];

    // Calculate retention for each month after cohort
    const monthsToAnalyze = 12; // Analyze 12 months

    for (let month = 0; month < monthsToAnalyze; month++) {
      const checkDate = new Date(cohortDate.getFullYear(), cohortDate.getMonth() + month + 1, 1);

      // Count how many are still active
      const retained = await this.subscriptionRepository.count({
        where: {
          tenantId: In(cohortTenants.map((t) => t.tenantId)),
          status: 'active',
          currentPeriodEnd: Between(checkDate, new Date()),
        },
      });

      retentionByMonth.push({
        month: month + 1,
        retained,
        retentionRate: totalCustomers > 0 ? (retained / totalCustomers) * 100 : 0,
      });
    }

    return {
      cohortMonth,
      totalCustomers,
      retentionByMonth,
    };
  }

  /**
   * Get product usage analytics
   */
  async getProductUsageAnalytics(days: number = 30): Promise<ProductUsageAnalytics> {
    const startDate = subDays(new Date(), days);
    const endDate = new Date();

    // Feature usage (from usage events)
    const featureEvents = await this.usageEventRepository
      .createQueryBuilder('event')
      .select('event.eventType', 'feature')
      .addSelect('COUNT(DISTINCT event.tenantId)', 'users')
      .addSelect('COUNT(*)', 'usage')
      .where('event.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('event.eventType')
      .getRawMany();

    const totalTenants = await this.tenantRepository.count();

    const features = featureEvents.map((f) => ({
      name: f.feature,
      users: parseInt(f.users, 10),
      usage: parseInt(f.usage, 10),
      adoptionRate: totalTenants > 0 ? (parseInt(f.users, 10) / totalTenants) * 100 : 0,
      trend: 'stable' as const, // Would compare with previous period
    }));

    return {
      features,
      popularPages: [], // Would track from analytics
      apiEndpoints: [], // Would track from API logs
    };
  }

  /**
   * Calculate LTV (Lifetime Value) for tenant
   */
  async calculateLTV(tenantId: string): Promise<number> {
    const totalRevenue = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.amountPaid)', 'total')
      .where('invoice.tenantId = :tenantId', { tenantId })
      .andWhere('invoice.status = :status', { status: 'paid' })
      .getRawOne();

    return parseFloat(totalRevenue?.total || '0');
  }

  /**
   * Calculate CAC (Customer Acquisition Cost) - simplified
   */
  async calculateCAC(month: string): Promise<number> {
    // In production, would calculate actual marketing/sales costs
    // For now, use industry average estimate
    return 100; // $100 placeholder
  }

  /**
   * Private helper methods
   */

  private async calculateMetrics(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    const [activeUsers, usage, revenue, subscription] = await Promise.all([
      this.userRepository.count({ where: { tenantId } }),
      this.usageTrackingService.getCurrentUsage(tenantId, 'month'),
      this.invoiceRepository
        .createQueryBuilder('invoice')
        .select('SUM(invoice.amountPaid)', 'total')
        .where('invoice.tenantId = :tenantId', { tenantId })
        .andWhere('invoice.paidAt BETWEEN :startDate AND :endDate', { startDate, endDate })
        .getRawOne(),
      this.subscriptionRepository.findOne({ where: { tenantId } }),
    ]);

    return {
      activeUsers,
      apiCalls: usage.api_call || 0,
      pagesCrawled: usage.crawl_page || 0,
      revenue: parseFloat(revenue?.total || '0'),
      mrr: subscription?.priceAmount || 0,
      churnRisk: 0, // Calculated separately
    };
  }

  private async calculateGrowth(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    const periodDays = differenceInDays(endDate, startDate);
    const previousStart = subDays(startDate, periodDays);
    const previousEnd = startDate;

    // Simplified growth calculation
    return {
      userGrowth: 5.0, // Placeholder
      revenueGrowth: 10.0, // Placeholder
      usageGrowth: 8.0, // Placeholder
    };
  }

  private async calculateEngagement(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    // Simplified engagement metrics
    return {
      dailyActiveUsers: 5,
      weeklyActiveUsers: 15,
      monthlyActiveUsers: 25,
      averageSessionDuration: 1200, // seconds
      featureAdoption: {
        keyword_research: 80,
        rank_tracking: 60,
        backlink_analysis: 40,
      },
    };
  }

  private async calculateHealth(tenantId: string): Promise<any> {
    const churnRisk = await this.calculateChurnRisk(tenantId);

    const score = 100 - churnRisk.riskScore;

    let status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    if (score >= 80) status = 'excellent';
    else if (score >= 60) status = 'good';
    else if (score >= 40) status = 'fair';
    else if (score >= 20) status = 'poor';
    else status = 'critical';

    return {
      score,
      status,
      issues: churnRisk.recommendations,
      recommendations: churnRisk.recommendations,
    };
  }

  private async calculateUsageDecline(tenantId: string): Promise<number> {
    const now = new Date();
    const thisMonth = await this.usageEventRepository.count({
      where: {
        tenantId,
        timestamp: Between(subDays(now, 30), now),
      },
    });

    const lastMonth = await this.usageEventRepository.count({
      where: {
        tenantId,
        timestamp: Between(subDays(now, 60), subDays(now, 30)),
      },
    });

    if (lastMonth === 0) return 0;

    const decline = ((lastMonth - thisMonth) / lastMonth) * 100;
    return Math.max(0, decline);
  }

  private async calculateEngagementDrop(tenantId: string): Promise<number> {
    // Simplified - would track actual user activity
    return 0;
  }

  private async getPaymentIssues(tenantId: string): Promise<number> {
    return this.invoiceRepository.count({
      where: {
        tenantId,
        status: 'failed',
      },
    });
  }

  private async getSupportTicketCount(tenantId: string): Promise<number> {
    // Would integrate with support system
    return 0;
  }

  private async getLastLoginDays(tenantId: string): Promise<number> {
    // Would track from user activity
    return 5; // Placeholder
  }

  private async calculateFeatureUsageDecline(tenantId: string): Promise<number> {
    // Would compare feature usage over time
    return 0;
  }

  private normalizeToRisk(value: number, threshold: number): number {
    return Math.min(value / threshold, 1);
  }

  private generateChurnRecommendations(
    factors: any,
    riskLevel: string,
  ): string[] {
    const recommendations: string[] = [];

    if (factors.usageDecline > 30) {
      recommendations.push('Usage has declined significantly. Consider reaching out to understand barriers.');
    }

    if (factors.engagementDrop > 30) {
      recommendations.push('User engagement is dropping. Offer training or onboarding support.');
    }

    if (factors.paymentIssues > 0) {
      recommendations.push('Payment issues detected. Follow up on billing concerns immediately.');
    }

    if (factors.supportTickets > 5) {
      recommendations.push('High support ticket volume. Address recurring issues and improve product stability.');
    }

    if (factors.lastLoginDays > 14) {
      recommendations.push('User hasn\'t logged in recently. Send re-engagement campaign.');
    }

    if (factors.featureUsageDecline > 25) {
      recommendations.push('Feature adoption is declining. Highlight value and provide use case examples.');
    }

    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('HIGH PRIORITY: Consider offering incentive or discount to retain customer.');
      recommendations.push('Schedule executive call to understand concerns and needs.');
    }

    return recommendations;
  }
}
