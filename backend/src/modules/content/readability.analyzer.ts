import { Injectable, Logger } from '@nestjs/common';

/**
 * Readability Analyzer
 * Calculates readability metrics using standard formulas
 */
@Injectable()
export class ReadabilityAnalyzer {
  private readonly logger = new Logger(ReadabilityAnalyzer.name);

  /**
   * Analyze text readability
   * @param text - Text to analyze
   * @returns Readability metrics
   */
  analyze(text: string): {
    score: number;
    wordCount: number;
    sentenceCount: number;
    syllableCount: number;
    avgSentenceLength: number;
    avgSyllablesPerWord: number;
    fleschReadingEase: number;
    fleschKincaidGrade: number;
  } {
    const words = this.getWords(text);
    const sentences = this.getSentences(text);
    const syllables = this.countSyllables(words);

    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const syllableCount = syllables;

    const avgSentenceLength = wordCount / sentenceCount || 0;
    const avgSyllablesPerWord = syllableCount / wordCount || 0;

    // Flesch Reading Ease: 206.835 - 1.015(words/sentences) - 84.6(syllables/words)
    const fleschReadingEase =
      206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;

    // Flesch-Kincaid Grade Level: 0.39(words/sentences) + 11.8(syllables/words) - 15.59
    const fleschKincaidGrade =
      0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;

    // Calculate overall readability score (0-100)
    const score = this.calculateScore(fleschReadingEase, avgSentenceLength, wordCount);

    return {
      score,
      wordCount,
      sentenceCount,
      syllableCount,
      avgSentenceLength,
      avgSyllablesPerWord,
      fleschReadingEase: Math.max(0, Math.min(100, fleschReadingEase)),
      fleschKincaidGrade: Math.max(0, fleschKincaidGrade),
    };
  }

  /**
   * Get words from text
   */
  private getWords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 0);
  }

  /**
   * Get sentences from text
   */
  private getSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  /**
   * Count syllables in words
   */
  private countSyllables(words: string[]): number {
    return words.reduce((total, word) => total + this.countWordSyllables(word), 0);
  }

  /**
   * Count syllables in a single word
   */
  private countWordSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;

    // Remove silent 'e'
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');

    // Count vowel groups
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  /**
   * Calculate overall readability score
   */
  private calculateScore(
    fleschScore: number,
    avgSentenceLength: number,
    wordCount: number,
  ): number {
    let score = 0;

    // Flesch score contribution (0-60 points)
    score += Math.min(Math.max(fleschScore, 0), 100) * 0.6;

    // Sentence length contribution (0-20 points)
    if (avgSentenceLength <= 20) score += 20;
    else if (avgSentenceLength <= 25) score += 15;
    else if (avgSentenceLength <= 30) score += 10;
    else score += 5;

    // Word count contribution (0-20 points)
    if (wordCount >= 300 && wordCount <= 2000) score += 20;
    else if (wordCount >= 100) score += 10;
    else score += 5;

    return Math.min(Math.max(Math.round(score), 0), 100);
  }
}
