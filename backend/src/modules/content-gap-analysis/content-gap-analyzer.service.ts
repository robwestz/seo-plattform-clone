import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ContentGap, GapType, GapPriority } from './entities/content-gap.entity';
import { KeywordService } from '../keywords/keyword.service';
import { SerpAnalyzerService } from '../rankings/serp-analyzer.service';
import { ContentQualityService } from '../content-analysis/content-quality.service';

/**
 * Competitor Content Data
 */
export interface CompetitorContent {
  url: string;
  domain: string;
  title: string;
  wordCount: number;
  rank: number;
  keywords: string[];
  topics: string[];
  headings: string[];
  hasVideo: boolean;
  hasImages: boolean;
  hasFaq: boolean;
  lastUpdated?: Date;
}

/**
 * Gap Analysis Request
 */
export interface GapAnalysisRequest {
  projectId: string;
  competitorDomains: string[];
  targetKeywords?: string[];
  minSearchVolume?: number;
  maxCompetitors?: number;
}

/**
 * Gap Analysis Result
 */
export interface GapAnalysisResult {
  totalGaps: number;
  criticalGaps: number;
  highPriorityGaps: number;
  gaps: ContentGap[];
  summary: {
    missingTopics: number;
    thinContent: number;
    keywordGaps: number;
    competitorAdvantages: number;
  };
  topOpportunities: Array<{
    topic: string;
    opportunityScore: number;
    estimatedTraffic: number;
    difficulty: number;
  }>;
}

/**
 * Topic Coverage Analysis
 */
export interface TopicCoverageAnalysis {
  topic: string;
  yourCoverage: number; // Percentage
  competitorCoverage: number;
  gap: number;
  missingSubtopics: string[];
  competitorAdvantages: Array<{
    domain: string;
    subtopics: string[];
    wordCount: number;
  }>;
}

/**
 * Keyword Opportunity
 */
export interface KeywordOpportunity {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  competitorCount: number;
  currentRank: number | null;
  potentialRank: number;
  estimatedTraffic: number;
  priority: GapPriority;
  competitorUrls: string[];
  contentRecommendations: {
    wordCount: number;
    topics: string[];
    format: string;
    contentAngles: string[];
  };
}

/**
 * Content Strategy Recommendation
 */
export interface ContentStrategyRecommendation {
  strategy: string;
  rationale: string;
  priority: GapPriority;
  estimatedImpact: {
    traffic: number;
    rankings: number;
    conversions: number;
  };
  actionItems: Array<{
    task: string;
    effort: 'low' | 'medium' | 'high';
    timeline: string;
  }>;
  contentTypes: string[];
  targetKeywords: string[];
}

/**
 * Content Gap Analyzer Service
 * Advanced competitor content analysis and gap detection
 */
@Injectable()
export class ContentGapAnalyzerService {
  private readonly logger = new Logger(ContentGapAnalyzerService.name);

  constructor(
    @InjectRepository(ContentGap)
    private gapRepository: Repository<ContentGap>,
    private keywordService: KeywordService,
    private serpAnalyzer: SerpAnalyzerService,
    private contentQuality: ContentQualityService,
  ) {}

  /**
   * Perform comprehensive gap analysis
   */
  async analyzeGaps(request: GapAnalysisRequest): Promise<GapAnalysisResult> {
    this.logger.log(`Analyzing content gaps for project ${request.projectId}`);

    const gaps: ContentGap[] = [];

    // 1. Analyze missing topics
    const missingTopics = await this.findMissingTopics(
      request.projectId,
      request.competitorDomains,
    );
    gaps.push(...missingTopics);

    // 2. Analyze keyword gaps
    const keywordGaps = await this.findKeywordGaps(
      request.projectId,
      request.competitorDomains,
      request.targetKeywords,
      request.minSearchVolume,
    );
    gaps.push(...keywordGaps);

    // 3. Analyze thin content
    const thinContent = await this.findThinContent(
      request.projectId,
      request.competitorDomains,
    );
    gaps.push(...thinContent);

    // 4. Analyze competitor advantages
    const competitorAdvantages = await this.findCompetitorAdvantages(
      request.projectId,
      request.competitorDomains,
    );
    gaps.push(...competitorAdvantages);

    // 5. Analyze outdated content
    const outdatedContent = await this.findOutdatedContent(request.projectId);
    gaps.push(...outdatedContent);

    // Save all gaps
    const savedGaps = await this.gapRepository.save(gaps);

    // Calculate summary
    const summary = {
      missingTopics: savedGaps.filter((g) => g.gapType === GapType.MISSING_TOPIC).length,
      thinContent: savedGaps.filter((g) => g.gapType === GapType.THIN_CONTENT).length,
      keywordGaps: savedGaps.filter((g) => g.gapType === GapType.KEYWORD_GAP).length,
      competitorAdvantages: savedGaps.filter(
        (g) => g.gapType === GapType.COMPETITOR_ADVANTAGE,
      ).length,
    };

    // Get top opportunities
    const topOpportunities = savedGaps
      .filter((g) => g.opportunityScore >= 70)
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 10)
      .map((gap) => ({
        topic: gap.topic,
        opportunityScore: gap.opportunityScore,
        estimatedTraffic: gap.estimatedSearchVolume,
        difficulty: this.calculateDifficulty(gap),
      }));

    return {
      totalGaps: savedGaps.length,
      criticalGaps: savedGaps.filter((g) => g.priority === GapPriority.CRITICAL).length,
      highPriorityGaps: savedGaps.filter((g) => g.priority === GapPriority.HIGH).length,
      gaps: savedGaps,
      summary,
      topOpportunities,
    };
  }

  /**
   * Find missing topics by analyzing competitor content
   */
  async findMissingTopics(
    projectId: string,
    competitorDomains: string[],
  ): Promise<ContentGap[]> {
    this.logger.log(`Finding missing topics for project ${projectId}`);

    const gaps: ContentGap[] = [];

    // Get your content topics
    const yourTopics = await this.getProjectTopics(projectId);

    // Analyze each competitor
    for (const domain of competitorDomains) {
      const competitorTopics = await this.getCompetitorTopics(domain);

      // Find topics they have that you don't
      for (const topic of competitorTopics) {
        const isMissing = !yourTopics.some((t) =>
          this.areTopicsSimilar(t.topic, topic.topic),
        );

        if (isMissing && topic.searchVolume >= 100) {
          const existingGap = gaps.find((g) =>
            this.areTopicsSimilar(g.topic, topic.topic),
          );

          if (existingGap) {
            // Update existing gap with more competitor data
            existingGap.competitorUrls.push({
              url: topic.url,
              domain,
              wordCount: topic.wordCount,
              rank: topic.rank,
            });
            existingGap.competitorCoverage =
              (existingGap.competitorUrls.length / competitorDomains.length) * 100;
          } else {
            // Create new gap
            const gap = this.gapRepository.create({
              projectId,
              gapType: GapType.MISSING_TOPIC,
              topic: topic.topic,
              description: `Competitors are covering "${topic.topic}" but you have no content on this topic.`,
              missingKeywords: topic.keywords,
              competitorUrls: [
                {
                  url: topic.url,
                  domain,
                  wordCount: topic.wordCount,
                  rank: topic.rank,
                },
              ],
              estimatedSearchVolume: topic.searchVolume,
              competitorCoverage: (1 / competitorDomains.length) * 100,
              opportunityScore: this.calculateOpportunityScore({
                searchVolume: topic.searchVolume,
                competitorCount: 1,
                difficulty: topic.difficulty,
                currentRank: null,
              }),
              recommendedWordCount: topic.wordCount,
              priority: this.calculatePriority(topic.searchVolume, 0),
              competitorAnalysis: {
                totalCompetitors: 1,
                averageWordCount: topic.wordCount,
                averageRank: topic.rank,
                commonKeywords: topic.keywords,
                contentAngles: topic.contentAngles || [],
              },
              recommendations: this.generateMissingTopicRecommendations(topic),
            });

            gaps.push(gap);
          }
        }
      }
    }

    // Recalculate metrics for multi-competitor gaps
    for (const gap of gaps) {
      if (gap.competitorUrls.length > 1) {
        gap.opportunityScore = this.calculateOpportunityScore({
          searchVolume: gap.estimatedSearchVolume,
          competitorCount: gap.competitorUrls.length,
          difficulty: 50, // Average
          currentRank: null,
        });

        gap.priority = this.calculatePriority(
          gap.estimatedSearchVolume,
          gap.competitorUrls.length,
        );

        gap.competitorAnalysis.totalCompetitors = gap.competitorUrls.length;
        gap.competitorAnalysis.averageWordCount =
          gap.competitorUrls.reduce((sum, c) => sum + c.wordCount, 0) /
          gap.competitorUrls.length;
        gap.competitorAnalysis.averageRank =
          gap.competitorUrls.reduce((sum, c) => sum + c.rank, 0) /
          gap.competitorUrls.length;
      }
    }

    this.logger.log(`Found ${gaps.length} missing topics`);
    return gaps;
  }

  /**
   * Find keyword gaps where competitors rank but you don't
   */
  async findKeywordGaps(
    projectId: string,
    competitorDomains: string[],
    targetKeywords?: string[],
    minSearchVolume: number = 100,
  ): Promise<ContentGap[]> {
    this.logger.log(`Finding keyword gaps for project ${projectId}`);

    const gaps: ContentGap[] = [];

    // Get your current rankings
    const yourRankings = await this.getProjectRankings(projectId);

    // Analyze competitor keywords
    for (const domain of competitorDomains) {
      const competitorKeywords = await this.getCompetitorKeywords(domain);

      for (const kwData of competitorKeywords) {
        // Skip if below minimum search volume
        if (kwData.searchVolume < minSearchVolume) continue;

        // Skip if targeting specific keywords and this isn't one
        if (targetKeywords && !targetKeywords.includes(kwData.keyword)) continue;

        const yourRank = yourRankings.find((r) => r.keyword === kwData.keyword);

        // Gap exists if competitor ranks in top 20 and you don't rank at all or rank poorly
        if (
          kwData.rank <= 20 &&
          (!yourRank || yourRank.rank > 50 || yourRank.rank > kwData.rank + 20)
        ) {
          const existingGap = gaps.find((g) => g.missingKeywords.includes(kwData.keyword));

          if (existingGap) {
            existingGap.competitorUrls.push({
              url: kwData.url,
              domain,
              wordCount: kwData.wordCount,
              rank: kwData.rank,
            });
          } else {
            const gap = this.gapRepository.create({
              projectId,
              gapType: GapType.KEYWORD_GAP,
              topic: kwData.keyword,
              description: `Competitors rank in top ${kwData.rank} for "${kwData.keyword}" but you ${yourRank ? `rank at ${yourRank.rank}` : "don't rank"}.`,
              missingKeywords: [kwData.keyword],
              competitorUrls: [
                {
                  url: kwData.url,
                  domain,
                  wordCount: kwData.wordCount,
                  rank: kwData.rank,
                },
              ],
              estimatedSearchVolume: kwData.searchVolume,
              competitorCoverage: (1 / competitorDomains.length) * 100,
              opportunityScore: this.calculateOpportunityScore({
                searchVolume: kwData.searchVolume,
                competitorCount: 1,
                difficulty: kwData.difficulty,
                currentRank: yourRank?.rank || null,
              }),
              recommendedWordCount: kwData.wordCount,
              priority: this.calculatePriority(kwData.searchVolume, 1),
              competitorAnalysis: {
                totalCompetitors: 1,
                averageWordCount: kwData.wordCount,
                averageRank: kwData.rank,
                commonKeywords: [kwData.keyword],
                contentAngles: [],
              },
              recommendations: this.generateKeywordGapRecommendations(kwData, yourRank),
            });

            gaps.push(gap);
          }
        }
      }
    }

    this.logger.log(`Found ${gaps.length} keyword gaps`);
    return gaps;
  }

  /**
   * Find thin content that needs expansion based on competitor analysis
   */
  async findThinContent(
    projectId: string,
    competitorDomains: string[],
  ): Promise<ContentGap[]> {
    this.logger.log(`Finding thin content for project ${projectId}`);

    const gaps: ContentGap[] = [];

    // Get your content
    const yourContent = await this.getProjectContent(projectId);

    for (const content of yourContent) {
      // Get competitor content for same topic/keywords
      const competitorContent = await this.getCompetitorContentForTopic(
        content.topic,
        competitorDomains,
      );

      if (competitorContent.length === 0) continue;

      const avgCompetitorWordCount =
        competitorContent.reduce((sum, c) => sum + c.wordCount, 0) /
        competitorContent.length;

      // Content is thin if it's less than 60% of average competitor length
      const threshold = avgCompetitorWordCount * 0.6;

      if (content.wordCount < threshold) {
        const wordCountGap = Math.round(avgCompetitorWordCount - content.wordCount);

        const gap = this.gapRepository.create({
          projectId,
          gapType: GapType.THIN_CONTENT,
          topic: content.topic,
          description: `Your content on "${content.topic}" (${content.wordCount} words) is significantly shorter than competitors (avg ${Math.round(avgCompetitorWordCount)} words). Consider expanding by ${wordCountGap} words.`,
          missingKeywords: this.findMissingKeywordsInContent(content, competitorContent),
          competitorUrls: competitorContent.map((c) => ({
            url: c.url,
            domain: c.domain,
            wordCount: c.wordCount,
            rank: c.rank,
          })),
          estimatedSearchVolume: content.searchVolume || 0,
          competitorCoverage: 100,
          opportunityScore: this.calculateOpportunityScore({
            searchVolume: content.searchVolume || 0,
            competitorCount: competitorContent.length,
            difficulty: 40, // Lower difficulty since you already have content
            currentRank: content.rank,
          }),
          recommendedWordCount: Math.round(avgCompetitorWordCount),
          priority: this.calculatePriority(content.searchVolume || 0, competitorContent.length),
          competitorAnalysis: {
            totalCompetitors: competitorContent.length,
            averageWordCount: Math.round(avgCompetitorWordCount),
            averageRank: Math.round(
              competitorContent.reduce((sum, c) => sum + c.rank, 0) /
                competitorContent.length,
            ),
            commonKeywords: this.extractCommonKeywords(competitorContent),
            contentAngles: this.extractContentAngles(competitorContent),
          },
          recommendations: this.generateThinContentRecommendations(
            content,
            competitorContent,
            wordCountGap,
          ),
          relatedContentId: content.id,
        });

        gaps.push(gap);
      }
    }

    this.logger.log(`Found ${gaps.length} thin content pages`);
    return gaps;
  }

  /**
   * Find competitor advantages (features/elements they have that you don't)
   */
  async findCompetitorAdvantages(
    projectId: string,
    competitorDomains: string[],
  ): Promise<ContentGap[]> {
    this.logger.log(`Finding competitor advantages for project ${projectId}`);

    const gaps: ContentGap[] = [];

    // Analyze content features
    const yourContent = await this.getProjectContent(projectId);

    for (const content of yourContent) {
      const competitorContent = await this.getCompetitorContentForTopic(
        content.topic,
        competitorDomains,
      );

      if (competitorContent.length === 0) continue;

      const advantages: string[] = [];

      // Check for video content
      const competitorsWithVideo = competitorContent.filter((c) => c.hasVideo).length;
      if (!content.hasVideo && competitorsWithVideo / competitorContent.length >= 0.5) {
        advantages.push('video');
      }

      // Check for FAQ sections
      const competitorsWithFaq = competitorContent.filter((c) => c.hasFaq).length;
      if (!content.hasFaq && competitorsWithFaq / competitorContent.length >= 0.5) {
        advantages.push('faq');
      }

      // Check for images
      const avgCompetitorImages =
        competitorContent.reduce((sum, c) => sum + (c.hasImages ? 10 : 0), 0) /
        competitorContent.length;
      if (!content.hasImages && avgCompetitorImages >= 5) {
        advantages.push('images');
      }

      // Check for freshness
      const competitorsRecentlyUpdated = competitorContent.filter((c) => {
        if (!c.lastUpdated) return false;
        const daysSinceUpdate =
          (Date.now() - c.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceUpdate < 90;
      }).length;

      if (content.lastUpdated) {
        const yourDaysSinceUpdate =
          (Date.now() - content.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
        if (
          yourDaysSinceUpdate > 180 &&
          competitorsRecentlyUpdated / competitorContent.length >= 0.5
        ) {
          advantages.push('freshness');
        }
      }

      if (advantages.length > 0) {
        const gap = this.gapRepository.create({
          projectId,
          gapType: GapType.COMPETITOR_ADVANTAGE,
          topic: content.topic,
          description: `Competitors have advantages on "${content.topic}": ${advantages.join(', ')}. Consider adding these elements to improve competitiveness.`,
          missingKeywords: [],
          competitorUrls: competitorContent.map((c) => ({
            url: c.url,
            domain: c.domain,
            wordCount: c.wordCount,
            rank: c.rank,
          })),
          estimatedSearchVolume: content.searchVolume || 0,
          competitorCoverage: 100,
          opportunityScore: advantages.length * 15, // 15 points per advantage
          priority:
            advantages.length >= 3
              ? GapPriority.HIGH
              : advantages.length >= 2
                ? GapPriority.MEDIUM
                : GapPriority.LOW,
          competitorAnalysis: {
            totalCompetitors: competitorContent.length,
            averageWordCount: Math.round(
              competitorContent.reduce((sum, c) => sum + c.wordCount, 0) /
                competitorContent.length,
            ),
            averageRank: Math.round(
              competitorContent.reduce((sum, c) => sum + c.rank, 0) /
                competitorContent.length,
            ),
            commonKeywords: [],
            contentAngles: advantages,
          },
          recommendations: this.generateCompetitorAdvantageRecommendations(
            content,
            advantages,
          ),
          relatedContentId: content.id,
        });

        gaps.push(gap);
      }
    }

    this.logger.log(`Found ${gaps.length} competitor advantages`);
    return gaps;
  }

  /**
   * Find outdated content that needs refreshing
   */
  async findOutdatedContent(projectId: string): Promise<ContentGap[]> {
    this.logger.log(`Finding outdated content for project ${projectId}`);

    const gaps: ContentGap[] = [];
    const yourContent = await this.getProjectContent(projectId);

    const now = new Date();

    for (const content of yourContent) {
      if (!content.lastUpdated) continue;

      const daysSinceUpdate = (now.getTime() - content.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

      // Content is outdated if:
      // 1. High search volume (>1000) and not updated in 6 months
      // 2. Medium search volume (500-1000) and not updated in 1 year
      // 3. Any content not updated in 2 years

      let isOutdated = false;
      let priority = GapPriority.LOW;

      if (content.searchVolume > 1000 && daysSinceUpdate > 180) {
        isOutdated = true;
        priority = GapPriority.HIGH;
      } else if (content.searchVolume >= 500 && daysSinceUpdate > 365) {
        isOutdated = true;
        priority = GapPriority.MEDIUM;
      } else if (daysSinceUpdate > 730) {
        isOutdated = true;
        priority = GapPriority.LOW;
      }

      if (isOutdated) {
        const gap = this.gapRepository.create({
          projectId,
          gapType: GapType.OUTDATED_CONTENT,
          topic: content.topic,
          description: `Content on "${content.topic}" hasn't been updated in ${Math.round(daysSinceUpdate)} days. Fresh content typically performs better in search results.`,
          missingKeywords: [],
          competitorUrls: [],
          estimatedSearchVolume: content.searchVolume || 0,
          competitorCoverage: 0,
          opportunityScore: Math.min(100, (daysSinceUpdate / 365) * 50 + (content.searchVolume / 100)),
          priority,
          recommendations: [
            {
              type: 'content_refresh',
              action: 'Update statistics, examples, and references to current year',
              impact: 'high',
              effort: 'low',
            },
            {
              type: 'content_expansion',
              action: 'Add new information and developments in the topic',
              impact: 'medium',
              effort: 'medium',
            },
            {
              type: 'technical_update',
              action: 'Update published date and add "last updated" timestamp',
              impact: 'low',
              effort: 'low',
            },
          ],
          relatedContentId: content.id,
        });

        gaps.push(gap);
      }
    }

    this.logger.log(`Found ${gaps.length} outdated content pages`);
    return gaps;
  }

  /**
   * Analyze topic coverage compared to competitors
   */
  async analyzeTopicCoverage(
    projectId: string,
    topic: string,
    competitorDomains: string[],
  ): Promise<TopicCoverageAnalysis> {
    this.logger.log(`Analyzing topic coverage for "${topic}"`);

    // Get your coverage
    const yourSubtopics = await this.getTopicSubtopics(projectId, topic);

    // Get competitor coverage
    const competitorSubtopics: Map<string, string[]> = new Map();
    const allCompetitorSubtopics: Set<string> = new Set();

    for (const domain of competitorDomains) {
      const subtopics = await this.getCompetitorTopicSubtopics(domain, topic);
      competitorSubtopics.set(domain, subtopics);
      subtopics.forEach((st) => allCompetitorSubtopics.add(st));
    }

    // Calculate coverage
    const yourCoverage =
      allCompetitorSubtopics.size > 0
        ? (yourSubtopics.filter((st) => allCompetitorSubtopics.has(st)).length /
            allCompetitorSubtopics.size) *
          100
        : 100;

    const competitorCoverage =
      yourSubtopics.length > 0
        ? (Array.from(allCompetitorSubtopics).filter((st) => yourSubtopics.includes(st))
            .length /
            yourSubtopics.length) *
          100
        : 0;

    // Find missing subtopics
    const missingSubtopics = Array.from(allCompetitorSubtopics).filter(
      (st) => !yourSubtopics.includes(st),
    );

    // Find competitor advantages
    const competitorAdvantages = Array.from(competitorSubtopics.entries())
      .map(([domain, subtopics]) => ({
        domain,
        subtopics: subtopics.filter((st) => !yourSubtopics.includes(st)),
        wordCount: 0, // Would be fetched from actual content
      }))
      .filter((ca) => ca.subtopics.length > 0);

    return {
      topic,
      yourCoverage,
      competitorCoverage,
      gap: competitorCoverage - yourCoverage,
      missingSubtopics,
      competitorAdvantages,
    };
  }

  /**
   * Find keyword opportunities with detailed recommendations
   */
  async findKeywordOpportunities(
    projectId: string,
    competitorDomains: string[],
    options: {
      minSearchVolume?: number;
      maxDifficulty?: number;
      limit?: number;
    } = {},
  ): Promise<KeywordOpportunity[]> {
    this.logger.log(`Finding keyword opportunities for project ${projectId}`);

    const opportunities: KeywordOpportunity[] = [];
    const yourRankings = await this.getProjectRankings(projectId);

    // Analyze all competitor keywords
    const competitorKeywordMap: Map<
      string,
      Array<{ domain: string; rank: number; url: string; wordCount: number }>
    > = new Map();

    for (const domain of competitorDomains) {
      const keywords = await this.getCompetitorKeywords(domain);

      for (const kwData of keywords) {
        if (!competitorKeywordMap.has(kwData.keyword)) {
          competitorKeywordMap.set(kwData.keyword, []);
        }

        competitorKeywordMap.get(kwData.keyword).push({
          domain,
          rank: kwData.rank,
          url: kwData.url,
          wordCount: kwData.wordCount,
        });
      }
    }

    // Analyze each keyword
    for (const [keyword, competitorData] of competitorKeywordMap.entries()) {
      // Get keyword metrics (in production, from actual keyword database)
      const searchVolume = await this.getKeywordSearchVolume(keyword);
      const difficulty = await this.getKeywordDifficulty(keyword);

      // Apply filters
      if (options.minSearchVolume && searchVolume < options.minSearchVolume) continue;
      if (options.maxDifficulty && difficulty > options.maxDifficulty) continue;

      const yourRank = yourRankings.find((r) => r.keyword === keyword);
      const currentRank = yourRank?.rank || null;

      // Calculate potential rank based on competitor performance
      const avgCompetitorRank =
        competitorData.reduce((sum, c) => sum + c.rank, 0) / competitorData.length;
      const potentialRank = currentRank
        ? Math.max(1, Math.floor((currentRank + avgCompetitorRank) / 2))
        : Math.floor(avgCompetitorRank);

      // Estimate traffic
      const ctr = this.estimateCTR(potentialRank);
      const estimatedTraffic = Math.round(searchVolume * ctr);

      // Calculate priority
      const priority = this.calculateKeywordOpportunityPriority(
        searchVolume,
        difficulty,
        competitorData.length,
        currentRank,
      );

      // Get content recommendations
      const avgWordCount =
        competitorData.reduce((sum, c) => sum + c.wordCount, 0) / competitorData.length;

      const opportunity: KeywordOpportunity = {
        keyword,
        searchVolume,
        difficulty,
        competitorCount: competitorData.length,
        currentRank,
        potentialRank,
        estimatedTraffic,
        priority,
        competitorUrls: competitorData.map((c) => c.url),
        contentRecommendations: {
          wordCount: Math.round(avgWordCount),
          topics: await this.extractTopicsForKeyword(keyword),
          format: this.recommendContentFormat(keyword),
          contentAngles: this.generateContentAngles(keyword),
        },
      };

      opportunities.push(opportunity);
    }

    // Sort by estimated traffic and limit
    opportunities.sort((a, b) => b.estimatedTraffic - a.estimatedTraffic);

    return options.limit ? opportunities.slice(0, options.limit) : opportunities;
  }

  /**
   * Generate content strategy recommendations
   */
  async generateContentStrategy(
    projectId: string,
    competitorDomains: string[],
  ): Promise<ContentStrategyRecommendation[]> {
    this.logger.log(`Generating content strategy for project ${projectId}`);

    const strategies: ContentStrategyRecommendation[] = [];

    // Analyze gaps
    const gapAnalysis = await this.analyzeGaps({
      projectId,
      competitorDomains,
    });

    // Strategy 1: Fill critical gaps
    if (gapAnalysis.criticalGaps > 0) {
      const criticalGaps = gapAnalysis.gaps.filter(
        (g) => g.priority === GapPriority.CRITICAL,
      );

      const totalEstimatedTraffic = criticalGaps.reduce(
        (sum, g) => sum + g.estimatedSearchVolume,
        0,
      );

      strategies.push({
        strategy: 'Fill Critical Content Gaps',
        rationale: `You have ${gapAnalysis.criticalGaps} critical content gaps with combined potential traffic of ${totalEstimatedTraffic.toLocaleString()} monthly searches.`,
        priority: GapPriority.CRITICAL,
        estimatedImpact: {
          traffic: Math.round(totalEstimatedTraffic * 0.05), // 5% CTR estimate
          rankings: criticalGaps.length,
          conversions: Math.round(totalEstimatedTraffic * 0.05 * 0.02), // 2% conversion
        },
        actionItems: criticalGaps.slice(0, 5).map((gap) => ({
          task: `Create content for "${gap.topic}"`,
          effort: gap.recommendedWordCount > 2000 ? 'high' : 'medium',
          timeline: gap.recommendedWordCount > 2000 ? '2-3 weeks' : '1 week',
        })),
        contentTypes: this.inferContentTypes(criticalGaps),
        targetKeywords: criticalGaps.flatMap((g) => g.missingKeywords).slice(0, 20),
      });
    }

    // Strategy 2: Expand thin content
    const thinContent = gapAnalysis.gaps.filter((g) => g.gapType === GapType.THIN_CONTENT);
    if (thinContent.length > 0) {
      strategies.push({
        strategy: 'Expand Thin Content',
        rationale: `You have ${thinContent.length} pages with thin content that could be expanded to match competitor depth.`,
        priority: GapPriority.HIGH,
        estimatedImpact: {
          traffic: Math.round(
            thinContent.reduce((sum, g) => sum + g.estimatedSearchVolume, 0) * 0.03,
          ),
          rankings: thinContent.length,
          conversions: Math.round(
            thinContent.reduce((sum, g) => sum + g.estimatedSearchVolume, 0) * 0.03 * 0.02,
          ),
        },
        actionItems: thinContent.slice(0, 5).map((gap) => ({
          task: `Expand "${gap.topic}" by ${gap.recommendedWordCount - (gap.competitorAnalysis?.averageWordCount || 0)} words`,
          effort: 'medium',
          timeline: '3-5 days',
        })),
        contentTypes: ['article', 'guide'],
        targetKeywords: thinContent.flatMap((g) => g.missingKeywords).slice(0, 15),
      });
    }

    // Strategy 3: Update outdated content
    const outdated = gapAnalysis.gaps.filter((g) => g.gapType === GapType.OUTDATED_CONTENT);
    if (outdated.length > 0) {
      strategies.push({
        strategy: 'Refresh Outdated Content',
        rationale: `You have ${outdated.length} outdated pages. Fresh content typically sees 20-30% traffic improvement.`,
        priority: GapPriority.MEDIUM,
        estimatedImpact: {
          traffic: Math.round(
            outdated.reduce((sum, g) => sum + g.estimatedSearchVolume, 0) * 0.25,
          ),
          rankings: Math.floor(outdated.length * 0.5),
          conversions: Math.round(
            outdated.reduce((sum, g) => sum + g.estimatedSearchVolume, 0) * 0.25 * 0.02,
          ),
        },
        actionItems: outdated.slice(0, 5).map((gap) => ({
          task: `Update "${gap.topic}" with current information`,
          effort: 'low',
          timeline: '1-2 days',
        })),
        contentTypes: ['update'],
        targetKeywords: [],
      });
    }

    // Strategy 4: Add competitor advantages
    const advantages = gapAnalysis.gaps.filter(
      (g) => g.gapType === GapType.COMPETITOR_ADVANTAGE,
    );
    if (advantages.length > 0) {
      strategies.push({
        strategy: 'Implement Competitor Content Features',
        rationale: `Competitors are using advanced features (video, FAQ, images) that you're missing on ${advantages.length} pages.`,
        priority: GapPriority.MEDIUM,
        estimatedImpact: {
          traffic: Math.round(
            advantages.reduce((sum, g) => sum + g.estimatedSearchVolume, 0) * 0.15,
          ),
          rankings: Math.floor(advantages.length * 0.3),
          conversions: Math.round(
            advantages.reduce((sum, g) => sum + g.estimatedSearchVolume, 0) * 0.15 * 0.03,
          ),
        },
        actionItems: [
          {
            task: 'Add video content to top 5 pages',
            effort: 'high',
            timeline: '2-4 weeks',
          },
          {
            task: 'Add FAQ schemas to relevant pages',
            effort: 'low',
            timeline: '3-5 days',
          },
          {
            task: 'Enhance image usage across content',
            effort: 'medium',
            timeline: '1 week',
          },
        ],
        contentTypes: ['video', 'faq', 'infographic'],
        targetKeywords: [],
      });
    }

    return strategies;
  }

  /**
   * Get gaps for a project
   */
  async getGaps(
    projectId: string,
    filters: {
      gapType?: GapType;
      priority?: GapPriority;
      addressed?: boolean;
      minOpportunityScore?: number;
    } = {},
  ): Promise<ContentGap[]> {
    const query = this.gapRepository.createQueryBuilder('gap').where('gap.projectId = :projectId', { projectId });

    if (filters.gapType) {
      query.andWhere('gap.gapType = :gapType', { gapType: filters.gapType });
    }

    if (filters.priority) {
      query.andWhere('gap.priority = :priority', { priority: filters.priority });
    }

    if (filters.addressed !== undefined) {
      query.andWhere('gap.addressed = :addressed', { addressed: filters.addressed });
    }

    if (filters.minOpportunityScore) {
      query.andWhere('gap.opportunityScore >= :minScore', {
        minScore: filters.minOpportunityScore,
      });
    }

    return query.orderBy('gap.opportunityScore', 'DESC').getMany();
  }

  /**
   * Mark gap as addressed
   */
  async markGapAddressed(gapId: string, contentId?: string): Promise<ContentGap> {
    const gap = await this.gapRepository.findOne({ where: { id: gapId } });

    if (!gap) {
      throw new NotFoundException(`Gap ${gapId} not found`);
    }

    gap.addressed = true;
    if (contentId) {
      gap.relatedContentId = contentId;
    }

    return this.gapRepository.save(gap);
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  /**
   * Get project topics (mock - in production would query content database)
   */
  private async getProjectTopics(projectId: string): Promise<
    Array<{
      topic: string;
      url: string;
      wordCount: number;
      searchVolume: number;
    }>
  > {
    // In production: query your content database
    return [];
  }

  /**
   * Get competitor topics (mock - in production would use crawler/SERP data)
   */
  private async getCompetitorTopics(domain: string): Promise<
    Array<{
      topic: string;
      url: string;
      wordCount: number;
      searchVolume: number;
      rank: number;
      difficulty: number;
      keywords: string[];
      contentAngles?: string[];
    }>
  > {
    // In production: query SERP data or use DataForSEO API
    return [];
  }

  /**
   * Get project rankings (mock)
   */
  private async getProjectRankings(
    projectId: string,
  ): Promise<Array<{ keyword: string; rank: number; url: string }>> {
    // In production: query rankings database
    return [];
  }

  /**
   * Get competitor keywords (mock)
   */
  private async getCompetitorKeywords(domain: string): Promise<
    Array<{
      keyword: string;
      rank: number;
      url: string;
      searchVolume: number;
      difficulty: number;
      wordCount: number;
    }>
  > {
    // In production: use DataForSEO or SEMrush API
    return [];
  }

  /**
   * Get project content (mock)
   */
  private async getProjectContent(projectId: string): Promise<
    Array<{
      id: string;
      topic: string;
      wordCount: number;
      searchVolume?: number;
      rank?: number;
      hasVideo: boolean;
      hasImages: boolean;
      hasFaq: boolean;
      lastUpdated?: Date;
      keywords: string[];
    }>
  > {
    // In production: query content database
    return [];
  }

  /**
   * Get competitor content for topic (mock)
   */
  private async getCompetitorContentForTopic(
    topic: string,
    domains: string[],
  ): Promise<CompetitorContent[]> {
    // In production: query SERP data
    return [];
  }

  /**
   * Get topic subtopics (mock)
   */
  private async getTopicSubtopics(projectId: string, topic: string): Promise<string[]> {
    // In production: analyze content structure
    return [];
  }

  /**
   * Get competitor topic subtopics (mock)
   */
  private async getCompetitorTopicSubtopics(domain: string, topic: string): Promise<string[]> {
    // In production: crawl and analyze competitor content
    return [];
  }

  /**
   * Get keyword search volume (mock)
   */
  private async getKeywordSearchVolume(keyword: string): Promise<number> {
    // In production: use keyword database or API
    return Math.floor(Math.random() * 5000) + 100;
  }

  /**
   * Get keyword difficulty (mock)
   */
  private async getKeywordDifficulty(keyword: string): Promise<number> {
    // In production: calculate based on SERP metrics
    return Math.floor(Math.random() * 100);
  }

  /**
   * Extract topics for keyword
   */
  private async extractTopicsForKeyword(keyword: string): Promise<string[]> {
    // Simple topic extraction from keyword
    const words = keyword.toLowerCase().split(' ');
    return words.filter((w) => w.length > 3);
  }

  /**
   * Check if two topics are similar
   */
  private areTopicsSimilar(topic1: string, topic2: string): boolean {
    const normalize = (s: string) => s.toLowerCase().trim();
    const t1 = normalize(topic1);
    const t2 = normalize(topic2);

    // Exact match
    if (t1 === t2) return true;

    // High overlap in words
    const words1 = new Set(t1.split(' '));
    const words2 = new Set(t2.split(' '));
    const intersection = new Set([...words1].filter((w) => words2.has(w)));

    const similarity = (intersection.size / Math.min(words1.size, words2.size)) * 100;

    return similarity >= 70;
  }

  /**
   * Calculate opportunity score
   */
  private calculateOpportunityScore(params: {
    searchVolume: number;
    competitorCount: number;
    difficulty: number;
    currentRank: number | null;
  }): number {
    let score = 0;

    // Search volume component (0-40 points)
    score += Math.min(40, (params.searchVolume / 100) * 2);

    // Competition component (0-30 points) - more competitors = higher opportunity
    score += Math.min(30, params.competitorCount * 5);

    // Difficulty component (0-20 points) - lower difficulty = higher opportunity
    score += Math.max(0, 20 - params.difficulty / 5);

    // Ranking gap component (0-10 points)
    if (params.currentRank === null) {
      score += 10; // Not ranking at all
    } else if (params.currentRank > 50) {
      score += 8;
    } else if (params.currentRank > 20) {
      score += 5;
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Calculate priority
   */
  private calculatePriority(searchVolume: number, competitorCount: number): GapPriority {
    const score = searchVolume / 100 + competitorCount * 10;

    if (score >= 100) return GapPriority.CRITICAL;
    if (score >= 50) return GapPriority.HIGH;
    if (score >= 20) return GapPriority.MEDIUM;
    return GapPriority.LOW;
  }

  /**
   * Calculate keyword opportunity priority
   */
  private calculateKeywordOpportunityPriority(
    searchVolume: number,
    difficulty: number,
    competitorCount: number,
    currentRank: number | null,
  ): GapPriority {
    let score = 0;

    score += Math.min(50, searchVolume / 20);
    score -= difficulty / 2;
    score += competitorCount * 5;
    if (currentRank === null) score += 20;

    if (score >= 80) return GapPriority.CRITICAL;
    if (score >= 50) return GapPriority.HIGH;
    if (score >= 25) return GapPriority.MEDIUM;
    return GapPriority.LOW;
  }

  /**
   * Calculate difficulty
   */
  private calculateDifficulty(gap: ContentGap): number {
    // Simple difficulty based on competitor count and coverage
    const base = gap.competitorUrls.length * 5;
    const coverage = gap.competitorCoverage / 2;
    return Math.min(100, Math.round(base + coverage));
  }

  /**
   * Find missing keywords in content
   */
  private findMissingKeywordsInContent(
    yourContent: any,
    competitorContent: CompetitorContent[],
  ): string[] {
    const yourKeywords = new Set(yourContent.keywords.map((k: string) => k.toLowerCase()));
    const competitorKeywords = new Set<string>();

    competitorContent.forEach((c) => {
      c.keywords.forEach((k) => competitorKeywords.add(k.toLowerCase()));
    });

    return Array.from(competitorKeywords).filter((k) => !yourKeywords.has(k)).slice(0, 20);
  }

  /**
   * Extract common keywords from competitor content
   */
  private extractCommonKeywords(competitorContent: CompetitorContent[]): string[] {
    const keywordCounts: Map<string, number> = new Map();

    competitorContent.forEach((c) => {
      c.keywords.forEach((k) => {
        keywordCounts.set(k, (keywordCounts.get(k) || 0) + 1);
      });
    });

    return Array.from(keywordCounts.entries())
      .filter(([, count]) => count >= competitorContent.length / 2)
      .sort((a, b) => b[1] - a[1])
      .map(([keyword]) => keyword)
      .slice(0, 10);
  }

  /**
   * Extract content angles from competitor content
   */
  private extractContentAngles(competitorContent: CompetitorContent[]): string[] {
    const angles: string[] = [];

    // Analyze common patterns
    const hasVideoCount = competitorContent.filter((c) => c.hasVideo).length;
    const hasFaqCount = competitorContent.filter((c) => c.hasFaq).length;

    if (hasVideoCount / competitorContent.length >= 0.5) {
      angles.push('video-heavy');
    }

    if (hasFaqCount / competitorContent.length >= 0.5) {
      angles.push('faq-focused');
    }

    const avgWordCount =
      competitorContent.reduce((sum, c) => sum + c.wordCount, 0) / competitorContent.length;

    if (avgWordCount > 3000) {
      angles.push('comprehensive-guide');
    } else if (avgWordCount < 1000) {
      angles.push('concise-answer');
    }

    return angles;
  }

  /**
   * Estimate CTR based on rank position
   */
  private estimateCTR(rank: number): number {
    // Industry average CTR by position
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

    if (rank <= 10) {
      return ctrByPosition[rank] || 0.01;
    }

    if (rank <= 20) {
      return 0.01;
    }

    return 0.005;
  }

  /**
   * Recommend content format
   */
  private recommendContentFormat(keyword: string): string {
    const lower = keyword.toLowerCase();

    if (lower.includes('how to') || lower.includes('guide')) return 'guide';
    if (lower.includes('best') || lower.includes('top')) return 'listicle';
    if (lower.includes('vs') || lower.includes('versus')) return 'comparison';
    if (lower.includes('what is') || lower.includes('definition')) return 'definition';
    if (lower.includes('review')) return 'review';

    return 'article';
  }

  /**
   * Generate content angles
   */
  private generateContentAngles(keyword: string): string[] {
    const angles: string[] = [];

    // Analyze keyword intent
    if (keyword.toLowerCase().includes('best')) {
      angles.push('Comparison-focused with pros/cons');
      angles.push('Include expert recommendations');
    }

    if (keyword.toLowerCase().includes('how to')) {
      angles.push('Step-by-step tutorial');
      angles.push('Include video walkthrough');
    }

    if (keyword.toLowerCase().includes('guide')) {
      angles.push('Comprehensive resource');
      angles.push('Include downloadable PDF');
    }

    // Default angles
    angles.push('Answer user questions directly');
    angles.push('Include real examples');

    return angles;
  }

  /**
   * Infer content types from gaps
   */
  private inferContentTypes(gaps: ContentGap[]): string[] {
    const types = new Set<string>();

    gaps.forEach((gap) => {
      if (gap.topic.toLowerCase().includes('guide')) types.add('guide');
      if (gap.topic.toLowerCase().includes('how to')) types.add('tutorial');
      if (gap.topic.toLowerCase().includes('best')) types.add('listicle');
      if (gap.gapType === GapType.THIN_CONTENT) types.add('expansion');
    });

    if (types.size === 0) {
      types.add('article');
    }

    return Array.from(types);
  }

  /**
   * Generate recommendations for missing topics
   */
  private generateMissingTopicRecommendations(topic: any): Array<{
    type: string;
    action: string;
    impact: string;
    effort: string;
  }> {
    return [
      {
        type: 'content_creation',
        action: `Create comprehensive content about "${topic.topic}"`,
        impact: 'high',
        effort: topic.wordCount > 2000 ? 'high' : 'medium',
      },
      {
        type: 'keyword_targeting',
        action: `Target ${topic.keywords.length} related keywords`,
        impact: 'medium',
        effort: 'low',
      },
      {
        type: 'internal_linking',
        action: 'Link from existing related content',
        impact: 'medium',
        effort: 'low',
      },
    ];
  }

  /**
   * Generate recommendations for keyword gaps
   */
  private generateKeywordGapRecommendations(
    kwData: any,
    yourRank: any,
  ): Array<{
    type: string;
    action: string;
    impact: string;
    effort: string;
  }> {
    const recommendations = [];

    if (!yourRank) {
      recommendations.push({
        type: 'content_creation',
        action: `Create content targeting "${kwData.keyword}"`,
        impact: 'high',
        effort: 'high',
      });
    } else {
      recommendations.push({
        type: 'content_optimization',
        action: `Optimize existing content for "${kwData.keyword}"`,
        impact: 'high',
        effort: 'medium',
      });
    }

    recommendations.push({
      type: 'on_page_seo',
      action: 'Improve on-page SEO elements (title, meta, headings)',
      impact: 'medium',
      effort: 'low',
    });

    return recommendations;
  }

  /**
   * Generate recommendations for thin content
   */
  private generateThinContentRecommendations(
    content: any,
    competitorContent: CompetitorContent[],
    wordCountGap: number,
  ): Array<{
    type: string;
    action: string;
    impact: string;
    effort: string;
  }> {
    return [
      {
        type: 'content_expansion',
        action: `Add ${wordCountGap} words to match competitor depth`,
        impact: 'high',
        effort: wordCountGap > 1000 ? 'high' : 'medium',
      },
      {
        type: 'subtopic_coverage',
        action: `Cover ${this.findMissingKeywordsInContent(content, competitorContent).length} additional subtopics`,
        impact: 'high',
        effort: 'medium',
      },
      {
        type: 'content_structure',
        action: 'Improve content structure with more headings and sections',
        impact: 'medium',
        effort: 'low',
      },
    ];
  }

  /**
   * Generate recommendations for competitor advantages
   */
  private generateCompetitorAdvantageRecommendations(
    content: any,
    advantages: string[],
  ): Array<{
    type: string;
    action: string;
    impact: string;
    effort: string;
  }> {
    const recommendations = [];

    if (advantages.includes('video')) {
      recommendations.push({
        type: 'video_content',
        action: 'Create video content for this topic',
        impact: 'high',
        effort: 'high',
      });
    }

    if (advantages.includes('faq')) {
      recommendations.push({
        type: 'faq_schema',
        action: 'Add FAQ section with schema markup',
        impact: 'medium',
        effort: 'low',
      });
    }

    if (advantages.includes('images')) {
      recommendations.push({
        type: 'visual_content',
        action: 'Add more images and infographics',
        impact: 'medium',
        effort: 'medium',
      });
    }

    if (advantages.includes('freshness')) {
      recommendations.push({
        type: 'content_refresh',
        action: 'Update content with current information',
        impact: 'medium',
        effort: 'low',
      });
    }

    return recommendations;
  }
}
