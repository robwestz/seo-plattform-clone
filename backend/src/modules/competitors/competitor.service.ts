import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Competitor } from './entities/competitor.entity';
import { Project } from '../../database/entities/project.entity';
import { CreateCompetitorDto } from './dto/create-competitor.dto';
import { ShareOfVoiceCalculator } from './share-of-voice.calculator';

/**
 * Competitor Service
 * Manages competitor analysis and gap detection
 */
@Injectable()
export class CompetitorService {
  private readonly logger = new Logger(CompetitorService.name);

  constructor(
    @InjectRepository(Competitor)
    private competitorRepository: Repository<Competitor>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private shareOfVoiceCalculator: ShareOfVoiceCalculator,
  ) {}

  /**
   * Create a new competitor
   * @param createCompetitorDto - Competitor data
   * @param projectId - Project ID
   * @returns Created competitor
   */
  async create(createCompetitorDto: CreateCompetitorDto, projectId: string): Promise<Competitor> {
    this.logger.log(`Adding competitor ${createCompetitorDto.domain} to project: ${projectId}`);

    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if competitor already exists
    const existing = await this.competitorRepository.findOne({
      where: { projectId, domain: createCompetitorDto.domain },
    });

    if (existing) {
      throw new ConflictException('Competitor already exists in this project');
    }

    const competitor = this.competitorRepository.create({
      ...createCompetitorDto,
      projectId,
      name: createCompetitorDto.name || createCompetitorDto.domain,
    });

    const saved = await this.competitorRepository.save(competitor);

    // Analyze competitor asynchronously
    this.analyzeCompetitor(saved.id).catch((error) => {
      this.logger.error(`Failed to analyze competitor: ${error.message}`);
    });

    return saved;
  }

  /**
   * Get all competitors for a project
   * @param projectId - Project ID
   * @returns List of competitors
   */
  async findAll(projectId: string): Promise<Competitor[]> {
    return this.competitorRepository.find({
      where: { projectId },
      order: { shareOfVoice: 'DESC' },
    });
  }

  /**
   * Analyze a competitor
   * @param competitorId - Competitor ID
   */
  private async analyzeCompetitor(competitorId: string): Promise<void> {
    this.logger.log(`Analyzing competitor: ${competitorId}`);

    // Simulate competitor analysis (in production, fetch real data)
    const metrics = {
      domainAuthority: Math.floor(Math.random() * 100),
      organicTraffic: Math.floor(Math.random() * 100000),
      organicKeywords: Math.floor(Math.random() * 10000),
      backlinksCount: Math.floor(Math.random() * 50000),
      referringDomains: Math.floor(Math.random() * 5000),
      commonKeywords: Math.floor(Math.random() * 500),
      keywordGaps: Math.floor(Math.random() * 1000),
    };

    await this.competitorRepository.update(competitorId, {
      ...metrics,
      lastAnalyzedAt: new Date(),
    });
  }

  /**
   * Perform gap analysis
   * @param projectId - Project ID
   * @returns Gap analysis results
   */
  async performGapAnalysis(projectId: string) {
    this.logger.log(`Performing gap analysis for project: ${projectId}`);

    const competitors = await this.competitorRepository.find({ where: { projectId } });

    const analysis = {
      totalCompetitors: competitors.length,
      avgDomainAuthority:
        competitors.reduce((sum, c) => sum + c.domainAuthority, 0) / competitors.length || 0,
      totalKeywordGaps: competitors.reduce((sum, c) => sum + c.keywordGaps, 0),
      topCompetitors: competitors
        .sort((a, b) => b.competitiveStrength - a.competitiveStrength)
        .slice(0, 5)
        .map((c) => ({
          domain: c.domain,
          strength: c.competitiveStrength,
          keywordGaps: c.keywordGaps,
        })),
      opportunities: this.identifyOpportunities(competitors),
    };

    return analysis;
  }

  /**
   * Identify competitive opportunities
   */
  private identifyOpportunities(competitors: Competitor[]) {
    const opportunities: any[] = [];

    competitors.forEach((competitor) => {
      if (competitor.keywordGaps > 100) {
        opportunities.push({
          type: 'keyword_gap',
          competitor: competitor.domain,
          value: competitor.keywordGaps,
          priority: 'high',
        });
      }

      if (competitor.contentGapScore > 50) {
        opportunities.push({
          type: 'content_gap',
          competitor: competitor.domain,
          value: Number(competitor.contentGapScore),
          priority: 'medium',
        });
      }
    });

    return opportunities.sort((a, b) => b.value - a.value).slice(0, 10);
  }
}
