import { Injectable, Logger } from '@nestjs/common';
import { LinkType } from './entities/backlink.entity';

/**
 * Link Quality Scorer
 * Calculates quality scores for backlinks
 */
@Injectable()
export class LinkQualityScorer {
  private readonly logger = new Logger(LinkQualityScorer.name);

  /**
   * Calculate backlink quality score
   * @param params - Scoring parameters
   * @returns Quality score (0-100)
   */
  calculateScore(params: {
    domainAuthority: number;
    pageAuthority: number;
    linkType?: LinkType;
    anchorText?: string;
    spamScore?: number;
    trustScore?: number;
  }): number {
    let score = 0;

    // Domain authority (0-40 points)
    score += (params.domainAuthority / 100) * 40;

    // Page authority (0-30 points)
    score += (params.pageAuthority / 100) * 30;

    // Link type bonus (0-15 points)
    if (params.linkType === LinkType.FOLLOW) {
      score += 15;
    } else {
      score += 5; // Nofollow still has some value
    }

    // Anchor text relevance (0-10 points)
    if (params.anchorText && params.anchorText.length > 0) {
      score += 10;
    }

    // Trust score bonus (0-5 points)
    if (params.trustScore) {
      score += (params.trustScore / 100) * 5;
    }

    // Spam score penalty
    if (params.spamScore) {
      score -= params.spamScore * 0.5;
    }

    return Math.min(Math.max(Math.round(score), 0), 100);
  }

  /**
   * Calculate link velocity (new links over time)
   * @param backlinks - Array of backlinks
   * @param days - Number of days
   * @returns Link velocity
   */
  calculateVelocity(backlinks: any[], days: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentLinks = backlinks.filter(
      (link) => new Date(link.firstSeenAt) >= cutoffDate,
    );

    return recentLinks.length / days;
  }
}
