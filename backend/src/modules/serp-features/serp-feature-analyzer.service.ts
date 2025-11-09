import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SerpFeatureAnalysis,
  SerpFeatureType,
  FeaturePosition,
  OpportunityLevel,
} from './entities/serp-feature-analysis.entity';

/**
 * SERP Feature Impact Summary
 */
export interface SerpFeatureImpactSummary {
  totalFeatures: number;
  featuresYouOwn: number;
  featuresYouDontOwn: number;
  highOpportunities: number;
  estimatedTrafficLoss: number;
  estimatedTrafficGain: number;
  netImpact: number;
  featureDistribution: Record<SerpFeatureType, number>;
  topOpportunities: SerpFeatureAnalysis[];
}

/**
 * Feature Optimization Strategy
 */
export interface FeatureOptimizationStrategy {
  featureType: SerpFeatureType;
  keyword: string;
  currentState: {
    hasFeature: boolean;
    youOwnIt: boolean;
    currentOwner?: string;
  };
  strategy: string;
  actionItems: Array<{
    step: number;
    action: string;
    effort: 'low' | 'medium' | 'high';
    impact: number;
  }>;
  estimatedTimeToWin: string;
  successProbability: number;
  expectedTraffic: number;
}

/**
 * CTR Impact Factors
 */
const CTR_IMPACT_BY_FEATURE: Record<SerpFeatureType, number> = {
  [SerpFeatureType.FEATURED_SNIPPET]: -25, // Featured snippets reduce clicks by ~25%
  [SerpFeatureType.PEOPLE_ALSO_ASK]: -10,
  [SerpFeatureType.LOCAL_PACK]: -40, // Local packs dominate local searches
  [SerpFeatureType.KNOWLEDGE_PANEL]: -15,
  [SerpFeatureType.IMAGE_PACK]: -8,
  [SerpFeatureType.VIDEO_CAROUSEL]: -12,
  [SerpFeatureType.TOP_STORIES]: -20,
  [SerpFeatureType.SHOPPING_RESULTS]: -30,
  [SerpFeatureType.SITELINKS]: +50, // Sitelinks increase CTR
  [SerpFeatureType.REVIEWS]: +15,
  [SerpFeatureType.JOBS]: -25,
  [SerpFeatureType.EVENTS]: -15,
};

/**
 * SERP Feature Analyzer Service
 * Analyzes impact of SERP features on visibility and CTR
 */
@Injectable()
export class SerpFeatureAnalyzerService {
  private readonly logger = new Logger(SerpFeatureAnalyzerService.name);

  constructor(
    @InjectRepository(SerpFeatureAnalysis)
    private analysisRepository: Repository<SerpFeatureAnalysis>,
  ) {}

  /**
   * Analyze SERP feature for a keyword
   */
  async analyzeFeature(
    projectId: string,
    params: {
      keyword: string;
      searchVolume: number;
      featureType: SerpFeatureType;
      position: FeaturePosition;
      featureUrl?: string;
      featureContent?: string;
      yourDomain: string;
      yourCurrentRank?: number;
    },
  ): Promise<SerpFeatureAnalysis> {
    this.logger.log(`Analyzing ${params.featureType} for keyword: ${params.keyword}`);

    const featureDomain = params.featureUrl
      ? this.extractDomain(params.featureUrl)
      : null;
    const youOwnFeature = featureDomain === params.yourDomain;

    // Calculate CTR impact
    const ctrImpact = this.calculateCTRImpact(
      params.featureType,
      params.position,
      youOwnFeature,
      params.yourCurrentRank,
    );

    // Calculate traffic impact
    const { trafficLoss, trafficGain } = this.calculateTrafficImpact(
      params.searchVolume,
      ctrImpact,
      youOwnFeature,
      params.yourCurrentRank,
    );

    // Calculate visibility impact
    const visibilityImpact = this.calculateVisibilityImpact(
      params.featureType,
      params.position,
      youOwnFeature,
    );

    // Analyze opportunity
    const { opportunityLevel, opportunityScore, canWinFeature, winProbability } =
      this.analyzeOpportunity(
        params.featureType,
        params.yourCurrentRank,
        params.searchVolume,
        youOwnFeature,
      );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      params.featureType,
      youOwnFeature,
      params.yourCurrentRank,
      opportunityLevel,
    );

    // Optimization tips
    const optimizationTips = this.generateOptimizationTips(
      params.featureType,
      params.featureContent,
    );

    // Create analysis
    const analysis = this.analysisRepository.create({
      projectId,
      keyword: params.keyword,
      searchVolume: params.searchVolume,
      featureType: params.featureType,
      position: params.position,
      youOwnFeature,
      featureUrl: params.featureUrl,
      featureDomain,
      featureContent: params.featureContent,
      ctrImpact,
      estimatedTrafficLoss: trafficLoss,
      estimatedTrafficGain: trafficGain,
      visibilityImpact,
      competitorCount: 0, // Would be populated from SERP data
      competitors: [],
      opportunityLevel,
      opportunityScore,
      canWinFeature,
      winProbability,
      recommendations,
      optimizationTips,
      firstSeen: new Date(),
      lastSeen: new Date(),
      isActive: true,
      seenCount: 1,
    });

    return this.analysisRepository.save(analysis);
  }

  /**
   * Get SERP feature impact summary
   */
  async getImpactSummary(projectId: string): Promise<SerpFeatureImpactSummary> {
    this.logger.log(`Generating SERP feature impact summary for project ${projectId}`);

    const features = await this.analysisRepository.find({
      where: { projectId, isActive: true },
    });

    const totalFeatures = features.length;
    const featuresYouOwn = features.filter((f) => f.youOwnFeature).length;
    const featuresYouDontOwn = totalFeatures - featuresYouOwn;
    const highOpportunities = features.filter(
      (f) => f.opportunityLevel === OpportunityLevel.HIGH && !f.youOwnFeature,
    ).length;

    const estimatedTrafficLoss = features
      .filter((f) => !f.youOwnFeature)
      .reduce((sum, f) => sum + f.estimatedTrafficLoss, 0);

    const estimatedTrafficGain = features
      .filter((f) => f.youOwnFeature)
      .reduce((sum, f) => sum + f.estimatedTrafficGain, 0);

    const netImpact = estimatedTrafficGain - estimatedTrafficLoss;

    // Feature distribution
    const featureDistribution: Record<SerpFeatureType, number> = {} as any;
    Object.values(SerpFeatureType).forEach((type) => {
      featureDistribution[type] = features.filter((f) => f.featureType === type).length;
    });

    // Top opportunities
    const topOpportunities = features
      .filter((f) => !f.youOwnFeature && f.canWinFeature)
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 10);

    return {
      totalFeatures,
      featuresYouOwn,
      featuresYouDontOwn,
      highOpportunities,
      estimatedTrafficLoss,
      estimatedTrafficGain,
      netImpact,
      featureDistribution,
      topOpportunities,
    };
  }

  /**
   * Get optimization strategies for winning features
   */
  async getOptimizationStrategies(
    projectId: string,
    limit: number = 10,
  ): Promise<FeatureOptimizationStrategy[]> {
    this.logger.log(`Generating optimization strategies for project ${projectId}`);

    const opportunities = await this.analysisRepository.find({
      where: {
        projectId,
        isActive: true,
        canWinFeature: true,
        youOwnFeature: false,
      },
      order: { opportunityScore: 'DESC' },
      take: limit,
    });

    return opportunities.map((opp) => this.createOptimizationStrategy(opp));
  }

  /**
   * Get features by type
   */
  async getFeaturesByType(
    projectId: string,
    featureType: SerpFeatureType,
  ): Promise<SerpFeatureAnalysis[]> {
    return this.analysisRepository.find({
      where: { projectId, featureType, isActive: true },
      order: { searchVolume: 'DESC' },
    });
  }

  /**
   * Get features you own
   */
  async getFeaturesYouOwn(projectId: string): Promise<SerpFeatureAnalysis[]> {
    return this.analysisRepository.find({
      where: { projectId, youOwnFeature: true, isActive: true },
      order: { estimatedTrafficGain: 'DESC' },
    });
  }

  /**
   * Get high-opportunity features
   */
  async getHighOpportunityFeatures(projectId: string): Promise<SerpFeatureAnalysis[]> {
    return this.analysisRepository.find({
      where: {
        projectId,
        opportunityLevel: OpportunityLevel.HIGH,
        youOwnFeature: false,
        isActive: true,
      },
      order: { opportunityScore: 'DESC' },
    });
  }

  // ========================================
  // Private Calculation Methods
  // ========================================

  /**
   * Calculate CTR impact
   */
  private calculateCTRImpact(
    featureType: SerpFeatureType,
    position: FeaturePosition,
    youOwnIt: boolean,
    yourCurrentRank?: number,
  ): number {
    let baseCTRImpact = CTR_IMPACT_BY_FEATURE[featureType] || 0;

    // If you own the feature, impact is positive
    if (youOwnIt) {
      baseCTRImpact = Math.abs(baseCTRImpact) * 1.5;
    }

    // Adjust based on position
    if (position === FeaturePosition.ABOVE_ORGANIC) {
      baseCTRImpact *= 1.5; // More impact if above organic
    } else if (position === FeaturePosition.RIGHT_SIDEBAR) {
      baseCTRImpact *= 0.5; // Less impact if sidebar
    }

    // Adjust based on your current rank
    if (yourCurrentRank) {
      if (yourCurrentRank <= 3) {
        // If you're already ranking well, feature has more impact
        baseCTRImpact *= 1.2;
      } else if (yourCurrentRank > 10) {
        // If you're ranking poorly, less impact
        baseCTRImpact *= 0.7;
      }
    }

    return Math.round(baseCTRImpact * 100) / 100;
  }

  /**
   * Calculate traffic impact
   */
  private calculateTrafficImpact(
    searchVolume: number,
    ctrImpact: number,
    youOwnIt: boolean,
    yourCurrentRank?: number,
  ): { trafficLoss: number; trafficGain: number } {
    // Base CTR by rank position
    const baseCTR = yourCurrentRank
      ? this.getCTRByPosition(yourCurrentRank)
      : 0.05;

    const baseTraffic = Math.round(searchVolume * baseCTR);

    if (youOwnIt) {
      // You own the feature - calculate gain
      const newCTR = baseCTR * (1 + ctrImpact / 100);
      const newTraffic = Math.round(searchVolume * newCTR);
      return {
        trafficLoss: 0,
        trafficGain: Math.max(0, newTraffic - baseTraffic),
      };
    } else {
      // You don't own the feature - calculate loss
      const newCTR = baseCTR * (1 + ctrImpact / 100);
      const newTraffic = Math.round(searchVolume * Math.max(0, newCTR));
      return {
        trafficLoss: Math.max(0, baseTraffic - newTraffic),
        trafficGain: 0,
      };
    }
  }

  /**
   * Get CTR by position
   */
  private getCTRByPosition(position: number): number {
    const ctrByPosition: Record<number, number> = {
      1: 0.31,
      2: 0.24,
      3: 0.18,
      4: 0.13,
      5: 0.09,
      6: 0.06,
      7: 0.04,
      8: 0.03,
      9: 0.025,
      10: 0.02,
    };

    if (position <= 10) {
      return ctrByPosition[position] || 0.01;
    } else if (position <= 20) {
      return 0.01;
    } else {
      return 0.005;
    }
  }

  /**
   * Calculate visibility impact
   */
  private calculateVisibilityImpact(
    featureType: SerpFeatureType,
    position: FeaturePosition,
    youOwnIt: boolean,
  ): number {
    let score = 50; // Base visibility

    // Feature type impact
    const highImpactFeatures = [
      SerpFeatureType.FEATURED_SNIPPET,
      SerpFeatureType.LOCAL_PACK,
      SerpFeatureType.KNOWLEDGE_PANEL,
    ];

    if (highImpactFeatures.includes(featureType)) {
      score += 30;
    } else {
      score += 15;
    }

    // Position impact
    if (position === FeaturePosition.ABOVE_ORGANIC) {
      score += 20;
    } else if (position === FeaturePosition.WITHIN_ORGANIC) {
      score += 10;
    }

    // Ownership
    if (youOwnIt) {
      score = Math.min(100, score);
    } else {
      score = Math.max(0, 100 - score); // Inverse if you don't own it
    }

    return score;
  }

  /**
   * Analyze opportunity
   */
  private analyzeOpportunity(
    featureType: SerpFeatureType,
    yourCurrentRank: number | undefined,
    searchVolume: number,
    youOwnIt: boolean,
  ): {
    opportunityLevel: OpportunityLevel;
    opportunityScore: number;
    canWinFeature: boolean;
    winProbability: number;
  } {
    if (youOwnIt) {
      return {
        opportunityLevel: OpportunityLevel.NONE,
        opportunityScore: 0,
        canWinFeature: false,
        winProbability: 0,
      };
    }

    let opportunityScore = 0;
    let canWinFeature = false;
    let winProbability = 0;

    // Search volume component (0-40 points)
    opportunityScore += Math.min(40, (searchVolume / 100) * 2);

    // Ranking component (0-40 points)
    if (yourCurrentRank) {
      if (yourCurrentRank <= 5) {
        opportunityScore += 40;
        canWinFeature = true;
        winProbability = 80 - yourCurrentRank * 10;
      } else if (yourCurrentRank <= 10) {
        opportunityScore += 30;
        canWinFeature = true;
        winProbability = 60 - yourCurrentRank * 5;
      } else if (yourCurrentRank <= 20) {
        opportunityScore += 15;
        canWinFeature = true;
        winProbability = 30 - yourCurrentRank * 1;
      } else {
        opportunityScore += 5;
        canWinFeature = false;
        winProbability = 10;
      }
    }

    // Feature type component (0-20 points)
    const highValueFeatures = [
      SerpFeatureType.FEATURED_SNIPPET,
      SerpFeatureType.LOCAL_PACK,
      SerpFeatureType.SITELINKS,
    ];

    if (highValueFeatures.includes(featureType)) {
      opportunityScore += 20;
    } else {
      opportunityScore += 10;
    }

    opportunityScore = Math.min(100, opportunityScore);

    // Determine opportunity level
    let opportunityLevel: OpportunityLevel;
    if (opportunityScore >= 75) {
      opportunityLevel = OpportunityLevel.HIGH;
    } else if (opportunityScore >= 50) {
      opportunityLevel = OpportunityLevel.MEDIUM;
    } else if (opportunityScore >= 25) {
      opportunityLevel = OpportunityLevel.LOW;
    } else {
      opportunityLevel = OpportunityLevel.NONE;
    }

    return {
      opportunityLevel,
      opportunityScore: Math.round(opportunityScore),
      canWinFeature,
      winProbability: Math.round(winProbability),
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    featureType: SerpFeatureType,
    youOwnIt: boolean,
    yourCurrentRank: number | undefined,
    opportunityLevel: OpportunityLevel,
  ): Array<{ type: string; action: string; priority: string; estimatedImpact: number }> {
    const recommendations = [];

    if (!youOwnIt && opportunityLevel !== OpportunityLevel.NONE) {
      // Recommendations for winning the feature
      switch (featureType) {
        case SerpFeatureType.FEATURED_SNIPPET:
          recommendations.push({
            type: 'content_optimization',
            action: 'Add concise, direct answer in first paragraph (40-60 words)',
            priority: 'high',
            estimatedImpact: 70,
          });
          recommendations.push({
            type: 'schema_markup',
            action: 'Implement FAQ or HowTo schema markup',
            priority: 'high',
            estimatedImpact: 50,
          });
          recommendations.push({
            type: 'heading_structure',
            action: 'Use clear H2/H3 headings with question format',
            priority: 'medium',
            estimatedImpact: 40,
          });
          break;

        case SerpFeatureType.PEOPLE_ALSO_ASK:
          recommendations.push({
            type: 'faq_content',
            action: 'Create comprehensive FAQ section addressing related questions',
            priority: 'medium',
            estimatedImpact: 60,
          });
          recommendations.push({
            type: 'question_targeting',
            action: 'Target question-based keywords in headings',
            priority: 'medium',
            estimatedImpact: 50,
          });
          break;

        case SerpFeatureType.LOCAL_PACK:
          recommendations.push({
            type: 'gmb_optimization',
            action: 'Optimize Google My Business profile',
            priority: 'high',
            estimatedImpact: 80,
          });
          recommendations.push({
            type: 'local_citations',
            action: 'Build consistent NAP citations across directories',
            priority: 'high',
            estimatedImpact: 60,
          });
          break;

        case SerpFeatureType.SITELINKS:
          recommendations.push({
            type: 'site_structure',
            action: 'Improve internal linking and site architecture',
            priority: 'medium',
            estimatedImpact: 70,
          });
          recommendations.push({
            type: 'brand_authority',
            action: 'Build brand authority and direct searches',
            priority: 'low',
            estimatedImpact: 50,
          });
          break;
      }
    }

    if (youOwnIt) {
      // Recommendations for maintaining the feature
      recommendations.push({
        type: 'monitoring',
        action: 'Monitor feature presence daily to detect changes',
        priority: 'high',
        estimatedImpact: 100,
      });
      recommendations.push({
        type: 'content_refresh',
        action: 'Keep content fresh and updated',
        priority: 'medium',
        estimatedImpact: 80,
      });
    }

    return recommendations;
  }

  /**
   * Generate optimization tips
   */
  private generateOptimizationTips(
    featureType: SerpFeatureType,
    currentContent?: string,
  ): string {
    const tips: Record<SerpFeatureType, string> = {
      [SerpFeatureType.FEATURED_SNIPPET]:
        'To win featured snippets: Use clear, concise answers (40-60 words), format with lists or tables, use question-based headings, and implement structured data.',
      [SerpFeatureType.PEOPLE_ALSO_ASK]:
        'To appear in PAA: Create comprehensive FAQ content, use question format in H2/H3 headings, provide direct answers, and cover related topics thoroughly.',
      [SerpFeatureType.LOCAL_PACK]:
        'To rank in local pack: Optimize GMB profile, gather positive reviews, build local citations, ensure NAP consistency, and create location-specific content.',
      [SerpFeatureType.KNOWLEDGE_PANEL]:
        'To get a knowledge panel: Build strong brand presence, optimize Wikipedia entry, ensure consistent structured data, and establish authority in your niche.',
      [SerpFeatureType.IMAGE_PACK]:
        'To appear in image pack: Use high-quality images, optimize alt text and file names, implement image schema, and ensure images are crawlable.',
      [SerpFeatureType.VIDEO_CAROUSEL]:
        'To rank in video carousel: Create video content, optimize YouTube SEO, add video schema markup, and ensure videos are embedded on your site.',
      [SerpFeatureType.TOP_STORIES]:
        'To appear in top stories: Publish timely news content, use Article schema, maintain strong domain authority, and ensure fast loading speed.',
      [SerpFeatureType.SHOPPING_RESULTS]:
        'To appear in shopping results: Set up Google Merchant Center, implement Product schema, optimize product titles and descriptions, and maintain competitive pricing.',
      [SerpFeatureType.SITELINKS]:
        'To get sitelinks: Build strong site architecture, use clear navigation, implement breadcrumb schema, and establish brand authority.',
      [SerpFeatureType.REVIEWS]:
        'To show review stars: Implement Review schema markup, gather authentic reviews, maintain high ratings, and ensure markup is valid.',
      [SerpFeatureType.JOBS]:
        'To appear in job listings: Use JobPosting schema markup, include clear job details, keep listings fresh, and use structured data.',
      [SerpFeatureType.EVENTS]:
        'To appear in events: Use Event schema markup, provide complete event details, keep information accurate, and update regularly.',
    };

    return tips[featureType] || 'Optimize your content for this SERP feature type.';
  }

  /**
   * Create optimization strategy
   */
  private createOptimizationStrategy(
    analysis: SerpFeatureAnalysis,
  ): FeatureOptimizationStrategy {
    const actionItems = this.getActionItemsForFeature(analysis.featureType);

    const estimatedTimeToWin = this.estimateTimeToWin(
      analysis.featureType,
      analysis.winProbability || 0,
    );

    return {
      featureType: analysis.featureType,
      keyword: analysis.keyword,
      currentState: {
        hasFeature: true,
        youOwnIt: analysis.youOwnFeature,
        currentOwner: analysis.featureDomain || undefined,
      },
      strategy: this.getStrategyDescription(analysis.featureType),
      actionItems,
      estimatedTimeToWin,
      successProbability: analysis.winProbability || 0,
      expectedTraffic: analysis.estimatedTrafficLoss,
    };
  }

  /**
   * Get action items for feature type
   */
  private getActionItemsForFeature(
    featureType: SerpFeatureType,
  ): Array<{ step: number; action: string; effort: 'low' | 'medium' | 'high'; impact: number }> {
    const actionsByFeature: Record<
      SerpFeatureType,
      Array<{ action: string; effort: 'low' | 'medium' | 'high'; impact: number }>
    > = {
      [SerpFeatureType.FEATURED_SNIPPET]: [
        { action: 'Research current featured snippet format', effort: 'low', impact: 90 },
        { action: 'Create concise, direct answer (40-60 words)', effort: 'low', impact: 95 },
        { action: 'Format with bullet points or tables', effort: 'low', impact: 85 },
        { action: 'Add FAQ or HowTo schema markup', effort: 'medium', impact: 70 },
        { action: 'Monitor and iterate based on results', effort: 'low', impact: 80 },
      ],
      [SerpFeatureType.LOCAL_PACK]: [
        { action: 'Claim and optimize Google My Business', effort: 'medium', impact: 100 },
        { action: 'Add high-quality photos and posts', effort: 'low', impact: 70 },
        { action: 'Gather customer reviews', effort: 'medium', impact: 90 },
        { action: 'Build local citations', effort: 'high', impact: 80 },
        { action: 'Create location-specific content', effort: 'medium', impact: 75 },
      ],
      [SerpFeatureType.PEOPLE_ALSO_ASK]: [
        { action: 'Identify related questions', effort: 'low', impact: 85 },
        { action: 'Create comprehensive FAQ section', effort: 'medium', impact: 90 },
        { action: 'Use question format in H2 headings', effort: 'low', impact: 80 },
        { action: 'Implement FAQ schema markup', effort: 'low', impact: 70 },
      ],
      // Add more feature types...
    } as any;

    const actions = actionsByFeature[featureType] || [
      { action: 'Research SERP feature requirements', effort: 'low', impact: 70 },
      { action: 'Optimize content for feature', effort: 'medium', impact: 80 },
      { action: 'Implement appropriate schema markup', effort: 'medium', impact: 75 },
    ];

    return actions.map((action, index) => ({
      step: index + 1,
      ...action,
    }));
  }

  /**
   * Get strategy description
   */
  private getStrategyDescription(featureType: SerpFeatureType): string {
    const strategies: Record<SerpFeatureType, string> = {
      [SerpFeatureType.FEATURED_SNIPPET]:
        'Win the featured snippet by providing the most concise, well-structured answer to the query',
      [SerpFeatureType.LOCAL_PACK]:
        'Dominate local search by optimizing your Google My Business presence and building local authority',
      [SerpFeatureType.PEOPLE_ALSO_ASK]:
        'Capture PAA placements by comprehensively answering related questions in FAQ format',
      [SerpFeatureType.SITELINKS]:
        'Earn sitelinks by establishing brand authority and clear site architecture',
      [SerpFeatureType.KNOWLEDGE_PANEL]:
        'Build knowledge panel by establishing authoritative brand presence across the web',
      [SerpFeatureType.IMAGE_PACK]:
        'Rank images by optimizing image quality, alt text, and implementing image schema',
      [SerpFeatureType.VIDEO_CAROUSEL]:
        'Appear in video results by creating optimized video content with proper schema',
      [SerpFeatureType.TOP_STORIES]:
        'Get featured in news by publishing timely, authoritative content with Article schema',
      [SerpFeatureType.SHOPPING_RESULTS]:
        'Show in shopping results by setting up Merchant Center and Product schema',
      [SerpFeatureType.REVIEWS]:
        'Display review stars by implementing Review schema and gathering authentic reviews',
      [SerpFeatureType.JOBS]:
        'List in job results by using JobPosting schema with complete job details',
      [SerpFeatureType.EVENTS]:
        'Feature in events by implementing Event schema with accurate event information',
    };

    return strategies[featureType] || 'Optimize for this SERP feature';
  }

  /**
   * Estimate time to win feature
   */
  private estimateTimeToWin(featureType: SerpFeatureType, winProbability: number): string {
    if (winProbability >= 70) {
      return '1-2 weeks';
    } else if (winProbability >= 50) {
      return '2-4 weeks';
    } else if (winProbability >= 30) {
      return '1-2 months';
    } else {
      return '2-3 months';
    }
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
}
