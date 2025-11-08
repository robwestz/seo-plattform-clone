import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Keyword, KeywordStatus } from './entities/keyword.entity';
import { Project } from '../../database/entities/project.entity';
import { CreateKeywordDto } from './dto/create-keyword.dto';
import { UpdateKeywordDto } from './dto/update-keyword.dto';
import { KeywordQueryDto } from './dto/keyword-query.dto';
import { KeywordDifficultyCalculator } from './keyword-difficulty.calculator';
import { SuggestionService } from './suggestion.service';

/**
 * Keyword Service
 * Manages keyword research, tracking, and analysis
 */
@Injectable()
export class KeywordService {
  private readonly logger = new Logger(KeywordService.name);

  constructor(
    @InjectRepository(Keyword)
    private keywordRepository: Repository<Keyword>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private difficultyCalculator: KeywordDifficultyCalculator,
    private suggestionService: SuggestionService,
  ) {}

  /**
   * Create a new keyword for tracking
   * @param createKeywordDto - Keyword creation data
   * @param projectId - Project ID
   * @returns Created keyword
   */
  async create(createKeywordDto: CreateKeywordDto, projectId: string): Promise<Keyword> {
    this.logger.log(`Creating keyword: ${createKeywordDto.keyword} for project: ${projectId}`);

    // Verify project exists
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if keyword already exists in project
    const existingKeyword = await this.keywordRepository.findOne({
      where: {
        projectId,
        keyword: createKeywordDto.keyword.toLowerCase().trim(),
        deletedAt: IsNull(),
      },
    });

    if (existingKeyword) {
      throw new ConflictException('Keyword already exists in this project');
    }

    // Calculate difficulty if not provided
    let difficulty = createKeywordDto.difficulty;
    if (!difficulty) {
      difficulty = this.difficultyCalculator.calculateDifficulty({
        searchVolume: createKeywordDto.searchVolume || 0,
        competition: createKeywordDto.competition || 0.5,
      });
    }

    // Classify intent if not provided
    let intent = createKeywordDto.intent;
    if (!intent) {
      intent = this.difficultyCalculator.classifyIntent(
        createKeywordDto.keyword,
      ) as any;
    }

    const keyword = this.keywordRepository.create({
      ...createKeywordDto,
      keyword: createKeywordDto.keyword.toLowerCase().trim(),
      projectId,
      difficulty,
      intent,
    });

    return this.keywordRepository.save(keyword);
  }

  /**
   * Get all keywords for a project with filters
   * @param projectId - Project ID
   * @param query - Filter and pagination options
   * @returns Filtered keywords
   */
  async findAll(projectId: string, query: KeywordQueryDto): Promise<{
    data: Keyword[];
    total: number;
    page: number;
    limit: number;
  }> {
    this.logger.log(`Finding keywords for project: ${projectId}`);

    const queryBuilder = this.keywordRepository
      .createQueryBuilder('keyword')
      .where('keyword.projectId = :projectId', { projectId })
      .andWhere('keyword.deletedAt IS NULL');

    // Apply filters
    if (query.search) {
      queryBuilder.andWhere('keyword.keyword ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    if (query.status) {
      queryBuilder.andWhere('keyword.status = :status', { status: query.status });
    }

    if (query.intent) {
      queryBuilder.andWhere('keyword.intent = :intent', { intent: query.intent });
    }

    if (query.minDifficulty !== undefined) {
      queryBuilder.andWhere('keyword.difficulty >= :minDifficulty', {
        minDifficulty: query.minDifficulty,
      });
    }

    if (query.maxDifficulty !== undefined) {
      queryBuilder.andWhere('keyword.difficulty <= :maxDifficulty', {
        maxDifficulty: query.maxDifficulty,
      });
    }

    if (query.minVolume !== undefined) {
      queryBuilder.andWhere('keyword.searchVolume >= :minVolume', {
        minVolume: query.minVolume,
      });
    }

    if (query.maxVolume !== undefined) {
      queryBuilder.andWhere('keyword.searchVolume <= :maxVolume', {
        maxVolume: query.maxVolume,
      });
    }

    // Apply sorting
    queryBuilder.orderBy(`keyword.${query.sortBy}`, query.sortOrder);

    // Apply pagination
    const total = await queryBuilder.getCount();
    queryBuilder.skip(query.offset).take(query.limit);

    const data = await queryBuilder.getMany();

    return {
      data,
      total,
      page: Math.floor(query.offset / query.limit) + 1,
      limit: query.limit,
    };
  }

  /**
   * Get a specific keyword by ID
   * @param id - Keyword ID
   * @param projectId - Project ID (for isolation)
   * @returns Keyword details
   */
  async findOne(id: string, projectId: string): Promise<Keyword> {
    this.logger.log(`Finding keyword: ${id} in project: ${projectId}`);

    const keyword = await this.keywordRepository.findOne({
      where: { id, projectId, deletedAt: IsNull() },
      relations: ['project'],
    });

    if (!keyword) {
      throw new NotFoundException('Keyword not found');
    }

    return keyword;
  }

  /**
   * Update a keyword
   * @param id - Keyword ID
   * @param updateKeywordDto - Update data
   * @param projectId - Project ID (for isolation)
   * @returns Updated keyword
   */
  async update(
    id: string,
    updateKeywordDto: UpdateKeywordDto,
    projectId: string,
  ): Promise<Keyword> {
    this.logger.log(`Updating keyword: ${id}`);

    const keyword = await this.findOne(id, projectId);

    Object.assign(keyword, updateKeywordDto);
    return this.keywordRepository.save(keyword);
  }

  /**
   * Soft delete a keyword
   * @param id - Keyword ID
   * @param projectId - Project ID (for isolation)
   */
  async remove(id: string, projectId: string): Promise<void> {
    this.logger.log(`Deleting keyword: ${id}`);

    const keyword = await this.findOne(id, projectId);

    keyword.deletedAt = new Date();
    keyword.status = KeywordStatus.ARCHIVED;
    await this.keywordRepository.save(keyword);
  }

  /**
   * Bulk import keywords
   * @param keywords - Array of keyword data
   * @param projectId - Project ID
   * @returns Import results
   */
  async bulkImport(
    keywords: CreateKeywordDto[],
    projectId: string,
  ): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    this.logger.log(`Bulk importing ${keywords.length} keywords for project: ${projectId}`);

    const results = { imported: 0, skipped: 0, errors: [] };

    for (const keywordDto of keywords) {
      try {
        await this.create(keywordDto, projectId);
        results.imported++;
      } catch (error) {
        results.skipped++;
        results.errors.push(`${keywordDto.keyword}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Research keywords using suggestion service
   * @param seedKeyword - Base keyword
   * @param projectId - Project ID
   * @param limit - Number of suggestions
   * @returns Keyword suggestions
   */
  async researchKeywords(seedKeyword: string, projectId: string, limit: number = 50) {
    this.logger.log(`Researching keywords for: ${seedKeyword}`);

    // Verify project exists
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.suggestionService.generateSuggestions(seedKeyword, limit);
  }

  /**
   * Get keyword statistics for a project
   * @param projectId - Project ID
   * @returns Keyword statistics
   */
  async getStatistics(projectId: string) {
    this.logger.log(`Getting keyword statistics for project: ${projectId}`);

    const keywords = await this.keywordRepository.find({
      where: { projectId, deletedAt: IsNull() },
    });

    const stats = {
      total: keywords.length,
      ranking: keywords.filter((k) => k.isRanking).length,
      topTen: keywords.filter((k) => k.isTopTen).length,
      byIntent: {
        informational: keywords.filter((k) => k.intent === 'informational').length,
        navigational: keywords.filter((k) => k.intent === 'navigational').length,
        transactional: keywords.filter((k) => k.intent === 'transactional').length,
        commercial: keywords.filter((k) => k.intent === 'commercial').length,
      },
      byDifficulty: {
        easy: keywords.filter((k) => k.difficulty < 30).length,
        medium: keywords.filter((k) => k.difficulty >= 30 && k.difficulty < 50).length,
        hard: keywords.filter((k) => k.difficulty >= 50 && k.difficulty < 70).length,
        veryHard: keywords.filter((k) => k.difficulty >= 70).length,
      },
      totalVolume: keywords.reduce((sum, k) => sum + k.searchVolume, 0),
      avgDifficulty:
        keywords.length > 0
          ? keywords.reduce((sum, k) => sum + k.difficulty, 0) / keywords.length
          : 0,
    };

    return stats;
  }

  /**
   * Update keyword positions from rank tracking
   * @param id - Keyword ID
   * @param position - New position
   * @param projectId - Project ID
   */
  async updatePosition(id: string, position: number, projectId: string): Promise<Keyword> {
    this.logger.log(`Updating position for keyword: ${id} to ${position}`);

    const keyword = await this.findOne(id, projectId);

    const previousPosition = keyword.currentPosition;
    keyword.currentPosition = position;
    keyword.positionChange = previousPosition ? previousPosition - position : 0;

    if (!keyword.bestPosition || position < keyword.bestPosition) {
      keyword.bestPosition = position;
    }

    if (!keyword.worstPosition || position > keyword.worstPosition) {
      keyword.worstPosition = position;
    }

    keyword.lastRankedAt = new Date();

    return this.keywordRepository.save(keyword);
  }
}
