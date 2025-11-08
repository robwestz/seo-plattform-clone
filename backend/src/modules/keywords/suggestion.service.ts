import { Injectable, Logger } from '@nestjs/common';
import { KeywordDifficultyCalculator } from './keyword-difficulty.calculator';
import { KeywordSuggestion } from './dto/keyword-research.dto';

/**
 * Keyword Suggestion Service
 * Generates keyword suggestions and related keywords
 */
@Injectable()
export class SuggestionService {
  private readonly logger = new Logger(SuggestionService.name);

  constructor(private readonly difficultyCalculator: KeywordDifficultyCalculator) {}

  /**
   * Generate keyword suggestions based on seed keyword
   * In a real implementation, this would integrate with external APIs
   * (Google Keyword Planner, SEMrush, Ahrefs, etc.)
   * @param seedKeyword - Base keyword to generate suggestions from
   * @param limit - Maximum number of suggestions
   * @returns Array of keyword suggestions
   */
  async generateSuggestions(seedKeyword: string, limit: number = 50): Promise<KeywordSuggestion[]> {
    this.logger.log(`Generating suggestions for: ${seedKeyword}`);

    // In production, integrate with external keyword APIs
    // For now, return mock data with realistic patterns
    const suggestions: KeywordSuggestion[] = [];

    // Generate question-based keywords
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'who'];
    for (const qw of questionWords) {
      suggestions.push(
        this.createSuggestion(`${qw} is ${seedKeyword}`, seedKeyword),
        this.createSuggestion(`${qw} ${seedKeyword}`, seedKeyword),
      );
    }

    // Generate modifier-based keywords
    const modifiers = ['best', 'top', 'cheap', 'free', 'online', 'near me'];
    for (const mod of modifiers) {
      suggestions.push(
        this.createSuggestion(`${mod} ${seedKeyword}`, seedKeyword),
        this.createSuggestion(`${seedKeyword} ${mod}`, seedKeyword),
      );
    }

    // Generate intent-based keywords
    const intents = ['buy', 'review', 'guide', 'tutorial', 'comparison', 'alternative'];
    for (const intent of intents) {
      suggestions.push(this.createSuggestion(`${seedKeyword} ${intent}`, seedKeyword));
    }

    // Generate long-tail variations
    const longtails = ['for beginners', 'step by step', 'tips and tricks', 'vs'];
    for (const lt of longtails) {
      suggestions.push(this.createSuggestion(`${seedKeyword} ${lt}`, seedKeyword));
    }

    // Shuffle and limit
    return this.shuffleArray(suggestions).slice(0, Math.min(limit, suggestions.length));
  }

  /**
   * Get related keywords for a given keyword
   * @param keyword - Keyword to find relations for
   * @returns Array of related keywords
   */
  async getRelatedKeywords(keyword: string): Promise<string[]> {
    this.logger.log(`Finding related keywords for: ${keyword}`);

    const related: string[] = [];
    const words = keyword.split(' ');

    // Add synonym variations
    const synonyms = this.getSynonyms(words[0]);
    for (const syn of synonyms) {
      related.push([syn, ...words.slice(1)].join(' '));
    }

    // Add semantic variations
    related.push(
      `${keyword} meaning`,
      `${keyword} definition`,
      `${keyword} examples`,
      `${keyword} benefits`,
      `${keyword} advantages`,
    );

    return related.slice(0, 20);
  }

  /**
   * Analyze keyword competitiveness
   * @param keyword - Keyword to analyze
   * @returns Competition analysis
   */
  async analyzeCompetition(keyword: string): Promise<{
    difficulty: number;
    competition: number;
    opportunity: number;
    recommendation: string;
  }> {
    this.logger.log(`Analyzing competition for: ${keyword}`);

    // Mock data - in production, fetch real SERP data
    const searchVolume = this.estimateSearchVolume(keyword);
    const competition = Math.random() * 0.8 + 0.1;

    const difficulty = this.difficultyCalculator.calculateDifficulty({
      searchVolume,
      competition,
      topPageAuthority: Array(10).fill(0).map(() => Math.random() * 100),
      topDomainAuthority: Array(10).fill(0).map(() => Math.random() * 100),
      topBacklinks: Array(10).fill(0).map(() => Math.floor(Math.random() * 1000)),
      serpFeatures: ['organic'],
    });

    const opportunity = this.difficultyCalculator.calculateOpportunityScore({
      searchVolume,
      difficulty,
      cpc: Math.random() * 5,
    });

    let recommendation = '';
    if (difficulty < 30 && searchVolume > 500) {
      recommendation = 'Excellent opportunity - low difficulty with good volume';
    } else if (difficulty < 50 && searchVolume > 1000) {
      recommendation = 'Good opportunity - moderate difficulty with high volume';
    } else if (difficulty > 70) {
      recommendation = 'Challenging - consider long-tail variations';
    } else {
      recommendation = 'Average opportunity - analyze competitors carefully';
    }

    return {
      difficulty,
      competition,
      opportunity,
      recommendation,
    };
  }

  /**
   * Create a keyword suggestion with estimated metrics
   */
  private createSuggestion(keyword: string, seedKeyword: string): KeywordSuggestion {
    const searchVolume = this.estimateSearchVolume(keyword);
    const competition = Math.random() * 0.8 + 0.1;
    const cpc = Math.random() * 5;

    const difficulty = this.difficultyCalculator.calculateDifficulty({
      searchVolume,
      competition,
    });

    const intent = this.difficultyCalculator.classifyIntent(keyword);

    return {
      keyword,
      searchVolume,
      difficulty,
      cpc,
      competition,
      intent,
      relatedKeywords: [seedKeyword],
    };
  }

  /**
   * Estimate search volume based on keyword characteristics
   */
  private estimateSearchVolume(keyword: string): number {
    const wordCount = keyword.split(' ').length;

    // Longer keywords typically have lower volume
    if (wordCount === 1) return Math.floor(Math.random() * 50000) + 1000;
    if (wordCount === 2) return Math.floor(Math.random() * 10000) + 500;
    if (wordCount === 3) return Math.floor(Math.random() * 5000) + 100;
    return Math.floor(Math.random() * 1000) + 10;
  }

  /**
   * Get simple synonyms for a word (mock implementation)
   */
  private getSynonyms(word: string): string[] {
    const synonymMap: Record<string, string[]> = {
      guide: ['tutorial', 'how-to', 'walkthrough'],
      best: ['top', 'leading', 'premier'],
      cheap: ['affordable', 'budget', 'inexpensive'],
      buy: ['purchase', 'get', 'acquire'],
    };

    return synonymMap[word.toLowerCase()] || [];
  }

  /**
   * Shuffle array (Fisher-Yates algorithm)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
