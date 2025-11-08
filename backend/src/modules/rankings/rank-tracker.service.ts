import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Ranking, DeviceType } from './entities/ranking.entity';
import { Keyword } from '../keywords/entities/keyword.entity';
import { Project } from '../../database/entities/project.entity';

/**
 * Rank Tracker Service
 * Tracks keyword rankings and position changes over time
 */
@Injectable()
export class RankTrackerService {
  private readonly logger = new Logger(RankTrackerService.name);

  constructor(
    @InjectRepository(Ranking)
    private rankingRepository: Repository<Ranking>,
    @InjectRepository(Keyword)
    private keywordRepository: Repository<Keyword>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  /**
   * Track ranking for a keyword
   * In production, this would call Google Search API or scrape SERPs
   * @param keywordId - Keyword to track
   * @param projectId - Project ID
   * @param device - Device type
   * @param location - Geographic location
   * @returns Ranking data
   */
  async trackKeyword(
    keywordId: string,
    projectId: string,
    device: DeviceType = DeviceType.DESKTOP,
    location: string = 'US',
  ): Promise<Ranking> {
    this.logger.log(`Tracking keyword: ${keywordId} for project: ${projectId}`);

    // Verify keyword exists and belongs to project
    const keyword = await this.keywordRepository.findOne({
      where: { id: keywordId, projectId },
    });

    if (!keyword) {
      throw new NotFoundException('Keyword not found');
    }

    // Get previous ranking
    const previousRanking = await this.getLatestRanking(keywordId, device, location);

    // Simulate rank checking (in production, call real SERP API)
    const position = this.simulateRankCheck(keyword.keyword);
    const previousPosition = previousRanking?.position;

    const ranking = this.rankingRepository.create({
      projectId,
      keywordId,
      position,
      previousPosition,
      positionChange: previousPosition ? previousPosition - position : 0,
      device,
      location,
      language: 'en',
      serpFeatures: this.analyzeSerpFeatures(keyword.keyword),
      top10Urls: this.getTop10Urls(),
      top10Titles: this.getTop10Titles(),
      estimatedTraffic: this.estimateTraffic(position, keyword.searchVolume),
      visibilityScore: this.calculateVisibilityScore(position),
      checkedAt: new Date(),
    });

    const saved = await this.rankingRepository.save(ranking);

    // Update keyword with latest position
    await this.keywordRepository.update(keywordId, {
      currentPosition: position,
      positionChange: ranking.positionChange,
      lastCheckedAt: new Date(),
      lastRankedAt: position <= 100 ? new Date() : keyword.lastRankedAt,
    });

    return saved;
  }

  /**
   * Track multiple keywords in bulk
   * @param keywordIds - Array of keyword IDs
   * @param projectId - Project ID
   * @param device - Device type
   * @param location - Location
   * @returns Array of ranking results
   */
  async bulkTrackKeywords(
    keywordIds: string[],
    projectId: string,
    device: DeviceType = DeviceType.DESKTOP,
    location: string = 'US',
  ): Promise<Ranking[]> {
    this.logger.log(`Bulk tracking ${keywordIds.length} keywords`);

    const rankings: Ranking[] = [];

    for (const keywordId of keywordIds) {
      try {
        const ranking = await this.trackKeyword(keywordId, projectId, device, location);
        rankings.push(ranking);
      } catch (error) {
        this.logger.error(`Failed to track keyword ${keywordId}: ${error.message}`);
      }
    }

    return rankings;
  }

  /**
   * Get ranking history for a keyword
   * @param keywordId - Keyword ID
   * @param startDate - Start date
   * @param endDate - End date
   * @param device - Device type
   * @returns Ranking history
   */
  async getRankingHistory(
    keywordId: string,
    startDate?: Date,
    endDate?: Date,
    device?: DeviceType,
  ): Promise<Ranking[]> {
    this.logger.log(`Getting ranking history for keyword: ${keywordId}`);

    const queryBuilder = this.rankingRepository
      .createQueryBuilder('ranking')
      .where('ranking.keywordId = :keywordId', { keywordId });

    if (device) {
      queryBuilder.andWhere('ranking.device = :device', { device });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('ranking.checkedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    queryBuilder.orderBy('ranking.checkedAt', 'ASC');

    return queryBuilder.getMany();
  }

  /**
   * Get latest ranking for a keyword
   * @param keywordId - Keyword ID
   * @param device - Device type
   * @param location - Location
   * @returns Latest ranking or null
   */
  async getLatestRanking(
    keywordId: string,
    device: DeviceType = DeviceType.DESKTOP,
    location: string = 'US',
  ): Promise<Ranking | null> {
    return this.rankingRepository.findOne({
      where: { keywordId, device, location },
      order: { checkedAt: 'DESC' },
    });
  }

  /**
   * Get project ranking overview
   * @param projectId - Project ID
   * @returns Ranking statistics
   */
  async getProjectOverview(projectId: string) {
    this.logger.log(`Getting ranking overview for project: ${projectId}`);

    const keywords = await this.keywordRepository.find({
      where: { projectId },
    });

    const stats = {
      totalKeywords: keywords.length,
      ranking: keywords.filter((k) => k.currentPosition && k.currentPosition <= 100).length,
      topTen: keywords.filter((k) => k.currentPosition && k.currentPosition <= 10).length,
      topThree: keywords.filter((k) => k.currentPosition && k.currentPosition <= 3).length,
      improved: keywords.filter((k) => k.positionChange > 0).length,
      declined: keywords.filter((k) => k.positionChange < 0).length,
      stable: keywords.filter((k) => k.positionChange === 0).length,
      avgPosition:
        keywords.filter((k) => k.currentPosition).length > 0
          ? keywords
              .filter((k) => k.currentPosition)
              .reduce((sum, k) => sum + k.currentPosition, 0) /
            keywords.filter((k) => k.currentPosition).length
          : null,
    };

    return stats;
  }

  /**
   * Simulate rank checking (mock implementation)
   * In production, this would call Google Search API
   */
  private simulateRankCheck(keyword: string): number {
    // Simulate a ranking between 1 and 100
    return Math.floor(Math.random() * 100) + 1;
  }

  /**
   * Analyze SERP features (mock implementation)
   */
  private analyzeSerpFeatures(keyword: string) {
    return {
      featuredSnippet: Math.random() > 0.7,
      peopleAlsoAsk: Math.random() > 0.5,
      localPack: keyword.includes('near me') || Math.random() > 0.8,
      knowledgePanel: Math.random() > 0.8,
      shopping: keyword.includes('buy') || Math.random() > 0.85,
      images: Math.random() > 0.6,
      videos: Math.random() > 0.7,
      news: Math.random() > 0.8,
      relatedSearches: true,
    };
  }

  /**
   * Get mock top 10 URLs
   */
  private getTop10Urls(): string[] {
    return Array(10)
      .fill(0)
      .map((_, i) => `https://example${i + 1}.com/page`);
  }

  /**
   * Get mock top 10 titles
   */
  private getTop10Titles(): string[] {
    return Array(10)
      .fill(0)
      .map((_, i) => `Top Result ${i + 1} - Example Title`);
  }

  /**
   * Estimate traffic based on position and search volume
   */
  private estimateTraffic(position: number, searchVolume: number): number {
    const ctrByPosition: Record<number, number> = {
      1: 0.31,
      2: 0.24,
      3: 0.18,
      4: 0.13,
      5: 0.09,
      6: 0.06,
      7: 0.04,
      8: 0.03,
      9: 0.02,
      10: 0.02,
    };

    const ctr = ctrByPosition[position] || 0.01;
    return Math.round(searchVolume * ctr);
  }

  /**
   * Calculate visibility score based on position
   */
  private calculateVisibilityScore(position: number): number {
    if (position <= 3) return 100;
    if (position <= 10) return 80;
    if (position <= 20) return 50;
    if (position <= 50) return 20;
    return 5;
  }
}
