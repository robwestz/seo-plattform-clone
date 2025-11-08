import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
  BillingInterval,
} from './entities/subscription.entity';
import {
  SubscriptionHistory,
  SubscriptionEventType,
} from './entities/subscription-history.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionLimitsDto } from './dto/subscription-limits.dto';

/**
 * Plan definitions with pricing and limits
 */
export const PLAN_DEFINITIONS = {
  [SubscriptionPlan.FREE]: {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: {
      maxUsers: 1,
      maxProjects: 1,
      maxKeywords: 50,
      maxPages: 50,
      maxBacklinks: 500,
      maxCompetitors: 3,
      maxApiCallsPerMonth: 1000,
      hasWhiteLabel: false,
      hasApiAccess: false,
      hasPrioritySupport: false,
      hasCustomReports: false,
    },
  },
  [SubscriptionPlan.PRO]: {
    name: 'Pro',
    monthlyPrice: 99,
    yearlyPrice: 990,
    limits: {
      maxUsers: 5,
      maxProjects: 10,
      maxKeywords: 500,
      maxPages: 500,
      maxBacklinks: 5000,
      maxCompetitors: 10,
      maxApiCallsPerMonth: 50000,
      hasWhiteLabel: false,
      hasApiAccess: true,
      hasPrioritySupport: false,
      hasCustomReports: true,
    },
  },
  [SubscriptionPlan.BUSINESS]: {
    name: 'Business',
    monthlyPrice: 299,
    yearlyPrice: 2990,
    limits: {
      maxUsers: 25,
      maxProjects: 50,
      maxKeywords: 2000,
      maxPages: 2000,
      maxBacklinks: 20000,
      maxCompetitors: 25,
      maxApiCallsPerMonth: 200000,
      hasWhiteLabel: false,
      hasApiAccess: true,
      hasPrioritySupport: true,
      hasCustomReports: true,
    },
  },
  [SubscriptionPlan.ENTERPRISE]: {
    name: 'Enterprise',
    monthlyPrice: 999,
    yearlyPrice: 9990,
    limits: {
      maxUsers: 100,
      maxProjects: 200,
      maxKeywords: 10000,
      maxPages: 10000,
      maxBacklinks: 100000,
      maxCompetitors: 100,
      maxApiCallsPerMonth: 1000000,
      hasWhiteLabel: true,
      hasApiAccess: true,
      hasPrioritySupport: true,
      hasCustomReports: true,
    },
  },
  [SubscriptionPlan.WHITE_LABEL]: {
    name: 'White Label',
    monthlyPrice: 1999,
    yearlyPrice: 19990,
    limits: {
      maxUsers: -1, // Unlimited
      maxProjects: -1,
      maxKeywords: -1,
      maxPages: -1,
      maxBacklinks: -1,
      maxCompetitors: -1,
      maxApiCallsPerMonth: -1,
      hasWhiteLabel: true,
      hasApiAccess: true,
      hasPrioritySupport: true,
      hasCustomReports: true,
    },
  },
};

/**
 * Subscription Service
 * Manages subscription plans, limits, and lifecycle
 */
@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionHistory)
    private historyRepository: Repository<SubscriptionHistory>,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a new subscription for a tenant
   */
  async create(
    tenantId: string,
    createDto: CreateSubscriptionDto,
    userId?: string,
  ): Promise<Subscription> {
    this.logger.log(`Creating subscription for tenant ${tenantId}`);

    // Check if tenant already has an active subscription
    const existing = await this.subscriptionRepository.findOne({
      where: { tenantId, status: SubscriptionStatus.ACTIVE },
    });

    if (existing) {
      throw new BadRequestException('Tenant already has an active subscription');
    }

    const planDef = PLAN_DEFINITIONS[createDto.plan];
    const price =
      createDto.billingInterval === BillingInterval.MONTHLY
        ? planDef.monthlyPrice
        : planDef.yearlyPrice;

    const subscription = this.subscriptionRepository.create({
      tenantId,
      plan: createDto.plan,
      billingInterval: createDto.billingInterval,
      status: SubscriptionStatus.ACTIVE,
      priceAmount: price,
      currency: 'USD',
      stripeCustomerId: createDto.stripeCustomerId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: this.calculatePeriodEnd(createDto.billingInterval),
      ...planDef.limits,
    });

    const saved = await this.subscriptionRepository.save(subscription);

    // Record history
    await this.recordHistory(
      saved,
      SubscriptionEventType.CREATED,
      null,
      createDto.plan,
      userId,
    );

    // Emit event
    this.eventEmitter.emit('subscription.created', { subscription: saved, tenantId });

    return saved;
  }

  /**
   * Get current subscription for a tenant
   */
  async getCurrentSubscription(tenantId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { tenantId, status: SubscriptionStatus.ACTIVE },
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    return subscription;
  }

  /**
   * Update subscription plan (upgrade/downgrade)
   */
  async updatePlan(
    tenantId: string,
    updateDto: UpdateSubscriptionDto,
    userId?: string,
  ): Promise<Subscription> {
    this.logger.log(`Updating subscription for tenant ${tenantId}`);

    const subscription = await this.getCurrentSubscription(tenantId);
    const oldPlan = subscription.plan;

    if (updateDto.plan) {
      const planDef = PLAN_DEFINITIONS[updateDto.plan];
      const price =
        (updateDto.billingInterval || subscription.billingInterval) === BillingInterval.MONTHLY
          ? planDef.monthlyPrice
          : planDef.yearlyPrice;

      subscription.plan = updateDto.plan;
      subscription.priceAmount = price;
      Object.assign(subscription, planDef.limits);

      // Determine if upgrade or downgrade
      const eventType = this.isUpgrade(oldPlan, updateDto.plan)
        ? SubscriptionEventType.UPGRADED
        : SubscriptionEventType.DOWNGRADED;

      await this.recordHistory(subscription, eventType, oldPlan, updateDto.plan, userId);
    }

    if (updateDto.billingInterval) {
      subscription.billingInterval = updateDto.billingInterval;
      const planDef = PLAN_DEFINITIONS[subscription.plan];
      subscription.priceAmount =
        updateDto.billingInterval === BillingInterval.MONTHLY
          ? planDef.monthlyPrice
          : planDef.yearlyPrice;
    }

    const updated = await this.subscriptionRepository.save(subscription);

    // Emit event
    this.eventEmitter.emit('subscription.updated', {
      subscription: updated,
      tenantId,
      oldPlan,
      newPlan: updateDto.plan,
    });

    return updated;
  }

  /**
   * Cancel subscription
   */
  async cancel(tenantId: string, cancelAtPeriodEnd = true, userId?: string): Promise<Subscription> {
    this.logger.log(`Cancelling subscription for tenant ${tenantId}`);

    const subscription = await this.getCurrentSubscription(tenantId);

    if (cancelAtPeriodEnd) {
      subscription.cancelAtPeriodEnd = true;
      subscription.cancelledAt = new Date();
    } else {
      subscription.status = SubscriptionStatus.CANCELLED;
      subscription.cancelledAt = new Date();
    }

    const updated = await this.subscriptionRepository.save(subscription);

    await this.recordHistory(
      subscription,
      SubscriptionEventType.CANCELLED,
      subscription.plan,
      subscription.plan,
      userId,
      'Cancelled by user',
    );

    this.eventEmitter.emit('subscription.cancelled', { subscription: updated, tenantId });

    return updated;
  }

  /**
   * Reactivate a cancelled subscription
   */
  async reactivate(tenantId: string, userId?: string): Promise<Subscription> {
    this.logger.log(`Reactivating subscription for tenant ${tenantId}`);

    const subscription = await this.subscriptionRepository.findOne({
      where: { tenantId, status: SubscriptionStatus.CANCELLED },
    });

    if (!subscription) {
      throw new NotFoundException('No cancelled subscription found');
    }

    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.cancelAtPeriodEnd = false;
    subscription.cancelledAt = null;
    subscription.currentPeriodEnd = this.calculatePeriodEnd(subscription.billingInterval);

    const updated = await this.subscriptionRepository.save(subscription);

    await this.recordHistory(
      subscription,
      SubscriptionEventType.REACTIVATED,
      subscription.plan,
      subscription.plan,
      userId,
    );

    this.eventEmitter.emit('subscription.reactivated', { subscription: updated, tenantId });

    return updated;
  }

  /**
   * Get subscription limits for a tenant
   */
  async getLimits(tenantId: string): Promise<SubscriptionLimitsDto> {
    const subscription = await this.getCurrentSubscription(tenantId);

    return {
      maxUsers: subscription.maxUsers,
      maxProjects: subscription.maxProjects,
      maxKeywords: subscription.maxKeywords,
      maxPages: subscription.maxPages,
      maxBacklinks: subscription.maxBacklinks,
      maxCompetitors: subscription.maxCompetitors,
      maxApiCallsPerMonth: subscription.maxApiCallsPerMonth,
      hasWhiteLabel: subscription.hasWhiteLabel,
      hasApiAccess: subscription.hasApiAccess,
      hasPrioritySupport: subscription.hasPrioritySupport,
      hasCustomReports: subscription.hasCustomReports,
    };
  }

  /**
   * Check if tenant can perform action based on limits
   */
  async checkLimit(
    tenantId: string,
    limitType: keyof SubscriptionLimitsDto,
    currentUsage: number,
  ): Promise<boolean> {
    const subscription = await this.getCurrentSubscription(tenantId);
    const limit = subscription[limitType];

    // -1 means unlimited
    if (limit === -1) return true;

    return currentUsage < limit;
  }

  /**
   * Enforce limit - throw exception if exceeded
   */
  async enforceLimit(
    tenantId: string,
    limitType: keyof SubscriptionLimitsDto,
    currentUsage: number,
  ): Promise<void> {
    const canProceed = await this.checkLimit(tenantId, limitType, currentUsage);

    if (!canProceed) {
      throw new ForbiddenException(
        `Subscription limit exceeded for ${limitType}. Please upgrade your plan.`,
      );
    }
  }

  /**
   * Get subscription history
   */
  async getHistory(tenantId: string): Promise<SubscriptionHistory[]> {
    return this.historyRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all plan definitions
   */
  getAllPlans() {
    return PLAN_DEFINITIONS;
  }

  /**
   * Calculate subscription period end date
   */
  private calculatePeriodEnd(interval: BillingInterval): Date {
    const now = new Date();
    if (interval === BillingInterval.MONTHLY) {
      return new Date(now.setMonth(now.getMonth() + 1));
    } else {
      return new Date(now.setFullYear(now.getFullYear() + 1));
    }
  }

  /**
   * Determine if plan change is an upgrade
   */
  private isUpgrade(fromPlan: SubscriptionPlan, toPlan: SubscriptionPlan): boolean {
    const planOrder = [
      SubscriptionPlan.FREE,
      SubscriptionPlan.PRO,
      SubscriptionPlan.BUSINESS,
      SubscriptionPlan.ENTERPRISE,
      SubscriptionPlan.WHITE_LABEL,
    ];

    return planOrder.indexOf(toPlan) > planOrder.indexOf(fromPlan);
  }

  /**
   * Record subscription history event
   */
  private async recordHistory(
    subscription: Subscription,
    eventType: SubscriptionEventType,
    fromPlan: SubscriptionPlan | null,
    toPlan: SubscriptionPlan,
    userId?: string,
    reason?: string,
  ): Promise<void> {
    const history = this.historyRepository.create({
      tenantId: subscription.tenantId,
      subscriptionId: subscription.id,
      eventType,
      fromPlan,
      toPlan,
      fromStatus: fromPlan ? subscription.status : null,
      toStatus: subscription.status,
      priceAmount: subscription.priceAmount,
      currency: subscription.currency,
      initiatedBy: userId,
      reason,
    });

    await this.historyRepository.save(history);
  }
}
