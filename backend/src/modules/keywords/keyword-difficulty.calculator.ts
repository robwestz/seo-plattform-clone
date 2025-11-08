import { Injectable, Logger } from '@nestjs/common';

/**
 * Keyword Difficulty Calculator
 * Calculates SEO difficulty score based on multiple factors
 * Score range: 0-100 (higher = more difficult)
 */
@Injectable()
export class KeywordDifficultyCalculator {
  private readonly logger = new Logger(KeywordDifficultyCalculator.name);

  /**
   * Calculate keyword difficulty score
   * @param params - Difficulty calculation parameters
   * @returns Difficulty score (0-100)
   */
  calculateDifficulty(params: {
    searchVolume: number;
    competition: number;
    topPageAuthority?: number[];
    topDomainAuthority?: number[];
    topBacklinks?: number[];
    serpFeatures?: string[];
  }): number {
    this.logger.debug(`Calculating difficulty for keyword with volume: ${params.searchVolume}`);

    let score = 0;

    // Base score from competition (0-30 points)
    score += this.calculateCompetitionScore(params.competition);

    // Search volume factor (0-15 points)
    score += this.calculateVolumeScore(params.searchVolume);

    // Page authority (0-20 points)
    if (params.topPageAuthority && params.topPageAuthority.length > 0) {
      score += this.calculatePageAuthorityScore(params.topPageAuthority);
    }

    // Domain authority (0-20 points)
    if (params.topDomainAuthority && params.topDomainAuthority.length > 0) {
      score += this.calculateDomainAuthorityScore(params.topDomainAuthority);
    }

    // Backlinks factor (0-10 points)
    if (params.topBacklinks && params.topBacklinks.length > 0) {
      score += this.calculateBacklinksScore(params.topBacklinks);
    }

    // SERP features penalty (0-5 points)
    if (params.serpFeatures && params.serpFeatures.length > 0) {
      score += this.calculateSerpFeaturesScore(params.serpFeatures);
    }

    // Normalize to 0-100
    return Math.min(Math.max(Math.round(score), 0), 100);
  }

  /**
   * Calculate competition score (0-30 points)
   */
  private calculateCompetitionScore(competition: number): number {
    return competition * 30;
  }

  /**
   * Calculate volume score (0-15 points)
   * Higher volume = higher difficulty
   */
  private calculateVolumeScore(volume: number): number {
    if (volume < 100) return 0;
    if (volume < 500) return 3;
    if (volume < 1000) return 5;
    if (volume < 5000) return 8;
    if (volume < 10000) return 10;
    if (volume < 50000) return 12;
    return 15;
  }

  /**
   * Calculate page authority score (0-20 points)
   * Based on average PA of top 10 results
   */
  private calculatePageAuthorityScore(pageAuthorities: number[]): number {
    const avgPA = pageAuthorities.reduce((sum, pa) => sum + pa, 0) / pageAuthorities.length;
    return (avgPA / 100) * 20;
  }

  /**
   * Calculate domain authority score (0-20 points)
   * Based on average DA of top 10 results
   */
  private calculateDomainAuthorityScore(domainAuthorities: number[]): number {
    const avgDA = domainAuthorities.reduce((sum, da) => sum + da, 0) / domainAuthorities.length;
    return (avgDA / 100) * 20;
  }

  /**
   * Calculate backlinks score (0-10 points)
   * Based on average backlinks of top 10 results
   */
  private calculateBacklinksScore(backlinks: number[]): number {
    const avgBacklinks = backlinks.reduce((sum, bl) => sum + bl, 0) / backlinks.length;

    if (avgBacklinks < 10) return 0;
    if (avgBacklinks < 50) return 2;
    if (avgBacklinks < 100) return 4;
    if (avgBacklinks < 500) return 6;
    if (avgBacklinks < 1000) return 8;
    return 10;
  }

  /**
   * Calculate SERP features penalty (0-5 points)
   * More SERP features = harder to rank organically
   */
  private calculateSerpFeaturesScore(features: string[]): number {
    const penaltyFeatures = ['featured_snippet', 'knowledge_panel', 'local_pack', 'shopping'];
    const count = features.filter((f) => penaltyFeatures.includes(f)).length;
    return Math.min(count * 1.5, 5);
  }

  /**
   * Classify keyword intent based on the keyword text
   * @param keyword - Keyword to classify
   * @returns Intent classification
   */
  classifyIntent(keyword: string): string {
    const lowerKeyword = keyword.toLowerCase();

    // Transactional intent patterns
    const transactionalPatterns = [
      /buy/,
      /purchase/,
      /order/,
      /discount/,
      /coupon/,
      /deal/,
      /price/,
      /cheap/,
      /affordable/,
      /for sale/,
    ];

    // Commercial intent patterns
    const commercialPatterns = [
      /best/,
      /top/,
      /review/,
      /compare/,
      /vs/,
      /alternative/,
      /recommendation/,
    ];

    // Navigational intent patterns
    const navigationalPatterns = [/login/, /sign in/, /download/, /app/, /official/];

    // Check patterns
    if (transactionalPatterns.some((pattern) => pattern.test(lowerKeyword))) {
      return 'transactional';
    }

    if (commercialPatterns.some((pattern) => pattern.test(lowerKeyword))) {
      return 'commercial';
    }

    if (navigationalPatterns.some((pattern) => pattern.test(lowerKeyword))) {
      return 'navigational';
    }

    // Default to informational
    return 'informational';
  }

  /**
   * Estimate keyword opportunity score
   * Considers volume, difficulty, and current ranking
   * @returns Opportunity score (0-100)
   */
  calculateOpportunityScore(params: {
    searchVolume: number;
    difficulty: number;
    currentPosition?: number;
    cpc?: number;
  }): number {
    let score = 0;

    // Volume contribution (0-40 points)
    const volumeScore = Math.min((params.searchVolume / 10000) * 40, 40);
    score += volumeScore;

    // Inverse difficulty (0-30 points)
    const difficultyScore = ((100 - params.difficulty) / 100) * 30;
    score += difficultyScore;

    // CPC value (0-15 points)
    if (params.cpc) {
      const cpcScore = Math.min((params.cpc / 10) * 15, 15);
      score += cpcScore;
    }

    // Position boost (0-15 points)
    if (params.currentPosition) {
      if (params.currentPosition > 10 && params.currentPosition <= 20) {
        score += 10; // Quick win potential
      } else if (params.currentPosition > 20 && params.currentPosition <= 50) {
        score += 5;
      }
    } else {
      score += 15; // Not ranking yet - high opportunity
    }

    return Math.min(Math.max(Math.round(score), 0), 100);
  }
}
