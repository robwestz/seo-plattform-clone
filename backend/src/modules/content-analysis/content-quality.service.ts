import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentAnalysis } from './entities/content-analysis.entity';

/**
 * Content Quality Score Breakdown
 */
export interface ContentQualityScore {
  overall: number; // 0-100
  readability: number; // 0-100
  seoOptimization: number; // 0-100
  structure: number; // 0-100
  uniqueness: number; // 0-100
  semanticRelevance: number; // 0-100
  engagement: number; // 0-100
  technicalSEO: number; // 0-100
}

/**
 * Readability Metrics
 */
export interface ReadabilityMetrics {
  fleschReadingEase: number; // 0-100 (higher = easier)
  fleschKincaidGrade: number; // US grade level
  smogIndex: number; // Years of education needed
  colemanLiauIndex: number; // US grade level
  automatedReadabilityIndex: number; // US grade level
  gunningFog: number; // Years of education needed
  averageGradeLevel: number; // Average of all metrics
  readabilityLevel: 'very_easy' | 'easy' | 'medium' | 'difficult' | 'very_difficult';
}

/**
 * TF-IDF Analysis Result
 */
export interface TfIdfAnalysis {
  topKeywords: Array<{
    term: string;
    tfIdf: number;
    frequency: number;
    relevance: number;
  }>;
  keywordDensity: Map<string, number>;
  overOptimization: boolean;
  warnings: string[];
}

/**
 * Content Structure Analysis
 */
export interface ContentStructure {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  headings: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
  };
  images: number;
  links: {
    internal: number;
    external: number;
    nofollow: number;
  };
  lists: {
    ordered: number;
    unordered: number;
  };
  codeBlocks: number;
  tables: number;
  averageSentenceLength: number;
  averageParagraphLength: number;
  structureScore: number; // 0-100
}

/**
 * LSI Keywords (Latent Semantic Indexing)
 */
export interface LsiKeywordAnalysis {
  primaryTopic: string;
  relatedTerms: Array<{
    term: string;
    relevance: number;
    category: string;
  }>;
  topicCoverage: number; // 0-100
  semanticRichness: number; // 0-100
  missingTerms: string[];
}

/**
 * SEO Best Practices Check
 */
export interface SeoChecks {
  hasH1: boolean;
  h1Count: number;
  titleLength: number;
  metaDescriptionLength: number;
  urlStructure: 'excellent' | 'good' | 'poor';
  keywordInTitle: boolean;
  keywordInH1: boolean;
  keywordInFirstParagraph: boolean;
  keywordInUrl: boolean;
  imageAltTags: number;
  internalLinks: number;
  externalLinks: number;
  contentFreshness: number; // days since last update
  mobileOptimized: boolean;
  pageSpeed: number; // 0-100
  score: number; // 0-100
  recommendations: string[];
}

/**
 * Content Quality Service
 * Comprehensive content analysis using ML/NLP techniques
 */
@Injectable()
export class ContentQualityService {
  private readonly logger = new Logger(ContentQualityService.name);

  // Common English stop words
  private readonly STOP_WORDS = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any',
    'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between',
    'both', 'but', 'by', 'can', 'did', 'do', 'does', 'doing', 'down', 'during', 'each',
    'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here',
    'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it',
    'its', 'itself', 'just', 'me', 'might', 'more', 'most', 'must', 'my', 'myself', 'no',
    'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours',
    'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such',
    'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there',
    'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
    'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who',
    'whom', 'why', 'will', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves',
  ]);

  // Ideal ranges for SEO
  private readonly IDEAL_WORD_COUNT = { min: 1000, optimal: 2000, max: 5000 };
  private readonly IDEAL_PARAGRAPH_LENGTH = { min: 40, max: 150 };
  private readonly IDEAL_SENTENCE_LENGTH = { min: 15, max: 25 };

  constructor(
    @InjectRepository(ContentAnalysis)
    private contentAnalysisRepository: Repository<ContentAnalysis>,
  ) {}

  /**
   * Analyze content quality comprehensively
   */
  async analyzeContent(params: {
    content: string;
    title?: string;
    metaDescription?: string;
    url?: string;
    targetKeyword?: string;
    html?: string;
  }): Promise<{
    score: ContentQualityScore;
    readability: ReadabilityMetrics;
    tfIdf: TfIdfAnalysis;
    structure: ContentStructure;
    lsi: LsiKeywordAnalysis;
    seo: SeoChecks;
    recommendations: string[];
  }> {
    this.logger.log('Analyzing content quality');

    const { content, title, metaDescription, url, targetKeyword, html } = params;

    // Parallel analysis
    const [readability, structure, tfIdf, lsi, seo] = await Promise.all([
      this.analyzeReadability(content),
      this.analyzeStructure(html || content),
      this.analyzeTfIdf(content, targetKeyword),
      this.analyzeLsiKeywords(content, targetKeyword),
      this.analyzeSeoChecks({
        content,
        title,
        metaDescription,
        url,
        targetKeyword,
        html,
      }),
    ]);

    // Calculate overall scores
    const score = this.calculateOverallScore(readability, structure, tfIdf, lsi, seo);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      score,
      readability,
      structure,
      tfIdf,
      lsi,
      seo,
    );

    return {
      score,
      readability,
      tfIdf,
      structure,
      lsi,
      seo,
      recommendations,
    };
  }

  /**
   * Analyze readability using multiple algorithms
   */
  async analyzeReadability(content: string): Promise<ReadabilityMetrics> {
    const text = this.cleanText(content);
    const sentences = this.splitIntoSentences(text);
    const words = this.splitIntoWords(text);
    const syllables = words.map((w) => this.countSyllables(w));

    const totalWords = words.length;
    const totalSentences = sentences.length;
    const totalSyllables = syllables.reduce((sum, s) => sum + s, 0);
    const complexWords = syllables.filter((s) => s >= 3).length;

    // Flesch Reading Ease (0-100, higher = easier)
    const fleschReadingEase =
      206.835 -
      1.015 * (totalWords / totalSentences) -
      84.6 * (totalSyllables / totalWords);

    // Flesch-Kincaid Grade Level
    const fleschKincaidGrade =
      0.39 * (totalWords / totalSentences) + 11.8 * (totalSyllables / totalWords) - 15.59;

    // SMOG Index
    const smogIndex = 1.0430 * Math.sqrt(complexWords * (30 / totalSentences)) + 3.1291;

    // Coleman-Liau Index
    const avgLettersPerWord =
      words.reduce((sum, w) => sum + w.length, 0) / totalWords;
    const avgSentencesPer100Words = (totalSentences / totalWords) * 100;
    const colemanLiauIndex =
      0.0588 * (avgLettersPerWord / totalWords) * 100 -
      0.296 * avgSentencesPer100Words -
      15.8;

    // Automated Readability Index
    const avgWordsPerSentence = totalWords / totalSentences;
    const avgCharsPerWord =
      words.reduce((sum, w) => sum + w.length, 0) / totalWords;
    const automatedReadabilityIndex =
      4.71 * avgCharsPerWord + 0.5 * avgWordsPerSentence - 21.43;

    // Gunning Fog Index
    const gunningFog =
      0.4 * (totalWords / totalSentences + 100 * (complexWords / totalWords));

    // Average grade level
    const averageGradeLevel =
      (fleschKincaidGrade +
        smogIndex +
        colemanLiauIndex +
        automatedReadabilityIndex +
        gunningFog) /
      5;

    // Determine readability level
    let readabilityLevel: ReadabilityMetrics['readabilityLevel'];
    if (averageGradeLevel <= 6) {
      readabilityLevel = 'very_easy';
    } else if (averageGradeLevel <= 9) {
      readabilityLevel = 'easy';
    } else if (averageGradeLevel <= 12) {
      readabilityLevel = 'medium';
    } else if (averageGradeLevel <= 16) {
      readabilityLevel = 'difficult';
    } else {
      readabilityLevel = 'very_difficult';
    }

    return {
      fleschReadingEase: Math.max(0, Math.min(100, fleschReadingEase)),
      fleschKincaidGrade: Math.max(0, fleschKincaidGrade),
      smogIndex: Math.max(0, smogIndex),
      colemanLiauIndex: Math.max(0, colemanLiauIndex),
      automatedReadabilityIndex: Math.max(0, automatedReadabilityIndex),
      gunningFog: Math.max(0, gunningFog),
      averageGradeLevel: Math.max(0, averageGradeLevel),
      readabilityLevel,
    };
  }

  /**
   * TF-IDF Analysis (Term Frequency-Inverse Document Frequency)
   */
  async analyzeTfIdf(
    content: string,
    targetKeyword?: string,
  ): Promise<TfIdfAnalysis> {
    const text = this.cleanText(content);
    const words = this.splitIntoWords(text).filter(
      (w) => !this.STOP_WORDS.has(w.toLowerCase()) && w.length > 2,
    );

    // Calculate term frequency
    const termFreq = new Map<string, number>();
    words.forEach((word) => {
      const lower = word.toLowerCase();
      termFreq.set(lower, (termFreq.get(lower) || 0) + 1);
    });

    // Calculate TF-IDF (simplified - in production, use corpus IDF)
    // For now, using log-normalized TF as approximation
    const tfIdfScores = new Map<string, number>();
    const totalWords = words.length;

    termFreq.forEach((freq, term) => {
      const tf = freq / totalWords;
      // Simplified IDF (in production, calculate from document corpus)
      const idf = Math.log(1 + 1 / (1 + freq));
      tfIdfScores.set(term, tf * idf);
    });

    // Get top keywords
    const topKeywords = Array.from(tfIdfScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([term, tfIdf]) => ({
        term,
        tfIdf,
        frequency: termFreq.get(term) || 0,
        relevance: this.calculateRelevance(term, targetKeyword),
      }));

    // Calculate keyword density
    const keywordDensity = new Map<string, number>();
    termFreq.forEach((freq, term) => {
      keywordDensity.set(term, (freq / totalWords) * 100);
    });

    // Check for over-optimization
    const warnings: string[] = [];
    let overOptimization = false;

    if (targetKeyword) {
      const targetDensity = keywordDensity.get(targetKeyword.toLowerCase()) || 0;
      if (targetDensity > 3) {
        overOptimization = true;
        warnings.push(
          `Target keyword "${targetKeyword}" density (${targetDensity.toFixed(2)}%) is too high. Aim for 1-2%.`,
        );
      }
    }

    // Check for exact match repetition
    topKeywords.forEach(({ term, frequency }) => {
      const density = (frequency / totalWords) * 100;
      if (density > 2.5 && frequency > 10) {
        warnings.push(
          `Term "${term}" appears ${frequency} times (${density.toFixed(2)}%). Consider using synonyms.`,
        );
      }
    });

    return {
      topKeywords,
      keywordDensity,
      overOptimization,
      warnings,
    };
  }

  /**
   * Analyze content structure
   */
  async analyzeStructure(html: string): Promise<ContentStructure> {
    // Parse HTML (simplified - in production, use proper HTML parser)
    const text = this.cleanText(html);
    const words = this.splitIntoWords(text);
    const sentences = this.splitIntoSentences(text);
    const paragraphs = this.splitIntoParagraphs(text);

    // Count headings
    const headings = {
      h1: (html.match(/<h1[^>]*>/gi) || []).length,
      h2: (html.match(/<h2[^>]*>/gi) || []).length,
      h3: (html.match(/<h3[^>]*>/gi) || []).length,
      h4: (html.match(/<h4[^>]*>/gi) || []).length,
      h5: (html.match(/<h5[^>]*>/gi) || []).length,
      h6: (html.match(/<h6[^>]*>/gi) || []).length,
    };

    // Count images
    const images = (html.match(/<img[^>]*>/gi) || []).length;

    // Count links
    const allLinks = html.match(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi) || [];
    const internalLinks = allLinks.filter((link) => !link.includes('http')).length;
    const externalLinks = allLinks.length - internalLinks;
    const nofollowLinks = allLinks.filter((link) => link.includes('rel="nofollow"'))
      .length;

    // Count lists
    const orderedLists = (html.match(/<ol[^>]*>/gi) || []).length;
    const unorderedLists = (html.match(/<ul[^>]*>/gi) || []).length;

    // Count code blocks and tables
    const codeBlocks = (html.match(/<pre[^>]*>|<code[^>]*>/gi) || []).length;
    const tables = (html.match(/<table[^>]*>/gi) || []).length;

    // Calculate averages
    const averageSentenceLength = words.length / sentences.length;
    const averageParagraphLength = words.length / paragraphs.length;

    // Calculate structure score
    const structureScore = this.calculateStructureScore({
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      headings,
      images,
      links: { internal: internalLinks, external: externalLinks, nofollow: nofollowLinks },
      lists: { ordered: orderedLists, unordered: unorderedLists },
      averageSentenceLength,
      averageParagraphLength,
    });

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      headings,
      images,
      links: { internal: internalLinks, external: externalLinks, nofollow: nofollowLinks },
      lists: { ordered: orderedLists, unordered: unorderedLists },
      codeBlocks,
      tables,
      averageSentenceLength,
      averageParagraphLength,
      structureScore,
    };
  }

  /**
   * LSI Keyword Analysis (Latent Semantic Indexing)
   */
  async analyzeLsiKeywords(
    content: string,
    targetKeyword?: string,
  ): Promise<LsiKeywordAnalysis> {
    const text = this.cleanText(content);
    const words = this.splitIntoWords(text);

    // Extract n-grams (2-grams and 3-grams)
    const bigrams = this.extractNGrams(words, 2);
    const trigrams = this.extractNGrams(words, 3);

    // Combine and score
    const allPhrases = [...bigrams, ...trigrams];
    const phraseFreq = new Map<string, number>();

    allPhrases.forEach((phrase) => {
      const key = phrase.join(' ').toLowerCase();
      if (!this.isStopPhrase(key)) {
        phraseFreq.set(key, (phraseFreq.get(key) || 0) + 1);
      }
    });

    // Get related terms (simplified LSI - in production, use word2vec or BERT)
    const relatedTerms = Array.from(phraseFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([term, freq]) => ({
        term,
        relevance: this.calculateLsiRelevance(term, targetKeyword, freq, words.length),
        category: this.categorizeTermType(term),
      }));

    // Determine primary topic (most frequent meaningful phrase)
    const primaryTopic = relatedTerms[0]?.term || targetKeyword || 'unknown';

    // Calculate topic coverage
    const topicCoverage = this.calculateTopicCoverage(relatedTerms, targetKeyword);

    // Calculate semantic richness
    const uniqueTerms = new Set(relatedTerms.map((t) => t.term)).size;
    const semanticRichness = Math.min(100, (uniqueTerms / 20) * 100);

    // Identify missing terms (simplified - in production, use semantic similarity)
    const missingTerms = this.identifyMissingTerms(targetKeyword, relatedTerms);

    return {
      primaryTopic,
      relatedTerms,
      topicCoverage,
      semanticRichness,
      missingTerms,
    };
  }

  /**
   * SEO Best Practices Checks
   */
  async analyzeSeoChecks(params: {
    content: string;
    title?: string;
    metaDescription?: string;
    url?: string;
    targetKeyword?: string;
    html?: string;
  }): Promise<SeoChecks> {
    const { content, title = '', metaDescription = '', url = '', targetKeyword = '', html = '' } = params;

    const text = this.cleanText(content);
    const firstParagraph = text.split('\n\n')[0] || '';

    // H1 checks
    const h1Tags = html.match(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
    const hasH1 = h1Tags.length > 0;
    const h1Count = h1Tags.length;
    const h1Text = h1Tags[0]?.replace(/<[^>]*>/g, '') || '';

    // Length checks
    const titleLength = title.length;
    const metaDescriptionLength = metaDescription.length;

    // Keyword placement
    const keywordLower = targetKeyword.toLowerCase();
    const keywordInTitle = title.toLowerCase().includes(keywordLower);
    const keywordInH1 = h1Text.toLowerCase().includes(keywordLower);
    const keywordInFirstParagraph = firstParagraph.toLowerCase().includes(keywordLower);
    const keywordInUrl = url.toLowerCase().includes(keywordLower.replace(/\s+/g, '-'));

    // Image alt tags
    const images = html.match(/<img[^>]*>/gi) || [];
    const imageAltTags = images.filter((img) => img.includes('alt=')).length;

    // Links
    const allLinks = html.match(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi) || [];
    const internalLinks = allLinks.filter((link) => !link.includes('http')).length;
    const externalLinks = allLinks.length - internalLinks;

    // URL structure
    let urlStructure: 'excellent' | 'good' | 'poor';
    if (url.length <= 60 && url.split('/').length <= 4 && !url.includes('?')) {
      urlStructure = 'excellent';
    } else if (url.length <= 100 && url.split('/').length <= 6) {
      urlStructure = 'good';
    } else {
      urlStructure = 'poor';
    }

    // Calculate score
    let score = 0;
    const checks = [
      { condition: hasH1 && h1Count === 1, points: 10 },
      { condition: titleLength >= 50 && titleLength <= 60, points: 10 },
      { condition: metaDescriptionLength >= 150 && metaDescriptionLength <= 160, points: 10 },
      { condition: keywordInTitle, points: 15 },
      { condition: keywordInH1, points: 15 },
      { condition: keywordInFirstParagraph, points: 10 },
      { condition: keywordInUrl, points: 10 },
      { condition: imageAltTags === images.length && images.length > 0, points: 10 },
      { condition: internalLinks >= 3, points: 5 },
      { condition: externalLinks >= 1 && externalLinks <= 5, points: 5 },
      { condition: urlStructure === 'excellent', points: 10 },
    ];

    checks.forEach(({ condition, points }) => {
      if (condition) score += points;
    });

    // Generate recommendations
    const recommendations: string[] = [];

    if (!hasH1) {
      recommendations.push('Add an H1 heading to your content');
    } else if (h1Count > 1) {
      recommendations.push('Use only one H1 heading per page');
    }

    if (titleLength < 50) {
      recommendations.push('Title tag is too short. Aim for 50-60 characters');
    } else if (titleLength > 60) {
      recommendations.push('Title tag is too long. Keep it under 60 characters');
    }

    if (metaDescriptionLength < 150) {
      recommendations.push('Meta description is too short. Aim for 150-160 characters');
    } else if (metaDescriptionLength > 160) {
      recommendations.push('Meta description is too long. Keep it under 160 characters');
    }

    if (!keywordInTitle) {
      recommendations.push(`Include target keyword "${targetKeyword}" in title tag`);
    }

    if (!keywordInH1) {
      recommendations.push(`Include target keyword "${targetKeyword}" in H1 heading`);
    }

    if (!keywordInFirstParagraph) {
      recommendations.push(`Include target keyword "${targetKeyword}" in first paragraph`);
    }

    if (imageAltTags < images.length) {
      recommendations.push(`Add alt text to ${images.length - imageAltTags} images`);
    }

    if (internalLinks < 3) {
      recommendations.push('Add more internal links (aim for 3-5)');
    }

    if (externalLinks === 0) {
      recommendations.push('Add 1-2 external links to authoritative sources');
    }

    return {
      hasH1,
      h1Count,
      titleLength,
      metaDescriptionLength,
      urlStructure,
      keywordInTitle,
      keywordInH1,
      keywordInFirstParagraph,
      keywordInUrl,
      imageAltTags,
      internalLinks,
      externalLinks,
      contentFreshness: 0, // Would calculate from lastModified
      mobileOptimized: true, // Would check with responsive design detection
      pageSpeed: 85, // Would fetch from PageSpeed API
      score,
      recommendations,
    };
  }

  /**
   * Calculate overall content quality score
   */
  private calculateOverallScore(
    readability: ReadabilityMetrics,
    structure: ContentStructure,
    tfIdf: TfIdfAnalysis,
    lsi: LsiKeywordAnalysis,
    seo: SeoChecks,
  ): ContentQualityScore {
    // Readability score (inverse of grade level, normalized to 0-100)
    const readabilityScore = Math.max(
      0,
      Math.min(100, 100 - readability.averageGradeLevel * 5),
    );

    // SEO optimization score
    const seoOptimization = seo.score;

    // Structure score (already calculated)
    const structureScore = structure.structureScore;

    // Uniqueness score (based on keyword diversity)
    const uniqueness = Math.min(100, lsi.semanticRichness);

    // Semantic relevance score (based on LSI topic coverage)
    const semanticRelevance = lsi.topicCoverage;

    // Engagement score (based on readability and structure)
    const engagement =
      (readabilityScore * 0.6 + structureScore * 0.4);

    // Technical SEO score
    const technicalSEO = seo.score;

    // Overall weighted score
    const overall =
      readabilityScore * 0.15 +
      seoOptimization * 0.25 +
      structureScore * 0.15 +
      uniqueness * 0.10 +
      semanticRelevance * 0.15 +
      engagement * 0.10 +
      technicalSEO * 0.10;

    return {
      overall: Math.round(overall),
      readability: Math.round(readabilityScore),
      seoOptimization: Math.round(seoOptimization),
      structure: Math.round(structureScore),
      uniqueness: Math.round(uniqueness),
      semanticRelevance: Math.round(semanticRelevance),
      engagement: Math.round(engagement),
      technicalSEO: Math.round(technicalSEO),
    };
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    score: ContentQualityScore,
    readability: ReadabilityMetrics,
    structure: ContentStructure,
    tfIdf: TfIdfAnalysis,
    lsi: LsiKeywordAnalysis,
    seo: SeoChecks,
  ): string[] {
    const recommendations: string[] = [];

    // Overall score recommendations
    if (score.overall < 60) {
      recommendations.push('Overall content quality is below average. Focus on improvements below.');
    }

    // Readability recommendations
    if (readability.averageGradeLevel > 12) {
      recommendations.push(
        'Content is too complex. Simplify language for better readability (aim for 8-10th grade level).',
      );
    }

    if (structure.averageSentenceLength > this.IDEAL_SENTENCE_LENGTH.max) {
      recommendations.push('Shorten sentences for better readability (aim for 15-25 words).');
    }

    // Structure recommendations
    if (structure.wordCount < this.IDEAL_WORD_COUNT.min) {
      recommendations.push(
        `Increase content length to at least ${this.IDEAL_WORD_COUNT.min} words for better SEO.`,
      );
    }

    if (structure.headings.h2 < 3) {
      recommendations.push('Add more H2 headings to improve content structure (aim for 3-6).');
    }

    if (structure.images < 1) {
      recommendations.push('Add images to make content more engaging.');
    }

    if (structure.links.internal < 3) {
      recommendations.push('Add internal links to related content (aim for 3-5).');
    }

    // TF-IDF recommendations
    if (tfIdf.overOptimization) {
      recommendations.push('Reduce keyword stuffing. Use synonyms and related terms.');
    }

    tfIdf.warnings.forEach((warning) => {
      recommendations.push(warning);
    });

    // LSI recommendations
    if (lsi.topicCoverage < 60) {
      recommendations.push(
        'Expand topic coverage by including these related terms: ' +
          lsi.missingTerms.slice(0, 5).join(', '),
      );
    }

    // SEO recommendations
    seo.recommendations.forEach((rec) => {
      recommendations.push(rec);
    });

    return recommendations;
  }

  /**
   * Helper: Clean text for analysis
   */
  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Helper: Split into sentences
   */
  private splitIntoSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  /**
   * Helper: Split into words
   */
  private splitIntoWords(text: string): string[] {
    return text
      .split(/\s+/)
      .map((w) => w.replace(/[^a-zA-Z0-9'-]/g, ''))
      .filter((w) => w.length > 0);
  }

  /**
   * Helper: Split into paragraphs
   */
  private splitIntoParagraphs(text: string): string[] {
    return text
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }

  /**
   * Helper: Count syllables in a word
   */
  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;

    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');

    const syllables = word.match(/[aeiouy]{1,2}/g);
    return syllables ? syllables.length : 1;
  }

  /**
   * Helper: Extract n-grams
   */
  private extractNGrams(words: string[], n: number): string[][] {
    const ngrams: string[][] = [];
    for (let i = 0; i <= words.length - n; i++) {
      ngrams.push(words.slice(i, i + n));
    }
    return ngrams;
  }

  /**
   * Helper: Check if phrase is stop phrase
   */
  private isStopPhrase(phrase: string): boolean {
    const words = phrase.split(' ');
    return words.every((w) => this.STOP_WORDS.has(w));
  }

  /**
   * Helper: Calculate relevance to target keyword
   */
  private calculateRelevance(term: string, targetKeyword?: string): number {
    if (!targetKeyword) return 0.5;

    const termLower = term.toLowerCase();
    const targetLower = targetKeyword.toLowerCase();

    if (termLower === targetLower) return 1.0;
    if (termLower.includes(targetLower) || targetLower.includes(termLower)) return 0.8;

    // Calculate Levenshtein similarity (simplified)
    const similarity = this.calculateStringSimilarity(termLower, targetLower);
    return similarity;
  }

  /**
   * Helper: Calculate string similarity
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Helper: Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Helper: Calculate LSI relevance
   */
  private calculateLsiRelevance(
    term: string,
    targetKeyword: string | undefined,
    frequency: number,
    totalWords: number,
  ): number {
    const baseRelevance = Math.min(1.0, frequency / 10);
    const keywordBonus = this.calculateRelevance(term, targetKeyword);
    return (baseRelevance + keywordBonus) / 2;
  }

  /**
   * Helper: Categorize term type
   */
  private categorizeTermType(term: string): string {
    const words = term.split(' ');

    if (words.length === 1) return 'single';
    if (words.length === 2) return 'bigram';
    if (words.length === 3) return 'trigram';
    return 'phrase';
  }

  /**
   * Helper: Calculate topic coverage
   */
  private calculateTopicCoverage(
    relatedTerms: Array<{ term: string; relevance: number }>,
    targetKeyword?: string,
  ): number {
    if (!targetKeyword) return 50;

    const relevantTerms = relatedTerms.filter((t) => t.relevance > 0.5);
    const coverage = Math.min(100, (relevantTerms.length / 15) * 100);

    return coverage;
  }

  /**
   * Helper: Identify missing terms
   */
  private identifyMissingTerms(
    targetKeyword: string | undefined,
    relatedTerms: Array<{ term: string }>,
  ): string[] {
    if (!targetKeyword) return [];

    // Simplified - in production, use semantic similarity models
    const suggestions = [
      `${targetKeyword} guide`,
      `${targetKeyword} tips`,
      `${targetKeyword} benefits`,
      `${targetKeyword} examples`,
      `${targetKeyword} best practices`,
    ];

    const existing = new Set(relatedTerms.map((t) => t.term.toLowerCase()));
    return suggestions.filter((s) => !existing.has(s.toLowerCase()));
  }

  /**
   * Helper: Calculate structure score
   */
  private calculateStructureScore(structure: Partial<ContentStructure>): number {
    let score = 0;

    // Word count score (0-20 points)
    if (structure.wordCount) {
      if (
        structure.wordCount >= this.IDEAL_WORD_COUNT.min &&
        structure.wordCount <= this.IDEAL_WORD_COUNT.max
      ) {
        score += 20;
      } else if (structure.wordCount >= this.IDEAL_WORD_COUNT.min * 0.7) {
        score += 15;
      } else {
        score += 10;
      }
    }

    // Heading structure (0-20 points)
    if (structure.headings) {
      const { h1, h2, h3 } = structure.headings;
      if (h1 === 1) score += 5;
      if (h2 >= 3 && h2 <= 6) score += 10;
      if (h3 >= 2) score += 5;
    }

    // Paragraph length (0-15 points)
    if (structure.averageParagraphLength) {
      if (
        structure.averageParagraphLength >= this.IDEAL_PARAGRAPH_LENGTH.min &&
        structure.averageParagraphLength <= this.IDEAL_PARAGRAPH_LENGTH.max
      ) {
        score += 15;
      } else {
        score += 8;
      }
    }

    // Sentence length (0-15 points)
    if (structure.averageSentenceLength) {
      if (
        structure.averageSentenceLength >= this.IDEAL_SENTENCE_LENGTH.min &&
        structure.averageSentenceLength <= this.IDEAL_SENTENCE_LENGTH.max
      ) {
        score += 15;
      } else {
        score += 8;
      }
    }

    // Images (0-10 points)
    if (structure.images) {
      if (structure.images >= 3) score += 10;
      else if (structure.images >= 1) score += 5;
    }

    // Links (0-10 points)
    if (structure.links) {
      if (structure.links.internal >= 3) score += 5;
      if (structure.links.external >= 1) score += 5;
    }

    // Lists (0-10 points)
    if (structure.lists) {
      if (structure.lists.ordered + structure.lists.unordered >= 2) score += 10;
      else if (structure.lists.ordered + structure.lists.unordered >= 1) score += 5;
    }

    return score;
  }
}
