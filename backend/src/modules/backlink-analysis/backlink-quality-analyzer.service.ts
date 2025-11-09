import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  BacklinkAnalysis,
  LinkQuality,
  LinkType,
  AnchorTextType,
} from './entities/backlink-analysis.entity';
import { subDays, subMonths } from 'date-fns';

/**
 * Backlink Profile Summary
 */
export interface BacklinkProfile {
  totalBacklinks: number;
  totalReferringDomains: number;
  dofollowLinks: number;
  nofollowLinks: number;
  qualityDistribution: Record<LinkQuality, number>;
  averageQuality: number;
  toxicLinks: number;
  linksToDisavow: number;
  topReferringDomains: Array<{
    domain: string;
    linkCount: number;
    avgQuality: number;
  }>;
  anchorTextDistribution: Record<AnchorTextType, number>;
  linkVelocity: {
    last7Days: number;
    last30Days: number;
    last90Days: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  };
}

/**
 * Link Analysis Request
 */
export interface AnalyzeLinkRequest {
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  linkType?: LinkType;
  discoveryDate?: Date;
}

/**
 * Anchor Text Analysis
 */
export interface AnchorTextAnalysis {
  distribution: Record<AnchorTextType, number>;
  percentages: Record<AnchorTextType, number>;
  topAnchors: Array<{
    text: string;
    count: number;
    type: AnchorTextType;
  }>;
  isNatural: boolean;
  overOptimization: boolean;
  warnings: string[];
  recommendations: string[];
}

/**
 * Link Velocity Analysis
 */
export interface LinkVelocityAnalysis {
  current: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  historical: Array<{
    period: string;
    count: number;
  }>;
  trend: 'accelerating' | 'steady' | 'declining' | 'suspicious';
  anomalies: Array<{
    date: string;
    count: number;
    expectedCount: number;
    deviation: number;
  }>;
  isHealthy: boolean;
  warnings: string[];
}

/**
 * Disavow Recommendations
 */
export interface DisavowRecommendations {
  totalLinksToDisavow: number;
  disavowDomains: Array<{
    domain: string;
    linkCount: number;
    avgToxicity: number;
    reason: string;
  }>;
  disavowUrls: Array<{
    url: string;
    toxicity: number;
    reason: string;
  }>;
  disavowFile: string; // Google disavow file format
  expectedImpact: {
    toxicLinksRemoved: number;
    qualityImprovement: number;
  };
}

/**
 * Backlink Quality Analyzer Service
 * Advanced backlink quality analysis and toxic link detection
 */
@Injectable()
export class BacklinkQualityAnalyzerService {
  private readonly logger = new Logger(BacklinkQualityAnalyzerService.name);

  // Quality scoring weights
  private readonly QUALITY_WEIGHTS = {
    domainAuthority: 0.25,
    pageAuthority: 0.15,
    trustFlow: 0.15,
    relevance: 0.15,
    editorial: 0.10,
    domainAge: 0.05,
    linkType: 0.10,
    spamSignals: 0.05,
  };

  // Toxic link thresholds
  private readonly TOXICITY_THRESHOLDS = {
    domainAuthority: 10, // < 10 DA is suspicious
    spamSignals: 4, // >= 4 spam signals = toxic
    outboundLinks: 100, // > 100 outbound links = link farm
  };

  // Anchor text optimization thresholds
  private readonly ANCHOR_THRESHOLDS = {
    exactMatch: 10, // Max 10% exact match
    partialMatch: 30, // Max 30% partial match
    branded: 30, // Min 30% branded
  };

  constructor(
    @InjectRepository(BacklinkAnalysis)
    private backlinkRepository: Repository<BacklinkAnalysis>,
  ) {}

  /**
   * Analyze backlink quality
   */
  async analyzeBacklink(
    projectId: string,
    request: AnalyzeLinkRequest,
  ): Promise<BacklinkAnalysis> {
    this.logger.log(`Analyzing backlink from ${request.sourceUrl}`);

    // Extract domains
    const sourceDomain = this.extractDomain(request.sourceUrl);
    const targetDomain = this.extractDomain(request.targetUrl);

    // Classify anchor text
    const anchorType = this.classifyAnchorText(request.anchorText, targetDomain);

    // Fetch source metrics (in production, from API or crawler)
    const sourceMetrics = await this.fetchSourceMetrics(request.sourceUrl);

    // Detect spam signals
    const spamSignals = await this.detectSpamSignals(request.sourceUrl, sourceMetrics);
    const spamSignalCount = Object.values(spamSignals).filter((v) => v).length;

    // Calculate relevance
    const relevanceScore = await this.calculateRelevance(
      request.sourceUrl,
      request.targetUrl,
      request.anchorText,
    );

    // Determine if editorial
    const isEditorial = await this.isEditorialLink(request.sourceUrl, sourceMetrics);

    // Calculate quality score
    const qualityScore = this.calculateQualityScore({
      domainAuthority: sourceMetrics.domainAuthority,
      pageAuthority: sourceMetrics.pageAuthority,
      trustFlow: sourceMetrics.trustFlow,
      relevanceScore,
      isEditorial,
      domainAge: sourceMetrics.domainAge,
      linkType: request.linkType || LinkType.DOFOLLOW,
      spamSignalCount,
    });

    const quality = this.getQualityLevel(qualityScore);

    // Calculate toxicity
    const toxicityScore = this.calculateToxicityScore({
      domainAuthority: sourceMetrics.domainAuthority,
      spamSignalCount,
      outboundLinks: sourceMetrics.outboundLinksOnPage,
      hasLowQualityContent: spamSignals.hasThinContent,
      hasExcessiveAds: spamSignals.hasExcessiveAds,
    });

    const isToxic = toxicityScore >= 70 || spamSignalCount >= this.TOXICITY_THRESHOLDS.spamSignals;

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      quality,
      isToxic,
      toxicityScore,
      anchorType,
      linkType: request.linkType || LinkType.DOFOLLOW,
    });

    // Determine if should disavow
    const shouldDisavow = isToxic || quality === LinkQuality.TOXIC;
    const disavowReason = shouldDisavow
      ? this.generateDisavowReason(toxicityScore, spamSignals, quality)
      : null;

    // Create analysis
    const analysis = this.backlinkRepository.create({
      projectId,
      sourceUrl: request.sourceUrl,
      targetUrl: request.targetUrl,
      sourceDomain,
      targetDomain,
      anchorText: request.anchorText,
      linkType: request.linkType || LinkType.DOFOLLOW,
      anchorType,
      qualityScore,
      quality,
      isToxic,
      toxicityScore,
      sourceDomainAuthority: sourceMetrics.domainAuthority,
      sourcePageAuthority: sourceMetrics.pageAuthority,
      sourceDomainAge: sourceMetrics.domainAge,
      sourceBacklinkCount: sourceMetrics.backlinkCount,
      sourceReferringDomains: sourceMetrics.referringDomains,
      sourceTrustFlow: sourceMetrics.trustFlow,
      sourceCitationFlow: sourceMetrics.citationFlow,
      outboundLinksOnPage: sourceMetrics.outboundLinksOnPage,
      isEditorial,
      isRelevant: relevanceScore >= 60,
      relevanceScore,
      spamSignals,
      spamSignalCount,
      firstDiscovered: request.discoveryDate || new Date(),
      lastSeen: new Date(),
      isActive: true,
      shouldDisavow,
      disavowReason,
      recommendations,
    });

    return this.backlinkRepository.save(analysis);
  }

  /**
   * Analyze multiple backlinks in batch
   */
  async analyzeBatch(
    projectId: string,
    links: AnalyzeLinkRequest[],
  ): Promise<BacklinkAnalysis[]> {
    this.logger.log(`Batch analyzing ${links.length} backlinks`);

    const analyses: BacklinkAnalysis[] = [];

    for (const link of links) {
      const analysis = await this.analyzeBacklink(projectId, link);
      analyses.push(analysis);
    }

    return analyses;
  }

  /**
   * Get backlink profile summary
   */
  async getBacklinkProfile(projectId: string): Promise<BacklinkProfile> {
    this.logger.log(`Generating backlink profile for project ${projectId}`);

    const backlinks = await this.backlinkRepository.find({
      where: { projectId },
    });

    const totalBacklinks = backlinks.length;

    // Count unique referring domains
    const referringDomains = new Set(backlinks.map((b) => b.sourceDomain));
    const totalReferringDomains = referringDomains.size;

    // Count by link type
    const dofollowLinks = backlinks.filter((b) => b.linkType === LinkType.DOFOLLOW).length;
    const nofollowLinks = totalBacklinks - dofollowLinks;

    // Quality distribution
    const qualityDistribution: Record<LinkQuality, number> = {
      [LinkQuality.EXCELLENT]: 0,
      [LinkQuality.GOOD]: 0,
      [LinkQuality.AVERAGE]: 0,
      [LinkQuality.POOR]: 0,
      [LinkQuality.TOXIC]: 0,
    };

    backlinks.forEach((b) => {
      qualityDistribution[b.quality]++;
    });

    // Average quality
    const averageQuality =
      backlinks.reduce((sum, b) => sum + b.qualityScore, 0) / (totalBacklinks || 1);

    // Toxic links
    const toxicLinks = backlinks.filter((b) => b.isToxic).length;
    const linksToDisavow = backlinks.filter((b) => b.shouldDisavow).length;

    // Top referring domains
    const domainCounts: Map<string, { count: number; totalQuality: number }> = new Map();

    backlinks.forEach((b) => {
      const current = domainCounts.get(b.sourceDomain) || { count: 0, totalQuality: 0 };
      domainCounts.set(b.sourceDomain, {
        count: current.count + 1,
        totalQuality: current.totalQuality + b.qualityScore,
      });
    });

    const topReferringDomains = Array.from(domainCounts.entries())
      .map(([domain, data]) => ({
        domain,
        linkCount: data.count,
        avgQuality: data.totalQuality / data.count,
      }))
      .sort((a, b) => b.linkCount - a.linkCount)
      .slice(0, 10);

    // Anchor text distribution
    const anchorTextDistribution: Record<AnchorTextType, number> = {
      [AnchorTextType.EXACT_MATCH]: 0,
      [AnchorTextType.PARTIAL_MATCH]: 0,
      [AnchorTextType.BRANDED]: 0,
      [AnchorTextType.NAKED_URL]: 0,
      [AnchorTextType.GENERIC]: 0,
      [AnchorTextType.IMAGE]: 0,
    };

    backlinks.forEach((b) => {
      anchorTextDistribution[b.anchorType]++;
    });

    // Link velocity
    const now = new Date();
    const last7Days = backlinks.filter(
      (b) => b.firstDiscovered >= subDays(now, 7),
    ).length;
    const last30Days = backlinks.filter(
      (b) => b.firstDiscovered >= subDays(now, 30),
    ).length;
    const last90Days = backlinks.filter(
      (b) => b.firstDiscovered >= subDays(now, 90),
    ).length;

    // Determine trend
    const prev30Days = backlinks.filter(
      (b) =>
        b.firstDiscovered >= subDays(now, 60) && b.firstDiscovered < subDays(now, 30),
    ).length;

    let trend: 'increasing' | 'stable' | 'decreasing';
    if (last30Days > prev30Days * 1.2) {
      trend = 'increasing';
    } else if (last30Days < prev30Days * 0.8) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    return {
      totalBacklinks,
      totalReferringDomains,
      dofollowLinks,
      nofollowLinks,
      qualityDistribution,
      averageQuality: Math.round(averageQuality * 100) / 100,
      toxicLinks,
      linksToDisavow,
      topReferringDomains,
      anchorTextDistribution,
      linkVelocity: {
        last7Days,
        last30Days,
        last90Days,
        trend,
      },
    };
  }

  /**
   * Analyze anchor text distribution
   */
  async analyzeAnchorText(projectId: string): Promise<AnchorTextAnalysis> {
    this.logger.log(`Analyzing anchor text for project ${projectId}`);

    const backlinks = await this.backlinkRepository.find({
      where: { projectId },
    });

    // Distribution by type
    const distribution: Record<AnchorTextType, number> = {
      [AnchorTextType.EXACT_MATCH]: 0,
      [AnchorTextType.PARTIAL_MATCH]: 0,
      [AnchorTextType.BRANDED]: 0,
      [AnchorTextType.NAKED_URL]: 0,
      [AnchorTextType.GENERIC]: 0,
      [AnchorTextType.IMAGE]: 0,
    };

    backlinks.forEach((b) => {
      distribution[b.anchorType]++;
    });

    // Calculate percentages
    const total = backlinks.length || 1;
    const percentages: Record<AnchorTextType, number> = {} as any;

    Object.keys(distribution).forEach((type) => {
      percentages[type as AnchorTextType] =
        (distribution[type as AnchorTextType] / total) * 100;
    });

    // Top anchors
    const anchorCounts: Map<string, { count: number; type: AnchorTextType }> = new Map();

    backlinks.forEach((b) => {
      const current = anchorCounts.get(b.anchorText) || { count: 0, type: b.anchorType };
      anchorCounts.set(b.anchorText, {
        count: current.count + 1,
        type: b.anchorType,
      });
    });

    const topAnchors = Array.from(anchorCounts.entries())
      .map(([text, data]) => ({
        text,
        count: data.count,
        type: data.type,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Check for over-optimization
    const exactMatchPct = percentages[AnchorTextType.EXACT_MATCH];
    const partialMatchPct = percentages[AnchorTextType.PARTIAL_MATCH];
    const brandedPct = percentages[AnchorTextType.BRANDED];

    const overOptimization =
      exactMatchPct > this.ANCHOR_THRESHOLDS.exactMatch ||
      partialMatchPct > this.ANCHOR_THRESHOLDS.partialMatch;

    const isNatural =
      !overOptimization && brandedPct >= this.ANCHOR_THRESHOLDS.branded * 0.8;

    // Generate warnings
    const warnings: string[] = [];
    if (exactMatchPct > this.ANCHOR_THRESHOLDS.exactMatch) {
      warnings.push(
        `Exact match anchor text is ${exactMatchPct.toFixed(1)}% (should be < ${this.ANCHOR_THRESHOLDS.exactMatch}%)`,
      );
    }

    if (partialMatchPct > this.ANCHOR_THRESHOLDS.partialMatch) {
      warnings.push(
        `Partial match anchor text is ${partialMatchPct.toFixed(1)}% (should be < ${this.ANCHOR_THRESHOLDS.partialMatch}%)`,
      );
    }

    if (brandedPct < this.ANCHOR_THRESHOLDS.branded) {
      warnings.push(
        `Branded anchor text is only ${brandedPct.toFixed(1)}% (should be > ${this.ANCHOR_THRESHOLDS.branded}%)`,
      );
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (overOptimization) {
      recommendations.push('Diversify anchor text to appear more natural');
      recommendations.push('Increase branded and generic anchor text usage');
    }

    if (brandedPct < this.ANCHOR_THRESHOLDS.branded) {
      recommendations.push('Build more branded backlinks');
    }

    return {
      distribution,
      percentages,
      topAnchors,
      isNatural,
      overOptimization,
      warnings,
      recommendations,
    };
  }

  /**
   * Analyze link velocity
   */
  async analyzeLinkVelocity(projectId: string): Promise<LinkVelocityAnalysis> {
    this.logger.log(`Analyzing link velocity for project ${projectId}`);

    const backlinks = await this.backlinkRepository.find({
      where: { projectId },
      order: { firstDiscovered: 'ASC' },
    });

    const now = new Date();

    // Current velocity
    const last24h = backlinks.filter(
      (b) => b.firstDiscovered >= subDays(now, 1),
    ).length;
    const last7d = backlinks.filter(
      (b) => b.firstDiscovered >= subDays(now, 7),
    ).length;
    const last30d = backlinks.filter(
      (b) => b.firstDiscovered >= subDays(now, 30),
    ).length;

    const current = {
      daily: last24h,
      weekly: last7d,
      monthly: last30d,
    };

    // Historical data (last 6 months by month)
    const historical: Array<{ period: string; count: number }> = [];

    for (let i = 0; i < 6; i++) {
      const start = subMonths(now, i + 1);
      const end = subMonths(now, i);

      const count = backlinks.filter(
        (b) => b.firstDiscovered >= start && b.firstDiscovered < end,
      ).length;

      historical.push({
        period: start.toISOString().substring(0, 7), // YYYY-MM
        count,
      });
    }

    historical.reverse(); // Oldest first

    // Determine trend
    const last3Months = historical.slice(-3).reduce((sum, h) => sum + h.count, 0) / 3;
    const previous3Months =
      historical.slice(-6, -3).reduce((sum, h) => sum + h.count, 0) / 3;

    let trend: 'accelerating' | 'steady' | 'declining' | 'suspicious';

    if (last3Months > previous3Months * 2) {
      trend = 'suspicious'; // Too fast growth
    } else if (last3Months > previous3Months * 1.2) {
      trend = 'accelerating';
    } else if (last3Months < previous3Months * 0.8) {
      trend = 'declining';
    } else {
      trend = 'steady';
    }

    // Detect anomalies
    const avgMonthly =
      historical.reduce((sum, h) => sum + h.count, 0) / (historical.length || 1);
    const stdDev = this.calculateStdDev(historical.map((h) => h.count));

    const anomalies = historical
      .filter((h) => Math.abs(h.count - avgMonthly) > stdDev * 2)
      .map((h) => ({
        date: h.period,
        count: h.count,
        expectedCount: Math.round(avgMonthly),
        deviation: Math.round(((h.count - avgMonthly) / avgMonthly) * 100),
      }));

    // Health check
    const isHealthy =
      trend !== 'suspicious' &&
      anomalies.length === 0 &&
      last30d > 0 &&
      last30d < 1000; // Not zero, not spam

    // Warnings
    const warnings: string[] = [];

    if (trend === 'suspicious') {
      warnings.push(
        'Link velocity is unusually high - may trigger spam filters',
      );
    }

    if (last30d === 0) {
      warnings.push('No new backlinks in the last 30 days');
    }

    if (last30d > 500) {
      warnings.push(
        'Very high link acquisition rate - ensure links are natural',
      );
    }

    if (anomalies.length > 0) {
      warnings.push(
        `${anomalies.length} unusual spike(s) detected in link acquisition`,
      );
    }

    return {
      current,
      historical,
      trend,
      anomalies,
      isHealthy,
      warnings,
    };
  }

  /**
   * Generate disavow recommendations
   */
  async generateDisavowRecommendations(
    projectId: string,
  ): Promise<DisavowRecommendations> {
    this.logger.log(`Generating disavow recommendations for project ${projectId}`);

    const backlinks = await this.backlinkRepository.find({
      where: { projectId },
    });

    const toDisavow = backlinks.filter((b) => b.shouldDisavow);

    // Group by domain
    const domainToxicity: Map<
      string,
      { links: BacklinkAnalysis[]; avgToxicity: number }
    > = new Map();

    toDisavow.forEach((link) => {
      if (!domainToxicity.has(link.sourceDomain)) {
        domainToxicity.set(link.sourceDomain, { links: [], avgToxicity: 0 });
      }

      const domain = domainToxicity.get(link.sourceDomain)!;
      domain.links.push(link);
    });

    // Calculate average toxicity per domain
    domainToxicity.forEach((data, domain) => {
      data.avgToxicity =
        data.links.reduce((sum, l) => sum + l.toxicityScore, 0) / data.links.length;
    });

    // Domains to disavow (disavow entire domain if >80% of links are toxic)
    const disavowDomains = Array.from(domainToxicity.entries())
      .filter(([_, data]) => data.avgToxicity >= 70 || data.links.length >= 5)
      .map(([domain, data]) => ({
        domain,
        linkCount: data.links.length,
        avgToxicity: Math.round(data.avgToxicity * 100) / 100,
        reason: this.generateDomainDisavowReason(data),
      }))
      .sort((a, b) => b.avgToxicity - a.avgToxicity);

    // Individual URLs to disavow (from otherwise good domains)
    const domainsToDisavowSet = new Set(disavowDomains.map((d) => d.domain));
    const disavowUrls = toDisavow
      .filter((link) => !domainsToDisavowSet.has(link.sourceDomain))
      .map((link) => ({
        url: link.sourceUrl,
        toxicity: link.toxicityScore,
        reason: link.disavowReason || 'Low quality link',
      }))
      .sort((a, b) => b.toxicity - a.toxicity);

    // Generate Google disavow file
    const disavowFile = this.generateDisavowFile(disavowDomains, disavowUrls);

    // Calculate expected impact
    const toxicLinksRemoved = toDisavow.length;
    const currentAvgQuality =
      backlinks.reduce((sum, b) => sum + b.qualityScore, 0) / (backlinks.length || 1);
    const remainingLinks = backlinks.filter((b) => !b.shouldDisavow);
    const newAvgQuality =
      remainingLinks.reduce((sum, b) => sum + b.qualityScore, 0) /
      (remainingLinks.length || 1);
    const qualityImprovement = newAvgQuality - currentAvgQuality;

    return {
      totalLinksToDisavow: toDisavow.length,
      disavowDomains,
      disavowUrls,
      disavowFile,
      expectedImpact: {
        toxicLinksRemoved,
        qualityImprovement: Math.round(qualityImprovement * 100) / 100,
      },
    };
  }

  /**
   * Get toxic backlinks
   */
  async getToxicBacklinks(projectId: string): Promise<BacklinkAnalysis[]> {
    return this.backlinkRepository.find({
      where: { projectId, isToxic: true },
      order: { toxicityScore: 'DESC' },
    });
  }

  /**
   * Get high-quality backlinks
   */
  async getHighQualityBacklinks(projectId: string): Promise<BacklinkAnalysis[]> {
    return this.backlinkRepository.find({
      where: { projectId },
      order: { qualityScore: 'DESC' },
      take: 100,
    });
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  /**
   * Fetch source metrics (mock - in production would use API)
   */
  private async fetchSourceMetrics(url: string): Promise<{
    domainAuthority: number;
    pageAuthority: number;
    trustFlow: number;
    citationFlow: number;
    domainAge: number;
    backlinkCount: number;
    referringDomains: number;
    outboundLinksOnPage: number;
  }> {
    // In production: fetch from Moz, Majestic, or Ahrefs API
    // For now, return mock data with some variance
    return {
      domainAuthority: Math.floor(Math.random() * 100),
      pageAuthority: Math.floor(Math.random() * 100),
      trustFlow: Math.floor(Math.random() * 100),
      citationFlow: Math.floor(Math.random() * 100),
      domainAge: Math.floor(Math.random() * 3650) + 365, // 1-10 years
      backlinkCount: Math.floor(Math.random() * 100000),
      referringDomains: Math.floor(Math.random() * 10000),
      outboundLinksOnPage: Math.floor(Math.random() * 150),
    };
  }

  /**
   * Detect spam signals
   */
  private async detectSpamSignals(url: string, metrics: any): Promise<any> {
    // In production: analyze page content
    return {
      hasExcessiveAds: metrics.outboundLinksOnPage > 50,
      hasThinContent: false, // Would check word count
      hasExactMatchAnchor: false, // Would analyze anchor text
      hasUnrelatedContent: false, // Would check topical relevance
      hasLowQualityDesign: metrics.domainAuthority < 20,
      hasSuspiciousTLD: this.hasSuspiciousTLD(url),
      hasNoIndex: false, // Would check meta robots
    };
  }

  /**
   * Check for suspicious TLD
   */
  private hasSuspiciousTLD(url: string): boolean {
    const suspiciousTLDs = ['.xyz', '.top', '.click', '.link', '.loan', '.download'];
    return suspiciousTLDs.some((tld) => url.includes(tld));
  }

  /**
   * Calculate relevance between source and target
   */
  private async calculateRelevance(
    sourceUrl: string,
    targetUrl: string,
    anchorText: string,
  ): Promise<number> {
    // In production: use NLP/topic modeling
    // For now, simple heuristic based on anchor text
    return Math.random() * 100;
  }

  /**
   * Check if link is editorial (in content vs sidebar/footer)
   */
  private async isEditorialLink(url: string, metrics: any): Promise<boolean> {
    // In production: analyze link placement
    // Heuristic: fewer outbound links = more likely editorial
    return metrics.outboundLinksOnPage < 30;
  }

  /**
   * Calculate quality score
   */
  private calculateQualityScore(params: {
    domainAuthority: number;
    pageAuthority: number;
    trustFlow: number;
    relevanceScore: number;
    isEditorial: boolean;
    domainAge: number;
    linkType: LinkType;
    spamSignalCount: number;
  }): number {
    let score = 0;

    // Domain authority (0-25 points)
    score += (params.domainAuthority / 100) * 25 * this.QUALITY_WEIGHTS.domainAuthority;

    // Page authority (0-15 points)
    score += (params.pageAuthority / 100) * 15 * this.QUALITY_WEIGHTS.pageAuthority;

    // Trust flow (0-15 points)
    score += (params.trustFlow / 100) * 15 * this.QUALITY_WEIGHTS.trustFlow;

    // Relevance (0-15 points)
    score += (params.relevanceScore / 100) * 15 * this.QUALITY_WEIGHTS.relevance;

    // Editorial (0-10 points)
    if (params.isEditorial) {
      score += 10 * this.QUALITY_WEIGHTS.editorial;
    }

    // Domain age (0-5 points) - older is better
    const ageYears = params.domainAge / 365;
    score += Math.min(5, ageYears) * this.QUALITY_WEIGHTS.domainAge;

    // Link type (0-10 points)
    if (params.linkType === LinkType.DOFOLLOW) {
      score += 10 * this.QUALITY_WEIGHTS.linkType;
    } else if (params.linkType === LinkType.NOFOLLOW) {
      score += 5 * this.QUALITY_WEIGHTS.linkType;
    }

    // Spam penalty (0--5 points)
    score -= params.spamSignalCount * 5 * this.QUALITY_WEIGHTS.spamSignals;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate toxicity score
   */
  private calculateToxicityScore(params: {
    domainAuthority: number;
    spamSignalCount: number;
    outboundLinks: number;
    hasLowQualityContent: boolean;
    hasExcessiveAds: boolean;
  }): number {
    let toxicity = 0;

    // Low DA
    if (params.domainAuthority < this.TOXICITY_THRESHOLDS.domainAuthority) {
      toxicity += 30;
    }

    // Spam signals (10 points each)
    toxicity += params.spamSignalCount * 10;

    // Excessive outbound links (link farm)
    if (params.outboundLinks > this.TOXICITY_THRESHOLDS.outboundLinks) {
      toxicity += 20;
    }

    // Low quality content
    if (params.hasLowQualityContent) {
      toxicity += 15;
    }

    // Excessive ads
    if (params.hasExcessiveAds) {
      toxicity += 10;
    }

    return Math.min(100, toxicity);
  }

  /**
   * Get quality level from score
   */
  private getQualityLevel(score: number): LinkQuality {
    if (score >= 80) return LinkQuality.EXCELLENT;
    if (score >= 60) return LinkQuality.GOOD;
    if (score >= 40) return LinkQuality.AVERAGE;
    if (score >= 20) return LinkQuality.POOR;
    return LinkQuality.TOXIC;
  }

  /**
   * Classify anchor text type
   */
  private classifyAnchorText(anchorText: string, targetDomain: string): AnchorTextType {
    const lower = anchorText.toLowerCase();

    // Image
    if (lower.includes('<img') || lower === '') {
      return AnchorTextType.IMAGE;
    }

    // Naked URL
    if (lower.includes('http://') || lower.includes('https://') || lower.includes(targetDomain)) {
      return AnchorTextType.NAKED_URL;
    }

    // Generic
    const genericPhrases = [
      'click here',
      'read more',
      'learn more',
      'visit',
      'website',
      'here',
    ];
    if (genericPhrases.some((phrase) => lower.includes(phrase))) {
      return AnchorTextType.GENERIC;
    }

    // Branded (contains brand name from domain)
    const brandName = targetDomain.split('.')[0];
    if (lower.includes(brandName)) {
      return AnchorTextType.BRANDED;
    }

    // Exact vs partial match (simplified - in production would compare to target keywords)
    // For now, assume partial match as default
    return AnchorTextType.PARTIAL_MATCH;
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(params: {
    quality: LinkQuality;
    isToxic: boolean;
    toxicityScore: number;
    anchorType: AnchorTextType;
    linkType: LinkType;
  }): Array<{ type: string; action: string; priority: string }> {
    const recommendations = [];

    if (params.isToxic || params.quality === LinkQuality.TOXIC) {
      recommendations.push({
        type: 'disavow',
        action: 'Add to Google Disavow File',
        priority: 'high',
      });
    }

    if (params.quality === LinkQuality.POOR && params.toxicityScore < 70) {
      recommendations.push({
        type: 'monitor',
        action: 'Monitor for quality changes',
        priority: 'medium',
      });
    }

    if (params.linkType !== LinkType.DOFOLLOW && params.quality === LinkQuality.EXCELLENT) {
      recommendations.push({
        type: 'outreach',
        action: 'Request conversion to dofollow link',
        priority: 'medium',
      });
    }

    if (params.anchorType === AnchorTextType.EXACT_MATCH) {
      recommendations.push({
        type: 'anchor_diversity',
        action: 'Build more diverse anchor text',
        priority: 'low',
      });
    }

    return recommendations;
  }

  /**
   * Generate disavow reason
   */
  private generateDisavowReason(
    toxicityScore: number,
    spamSignals: any,
    quality: LinkQuality,
  ): string {
    const reasons: string[] = [];

    if (quality === LinkQuality.TOXIC) {
      reasons.push('Very low quality link');
    }

    if (toxicityScore >= 80) {
      reasons.push('High toxicity score');
    }

    if (spamSignals.hasExcessiveAds) {
      reasons.push('Excessive advertising');
    }

    if (spamSignals.hasThinContent) {
      reasons.push('Thin content');
    }

    if (spamSignals.hasLowQualityDesign) {
      reasons.push('Low quality website');
    }

    return reasons.join('; ') || 'Toxic link detected';
  }

  /**
   * Generate domain disavow reason
   */
  private generateDomainDisavowReason(data: {
    links: BacklinkAnalysis[];
    avgToxicity: number;
  }): string {
    if (data.avgToxicity >= 80) {
      return 'Extremely toxic domain';
    } else if (data.links.length >= 10) {
      return 'Multiple low-quality links from this domain';
    } else {
      return 'High toxicity score';
    }
  }

  /**
   * Generate Google disavow file
   */
  private generateDisavowFile(
    domains: Array<{ domain: string }>,
    urls: Array<{ url: string }>,
  ): string {
    const lines: string[] = [];

    // Add header comment
    lines.push('# Disavow file generated by SEO Intelligence Platform');
    lines.push(`# Generated: ${new Date().toISOString()}`);
    lines.push('');

    // Add domains
    if (domains.length > 0) {
      lines.push('# Toxic domains');
      domains.forEach((d) => {
        lines.push(`domain:${d.domain}`);
      });
      lines.push('');
    }

    // Add individual URLs
    if (urls.length > 0) {
      lines.push('# Individual toxic URLs');
      urls.forEach((u) => {
        lines.push(u.url);
      });
    }

    return lines.join('\n');
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(values: number[]): number {
    const avg = values.reduce((sum, v) => sum + v, 0) / (values.length || 1);
    const squareDiffs = values.map((v) => Math.pow(v - avg, 2));
    const avgSquareDiff =
      squareDiffs.reduce((sum, v) => sum + v, 0) / (values.length || 1);
    return Math.sqrt(avgSquareDiff);
  }
}
