# TEAM KAPPA - BUSINESS LOGIC & MONETIZATION
## SEO Intelligence Platform - Billing, Subscriptions, White-Label (10,000 LOC)

---

## 🎯 YOUR MISSION
You are Team Kappa, building the **money-making infrastructure**: subscription plans, usage-based billing, white-label features, analytics, and admin tools. You ensure the platform can actually make revenue.

**Target**: 10,000 lines of production-ready code
**Critical Success Factor**: Accurate billing, flexible plans, white-label ready

---

## 📋 YOUR RESPONSIBILITIES

### 1. Subscription Management (3,000 LOC)

**Plans**:
```typescript
enum PlanType {
  FREE = 'free',
  PRO = 'pro',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
  WHITE_LABEL = 'white_label'
}

interface PlanLimits {
  searchesPerDay: number;
  projectsLimit: number;
  keywordsLimit: number;
  crawlPagesLimit: number;
  apiCallsPerHour: number;
  teamMembersLimit: number;
  features: string[]; // ['rank_tracking', 'backlink_analysis', etc.]
}

const PLANS: Record<PlanType, PlanLimits> = {
  [PlanType.FREE]: {
    searchesPerDay: 10,
    projectsLimit: 1,
    keywordsLimit: 50,
    crawlPagesLimit: 100,
    apiCallsPerHour: 10,
    teamMembersLimit: 1,
    features: ['keyword_research'],
  },
  [PlanType.PRO]: {
    searchesPerDay: 1000,
    projectsLimit: 10,
    keywordsLimit: 5000,
    crawlPagesLimit: 50000,
    apiCallsPerHour: 1000,
    teamMembersLimit: 5,
    features: ['keyword_research', 'rank_tracking', 'technical_audit'],
  },
  // ... other plans
};
```

**Service**:
```typescript
@Injectable()
export class SubscriptionService {
  async upgradePlan(tenantId: string, newPlan: PlanType): Promise<void> {
    // Create Stripe subscription
    const subscription = await this.stripe.subscriptions.create({
      customer: tenant.stripeCustomerId,
      items: [{ price: PLAN_PRICES[newPlan] }],
    });

    // Update tenant
    await this.tenantService.updatePlan(tenantId, newPlan);

    // Emit event
    await this.eventBus.publish(new PlanUpgradedEvent(tenantId, newPlan));
  }

  async checkLimit(tenantId: string, limitType: string): Promise<boolean> {
    const tenant = await this.tenantService.findById(tenantId);
    const limits = PLANS[tenant.plan];
    const usage = await this.usageService.getCurrentUsage(tenantId);

    return usage[limitType] < limits[limitType];
  }

  async enforceLimits(tenantId: string, action: string): Promise<void> {
    if (!await this.checkLimit(tenantId, action)) {
      throw new PlanLimitExceededError(action);
    }
  }
}
```

### 2. Usage Tracking & Billing (2,500 LOC)

**Usage Events**:
```typescript
interface UsageEvent {
  tenantId: string;
  eventType: 'api_call' | 'crawl_page' | 'keyword_search' | 'rank_check';
  timestamp: Date;
  metadata: object;
  creditsUsed: number;
}

@Injectable()
export class UsageTrackingService {
  async trackUsage(event: UsageEvent): Promise<void> {
    // Store in ClickHouse for analytics
    await this.clickhouse.insert('usage_events', event);

    // Update real-time counters in Redis
    await this.redis.hincrby(
      `usage:${event.tenantId}:${format(new Date(), 'yyyy-MM-dd')}`,
      event.eventType,
      1
    );

    // Check if approaching limit
    await this.checkAndAlert(event.tenantId, event.eventType);
  }

  async getUsageReport(tenantId: string, period: DateRange): Promise<UsageReport> {
    const query = `
      SELECT
        eventType,
        toDate(timestamp) as date,
        count() as count,
        sum(creditsUsed) as totalCredits
      FROM usage_events
      WHERE tenantId = '${tenantId}'
        AND timestamp BETWEEN '${period.start}' AND '${period.end}'
      GROUP BY eventType, date
      ORDER BY date DESC
    `;

    const results = await this.clickhouse.query(query);

    return this.formatUsageReport(results);
  }
}
```

**Stripe Integration**:
```typescript
@Injectable()
export class BillingService {
  async createCustomer(tenant: Tenant): Promise<string> {
    const customer = await this.stripe.customers.create({
      email: tenant.email,
      name: tenant.name,
      metadata: { tenantId: tenant.id },
    });

    return customer.id;
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
        break;
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const tenantId = invoice.customer_metadata.tenantId;

    // Downgrade to free plan
    await this.subscriptionService.downgradePlan(tenantId, PlanType.FREE);

    // Send notification
    await this.emailService.sendPaymentFailedEmail(tenantId);
  }
}
```

### 3. White-Label System (2,000 LOC)

**Features**:
- Custom branding (logo, colors, domain)
- Custom email templates
- Custom API domain
- Hide "Powered by" branding
- Custom feature toggles

**Implementation**:
```typescript
interface WhiteLabelConfig {
  tenantId: string;
  brandName: string;
  logo: string; // S3 URL
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  customDomain?: string; // app.customer.com
  emailFromName: string;
  emailFromAddress: string;
  features: {
    showBranding: boolean;
    customSMTP: boolean;
    customAuth: boolean;
  };
}

@Injectable()
export class WhiteLabelService {
  async getConfig(tenantId: string): Promise<WhiteLabelConfig> {
    const cached = await this.cache.get(`whitelabel:${tenantId}`);
    if (cached) return cached;

    const config = await this.configRepository.findOne({ tenantId });
    await this.cache.set(`whitelabel:${tenantId}`, config, 3600);

    return config;
  }

  async updateBranding(tenantId: string, branding: Partial<WhiteLabelConfig>): Promise<void> {
    await this.configRepository.update({ tenantId }, branding);
    await this.cache.del(`whitelabel:${tenantId}`);
  }
}
```

### 4. Admin Dashboard (1,500 LOC)

**Features**:
- Tenant management
- Usage analytics
- Revenue tracking
- Support tools
- Feature flags
- System health monitoring

**Endpoints**:
```typescript
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  @Get('tenants')
  async listTenants(@Query() query: TenantQuery): Promise<TenantList> {
    return this.adminService.listTenants(query);
  }

  @Get('analytics/revenue')
  async getRevenueAnalytics(@Query() period: string): Promise<RevenueAnalytics> {
    return this.analyticsService.getRevenue(period);
  }

  @Post('tenants/:id/disable')
  async disableTenant(@Param('id') tenantId: string): Promise<void> {
    await this.adminService.disableTenant(tenantId);
  }

  @Get('system/health')
  async getSystemHealth(): Promise<SystemHealth> {
    return {
      database: await this.healthService.checkDatabase(),
      redis: await this.healthService.checkRedis(),
      kafka: await this.healthService.checkKafka(),
      crawler: await this.healthService.checkCrawler(),
    };
  }
}
```

### 5. Analytics & Reporting (1,000 LOC)

**Tenant Analytics**:
```typescript
interface TenantAnalytics {
  tenantId: string;
  period: DateRange;
  metrics: {
    activeUsers: number;
    apiCalls: number;
    pagesC crawled: number;
    revenue: number;
    mrr: number; // Monthly Recurring Revenue
    churnRisk: number; // 0-100 score
  };
  growth: {
    userGrowth: number; // percentage
    revenueGrowth: number;
  };
}

@Injectable()
export class AnalyticsService {
  async getTenantAnalytics(tenantId: string, period: DateRange): Promise<TenantAnalytics> {
    const [usage, revenue, users] = await Promise.all([
      this.usageService.getUsageReport(tenantId, period),
      this.billingService.getRevenue(tenantId, period),
      this.userService.getActiveUsers(tenantId, period),
    ]);

    return {
      tenantId,
      period,
      metrics: {
        activeUsers: users.length,
        apiCalls: usage.totalApiCalls,
        pagesCrawled: usage.totalPagesCrawled,
        revenue: revenue.total,
        mrr: revenue.mrr,
        churnRisk: await this.calculateChurnRisk(tenantId),
      },
      growth: {
        userGrowth: await this.calculateGrowth(users, 'month'),
        revenueGrowth: await this.calculateGrowth(revenue, 'month'),
      },
    };
  }

  private async calculateChurnRisk(tenantId: string): Promise<number> {
    // ML model or heuristics
    const factors = {
      lastLoginDays: await this.getLastLoginDays(tenantId),
      usageDecline: await this.getUsageDecline(tenantId),
      supportTickets: await this.getSupportTicketCount(tenantId),
      paymentIssues: await this.getPaymentIssues(tenantId),
    };

    // Simple scoring
    let risk = 0;
    if (factors.lastLoginDays > 30) risk += 40;
    if (factors.usageDecline > 50) risk += 30;
    if (factors.supportTickets > 5) risk += 20;
    if (factors.paymentIssues > 0) risk += 10;

    return Math.min(risk, 100);
  }
}
```

---

## 🏗️ PROJECT STRUCTURE

```
business/
├── src/
│   ├── subscription/
│   │   ├── subscription.service.ts
│   │   ├── plan.config.ts
│   │   └── limits.guard.ts
│   ├── billing/
│   │   ├── billing.service.ts
│   │   ├── stripe.client.ts
│   │   └── invoice.service.ts
│   ├── usage/
│   │   ├── usage-tracking.service.ts
│   │   ├── usage-report.service.ts
│   │   └── clickhouse.client.ts
│   ├── white-label/
│   │   ├── white-label.service.ts
│   │   ├── branding.controller.ts
│   │   └── config.entity.ts
│   ├── admin/
│   │   ├── admin.controller.ts
│   │   ├── admin.service.ts
│   │   └── analytics.service.ts
│   └── webhooks/
│       ├── stripe-webhook.controller.ts
│       └── webhook.service.ts
```

---

## 🔧 TECHNICAL REQUIREMENTS

### Payment Processing
- Stripe integration
- Support for credit cards, ACH
- Invoice generation
- Automatic retries on failed payments

### Pricing
- Monthly/annual billing
- Usage-based add-ons
- Custom enterprise pricing
- Proration on upgrades/downgrades

### Compliance
- PCI compliance (via Stripe)
- GDPR compliance
- SOC 2 ready

---

## 📊 DELIVERABLES

### API Endpoints
```
# Subscription
GET    /subscription/plans
POST   /subscription/upgrade
POST   /subscription/cancel
GET    /subscription/current

# Billing
GET    /billing/invoices
GET    /billing/usage
POST   /billing/payment-method

# White-label
GET    /white-label/config
PUT    /white-label/branding

# Admin
GET    /admin/tenants
GET    /admin/analytics
POST   /admin/feature-flags
```

### Stripe Webhooks
- invoice.paid
- invoice.payment_failed
- customer.subscription.updated
- customer.subscription.deleted

---

**BUILD THE REVENUE ENGINE. MAKE IT PROFITABLE. 💰**

BEGIN MEGA-FILE CREATION FOR TEAM KAPPA!
