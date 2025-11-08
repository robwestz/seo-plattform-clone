import { Injectable, Logger } from '@nestjs/common';

/**
 * Toxic Link Detector
 * Identifies potentially harmful backlinks
 */
@Injectable()
export class ToxicLinkDetector {
  private readonly logger = new Logger(ToxicLinkDetector.name);

  private readonly toxicPatterns = [
    /casino/i,
    /poker/i,
    /pills/i,
    /viagra/i,
    /pharma/i,
    /porn/i,
    /xxx/i,
  ];

  /**
   * Check if a link is toxic
   * @param params - Link parameters
   * @returns True if toxic
   */
  isToxic(params: { domain: string; spamScore?: number; anchorText?: string }): boolean {
    // Check spam score threshold
    if (params.spamScore && params.spamScore > 70) {
      return true;
    }

    // Check domain against toxic patterns
    if (this.toxicPatterns.some((pattern) => pattern.test(params.domain))) {
      return true;
    }

    // Check anchor text for spammy patterns
    if (params.anchorText && this.toxicPatterns.some((pattern) => pattern.test(params.anchorText))) {
      return true;
    }

    return false;
  }

  /**
   * Calculate toxicity score
   * @param params - Link parameters
   * @returns Toxicity score (0-100)
   */
  calculateToxicityScore(params: {
    domain: string;
    spamScore?: number;
    anchorText?: string;
  }): number {
    let score = 0;

    // Spam score contribution
    if (params.spamScore) {
      score += params.spamScore * 0.6;
    }

    // Pattern matching contribution
    const matchCount = this.toxicPatterns.filter(
      (pattern) =>
        pattern.test(params.domain) || (params.anchorText && pattern.test(params.anchorText)),
    ).length;

    score += matchCount * 20;

    return Math.min(Math.round(score), 100);
  }
}
