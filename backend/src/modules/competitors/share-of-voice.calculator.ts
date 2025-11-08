import { Injectable, Logger } from '@nestjs/common';

/**
 * Share of Voice Calculator
 * Calculates market share based on keyword rankings
 */
@Injectable()
export class ShareOfVoiceCalculator {
  private readonly logger = new Logger(ShareOfVoiceCalculator.name);

  /**
   * Calculate share of voice percentage
   * @param params - Calculation parameters
   * @returns Share of voice (0-100)
   */
  calculateShareOfVoice(params: {
    totalKeywords: number;
    rankingKeywords: number;
    avgPosition: number;
    searchVolume: number;
  }): number {
    const rankingRatio = params.rankingKeywords / params.totalKeywords || 0;
    const positionFactor = this.getPositionFactor(params.avgPosition);
    const volumeFactor = Math.min(params.searchVolume / 10000, 1);

    const shareOfVoice = (rankingRatio * 0.4 + positionFactor * 0.4 + volumeFactor * 0.2) * 100;

    return Math.min(Math.round(shareOfVoice), 100);
  }

  /**
   * Get position factor (better positions = higher score)
   */
  private getPositionFactor(avgPosition: number): number {
    if (avgPosition <= 3) return 1.0;
    if (avgPosition <= 10) return 0.8;
    if (avgPosition <= 20) return 0.5;
    if (avgPosition <= 50) return 0.2;
    return 0.1;
  }

  /**
   * Calculate competitive intensity
   * @param competitors - Array of competitors
   * @returns Competitive intensity score (0-100)
   */
  calculateCompetitiveIntensity(competitors: any[]): number {
    if (competitors.length === 0) return 0;

    const avgDA = competitors.reduce((sum, c) => sum + c.domainAuthority, 0) / competitors.length;
    const avgKeywords =
      competitors.reduce((sum, c) => sum + c.organicKeywords, 0) / competitors.length;

    const intensity = (avgDA * 0.6 + Math.min(avgKeywords / 1000, 100) * 0.4);

    return Math.round(intensity);
  }
}
