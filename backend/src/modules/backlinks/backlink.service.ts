import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Backlink, BacklinkStatus } from './entities/backlink.entity';
import { Project } from '../../database/entities/project.entity';
import { CreateBacklinkDto } from './dto/create-backlink.dto';
import { LinkQualityScorer } from './link-quality.scorer';
import { ToxicLinkDetector } from './toxic-link.detector';

/**
 * Backlink Service
 * Manages backlink analysis and tracking
 */
@Injectable()
export class BacklinkService {
  private readonly logger = new Logger(BacklinkService.name);

  constructor(
    @InjectRepository(Backlink)
    private backlinkRepository: Repository<Backlink>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private linkQualityScorer: LinkQualityScorer,
    private toxicLinkDetector: ToxicLinkDetector,
  ) {}

  /**
   * Create a new backlink
   * @param createBacklinkDto - Backlink data
   * @param projectId - Project ID
   * @returns Created backlink
   */
  async create(createBacklinkDto: CreateBacklinkDto, projectId: string): Promise<Backlink> {
    this.logger.log(`Creating backlink for project: ${projectId}`);

    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const sourceDomain = this.extractDomain(createBacklinkDto.sourceUrl);

    // Calculate quality and toxicity scores
    const qualityScore = this.linkQualityScorer.calculateScore({
      domainAuthority: createBacklinkDto.domainAuthority || 50,
      pageAuthority: createBacklinkDto.pageAuthority || 40,
      linkType: createBacklinkDto.type,
      anchorText: createBacklinkDto.anchorText,
    });

    const isToxic = this.toxicLinkDetector.isToxic({
      domain: sourceDomain,
      spamScore: 0,
    });

    const backlink = this.backlinkRepository.create({
      ...createBacklinkDto,
      projectId,
      sourceDomain,
      qualityScore,
      isToxic,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
    });

    return this.backlinkRepository.save(backlink);
  }

  /**
   * Get all backlinks for a project
   * @param projectId - Project ID
   * @returns List of backlinks
   */
  async findAll(projectId: string): Promise<Backlink[]> {
    return this.backlinkRepository.find({
      where: { projectId },
      order: { qualityScore: 'DESC' },
    });
  }

  /**
   * Get backlink statistics
   * @param projectId - Project ID
   * @returns Backlink statistics
   */
  async getStatistics(projectId: string) {
    const backlinks = await this.backlinkRepository.find({ where: { projectId } });

    return {
      total: backlinks.length,
      active: backlinks.filter((b) => b.status === BacklinkStatus.ACTIVE).length,
      lost: backlinks.filter((b) => b.status === BacklinkStatus.LOST).length,
      toxic: backlinks.filter((b) => b.isToxic).length,
      dofollow: backlinks.filter((b) => b.isDofollow).length,
      highQuality: backlinks.filter((b) => b.isHighQuality).length,
      avgQuality:
        backlinks.length > 0
          ? backlinks.reduce((sum, b) => sum + Number(b.qualityScore), 0) / backlinks.length
          : 0,
      uniqueDomains: new Set(backlinks.map((b) => b.sourceDomain)).size,
    };
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
