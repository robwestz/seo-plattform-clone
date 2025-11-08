import { Injectable, Logger } from '@nestjs/common';
import { IssueSeverity, IssueCategory } from './entities/audit-issue.entity';

/**
 * Page Speed Service
 * Analyzes page speed and Core Web Vitals
 */
@Injectable()
export class PageSpeedService {
  private readonly logger = new Logger(PageSpeedService.name);

  /**
   * Analyze page speed metrics
   * In production, integrate with Google PageSpeed Insights API
   * @param url - URL to analyze
   * @returns Page speed metrics
   */
  async analyze(url: string): Promise<any> {
    this.logger.log(`Analyzing page speed for: ${url}`);

    // Simulate page speed metrics (in production, call PageSpeed Insights API)
    const metrics = {
      fcp: this.randomMetric(800, 3000), // First Contentful Paint (ms)
      lcp: this.randomMetric(1200, 4500), // Largest Contentful Paint (ms)
      fid: this.randomMetric(50, 300), // First Input Delay (ms)
      cls: this.randomMetric(0, 0.5, true), // Cumulative Layout Shift
      ttfb: this.randomMetric(200, 1500), // Time to First Byte (ms)
      tti: this.randomMetric(2000, 7000), // Time to Interactive (ms)
    };

    return metrics;
  }

  /**
   * Calculate performance score from metrics
   * @param metrics - Page speed metrics
   * @returns Performance score (0-100)
   */
  calculatePerformanceScore(metrics: any): number {
    let score = 100;

    // LCP scoring (0-40 points)
    if (metrics.lcp > 4000) score -= 40;
    else if (metrics.lcp > 2500) score -= 20;
    else if (metrics.lcp > 1800) score -= 10;

    // FID scoring (0-20 points)
    if (metrics.fid > 300) score -= 20;
    else if (metrics.fid > 100) score -= 10;

    // CLS scoring (0-20 points)
    if (metrics.cls > 0.25) score -= 20;
    else if (metrics.cls > 0.1) score -= 10;

    // FCP scoring (0-10 points)
    if (metrics.fcp > 3000) score -= 10;
    else if (metrics.fcp > 1800) score -= 5;

    // TTFB scoring (0-10 points)
    if (metrics.ttfb > 1000) score -= 10;
    else if (metrics.ttfb > 500) score -= 5;

    return Math.max(score, 0);
  }

  /**
   * Get issues from metrics
   * @param metrics - Page speed metrics
   * @returns Array of issues
   */
  getIssuesFromMetrics(metrics: any): any[] {
    const issues: any[] = [];

    // LCP issues
    if (metrics.lcp > 2500) {
      issues.push({
        severity: metrics.lcp > 4000 ? IssueSeverity.CRITICAL : IssueSeverity.WARNING,
        category: IssueCategory.PERFORMANCE,
        title: 'Slow Largest Contentful Paint',
        description: `LCP is ${Math.round(metrics.lcp)}ms (should be under 2500ms)`,
        recommendation: 'Optimize images, reduce server response time, use CDN',
      });
    }

    // FID issues
    if (metrics.fid > 100) {
      issues.push({
        severity: metrics.fid > 300 ? IssueSeverity.CRITICAL : IssueSeverity.WARNING,
        category: IssueCategory.PERFORMANCE,
        title: 'High First Input Delay',
        description: `FID is ${Math.round(metrics.fid)}ms (should be under 100ms)`,
        recommendation: 'Reduce JavaScript execution time, split long tasks',
      });
    }

    // CLS issues
    if (metrics.cls > 0.1) {
      issues.push({
        severity: metrics.cls > 0.25 ? IssueSeverity.CRITICAL : IssueSeverity.WARNING,
        category: IssueCategory.PERFORMANCE,
        title: 'Layout Shift Issues',
        description: `CLS is ${metrics.cls.toFixed(3)} (should be under 0.1)`,
        recommendation: 'Add size attributes to images and videos, avoid dynamic content insertion',
      });
    }

    // FCP issues
    if (metrics.fcp > 1800) {
      issues.push({
        severity: metrics.fcp > 3000 ? IssueSeverity.WARNING : IssueSeverity.INFO,
        category: IssueCategory.PERFORMANCE,
        title: 'Slow First Contentful Paint',
        description: `FCP is ${Math.round(metrics.fcp)}ms (should be under 1800ms)`,
        recommendation: 'Optimize fonts, eliminate render-blocking resources',
      });
    }

    // TTFB issues
    if (metrics.ttfb > 600) {
      issues.push({
        severity: metrics.ttfb > 1000 ? IssueSeverity.WARNING : IssueSeverity.INFO,
        category: IssueCategory.PERFORMANCE,
        title: 'Slow Server Response',
        description: `TTFB is ${Math.round(metrics.ttfb)}ms (should be under 600ms)`,
        recommendation: 'Optimize server configuration, use caching, upgrade hosting',
      });
    }

    return issues;
  }

  /**
   * Generate random metric value
   */
  private randomMetric(min: number, max: number, isFloat: boolean = false): number {
    const value = Math.random() * (max - min) + min;
    return isFloat ? Math.round(value * 1000) / 1000 : Math.round(value);
  }
}
