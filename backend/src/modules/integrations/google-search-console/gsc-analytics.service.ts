import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GSCData } from './entities/gsc-data.entity';

/**
 * Google Search Console Analytics Service
 * Advanced analytics, insights, and reporting capabilities
 */
@Injectable()
export class GSCAnalyticsService {
  private readonly logger = new Logger(GSCAnalyticsService.name);

  constructor(
    @InjectRepository(GSCData)
    private gscDataRepository: Repository<GSCData>,
  ) {}

  /**
   * Get mobile vs desktop performance comparison
   */
  async getMobileDesktopComparison(
    tenantId: string,
    projectId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    mobile: {
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    };
    desktop: {
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    };
    tablet: {
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    };
  }> {
    // This would require device dimension in GSCData entity
    // For now, return a structured response

    const query = this.gscDataRepository
      .createQueryBuilder('gsc')
      .select('gsc.metadata->>\'device\'', 'device')
      .addSelect('SUM(gsc.clicks)', 'clicks')
      .addSelect('SUM(gsc.impressions)', 'impressions')
      .addSelect('AVG(gsc.ctr)', 'ctr')
      .addSelect('AVG(gsc.position)', 'position')
      .where('gsc.tenantId = :tenantId', { tenantId })
      .andWhere('gsc.projectId = :projectId', { projectId })
      .andWhere('gsc.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('gsc.metadata->>\'device\'')
      .getRawMany();

    const results = await query;

    const defaultMetrics = {
      clicks: 0,
      impressions: 0,
      ctr: 0,
      position: 0,
    };

    return {
      mobile:
        results.find(r => r.device === 'MOBILE') ||
        ({ ...defaultMetrics } as any),
      desktop:
        results.find(r => r.device === 'DESKTOP') ||
        ({ ...defaultMetrics } as any),
      tablet:
        results.find(r => r.device === 'TABLET') ||
        ({ ...defaultMetrics } as any),
    };
  }

  /**
   * Get country-wise performance breakdown
   */
  async getCountryPerformance(
    tenantId: string,
    projectId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 20,
  ): Promise<
    Array<{
      country: string;
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    }>
  > {
    return this.gscDataRepository
      .createQueryBuilder('gsc')
      .select('gsc.metadata->>\'country\'', 'country')
      .addSelect('SUM(gsc.clicks)', 'clicks')
      .addSelect('SUM(gsc.impressions)', 'impressions')
      .addSelect('AVG(gsc.ctr)', 'ctr')
      .addSelect('AVG(gsc.position)', 'position')
      .where('gsc.tenantId = :tenantId', { tenantId })
      .andWhere('gsc.projectId = :projectId', { projectId })
      .andWhere('gsc.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('gsc.metadata->>\'country\' IS NOT NULL')
      .groupBy('gsc.metadata->>\'country\'')
      .orderBy('SUM(gsc.clicks)', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  /**
   * Identify queries with high impressions but low CTR (opportunity queries)
   */
  async getOpportunityQueries(
    tenantId: string,
    projectId: string,
    minImpressions: number = 100,
    maxCtr: number = 5,
    limit: number = 50,
  ): Promise<
    Array<{
      query: string;
      impressions: number;
      clicks: number;
      ctr: number;
      position: number;
      opportunityScore: number;
    }>
  > {
    const results = await this.gscDataRepository
      .createQueryBuilder('gsc')
      .select('gsc.query', 'query')
      .addSelect('SUM(gsc.impressions)', 'impressions')
      .addSelect('SUM(gsc.clicks)', 'clicks')
      .addSelect('AVG(gsc.ctr)', 'ctr')
      .addSelect('AVG(gsc.position)', 'position')
      .where('gsc.tenantId = :tenantId', { tenantId })
      .andWhere('gsc.projectId = :projectId', { projectId })
      .andWhere('gsc.query IS NOT NULL')
      .groupBy('gsc.query')
      .having('SUM(gsc.impressions) >= :minImpressions', { minImpressions })
      .andHaving('AVG(gsc.ctr) <= :maxCtr', { maxCtr })
      .orderBy('SUM(gsc.impressions)', 'DESC')
      .limit(limit)
      .getRawMany();

    // Calculate opportunity score: high impressions + low CTR + good position
    return results.map(r => ({
      query: r.query,
      impressions: parseInt(r.impressions),
      clicks: parseInt(r.clicks),
      ctr: parseFloat(r.ctr),
      position: parseFloat(r.position),
      opportunityScore: this.calculateOpportunityScore(
        parseInt(r.impressions),
        parseFloat(r.ctr),
        parseFloat(r.position),
      ),
    }));
  }

  /**
   * Calculate opportunity score for a query
   */
  private calculateOpportunityScore(
    impressions: number,
    ctr: number,
    position: number,
  ): number {
    // Higher impressions = more opportunity
    const impressionScore = Math.min(impressions / 1000, 10);

    // Lower CTR = more room for improvement
    const ctrScore = Math.max(0, 10 - ctr * 2);

    // Better position (lower number) = easier to improve
    const positionScore = Math.max(0, 10 - position);

    return parseFloat(
      ((impressionScore + ctrScore + positionScore) / 3).toFixed(2),
    );
  }

  /**
   * Get queries that lost/gained positions significantly
   */
  async getPositionChanges(
    tenantId: string,
    projectId: string,
    currentStartDate: Date,
    currentEndDate: Date,
    previousStartDate: Date,
    previousEndDate: Date,
    minChange: number = 5,
    limit: number = 50,
  ): Promise<
    Array<{
      query: string;
      currentPosition: number;
      previousPosition: number;
      positionChange: number;
      currentClicks: number;
      previousClicks: number;
      type: 'gain' | 'loss';
    }>
  > {
    // Get current period data
    const currentData = await this.gscDataRepository
      .createQueryBuilder('gsc')
      .select('gsc.query', 'query')
      .addSelect('AVG(gsc.position)', 'position')
      .addSelect('SUM(gsc.clicks)', 'clicks')
      .where('gsc.tenantId = :tenantId', { tenantId })
      .andWhere('gsc.projectId = :projectId', { projectId })
      .andWhere('gsc.date BETWEEN :startDate AND :endDate', {
        startDate: currentStartDate,
        endDate: currentEndDate,
      })
      .andWhere('gsc.query IS NOT NULL')
      .groupBy('gsc.query')
      .getRawMany();

    // Get previous period data
    const previousData = await this.gscDataRepository
      .createQueryBuilder('gsc')
      .select('gsc.query', 'query')
      .addSelect('AVG(gsc.position)', 'position')
      .addSelect('SUM(gsc.clicks)', 'clicks')
      .where('gsc.tenantId = :tenantId', { tenantId })
      .andWhere('gsc.projectId = :projectId', { projectId })
      .andWhere('gsc.date BETWEEN :startDate AND :endDate', {
        startDate: previousStartDate,
        endDate: previousEndDate,
      })
      .andWhere('gsc.query IS NOT NULL')
      .groupBy('gsc.query')
      .getRawMany();

    // Create maps for quick lookup
    const previousMap = new Map(
      previousData.map(d => [
        d.query,
        { position: parseFloat(d.position), clicks: parseInt(d.clicks) },
      ]),
    );

    // Calculate changes
    const changes = currentData
      .map(current => {
        const previous = previousMap.get(current.query);
        if (!previous) return null;

        const currentPosition = parseFloat(current.position);
        const previousPosition = previous.position;
        const positionChange = previousPosition - currentPosition; // Positive = improvement

        if (Math.abs(positionChange) < minChange) return null;

        return {
          query: current.query,
          currentPosition,
          previousPosition,
          positionChange,
          currentClicks: parseInt(current.clicks),
          previousClicks: previous.clicks,
          type: (positionChange > 0 ? 'gain' : 'loss') as 'gain' | 'loss',
        };
      })
      .filter(Boolean)
      .sort((a, b) => Math.abs(b.positionChange) - Math.abs(a.positionChange))
      .slice(0, limit);

    return changes;
  }

  /**
   * Get search intent distribution
   */
  async getSearchIntentDistribution(
    tenantId: string,
    projectId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    informational: number;
    navigational: number;
    transactional: number;
    commercial: number;
  }> {
    const queries = await this.gscDataRepository
      .createQueryBuilder('gsc')
      .select('gsc.query', 'query')
      .addSelect('SUM(gsc.clicks)', 'clicks')
      .where('gsc.tenantId = :tenantId', { tenantId })
      .andWhere('gsc.projectId = :projectId', { projectId })
      .andWhere('gsc.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('gsc.query IS NOT NULL')
      .groupBy('gsc.query')
      .getRawMany();

    // Simple keyword-based intent classification
    const intentCounts = {
      informational: 0,
      navigational: 0,
      transactional: 0,
      commercial: 0,
    };

    const informationalKeywords = [
      'how',
      'what',
      'why',
      'when',
      'where',
      'guide',
      'tutorial',
    ];
    const navigationalKeywords = ['login', 'sign in', 'website', 'official'];
    const transactionalKeywords = [
      'buy',
      'purchase',
      'order',
      'price',
      'download',
    ];
    const commercialKeywords = [
      'best',
      'top',
      'review',
      'compare',
      'vs',
      'alternative',
    ];

    queries.forEach(q => {
      const query = q.query.toLowerCase();

      if (informationalKeywords.some(kw => query.includes(kw))) {
        intentCounts.informational += parseInt(q.clicks);
      } else if (navigationalKeywords.some(kw => query.includes(kw))) {
        intentCounts.navigational += parseInt(q.clicks);
      } else if (transactionalKeywords.some(kw => query.includes(kw))) {
        intentCounts.transactional += parseInt(q.clicks);
      } else if (commercialKeywords.some(kw => query.includes(kw))) {
        intentCounts.commercial += parseInt(q.clicks);
      } else {
        intentCounts.informational += parseInt(q.clicks); // Default
      }
    });

    return intentCounts;
  }

  /**
   * Get performance trends over time
   */
  async getPerformanceTrends(
    tenantId: string,
    projectId: string,
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'day',
  ): Promise<
    Array<{
      date: string;
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    }>
  > {
    let dateFormat = '%Y-%m-%d';
    if (groupBy === 'week') {
      dateFormat = '%Y-W%V';
    } else if (groupBy === 'month') {
      dateFormat = '%Y-%m';
    }

    return this.gscDataRepository
      .createQueryBuilder('gsc')
      .select(`TO_CHAR(gsc.date, '${dateFormat}')`, 'date')
      .addSelect('SUM(gsc.clicks)', 'clicks')
      .addSelect('SUM(gsc.impressions)', 'impressions')
      .addSelect('AVG(gsc.ctr)', 'ctr')
      .addSelect('AVG(gsc.position)', 'position')
      .where('gsc.tenantId = :tenantId', { tenantId })
      .andWhere('gsc.projectId = :projectId', { projectId })
      .andWhere('gsc.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();
  }

  /**
   * Get branded vs non-branded traffic split
   */
  async getBrandedTrafficSplit(
    tenantId: string,
    projectId: string,
    brandKeywords: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<{
    branded: {
      clicks: number;
      impressions: number;
      ctr: number;
    };
    nonBranded: {
      clicks: number;
      impressions: number;
      ctr: number;
    };
    brandedPercentage: number;
  }> {
    const allData = await this.gscDataRepository
      .createQueryBuilder('gsc')
      .select('gsc.query', 'query')
      .addSelect('SUM(gsc.clicks)', 'clicks')
      .addSelect('SUM(gsc.impressions)', 'impressions')
      .addSelect('AVG(gsc.ctr)', 'ctr')
      .where('gsc.tenantId = :tenantId', { tenantId })
      .andWhere('gsc.projectId = :projectId', { projectId })
      .andWhere('gsc.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('gsc.query IS NOT NULL')
      .groupBy('gsc.query')
      .getRawMany();

    const branded = { clicks: 0, impressions: 0, ctr: 0, count: 0 };
    const nonBranded = { clicks: 0, impressions: 0, ctr: 0, count: 0 };

    allData.forEach(row => {
      const isBranded = brandKeywords.some(brand =>
        row.query.toLowerCase().includes(brand.toLowerCase()),
      );

      if (isBranded) {
        branded.clicks += parseInt(row.clicks);
        branded.impressions += parseInt(row.impressions);
        branded.ctr += parseFloat(row.ctr);
        branded.count++;
      } else {
        nonBranded.clicks += parseInt(row.clicks);
        nonBranded.impressions += parseInt(row.impressions);
        nonBranded.ctr += parseFloat(row.ctr);
        nonBranded.count++;
      }
    });

    const totalClicks = branded.clicks + nonBranded.clicks;

    return {
      branded: {
        clicks: branded.clicks,
        impressions: branded.impressions,
        ctr: branded.count > 0 ? branded.ctr / branded.count : 0,
      },
      nonBranded: {
        clicks: nonBranded.clicks,
        impressions: nonBranded.impressions,
        ctr: nonBranded.count > 0 ? nonBranded.ctr / nonBranded.count : 0,
      },
      brandedPercentage:
        totalClicks > 0 ? (branded.clicks / totalClicks) * 100 : 0,
    };
  }

  /**
   * Get cannibalization issues (multiple pages ranking for same query)
   */
  async getCannibalizationIssues(
    tenantId: string,
    projectId: string,
    startDate: Date,
    endDate: Date,
    minUrls: number = 2,
    limit: number = 50,
  ): Promise<
    Array<{
      query: string;
      urlCount: number;
      urls: Array<{
        url: string;
        clicks: number;
        impressions: number;
        position: number;
      }>;
      totalClicks: number;
    }>
  > {
    // Get all query-url combinations
    const data = await this.gscDataRepository
      .createQueryBuilder('gsc')
      .select('gsc.query', 'query')
      .addSelect('gsc.url', 'url')
      .addSelect('SUM(gsc.clicks)', 'clicks')
      .addSelect('SUM(gsc.impressions)', 'impressions')
      .addSelect('AVG(gsc.position)', 'position')
      .where('gsc.tenantId = :tenantId', { tenantId })
      .andWhere('gsc.projectId = :projectId', { projectId })
      .andWhere('gsc.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('gsc.query IS NOT NULL')
      .andWhere('gsc.url IS NOT NULL')
      .groupBy('gsc.query, gsc.url')
      .getRawMany();

    // Group by query
    const queryMap = new Map<
      string,
      Array<{
        url: string;
        clicks: number;
        impressions: number;
        position: number;
      }>
    >();

    data.forEach(row => {
      if (!queryMap.has(row.query)) {
        queryMap.set(row.query, []);
      }

      queryMap.get(row.query).push({
        url: row.url,
        clicks: parseInt(row.clicks),
        impressions: parseInt(row.impressions),
        position: parseFloat(row.position),
      });
    });

    // Find queries with multiple URLs
    const issues = Array.from(queryMap.entries())
      .filter(([_, urls]) => urls.length >= minUrls)
      .map(([query, urls]) => ({
        query,
        urlCount: urls.length,
        urls: urls.sort((a, b) => b.clicks - a.clicks),
        totalClicks: urls.reduce((sum, u) => sum + u.clicks, 0),
      }))
      .sort((a, b) => b.totalClicks - a.totalClicks)
      .slice(0, limit);

    return issues;
  }

  /**
   * Get seasonal trends analysis
   */
  async getSeasonalTrends(
    tenantId: string,
    projectId: string,
    years: number = 2,
  ): Promise<
    Array<{
      month: number;
      avgClicks: number;
      avgImpressions: number;
      avgPosition: number;
      yearCount: number;
    }>
  > {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - years);

    return this.gscDataRepository
      .createQueryBuilder('gsc')
      .select('EXTRACT(MONTH FROM gsc.date)', 'month')
      .addSelect('AVG(gsc.clicks)', 'avgClicks')
      .addSelect('AVG(gsc.impressions)', 'avgImpressions')
      .addSelect('AVG(gsc.position)', 'avgPosition')
      .addSelect('COUNT(DISTINCT EXTRACT(YEAR FROM gsc.date))', 'yearCount')
      .where('gsc.tenantId = :tenantId', { tenantId })
      .andWhere('gsc.projectId = :projectId', { projectId })
      .andWhere('gsc.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('EXTRACT(MONTH FROM gsc.date)')
      .orderBy('month', 'ASC')
      .getRawMany();
  }
}
