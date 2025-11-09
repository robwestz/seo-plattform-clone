import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AhrefsClient } from './ahrefs.client';
import { SEMrushClient } from './semrush.client';
import { MozClient } from './moz.client';
import { IntegrationUsage } from './entities/integration-usage.entity';
import { IntegrationCache } from './entities/integration-cache.entity';

/**
 * SEO Tools Manager Service
 * Manages all third-party SEO tool integrations with unified API,
 * caching, cost tracking, and provider failover
 */
@Injectable()
export class SEOToolsManagerService {
  private readonly logger = new Logger(SEOToolsManagerService.name);
  private providerPriority = ['ahrefs', 'semrush', 'moz'];

  constructor(
    private ahrefsClient: AhrefsClient,
    private semrushClient: SEMrushClient,
    private mozClient: MozClient,
    @InjectRepository(IntegrationUsage)
    private usageRepository: Repository<IntegrationUsage>,
    @InjectRepository(IntegrationCache)
    private cacheRepository: Repository<IntegrationCache>,
  ) {}

  /**
   * Get backlinks from best available provider
   */
  async getBacklinks(params: {
    tenantId: string;
    domain: string;
    limit?: number;
    preferredProvider?: 'ahrefs' | 'semrush' | 'moz';
    useCache?: boolean;
  }): Promise<{
    provider: string;
    data: any[];
    cached: boolean;
    cost: number;
  }> {
    const cacheKey = `backlinks:${params.domain}:${params.limit || 100}`;

    // Check cache first
    if (params.useCache !== false) {
      const cached = await this.getFromCache(params.tenantId, cacheKey);
      if (cached) {
        return {
          provider: cached.provider,
          data: cached.data,
          cached: true,
          cost: 0,
        };
      }
    }

    // Determine provider order
    const providers = params.preferredProvider
      ? [params.preferredProvider, ...this.providerPriority.filter(p => p !== params.preferredProvider)]
      : this.providerPriority;

    // Try providers in order until one succeeds
    for (const provider of providers) {
      try {
        const result = await this.fetchBacklinksFromProvider(
          provider,
          params.domain,
          params.limit,
        );

        // Track usage and cost
        const cost = await this.trackUsage({
          tenantId: params.tenantId,
          provider,
          operation: 'getBacklinks',
          requestCount: 1,
          recordsReturned: result.total,
        });

        // Cache the result
        await this.saveToCache({
          tenantId: params.tenantId,
          cacheKey,
          data: result.backlinks,
          provider,
          ttl: 86400, // 24 hours
        });

        return {
          provider,
          data: result.backlinks,
          cached: false,
          cost,
        };
      } catch (error) {
        this.logger.warn(
          `Failed to fetch backlinks from ${provider}: ${error.message}. Trying next provider...`,
        );
        continue;
      }
    }

    throw new Error('All backlink providers failed');
  }

  /**
   * Get domain metrics from multiple providers and aggregate
   */
  async getAggregatedDomainMetrics(params: {
    tenantId: string;
    domain: string;
    providers?: Array<'ahrefs' | 'semrush' | 'moz'>;
    useCache?: boolean;
  }): Promise<{
    domain: string;
    metrics: {
      [provider: string]: {
        domainAuthority?: number;
        domainRating?: number;
        authorityScore?: number;
        backlinks: number;
        referringDomains: number;
        organicTraffic?: number;
        organicKeywords?: number;
      };
    };
    aggregated: {
      avgAuthority: number;
      totalBacklinks: number;
      totalReferringDomains: number;
      confidence: number;
    };
    totalCost: number;
  }> {
    const cacheKey = `domain-metrics:${params.domain}`;

    // Check cache
    if (params.useCache !== false) {
      const cached = await this.getFromCache(params.tenantId, cacheKey);
      if (cached) {
        return { ...cached.data, totalCost: 0 };
      }
    }

    const providers = params.providers || this.providerPriority;
    const metrics: any = {};
    let totalCost = 0;

    // Fetch from each provider
    await Promise.allSettled(
      providers.map(async provider => {
        try {
          const result = await this.fetchDomainMetricsFromProvider(
            provider,
            params.domain,
          );

          metrics[provider] = result;

          const cost = await this.trackUsage({
            tenantId: params.tenantId,
            provider,
            operation: 'getDomainMetrics',
            requestCount: 1,
            recordsReturned: 1,
          });

          totalCost += cost;
        } catch (error) {
          this.logger.error(
            `Failed to fetch domain metrics from ${provider}: ${error.message}`,
          );
        }
      }),
    );

    // Aggregate metrics
    const aggregated = this.aggregateMetrics(metrics);

    const result = {
      domain: params.domain,
      metrics,
      aggregated,
      totalCost,
    };

    // Cache aggregated result
    await this.saveToCache({
      tenantId: params.tenantId,
      cacheKey,
      data: result,
      provider: 'aggregated',
      ttl: 3600, // 1 hour for aggregated data
    });

    return result;
  }

  /**
   * Get keyword data with provider failover
   */
  async getKeywordData(params: {
    tenantId: string;
    keyword: string;
    country?: string;
    preferredProvider?: 'ahrefs' | 'semrush' | 'moz';
    useCache?: boolean;
  }): Promise<{
    provider: string;
    keyword: string;
    searchVolume: number;
    difficulty: number;
    cpc: number;
    competition: number;
    trend: number[];
    cached: boolean;
    cost: number;
  }> {
    const cacheKey = `keyword:${params.keyword}:${params.country || 'us'}`;

    // Check cache
    if (params.useCache !== false) {
      const cached = await this.getFromCache(params.tenantId, cacheKey);
      if (cached) {
        return {
          ...cached.data,
          provider: cached.provider,
          cached: true,
          cost: 0,
        };
      }
    }

    const providers = params.preferredProvider
      ? [params.preferredProvider, ...this.providerPriority.filter(p => p !== params.preferredProvider)]
      : this.providerPriority;

    for (const provider of providers) {
      try {
        const result = await this.fetchKeywordDataFromProvider(
          provider,
          params.keyword,
          params.country,
        );

        const cost = await this.trackUsage({
          tenantId: params.tenantId,
          provider,
          operation: 'getKeywordData',
          requestCount: 1,
          recordsReturned: 1,
        });

        await this.saveToCache({
          tenantId: params.tenantId,
          cacheKey,
          data: result,
          provider,
          ttl: 43200, // 12 hours
        });

        return {
          provider,
          ...result,
          cached: false,
          cost,
        };
      } catch (error) {
        this.logger.warn(
          `Failed to fetch keyword data from ${provider}: ${error.message}`,
        );
        continue;
      }
    }

    throw new Error('All keyword data providers failed');
  }

  /**
   * Batch keyword lookup with cost optimization
   */
  async batchKeywordLookup(params: {
    tenantId: string;
    keywords: string[];
    country?: string;
    maxCostPerKeyword?: number;
  }): Promise<{
    results: Array<{
      keyword: string;
      provider: string;
      searchVolume: number;
      difficulty: number;
      cached: boolean;
    }>;
    totalCost: number;
    cacheHitRate: number;
  }> {
    const results = [];
    let totalCost = 0;
    let cacheHits = 0;

    // Process in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < params.keywords.length; i += batchSize) {
      const batch = params.keywords.slice(i, i + batchSize);

      const batchResults = await Promise.allSettled(
        batch.map(async keyword => {
          const result = await this.getKeywordData({
            tenantId: params.tenantId,
            keyword,
            country: params.country,
            useCache: true,
          });

          if (result.cached) {
            cacheHits++;
          }

          totalCost += result.cost;

          return {
            keyword,
            provider: result.provider,
            searchVolume: result.searchVolume,
            difficulty: result.difficulty,
            cached: result.cached,
          };
        }),
      );

      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      });

      // Rate limiting delay between batches
      if (i + batchSize < params.keywords.length) {
        await this.sleep(1000);
      }
    }

    return {
      results,
      totalCost,
      cacheHitRate:
        results.length > 0 ? (cacheHits / results.length) * 100 : 0,
    };
  }

  /**
   * Get usage statistics for a tenant
   */
  async getUsageStatistics(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    byProvider: {
      [provider: string]: {
        requests: number;
        cost: number;
        recordsReturned: number;
      };
    };
    total: {
      requests: number;
      cost: number;
      recordsReturned: number;
    };
    topOperations: Array<{
      operation: string;
      count: number;
      cost: number;
    }>;
  }> {
    const query = this.usageRepository
      .createQueryBuilder('usage')
      .where('usage.tenantId = :tenantId', { tenantId });

    if (startDate) {
      query.andWhere('usage.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('usage.createdAt <= :endDate', { endDate });
    }

    const records = await query.getMany();

    const byProvider: any = {};
    let totalRequests = 0;
    let totalCost = 0;
    let totalRecords = 0;

    const operationMap = new Map<string, { count: number; cost: number }>();

    records.forEach(record => {
      // By provider
      if (!byProvider[record.provider]) {
        byProvider[record.provider] = {
          requests: 0,
          cost: 0,
          recordsReturned: 0,
        };
      }

      byProvider[record.provider].requests += record.requestCount;
      byProvider[record.provider].cost += record.cost;
      byProvider[record.provider].recordsReturned += record.recordsReturned;

      // Totals
      totalRequests += record.requestCount;
      totalCost += record.cost;
      totalRecords += record.recordsReturned;

      // Operations
      const opKey = record.operation;
      if (!operationMap.has(opKey)) {
        operationMap.set(opKey, { count: 0, cost: 0 });
      }
      const op = operationMap.get(opKey);
      op.count += record.requestCount;
      op.cost += record.cost;
    });

    const topOperations = Array.from(operationMap.entries())
      .map(([operation, data]) => ({
        operation,
        count: data.count,
        cost: data.cost,
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);

    return {
      byProvider,
      total: {
        requests: totalRequests,
        cost: totalCost,
        recordsReturned: totalRecords,
      },
      topOperations,
    };
  }

  /**
   * Clear cache for tenant or specific keys
   */
  async clearCache(tenantId: string, pattern?: string): Promise<number> {
    const query = this.cacheRepository
      .createQueryBuilder()
      .delete()
      .where('tenantId = :tenantId', { tenantId });

    if (pattern) {
      query.andWhere('cacheKey LIKE :pattern', { pattern: `%${pattern}%` });
    }

    const result = await query.execute();
    return result.affected || 0;
  }

  // Private helper methods

  private async fetchBacklinksFromProvider(
    provider: string,
    domain: string,
    limit?: number,
  ): Promise<{ backlinks: any[]; total: number }> {
    switch (provider) {
      case 'ahrefs':
        return this.ahrefsClient.getBacklinks(domain, { limit });
      case 'semrush':
        return this.semrushClient.getBacklinks(domain, { limit });
      case 'moz':
        return this.mozClient.getBacklinks(domain, { limit });
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private async fetchDomainMetricsFromProvider(
    provider: string,
    domain: string,
  ): Promise<any> {
    switch (provider) {
      case 'ahrefs':
        return this.ahrefsClient.getDomainMetrics(domain);
      case 'semrush':
        return this.semrushClient.getDomainMetrics(domain);
      case 'moz':
        return this.mozClient.getDomainMetrics(domain);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private async fetchKeywordDataFromProvider(
    provider: string,
    keyword: string,
    country?: string,
  ): Promise<any> {
    switch (provider) {
      case 'ahrefs':
        return this.ahrefsClient.getKeywordData(keyword, country);
      case 'semrush':
        return this.semrushClient.getKeywordData(keyword, country);
      case 'moz':
        return this.mozClient.getKeywordData(keyword, country);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private aggregateMetrics(metrics: any): {
    avgAuthority: number;
    totalBacklinks: number;
    totalReferringDomains: number;
    confidence: number;
  } {
    const providers = Object.keys(metrics);
    if (providers.length === 0) {
      return {
        avgAuthority: 0,
        totalBacklinks: 0,
        totalReferringDomains: 0,
        confidence: 0,
      };
    }

    let totalAuthority = 0;
    let authorityCount = 0;
    let totalBacklinks = 0;
    let totalReferringDomains = 0;

    providers.forEach(provider => {
      const m = metrics[provider];

      // Authority (normalize to 0-100 scale)
      const authority =
        m.domainRating || m.domainAuthority || m.authorityScore || 0;
      if (authority > 0) {
        totalAuthority += authority;
        authorityCount++;
      }

      totalBacklinks += m.backlinks || 0;
      totalReferringDomains += m.referringDomains || 0;
    });

    return {
      avgAuthority: authorityCount > 0 ? totalAuthority / authorityCount : 0,
      totalBacklinks: Math.round(totalBacklinks / providers.length),
      totalReferringDomains: Math.round(
        totalReferringDomains / providers.length,
      ),
      confidence: (authorityCount / 3) * 100, // Percentage of providers that returned data
    };
  }

  private async trackUsage(params: {
    tenantId: string;
    provider: string;
    operation: string;
    requestCount: number;
    recordsReturned: number;
  }): Promise<number> {
    // Cost per operation (in credits or dollars)
    const costMap = {
      ahrefs: { getBacklinks: 0.05, getDomainMetrics: 0.02, getKeywordData: 0.01 },
      semrush: { getBacklinks: 0.04, getDomainMetrics: 0.015, getKeywordData: 0.008 },
      moz: { getBacklinks: 0.03, getDomainMetrics: 0.01, getKeywordData: 0.006 },
    };

    const cost =
      (costMap[params.provider]?.[params.operation] || 0.01) *
      params.requestCount;

    const usage = this.usageRepository.create({
      tenantId: params.tenantId,
      provider: params.provider,
      operation: params.operation,
      requestCount: params.requestCount,
      recordsReturned: params.recordsReturned,
      cost,
    });

    await this.usageRepository.save(usage);

    return cost;
  }

  private async getFromCache(
    tenantId: string,
    cacheKey: string,
  ): Promise<{ provider: string; data: any } | null> {
    const cached = await this.cacheRepository.findOne({
      where: { tenantId, cacheKey },
    });

    if (!cached) return null;

    // Check if expired
    if (cached.expiresAt && cached.expiresAt < new Date()) {
      await this.cacheRepository.delete(cached.id);
      return null;
    }

    return {
      provider: cached.provider,
      data: cached.data,
    };
  }

  private async saveToCache(params: {
    tenantId: string;
    cacheKey: string;
    data: any;
    provider: string;
    ttl: number;
  }): Promise<void> {
    const expiresAt = new Date(Date.now() + params.ttl * 1000);

    const cache = this.cacheRepository.create({
      tenantId: params.tenantId,
      cacheKey: params.cacheKey,
      provider: params.provider,
      data: params.data,
      expiresAt,
    });

    await this.cacheRepository.save(cache);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
