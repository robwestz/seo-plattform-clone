import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentScore } from './entities/content-score.entity';
import { Project } from '../../database/entities/project.entity';
import { AnalyzeContentDto } from './dto/analyze-content.dto';
import { ReadabilityAnalyzer } from './readability.analyzer';

/**
 * Content Optimizer Service
 * Analyzes and scores content for SEO optimization
 */
@Injectable()
export class ContentOptimizerService {
  private readonly logger = new Logger(ContentOptimizerService.name);

  constructor(
    @InjectRepository(ContentScore)
    private contentScoreRepository: Repository<ContentScore>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private readabilityAnalyzer: ReadabilityAnalyzer,
  ) {}

  /**
   * Analyze content for a URL
   * @param analyzeDto - Analysis parameters
   * @param projectId - Project ID
   * @returns Content score
   */
  async analyze(analyzeDto: AnalyzeContentDto, projectId: string): Promise<ContentScore> {
    this.logger.log(`Analyzing content for: ${analyzeDto.url}`);

    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Simulate content extraction and analysis
    const content = await this.extractContent(analyzeDto.url);
    const readabilityMetrics = this.readabilityAnalyzer.analyze(content.text);
    const seoMetrics = this.analyzeSEO(content, analyzeDto.targetKeyword);

    // Calculate scores
    const readabilityScore = readabilityMetrics.score;
    const seoScore = seoMetrics.score;
    const overallScore = (readabilityScore * 0.4 + seoScore * 0.6);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      readabilityMetrics,
      seoMetrics,
      content,
    );

    const contentScore = this.contentScoreRepository.create({
      projectId,
      url: analyzeDto.url,
      title: content.title,
      overallScore,
      readabilityScore,
      seoScore,
      wordCount: readabilityMetrics.wordCount,
      sentenceCount: readabilityMetrics.sentenceCount,
      paragraphCount: content.paragraphCount,
      avgSentenceLength: readabilityMetrics.avgSentenceLength,
      fleschReadingEase: readabilityMetrics.fleschReadingEase,
      fleschKincaidGrade: readabilityMetrics.fleschKincaidGrade,
      keywordDensity: seoMetrics.keywordDensity,
      hasMetaDescription: seoMetrics.hasMetaDescription,
      metaDescriptionLength: seoMetrics.metaDescriptionLength,
      hasH1: seoMetrics.hasH1,
      h1Count: seoMetrics.h1Count,
      headingStructureScore: seoMetrics.headingStructureScore,
      internalLinks: content.internalLinks,
      externalLinks: content.externalLinks,
      imageCount: content.imageCount,
      imagesWithAlt: content.imagesWithAlt,
      recommendations,
    });

    return this.contentScoreRepository.save(contentScore);
  }

  /**
   * Get all content scores for a project
   * @param projectId - Project ID
   * @returns List of content scores
   */
  async findAll(projectId: string): Promise<ContentScore[]> {
    return this.contentScoreRepository.find({
      where: { projectId },
      order: { overallScore: 'DESC' },
    });
  }

  /**
   * Get content statistics
   * @param projectId - Project ID
   * @returns Content statistics
   */
  async getStatistics(projectId: string) {
    const scores = await this.contentScoreRepository.find({ where: { projectId } });

    if (scores.length === 0) {
      return null;
    }

    return {
      totalPages: scores.length,
      avgOverallScore:
        scores.reduce((sum, s) => sum + Number(s.overallScore), 0) / scores.length,
      avgReadabilityScore:
        scores.reduce((sum, s) => sum + Number(s.readabilityScore), 0) / scores.length,
      avgSeoScore: scores.reduce((sum, s) => sum + Number(s.seoScore), 0) / scores.length,
      avgWordCount: scores.reduce((sum, s) => sum + s.wordCount, 0) / scores.length,
      topPages: scores.sort((a, b) => Number(b.overallScore) - Number(a.overallScore)).slice(0, 5),
      lowPages: scores.sort((a, b) => Number(a.overallScore) - Number(b.overallScore)).slice(0, 5),
    };
  }

  /**
   * Extract content from URL (mock implementation)
   */
  private async extractContent(url: string): Promise<any> {
    // In production, fetch and parse HTML
    return {
      title: 'Sample Page Title',
      text: this.generateSampleText(),
      paragraphCount: 10,
      internalLinks: Math.floor(Math.random() * 20) + 5,
      externalLinks: Math.floor(Math.random() * 10) + 2,
      imageCount: Math.floor(Math.random() * 15) + 3,
      imagesWithAlt: Math.floor(Math.random() * 10) + 2,
    };
  }

  /**
   * Analyze SEO factors
   */
  private analyzeSEO(content: any, targetKeyword?: string): any {
    let score = 100;

    const hasMetaDescription = Math.random() > 0.3;
    const metaDescriptionLength = hasMetaDescription ? Math.floor(Math.random() * 160) + 50 : 0;
    const hasH1 = Math.random() > 0.2;
    const h1Count = hasH1 ? Math.floor(Math.random() * 2) + 1 : 0;

    // Meta description check
    if (!hasMetaDescription) score -= 15;
    else if (metaDescriptionLength < 120 || metaDescriptionLength > 160) score -= 5;

    // H1 check
    if (!hasH1) score -= 20;
    else if (h1Count > 1) score -= 10;

    // Heading structure
    const headingStructureScore = Math.floor(Math.random() * 40) + 60;
    score -= (100 - headingStructureScore) * 0.1;

    // Keyword density
    const keywordDensity = targetKeyword ? Math.random() * 3 : 0;
    if (targetKeyword && (keywordDensity < 0.5 || keywordDensity > 2.5)) {
      score -= 10;
    }

    // Image alt tags
    const altTagRatio = content.imageCount > 0 ? content.imagesWithAlt / content.imageCount : 0;
    if (altTagRatio < 0.8) score -= 10;

    return {
      score: Math.max(score, 0),
      hasMetaDescription,
      metaDescriptionLength,
      hasH1,
      h1Count,
      headingStructureScore,
      keywordDensity,
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(readability: any, seo: any, content: any): any[] {
    const recommendations: any[] = [];

    // Readability recommendations
    if (readability.fleschReadingEase < 60) {
      recommendations.push({
        type: 'readability',
        priority: 'high',
        message: 'Content is difficult to read. Use shorter sentences and simpler words.',
      });
    }

    if (readability.avgSentenceLength > 25) {
      recommendations.push({
        type: 'readability',
        priority: 'medium',
        message: 'Sentences are too long. Aim for average 15-20 words per sentence.',
      });
    }

    // SEO recommendations
    if (!seo.hasMetaDescription) {
      recommendations.push({
        type: 'seo',
        priority: 'high',
        message: 'Add a meta description (120-160 characters) to improve click-through rates.',
      });
    }

    if (!seo.hasH1) {
      recommendations.push({
        type: 'seo',
        priority: 'high',
        message: 'Add an H1 heading tag with your target keyword.',
      });
    }

    if (seo.h1Count > 1) {
      recommendations.push({
        type: 'seo',
        priority: 'medium',
        message: 'Use only one H1 tag per page.',
      });
    }

    // Content length
    if (readability.wordCount < 300) {
      recommendations.push({
        type: 'content',
        priority: 'high',
        message: 'Content is too short. Aim for at least 500 words for better SEO.',
      });
    }

    // Images
    const altRatio = content.imageCount > 0 ? content.imagesWithAlt / content.imageCount : 0;
    if (altRatio < 0.8) {
      recommendations.push({
        type: 'seo',
        priority: 'medium',
        message: 'Add alt text to all images for better accessibility and SEO.',
      });
    }

    return recommendations;
  }

  /**
   * Generate sample text for mock content
   */
  private generateSampleText(): string {
    const sentences = [
      'This is a sample sentence for content analysis.',
      'Content optimization is crucial for SEO success.',
      'Readability scores help ensure your content is accessible.',
      'Using proper heading structure improves user experience.',
      'Meta descriptions influence click-through rates from search results.',
    ];

    return Array(20)
      .fill(0)
      .map(() => sentences[Math.floor(Math.random() * sentences.length)])
      .join(' ');
  }
}
