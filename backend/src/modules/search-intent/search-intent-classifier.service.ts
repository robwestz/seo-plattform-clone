import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IntentClassification,
  IntentType,
  ConfidenceLevel,
} from './entities/intent-classification.entity';

/**
 * Training Data Point
 */
export interface TrainingDataPoint {
  keyword: string;
  intent: IntentType;
  features?: any;
}

/**
 * Model Performance Metrics
 */
export interface ModelMetrics {
  accuracy: number;
  precision: Record<IntentType, number>;
  recall: Record<IntentType, number>;
  f1Score: Record<IntentType, number>;
  confusionMatrix: number[][];
  trainingSize: number;
  testSize: number;
}

/**
 * Intent Features
 */
export interface IntentFeatures {
  // Keyword features
  keywordLength: number;
  wordCount: number;
  hasQuestionWords: boolean;
  hasActionWords: boolean;
  hasBrandTerms: boolean;
  hasModifiers: string[];

  // Linguistic features
  hasNumbers: boolean;
  hasComparison: boolean;
  hasSuperlatives: boolean;
  hasLocalIntent: boolean;

  // Pattern features
  patternScores: {
    informational: number;
    navigational: number;
    commercial: number;
    transactional: number;
  };

  // SERP features (if available)
  serpFeatures?: string[];
}

/**
 * Search Intent Classifier Service
 * ML-powered intent classification with training pipeline
 */
@Injectable()
export class SearchIntentClassifierService {
  private readonly logger = new Logger(SearchIntentClassifierService.name);
  private readonly MODEL_VERSION = 'v1.0.0';

  // Pattern dictionaries for intent classification
  private readonly INTENT_PATTERNS = {
    informational: {
      prefixes: ['what', 'why', 'how', 'when', 'where', 'who', 'guide', 'tutorial', 'learn'],
      suffixes: ['meaning', 'definition', 'explained', 'guide', 'tutorial', 'tips'],
      contains: ['how to', 'what is', 'guide to', 'tips for', 'ways to', 'introduction to'],
      weight: 1.0,
    },
    navigational: {
      prefixes: ['login', 'signin', 'sign in', 'download', 'facebook', 'youtube', 'amazon'],
      suffixes: ['login', 'signin', 'app', 'website', 'official', 'portal'],
      contains: ['official site', 'official website', 'login', 'sign in', 'download'],
      weight: 1.0,
    },
    commercial: {
      prefixes: ['best', 'top', 'review', 'compare', 'vs', 'versus', 'alternative'],
      suffixes: ['review', 'reviews', 'comparison', 'alternatives', 'vs'],
      contains: [
        'best',
        'top',
        'review',
        'compare',
        'vs',
        'versus',
        'alternative to',
        'better than',
      ],
      weight: 1.0,
    },
    transactional: {
      prefixes: ['buy', 'purchase', 'order', 'discount', 'coupon', 'deal', 'price', 'cheap'],
      suffixes: [
        'buy',
        'purchase',
        'order',
        'price',
        'cost',
        'deal',
        'discount',
        'coupon',
        'sale',
        'shop',
      ],
      contains: [
        'buy',
        'purchase',
        'order',
        'price',
        'discount',
        'coupon',
        'deal',
        'cheap',
        'affordable',
        'for sale',
      ],
      weight: 1.0,
    },
  };

  // TF-IDF weights (learned from training data)
  private tfIdfWeights: Map<string, Map<IntentType, number>> = new Map();

  // Naive Bayes probabilities
  private naiveBayesPriors: Map<IntentType, number> = new Map();
  private naiveBayesLikelihoods: Map<string, Map<IntentType, number>> = new Map();

  constructor(
    @InjectRepository(IntentClassification)
    private classificationRepository: Repository<IntentClassification>,
  ) {
    this.initializeDefaultModel();
  }

  /**
   * Classify keyword intent
   */
  async classifyIntent(
    projectId: string,
    keyword: string,
    options: {
      searchVolume?: number;
      serpSignals?: any;
      useCache?: boolean;
    } = {},
  ): Promise<IntentClassification> {
    this.logger.log(`Classifying intent for keyword: "${keyword}"`);

    // Check cache first
    if (options.useCache !== false) {
      const cached = await this.classificationRepository.findOne({
        where: { projectId, keyword },
      });

      if (cached) {
        this.logger.log(`Using cached classification for "${keyword}"`);
        return cached;
      }
    }

    // Extract features
    const features = this.extractFeatures(keyword, options.serpSignals);

    // Classify using ensemble of methods
    const patternProbs = this.classifyByPatterns(keyword, features);
    const tfIdfProbs = this.classifyByTfIdf(keyword);
    const nbProbs = this.classifyByNaiveBayes(keyword);

    // Ensemble: weighted average
    const intentProbabilities = this.ensemblePredictions([
      { probs: patternProbs, weight: 0.4 },
      { probs: tfIdfProbs, weight: 0.3 },
      { probs: nbProbs, weight: 0.3 },
    ]);

    // Get primary intent
    const intent = this.getPrimaryIntent(intentProbabilities);
    const confidence = intentProbabilities[intent];
    const confidenceLevel = this.getConfidenceLevel(confidence);

    // Generate content recommendations
    const contentRecommendations = this.generateContentRecommendations(
      intent,
      keyword,
      features,
    );

    // Create and save classification
    const classification = this.classificationRepository.create({
      projectId,
      keyword,
      searchVolume: options.searchVolume || 0,
      intent,
      confidence,
      confidenceLevel,
      intentProbabilities,
      features,
      serpSignals: options.serpSignals,
      contentRecommendations,
      modelVersion: this.MODEL_VERSION,
    });

    return this.classificationRepository.save(classification);
  }

  /**
   * Classify multiple keywords in batch
   */
  async classifyBatch(
    projectId: string,
    keywords: Array<{
      keyword: string;
      searchVolume?: number;
      serpSignals?: any;
    }>,
  ): Promise<IntentClassification[]> {
    this.logger.log(`Batch classifying ${keywords.length} keywords`);

    const classifications: IntentClassification[] = [];

    for (const kw of keywords) {
      const classification = await this.classifyIntent(projectId, kw.keyword, {
        searchVolume: kw.searchVolume,
        serpSignals: kw.serpSignals,
        useCache: false,
      });

      classifications.push(classification);
    }

    return classifications;
  }

  /**
   * Train model with labeled data
   */
  async trainModel(trainingData: TrainingDataPoint[]): Promise<ModelMetrics> {
    this.logger.log(`Training model with ${trainingData.length} examples`);

    // Split into train/test
    const shuffled = this.shuffleArray([...trainingData]);
    const splitIndex = Math.floor(shuffled.length * 0.8);
    const trainSet = shuffled.slice(0, splitIndex);
    const testSet = shuffled.slice(splitIndex);

    // Train Naive Bayes
    this.trainNaiveBayes(trainSet);

    // Train TF-IDF
    this.trainTfIdf(trainSet);

    // Evaluate on test set
    const metrics = await this.evaluateModel(testSet);

    this.logger.log(`Model trained. Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);

    return metrics;
  }

  /**
   * Evaluate model performance
   */
  async evaluateModel(testData: TrainingDataPoint[]): Promise<ModelMetrics> {
    const predictions: IntentType[] = [];
    const actuals: IntentType[] = [];

    for (const example of testData) {
      const features = this.extractFeatures(example.keyword);

      const patternProbs = this.classifyByPatterns(example.keyword, features);
      const tfIdfProbs = this.classifyByTfIdf(example.keyword);
      const nbProbs = this.classifyByNaiveBayes(example.keyword);

      const intentProbabilities = this.ensemblePredictions([
        { probs: patternProbs, weight: 0.4 },
        { probs: tfIdfProbs, weight: 0.3 },
        { probs: nbProbs, weight: 0.3 },
      ]);

      const predicted = this.getPrimaryIntent(intentProbabilities);
      predictions.push(predicted);
      actuals.push(example.intent);
    }

    // Calculate metrics
    const accuracy = predictions.filter((p, i) => p === actuals[i]).length / predictions.length;

    const intents = Object.values(IntentType);
    const precision: Record<IntentType, number> = {} as any;
    const recall: Record<IntentType, number> = {} as any;
    const f1Score: Record<IntentType, number> = {} as any;

    for (const intent of intents) {
      const tp = predictions.filter((p, i) => p === intent && actuals[i] === intent).length;
      const fp = predictions.filter((p, i) => p === intent && actuals[i] !== intent).length;
      const fn = predictions.filter((p, i) => p !== intent && actuals[i] === intent).length;

      precision[intent] = tp + fp > 0 ? tp / (tp + fp) : 0;
      recall[intent] = tp + fn > 0 ? tp / (tp + fn) : 0;
      f1Score[intent] =
        precision[intent] + recall[intent] > 0
          ? (2 * precision[intent] * recall[intent]) / (precision[intent] + recall[intent])
          : 0;
    }

    // Confusion matrix
    const confusionMatrix = this.buildConfusionMatrix(predictions, actuals, intents);

    return {
      accuracy,
      precision,
      recall,
      f1Score,
      confusionMatrix,
      trainingSize: testData.length,
      testSize: testData.length,
    };
  }

  /**
   * Get intent distribution for project
   */
  async getIntentDistribution(projectId: string): Promise<{
    total: number;
    distribution: Record<IntentType, number>;
    percentages: Record<IntentType, number>;
  }> {
    const classifications = await this.classificationRepository.find({
      where: { projectId },
    });

    const distribution: Record<IntentType, number> = {
      [IntentType.INFORMATIONAL]: 0,
      [IntentType.NAVIGATIONAL]: 0,
      [IntentType.COMMERCIAL]: 0,
      [IntentType.TRANSACTIONAL]: 0,
    };

    classifications.forEach((c) => {
      distribution[c.intent]++;
    });

    const total = classifications.length;
    const percentages: Record<IntentType, number> = {} as any;

    Object.keys(distribution).forEach((intent) => {
      percentages[intent as IntentType] = total > 0 ? (distribution[intent as IntentType] / total) * 100 : 0;
    });

    return {
      total,
      distribution,
      percentages,
    };
  }

  /**
   * Get classifications by intent
   */
  async getByIntent(projectId: string, intent: IntentType): Promise<IntentClassification[]> {
    return this.classificationRepository.find({
      where: { projectId, intent },
      order: { searchVolume: 'DESC' },
    });
  }

  /**
   * Get low-confidence classifications needing review
   */
  async getLowConfidenceClassifications(
    projectId: string,
    limit: number = 50,
  ): Promise<IntentClassification[]> {
    return this.classificationRepository.find({
      where: {
        projectId,
        confidenceLevel: ConfidenceLevel.LOW,
        manuallyVerified: false,
      },
      order: { searchVolume: 'DESC' },
      take: limit,
    });
  }

  /**
   * Manually verify classification
   */
  async verifyClassification(
    classificationId: string,
    correctIntent: IntentType,
    verifiedBy: string,
  ): Promise<IntentClassification> {
    const classification = await this.classificationRepository.findOne({
      where: { id: classificationId },
    });

    if (!classification) {
      throw new Error(`Classification ${classificationId} not found`);
    }

    classification.intent = correctIntent;
    classification.manuallyVerified = true;
    classification.verifiedBy = verifiedBy;

    return this.classificationRepository.save(classification);
  }

  // ========================================
  // Private Classification Methods
  // ========================================

  /**
   * Pattern-based classification
   */
  private classifyByPatterns(
    keyword: string,
    features: IntentFeatures,
  ): Record<IntentType, number> {
    const scores: Record<IntentType, number> = {
      [IntentType.INFORMATIONAL]: 0,
      [IntentType.NAVIGATIONAL]: 0,
      [IntentType.COMMERCIAL]: 0,
      [IntentType.TRANSACTIONAL]: 0,
    };

    const lower = keyword.toLowerCase();

    // Check each intent pattern
    for (const [intent, patterns] of Object.entries(this.INTENT_PATTERNS)) {
      let score = 0;

      // Prefix matching
      for (const prefix of patterns.prefixes) {
        if (lower.startsWith(prefix)) {
          score += 3 * patterns.weight;
          break;
        }
      }

      // Suffix matching
      for (const suffix of patterns.suffixes) {
        if (lower.endsWith(suffix)) {
          score += 3 * patterns.weight;
          break;
        }
      }

      // Contains matching
      for (const phrase of patterns.contains) {
        if (lower.includes(phrase)) {
          score += 2 * patterns.weight;
        }
      }

      scores[intent as IntentType] = score;
    }

    // Use pattern scores from features
    Object.keys(features.patternScores).forEach((intent) => {
      scores[intent as IntentType] += features.patternScores[intent as IntentType];
    });

    // Normalize to probabilities
    return this.normalizeToProbabilities(scores);
  }

  /**
   * TF-IDF based classification
   */
  private classifyByTfIdf(keyword: string): Record<IntentType, number> {
    const words = this.tokenize(keyword);
    const scores: Record<IntentType, number> = {
      [IntentType.INFORMATIONAL]: 0,
      [IntentType.NAVIGATIONAL]: 0,
      [IntentType.COMMERCIAL]: 0,
      [IntentType.TRANSACTIONAL]: 0,
    };

    for (const word of words) {
      const weights = this.tfIdfWeights.get(word);
      if (weights) {
        Object.keys(scores).forEach((intent) => {
          scores[intent as IntentType] += weights.get(intent as IntentType) || 0;
        });
      }
    }

    return this.normalizeToProbabilities(scores);
  }

  /**
   * Naive Bayes classification
   */
  private classifyByNaiveBayes(keyword: string): Record<IntentType, number> {
    const words = this.tokenize(keyword);
    const scores: Record<IntentType, number> = {} as any;

    // Calculate log probabilities for each intent
    Object.values(IntentType).forEach((intent) => {
      let logProb = Math.log(this.naiveBayesPriors.get(intent) || 0.25);

      for (const word of words) {
        const likelihoods = this.naiveBayesLikelihoods.get(word);
        if (likelihoods) {
          logProb += Math.log(likelihoods.get(intent) || 1e-10);
        }
      }

      scores[intent] = Math.exp(logProb);
    });

    return this.normalizeToProbabilities(scores);
  }

  /**
   * Extract features from keyword
   */
  private extractFeatures(keyword: string, serpSignals?: any): IntentFeatures {
    const lower = keyword.toLowerCase();
    const words = lower.split(' ');

    // Question words
    const questionWords = ['what', 'why', 'how', 'when', 'where', 'who', 'which'];
    const hasQuestionWords = questionWords.some((q) => lower.includes(q));

    // Action words
    const actionWords = ['buy', 'purchase', 'order', 'get', 'find', 'download', 'install'];
    const hasActionWords = actionWords.some((a) => lower.includes(a));

    // Brand detection (simplified)
    const brandTerms = ['google', 'amazon', 'facebook', 'youtube', 'netflix'];
    const hasBrandTerms = brandTerms.some((b) => lower.includes(b));

    // Modifiers
    const modifiers: string[] = [];
    if (lower.includes('best')) modifiers.push('best');
    if (lower.includes('top')) modifiers.push('top');
    if (lower.includes('cheap')) modifiers.push('cheap');
    if (lower.includes('free')) modifiers.push('free');

    // Numbers
    const hasNumbers = /\d/.test(keyword);

    // Comparison
    const hasComparison = /\b(vs|versus|compared?|alternative|better)\b/.test(lower);

    // Superlatives
    const hasSuperlatives = /\b(best|top|most|biggest|largest|smallest)\b/.test(lower);

    // Local intent
    const hasLocalIntent = /\b(near me|nearby|local|in [A-Z][a-z]+)\b/.test(keyword);

    // Calculate pattern scores
    const patternScores = {
      informational: this.calculatePatternScore(lower, 'informational'),
      navigational: this.calculatePatternScore(lower, 'navigational'),
      commercial: this.calculatePatternScore(lower, 'commercial'),
      transactional: this.calculatePatternScore(lower, 'transactional'),
    };

    return {
      keywordLength: keyword.length,
      wordCount: words.length,
      hasQuestionWords,
      hasActionWords,
      hasBrandTerms,
      hasModifiers: modifiers,
      hasNumbers,
      hasComparison,
      hasSuperlatives,
      hasLocalIntent,
      patternScores,
      serpFeatures: serpSignals?.features || [],
    };
  }

  /**
   * Calculate pattern score for specific intent
   */
  private calculatePatternScore(keyword: string, intent: keyof typeof this.INTENT_PATTERNS): number {
    const patterns = this.INTENT_PATTERNS[intent];
    let score = 0;

    // Check all patterns
    for (const prefix of patterns.prefixes) {
      if (keyword.startsWith(prefix)) score += 1.5;
    }

    for (const suffix of patterns.suffixes) {
      if (keyword.endsWith(suffix)) score += 1.5;
    }

    for (const phrase of patterns.contains) {
      if (keyword.includes(phrase)) score += 1.0;
    }

    return score;
  }

  /**
   * Ensemble predictions
   */
  private ensemblePredictions(
    predictions: Array<{ probs: Record<IntentType, number>; weight: number }>,
  ): Record<IntentType, number> {
    const ensemble: Record<IntentType, number> = {
      [IntentType.INFORMATIONAL]: 0,
      [IntentType.NAVIGATIONAL]: 0,
      [IntentType.COMMERCIAL]: 0,
      [IntentType.TRANSACTIONAL]: 0,
    };

    const totalWeight = predictions.reduce((sum, p) => sum + p.weight, 0);

    predictions.forEach(({ probs, weight }) => {
      Object.keys(probs).forEach((intent) => {
        ensemble[intent as IntentType] += (probs[intent as IntentType] * weight) / totalWeight;
      });
    });

    return this.normalizeToProbabilities(ensemble);
  }

  /**
   * Get primary intent from probabilities
   */
  private getPrimaryIntent(probabilities: Record<IntentType, number>): IntentType {
    return Object.entries(probabilities).reduce((max, [intent, prob]) =>
      prob > probabilities[max] ? (intent as IntentType) : max,
    IntentType.INFORMATIONAL);
  }

  /**
   * Get confidence level
   */
  private getConfidenceLevel(confidence: number): ConfidenceLevel {
    if (confidence >= 0.8) return ConfidenceLevel.HIGH;
    if (confidence >= 0.5) return ConfidenceLevel.MEDIUM;
    return ConfidenceLevel.LOW;
  }

  /**
   * Generate content recommendations based on intent
   */
  private generateContentRecommendations(
    intent: IntentType,
    keyword: string,
    features: IntentFeatures,
  ): any {
    const recommendations = {
      informational: {
        format: features.hasQuestionWords ? 'faq' : 'guide',
        tone: 'educational',
        cta: 'learn more',
        elements: ['table of contents', 'examples', 'infographics', 'faq', 'related articles'],
      },
      navigational: {
        format: 'landing page',
        tone: 'direct',
        cta: 'sign in',
        elements: ['clear navigation', 'search bar', 'breadcrumbs', 'sitemap link'],
      },
      commercial: {
        format: features.hasComparison ? 'comparison' : 'review',
        tone: 'objective',
        cta: 'see details',
        elements: ['comparison table', 'pros/cons', 'ratings', 'expert opinion', 'user reviews'],
      },
      transactional: {
        format: 'product page',
        tone: 'persuasive',
        cta: 'buy now',
        elements: ['pricing', 'add to cart', 'product images', 'specifications', 'reviews', 'guarantee'],
      },
    };

    return recommendations[intent];
  }

  // ========================================
  // Training Methods
  // ========================================

  /**
   * Train Naive Bayes classifier
   */
  private trainNaiveBayes(trainingData: TrainingDataPoint[]): void {
    this.logger.log('Training Naive Bayes classifier...');

    // Count intent occurrences
    const intentCounts: Map<IntentType, number> = new Map();
    const wordIntentCounts: Map<string, Map<IntentType, number>> = new Map();
    const totalIntentWords: Map<IntentType, number> = new Map();

    Object.values(IntentType).forEach((intent) => {
      intentCounts.set(intent, 0);
      totalIntentWords.set(intent, 0);
    });

    // Count
    trainingData.forEach((example) => {
      const intent = example.intent;
      intentCounts.set(intent, (intentCounts.get(intent) || 0) + 1);

      const words = this.tokenize(example.keyword);
      words.forEach((word) => {
        if (!wordIntentCounts.has(word)) {
          wordIntentCounts.set(word, new Map());
        }

        const intentMap = wordIntentCounts.get(word)!;
        intentMap.set(intent, (intentMap.get(intent) || 0) + 1);
        totalIntentWords.set(intent, (totalIntentWords.get(intent) || 0) + 1);
      });
    });

    // Calculate priors
    const totalExamples = trainingData.length;
    Object.values(IntentType).forEach((intent) => {
      this.naiveBayesPriors.set(intent, (intentCounts.get(intent) || 0) / totalExamples);
    });

    // Calculate likelihoods with Laplace smoothing
    const vocabulary = wordIntentCounts.size;

    wordIntentCounts.forEach((intentMap, word) => {
      const likelihoods: Map<IntentType, number> = new Map();

      Object.values(IntentType).forEach((intent) => {
        const wordCount = intentMap.get(intent) || 0;
        const totalWords = totalIntentWords.get(intent) || 1;
        // Laplace smoothing
        const likelihood = (wordCount + 1) / (totalWords + vocabulary);
        likelihoods.set(intent, likelihood);
      });

      this.naiveBayesLikelihoods.set(word, likelihoods);
    });

    this.logger.log(
      `Naive Bayes trained with ${trainingData.length} examples, ${vocabulary} unique words`,
    );
  }

  /**
   * Train TF-IDF weights
   */
  private trainTfIdf(trainingData: TrainingDataPoint[]): void {
    this.logger.log('Training TF-IDF weights...');

    // Build document-intent mapping
    const intentDocuments: Map<IntentType, string[]> = new Map();

    Object.values(IntentType).forEach((intent) => {
      intentDocuments.set(intent, []);
    });

    trainingData.forEach((example) => {
      const docs = intentDocuments.get(example.intent)!;
      docs.push(example.keyword);
    });

    // Calculate TF-IDF for each word-intent pair
    const allWords = new Set<string>();
    trainingData.forEach((example) => {
      this.tokenize(example.keyword).forEach((word) => allWords.add(word));
    });

    const totalDocuments = trainingData.length;

    allWords.forEach((word) => {
      const weights: Map<IntentType, number> = new Map();

      Object.values(IntentType).forEach((intent) => {
        const docs = intentDocuments.get(intent)!;

        // TF: frequency in intent documents
        const tf = docs.filter((doc) => this.tokenize(doc).includes(word)).length / docs.length;

        // IDF: inverse document frequency across all intents
        const docsWithWord = trainingData.filter((ex) =>
          this.tokenize(ex.keyword).includes(word),
        ).length;
        const idf = Math.log(totalDocuments / (docsWithWord + 1));

        weights.set(intent, tf * idf);
      });

      this.tfIdfWeights.set(word, weights);
    });

    this.logger.log(`TF-IDF trained with ${allWords.size} unique words`);
  }

  /**
   * Initialize default model with common patterns
   */
  private initializeDefaultModel(): void {
    // Default priors (uniform distribution)
    Object.values(IntentType).forEach((intent) => {
      this.naiveBayesPriors.set(intent, 0.25);
    });

    // Default TF-IDF weights for common words
    const commonWords = {
      informational: ['what', 'how', 'why', 'guide', 'tutorial', 'learn', 'explain'],
      navigational: ['login', 'signin', 'download', 'official', 'website'],
      commercial: ['best', 'top', 'review', 'compare', 'vs', 'alternative'],
      transactional: ['buy', 'purchase', 'price', 'cheap', 'discount', 'order'],
    };

    Object.entries(commonWords).forEach(([intent, words]) => {
      words.forEach((word) => {
        const weights: Map<IntentType, number> = new Map();
        Object.values(IntentType).forEach((i) => {
          weights.set(i, i === intent ? 1.0 : 0.1);
        });
        this.tfIdfWeights.set(word, weights);
      });
    });
  }

  // ========================================
  // Utility Methods
  // ========================================

  /**
   * Tokenize keyword
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 1);
  }

  /**
   * Normalize scores to probabilities
   */
  private normalizeToProbabilities(scores: Record<IntentType, number>): Record<IntentType, number> {
    const total = Object.values(scores).reduce((sum, score) => sum + Math.max(0, score), 0);

    if (total === 0) {
      // Uniform distribution if no scores
      const uniform = 1 / Object.keys(scores).length;
      const result: Record<IntentType, number> = {} as any;
      Object.keys(scores).forEach((intent) => {
        result[intent as IntentType] = uniform;
      });
      return result;
    }

    const result: Record<IntentType, number> = {} as any;
    Object.keys(scores).forEach((intent) => {
      result[intent as IntentType] = Math.max(0, scores[intent as IntentType]) / total;
    });

    return result;
  }

  /**
   * Build confusion matrix
   */
  private buildConfusionMatrix(
    predictions: IntentType[],
    actuals: IntentType[],
    intents: IntentType[],
  ): number[][] {
    const matrix: number[][] = Array(intents.length)
      .fill(0)
      .map(() => Array(intents.length).fill(0));

    predictions.forEach((pred, i) => {
      const predIdx = intents.indexOf(pred);
      const actualIdx = intents.indexOf(actuals[i]);
      matrix[actualIdx][predIdx]++;
    });

    return matrix;
  }

  /**
   * Shuffle array (Fisher-Yates)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
