import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ranking } from './entities/ranking.entity';

/**
 * SERP Analyzer Service
 * Analyzes Search Engine Results Pages for insights
 */
@Injectable()
export class SerpAnalyzerService {
  private readonly logger = new Logger(SerpAnalyzerService.name);

  constructor(
    @InjectRepository(Ranking)
    private rankingRepository: Repository<Ranking>,
  ) {}

  /**
   * Analyze SERP features for a keyword over time
   * @param keywordId - Keyword ID
   * @param days - Number of days to analyze
   * @returns SERP feature analysis
   */
  async analyzeSerpFeatures(keywordId: string, days: number = 30) {
    this.logger.log(`Analyzing SERP features for keyword: ${keywordId}`);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const rankings = await this.rankingRepository.find({
      where: { keywordId },
      order: { checkedAt: 'DESC' },
      take: days,
    });

    if (rankings.length === 0) {
      return null;
    }

    // Count feature occurrences
    const featureCounts = {
      featuredSnippet: 0,
      peopleAlsoAsk: 0,
      localPack: 0,
      knowledgePanel: 0,
      shopping: 0,
      images: 0,
      videos: 0,
      news: 0,
      relatedSearches: 0,
    };

    rankings.forEach((ranking) => {
      Object.keys(featureCounts).forEach((feature) => {
        if (ranking.serpFeatures[feature]) {
          featureCounts[feature]++;
        }
      });
    });

    // Calculate percentages
    const total = rankings.length;
    const featurePercentages = Object.entries(featureCounts).reduce(
      (acc, [feature, count]) => {
        acc[feature] = Math.round((count / total) * 100);
        return acc;
      },
      {},
    );

    return {
      period: `${days} days`,
      totalChecks: total,
      features: featurePercentages,
      mostCommon: Object.entries(featureCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([feature]) => feature),
    };
  }

  /**
   * Analyze competitor URLs in top 10
   * @param keywordId - Keyword ID
   * @returns Competitor URL analysis
   */
  async analyzeCompetitors(keywordId: string) {
    this.logger.log(`Analyzing competitors for keyword: ${keywordId}`);

    const latestRanking = await this.rankingRepository.findOne({
      where: { keywordId },
      order: { checkedAt: 'DESC' },
    });

    if (!latestRanking || !latestRanking.top10Urls.length) {
      return null;
    }

    // Count URL occurrences across historical data
    const historicalRankings = await this.rankingRepository.find({
      where: { keywordId },
      order: { checkedAt: 'DESC' },
      take: 30,
    });

    const urlFrequency: Record<string, number> = {};

    historicalRankings.forEach((ranking) => {
      ranking.top10Urls.forEach((url) => {
        const domain = this.extractDomain(url);
        urlFrequency[domain] = (urlFrequency[domain] || 0) + 1;
      });
    });

    const competitors = Object.entries(urlFrequency)
      .map(([domain, frequency]) => ({
        domain,
        frequency,
        percentage: Math.round((frequency / (historicalRankings.length * 10)) * 100),
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    return {
      topCompetitors: competitors,
      totalCompetitors: Object.keys(urlFrequency).length,
      currentTop10: latestRanking.top10Urls.map((url) => this.extractDomain(url)),
    };
  }

  /**
   * Analyze SERP volatility
   * Measures how stable rankings are over time
   * @param keywordId - Keyword ID
   * @param days - Number of days to analyze
   * @returns Volatility score and analysis
   */
  async analyzeSerpVolatility(keywordId: string, days: number = 30) {
    this.logger.log(`Analyzing SERP volatility for keyword: ${keywordId}`);

    const rankings = await this.rankingRepository.find({
      where: { keywordId },
      order: { checkedAt: 'ASC' },
      take: days,
    });

    if (rankings.length < 2) {
      return null;
    }

    // Calculate position changes
    const changes: number[] = [];
    for (let i = 1; i < rankings.length; i++) {
      const change = Math.abs(rankings[i].position - rankings[i - 1].position);
      changes.push(change);
    }

    const avgChange = changes.reduce((sum, c) => sum + c, 0) / changes.length;
    const maxChange = Math.max(...changes);

    // Volatility score (0-100, higher = more volatile)
    const volatilityScore = Math.min(Math.round((avgChange / 10) * 100), 100);

    let volatilityLevel = 'Low';
    if (volatilityScore > 30) volatilityLevel = 'Medium';
    if (volatilityScore > 60) volatilityLevel = 'High';

    return {
      volatilityScore,
      volatilityLevel,
      avgChange: Math.round(avgChange * 10) / 10,
      maxChange,
      totalChanges: changes.length,
      period: `${days} days`,
      recommendation:
        volatilityLevel === 'High'
          ? 'SERP is highly volatile - monitor closely for algorithm updates'
          : volatilityLevel === 'Medium'
            ? 'Moderate volatility - continue regular monitoring'
            : 'Stable SERP - maintain current strategy',
    };
  }

  /**
   * Get SERP feature trends
   * @param projectId - Project ID
   * @param days - Number of days
   * @returns Feature trends
   */
  async getSerpFeatureTrends(projectId: string, days: number = 30) {
    this.logger.log(`Getting SERP feature trends for project: ${projectId}`);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const rankings = await this.rankingRepository.find({
      where: { projectId },
      order: { checkedAt: 'DESC' },
    });

    // Group by date and count features
    const trendData: Record<string, any> = {};

    rankings.forEach((ranking) => {
      const date = ranking.checkedAt.toISOString().split('T')[0];

      if (!trendData[date]) {
        trendData[date] = {
          date,
          featuredSnippet: 0,
          peopleAlsoAsk: 0,
          localPack: 0,
          shopping: 0,
          total: 0,
        };
      }

      trendData[date].total++;
      Object.keys(ranking.serpFeatures).forEach((feature) => {
        if (ranking.serpFeatures[feature]) {
          trendData[date][feature] = (trendData[date][feature] || 0) + 1;
        }
      });
    });

    return Object.values(trendData).sort((a: any, b: any) =>
      a.date.localeCompare(b.date),
    );
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
