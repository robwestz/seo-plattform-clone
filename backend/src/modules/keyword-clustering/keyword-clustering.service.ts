import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KeywordCluster } from './entities/keyword-cluster.entity';
import { Keyword } from '../keywords/entities/keyword.entity';

/**
 * Cluster Result
 */
export interface ClusterResult {
  clusters: Array<{
    id: string;
    name: string;
    keywords: string[];
    primaryKeyword: string;
    searchVolume: number;
    averageDifficulty: number;
    intent: string;
    topicScore: number;
    keywords_count: number;
  }>;
  orphanKeywords: string[];
  statistics: {
    totalClusters: number;
    averageClusterSize: number;
    largestCluster: number;
    smallestCluster: number;
    totalKeywords: number;
    clusteredKeywords: number;
    orphanedKeywords: number;
  };
}

/**
 * Topic Model Result
 */
export interface TopicModelResult {
  topics: Array<{
    id: number;
    name: string;
    topTerms: string[];
    coherenceScore: number;
    keywords: string[];
  }>;
  documentTopicMatrix: number[][];
  topicTermMatrix: number[][];
}

/**
 * Semantic Similarity Matrix
 */
type SimilarityMatrix = Map<string, Map<string, number>>;

/**
 * Keyword Clustering Service
 * Advanced keyword grouping using semantic similarity and topic modeling
 */
@Injectable()
export class KeywordClusteringService {
  private readonly logger = new Logger(KeywordClusteringService.name);

  private readonly SIMILARITY_THRESHOLD = 0.6;
  private readonly MIN_CLUSTER_SIZE = 3;
  private readonly MAX_CLUSTER_SIZE = 50;

  constructor(
    @InjectRepository(KeywordCluster)
    private clusterRepository: Repository<KeywordCluster>,
    @InjectRepository(Keyword)
    private keywordRepository: Repository<Keyword>,
  ) {}

  /**
   * Cluster keywords using semantic similarity
   */
  async clusterKeywords(params: {
    projectId: string;
    keywords: string[];
    method?: 'semantic' | 'intent' | 'topic' | 'hierarchical';
    threshold?: number;
  }): Promise<ClusterResult> {
    this.logger.log(`Clustering ${params.keywords.length} keywords using ${params.method || 'semantic'} method`);

    const { keywords, method = 'semantic', threshold = this.SIMILARITY_THRESHOLD } = params;

    let clusters: ClusterResult['clusters'];

    switch (method) {
      case 'semantic':
        clusters = await this.semanticClustering(keywords, threshold);
        break;
      case 'intent':
        clusters = await this.intentBasedClustering(keywords);
        break;
      case 'topic':
        clusters = await this.topicModelClustering(keywords);
        break;
      case 'hierarchical':
        clusters = await this.hierarchicalClustering(keywords, threshold);
        break;
      default:
        clusters = await this.semanticClustering(keywords, threshold);
    }

    // Identify orphan keywords (not in any cluster)
    const clusteredKeywords = new Set(
      clusters.flatMap((c) => c.keywords),
    );
    const orphanKeywords = keywords.filter((k) => !clusteredKeywords.has(k));

    // Calculate statistics
    const statistics = {
      totalClusters: clusters.length,
      averageClusterSize:
        clusters.reduce((sum, c) => sum + c.keywords.length, 0) / clusters.length || 0,
      largestCluster: Math.max(...clusters.map((c) => c.keywords.length), 0),
      smallestCluster: Math.min(...clusters.map((c) => c.keywords.length), Infinity),
      totalKeywords: keywords.length,
      clusteredKeywords: clusteredKeywords.size,
      orphanedKeywords: orphanKeywords.length,
    };

    return {
      clusters,
      orphanKeywords,
      statistics,
    };
  }

  /**
   * Semantic clustering using string similarity
   */
  private async semanticClustering(
    keywords: string[],
    threshold: number,
  ): Promise<ClusterResult['clusters']> {
    // Build similarity matrix
    const similarityMatrix = this.buildSimilarityMatrix(keywords);

    // Perform clustering using similarity threshold
    const clusters: ClusterResult['clusters'] = [];
    const assigned = new Set<string>();

    for (const keyword of keywords) {
      if (assigned.has(keyword)) continue;

      // Find similar keywords
      const similar = keywords.filter((k) => {
        if (k === keyword || assigned.has(k)) return false;
        const similarity = similarityMatrix.get(keyword)?.get(k) || 0;
        return similarity >= threshold;
      });

      if (similar.length >= this.MIN_CLUSTER_SIZE - 1) {
        const clusterKeywords = [keyword, ...similar];

        // Mark as assigned
        clusterKeywords.forEach((k) => assigned.add(k));

        // Create cluster
        clusters.push({
          id: this.generateClusterId(),
          name: this.generateClusterName(clusterKeywords),
          keywords: clusterKeywords,
          primaryKeyword: this.selectPrimaryKeyword(clusterKeywords),
          searchVolume: 0, // Would fetch from keyword data
          averageDifficulty: 0, // Would calculate from keyword data
          intent: this.detectClusterIntent(clusterKeywords),
          topicScore: this.calculateTopicCoherence(clusterKeywords),
          keywords_count: clusterKeywords.length,
        });
      }
    }

    return clusters;
  }

  /**
   * Intent-based clustering
   */
  private async intentBasedClustering(
    keywords: string[],
  ): Promise<ClusterResult['clusters']> {
    const intentGroups = new Map<string, string[]>();

    // Group by intent
    keywords.forEach((keyword) => {
      const intent = this.classifyIntent(keyword);
      if (!intentGroups.has(intent)) {
        intentGroups.set(intent, []);
      }
      intentGroups.get(intent)!.push(keyword);
    });

    const clusters: ClusterResult['clusters'] = [];

    // Create clusters from intent groups
    intentGroups.forEach((keywords, intent) => {
      if (keywords.length >= this.MIN_CLUSTER_SIZE) {
        clusters.push({
          id: this.generateClusterId(),
          name: `${intent.charAt(0).toUpperCase() + intent.slice(1)} Intent`,
          keywords,
          primaryKeyword: this.selectPrimaryKeyword(keywords),
          searchVolume: 0,
          averageDifficulty: 0,
          intent,
          topicScore: this.calculateTopicCoherence(keywords),
          keywords_count: keywords.length,
        });
      }
    });

    return clusters;
  }

  /**
   * Topic modeling clustering (LDA-based)
   */
  private async topicModelClustering(
    keywords: string[],
  ): Promise<ClusterResult['clusters']> {
    // Simplified LDA (Latent Dirichlet Allocation)
    const numTopics = Math.min(10, Math.ceil(keywords.length / 10));

    // Extract terms from keywords
    const documents = keywords.map((k) => k.toLowerCase().split(/\s+/));

    // Build vocabulary
    const vocabulary = new Set<string>();
    documents.forEach((doc) => doc.forEach((term) => vocabulary.add(term)));
    const vocabArray = Array.from(vocabulary);

    // Initialize topic-term and document-topic distributions
    const topicTermMatrix = this.initializeMatrix(numTopics, vocabArray.length);
    const documentTopicMatrix = this.initializeMatrix(documents.length, numTopics);

    // Simple topic assignment (simplified LDA - in production, use proper Gibbs sampling)
    documents.forEach((doc, docIdx) => {
      doc.forEach((term) => {
        const termIdx = vocabArray.indexOf(term);
        // Assign to topic with highest probability (simplified)
        const topicIdx = docIdx % numTopics;
        topicTermMatrix[topicIdx][termIdx] += 1;
        documentTopicMatrix[docIdx][topicIdx] += 1;
      });
    });

    // Normalize matrices
    this.normalizeMatrix(topicTermMatrix);
    this.normalizeMatrix(documentTopicMatrix);

    // Extract topics
    const topics: TopicModelResult['topics'] = [];
    for (let i = 0; i < numTopics; i++) {
      const topTermIndices = this.getTopIndices(topicTermMatrix[i], 5);
      const topTerms = topTermIndices.map((idx) => vocabArray[idx]);

      // Find keywords belonging to this topic
      const topicKeywords = keywords.filter((_, idx) => {
        const topicProb = documentTopicMatrix[idx][i];
        return topicProb > 0.3; // Threshold for topic membership
      });

      if (topicKeywords.length >= this.MIN_CLUSTER_SIZE) {
        topics.push({
          id: i,
          name: `Topic ${i + 1}: ${topTerms.slice(0, 2).join(' + ')}`,
          topTerms,
          coherenceScore: this.calculateTopicCoherence(topicKeywords),
          keywords: topicKeywords,
        });
      }
    }

    // Convert topics to clusters
    const clusters: ClusterResult['clusters'] = topics.map((topic) => ({
      id: this.generateClusterId(),
      name: topic.name,
      keywords: topic.keywords,
      primaryKeyword: this.selectPrimaryKeyword(topic.keywords),
      searchVolume: 0,
      averageDifficulty: 0,
      intent: this.detectClusterIntent(topic.keywords),
      topicScore: topic.coherenceScore,
      keywords_count: topic.keywords.length,
    }));

    return clusters;
  }

  /**
   * Hierarchical clustering
   */
  private async hierarchicalClustering(
    keywords: string[],
    threshold: number,
  ): Promise<ClusterResult['clusters']> {
    // Build similarity matrix
    const similarityMatrix = this.buildSimilarityMatrix(keywords);

    // Create initial clusters (each keyword is a cluster)
    let clusters = keywords.map((k) => ({
      keywords: [k],
      centroid: k,
    }));

    // Merge clusters hierarchically
    while (clusters.length > 1) {
      // Find most similar cluster pair
      let maxSimilarity = -Infinity;
      let mergeIdx1 = -1;
      let mergeIdx2 = -1;

      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          const similarity = this.calculateClusterSimilarity(
            clusters[i],
            clusters[j],
            similarityMatrix,
          );

          if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            mergeIdx1 = i;
            mergeIdx2 = j;
          }
        }
      }

      // Stop if no similar clusters found
      if (maxSimilarity < threshold) break;

      // Merge clusters
      const merged = {
        keywords: [...clusters[mergeIdx1].keywords, ...clusters[mergeIdx2].keywords],
        centroid: clusters[mergeIdx1].centroid, // Use first cluster's centroid
      };

      // Remove old clusters and add merged
      clusters = clusters.filter((_, idx) => idx !== mergeIdx1 && idx !== mergeIdx2);
      clusters.push(merged);

      // Stop if clusters are getting too large
      if (merged.keywords.length > this.MAX_CLUSTER_SIZE) break;
    }

    // Filter out small clusters
    clusters = clusters.filter((c) => c.keywords.length >= this.MIN_CLUSTER_SIZE);

    // Convert to result format
    return clusters.map((cluster) => ({
      id: this.generateClusterId(),
      name: this.generateClusterName(cluster.keywords),
      keywords: cluster.keywords,
      primaryKeyword: this.selectPrimaryKeyword(cluster.keywords),
      searchVolume: 0,
      averageDifficulty: 0,
      intent: this.detectClusterIntent(cluster.keywords),
      topicScore: this.calculateTopicCoherence(cluster.keywords),
      keywords_count: cluster.keywords.length,
    }));
  }

  /**
   * Detect keyword cannibalization
   */
  async detectCannibalization(params: {
    projectId: string;
    threshold?: number;
  }): Promise<{
    cannibalizationGroups: Array<{
      keywords: string[];
      similarity: number;
      urls: string[];
      recommendation: string;
    }>;
    severity: 'low' | 'medium' | 'high';
  }> {
    const { projectId, threshold = 0.85 } = params;

    // Get all keywords with their ranking URLs
    const keywords = await this.keywordRepository.find({
      where: { projectId },
      select: ['keyword', 'currentPosition', 'metadata'],
    });

    // Build similarity matrix
    const keywordStrings = keywords.map((k) => k.keyword);
    const similarityMatrix = this.buildSimilarityMatrix(keywordStrings);

    // Find cannibalization groups (high similarity + ranking for same URLs)
    const cannibalizationGroups: any[] = [];

    for (let i = 0; i < keywordStrings.length; i++) {
      for (let j = i + 1; j < keywordStrings.length; j++) {
        const similarity = similarityMatrix.get(keywordStrings[i])?.get(keywordStrings[j]) || 0;

        if (similarity >= threshold) {
          // Check if they rank for similar URLs (simplified - in production, compare actual URLs)
          const urls1 = keywords[i].metadata?.['rankingUrls'] || [];
          const urls2 = keywords[j].metadata?.['rankingUrls'] || [];

          const urlOverlap = this.calculateArrayOverlap(urls1, urls2);

          if (urlOverlap > 0.5) {
            cannibalizationGroups.push({
              keywords: [keywordStrings[i], keywordStrings[j]],
              similarity,
              urls: [...new Set([...urls1, ...urls2])],
              recommendation: this.generateCannibalizationRecommendation(
                keywordStrings[i],
                keywordStrings[j],
                similarity,
              ),
            });
          }
        }
      }
    }

    // Determine severity
    let severity: 'low' | 'medium' | 'high' = 'low';
    if (cannibalizationGroups.length > 10) {
      severity = 'high';
    } else if (cannibalizationGroups.length > 5) {
      severity = 'medium';
    }

    return {
      cannibalizationGroups,
      severity,
    };
  }

  /**
   * Build similarity matrix for keywords
   */
  private buildSimilarityMatrix(keywords: string[]): SimilarityMatrix {
    const matrix: SimilarityMatrix = new Map();

    for (const k1 of keywords) {
      const row = new Map<string, number>();

      for (const k2 of keywords) {
        if (k1 === k2) {
          row.set(k2, 1.0);
        } else {
          row.set(k2, this.calculateSimilarity(k1, k2));
        }
      }

      matrix.set(k1, row);
    }

    return matrix;
  }

  /**
   * Calculate similarity between two keywords
   */
  private calculateSimilarity(keyword1: string, keyword2: string): number {
    const k1 = keyword1.toLowerCase();
    const k2 = keyword2.toLowerCase();

    // Jaccard similarity on words
    const words1 = new Set(k1.split(/\s+/));
    const words2 = new Set(k2.split(/\s+/));

    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    const jaccardScore = intersection.size / union.size;

    // Levenshtein similarity
    const levenshteinScore = this.levenshteinSimilarity(k1, k2);

    // Combined score (weighted average)
    return jaccardScore * 0.7 + levenshteinScore * 0.3;
  }

  /**
   * Levenshtein distance similarity
   */
  private levenshteinSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);

    if (maxLength === 0) return 1.0;

    return 1 - distance / maxLength;
  }

  /**
   * Levenshtein distance
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
   * Calculate cluster similarity
   */
  private calculateClusterSimilarity(
    cluster1: { keywords: string[] },
    cluster2: { keywords: string[] },
    similarityMatrix: SimilarityMatrix,
  ): number {
    let totalSimilarity = 0;
    let count = 0;

    for (const k1 of cluster1.keywords) {
      for (const k2 of cluster2.keywords) {
        totalSimilarity += similarityMatrix.get(k1)?.get(k2) || 0;
        count++;
      }
    }

    return count > 0 ? totalSimilarity / count : 0;
  }

  /**
   * Classify intent of keyword
   */
  private classifyIntent(keyword: string): string {
    const lower = keyword.toLowerCase();

    // Transactional
    if (/\b(buy|purchase|order|shop|deal|price|discount|coupon)\b/.test(lower)) {
      return 'transactional';
    }

    // Commercial
    if (/\b(best|top|review|compare|vs|alternative)\b/.test(lower)) {
      return 'commercial';
    }

    // Navigational
    if (/\b(login|sign in|download|app|website)\b/.test(lower)) {
      return 'navigational';
    }

    // Informational (default)
    return 'informational';
  }

  /**
   * Detect cluster intent
   */
  private detectClusterIntent(keywords: string[]): string {
    const intentCounts = new Map<string, number>();

    keywords.forEach((k) => {
      const intent = this.classifyIntent(k);
      intentCounts.set(intent, (intentCounts.get(intent) || 0) + 1);
    });

    // Return most common intent
    let maxCount = 0;
    let dominantIntent = 'informational';

    intentCounts.forEach((count, intent) => {
      if (count > maxCount) {
        maxCount = count;
        dominantIntent = intent;
      }
    });

    return dominantIntent;
  }

  /**
   * Select primary keyword from cluster
   */
  private selectPrimaryKeyword(keywords: string[]): string {
    // Select shortest keyword (usually the head term)
    return keywords.reduce((shortest, current) =>
      current.length < shortest.length ? current : shortest,
    );
  }

  /**
   * Generate cluster name
   */
  private generateClusterName(keywords: string[]): string {
    const primary = this.selectPrimaryKeyword(keywords);
    return `${primary} (${keywords.length} keywords)`;
  }

  /**
   * Calculate topic coherence
   */
  private calculateTopicCoherence(keywords: string[]): number {
    if (keywords.length < 2) return 0;

    // Calculate average pairwise similarity
    let totalSimilarity = 0;
    let count = 0;

    for (let i = 0; i < keywords.length; i++) {
      for (let j = i + 1; j < keywords.length; j++) {
        totalSimilarity += this.calculateSimilarity(keywords[i], keywords[j]);
        count++;
      }
    }

    return count > 0 ? (totalSimilarity / count) * 100 : 0;
  }

  /**
   * Generate cluster ID
   */
  private generateClusterId(): string {
    return `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize matrix
   */
  private initializeMatrix(rows: number, cols: number): number[][] {
    return Array(rows)
      .fill(0)
      .map(() => Array(cols).fill(0));
  }

  /**
   * Normalize matrix rows to sum to 1
   */
  private normalizeMatrix(matrix: number[][]): void {
    matrix.forEach((row) => {
      const sum = row.reduce((a, b) => a + b, 0);
      if (sum > 0) {
        for (let i = 0; i < row.length; i++) {
          row[i] /= sum;
        }
      }
    });
  }

  /**
   * Get top N indices from array
   */
  private getTopIndices(arr: number[], n: number): number[] {
    return arr
      .map((val, idx) => ({ val, idx }))
      .sort((a, b) => b.val - a.val)
      .slice(0, n)
      .map((item) => item.idx);
  }

  /**
   * Calculate array overlap
   */
  private calculateArrayOverlap(arr1: any[], arr2: any[]): number {
    if (arr1.length === 0 || arr2.length === 0) return 0;

    const set1 = new Set(arr1);
    const set2 = new Set(arr2);

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Generate cannibalization recommendation
   */
  private generateCannibalizationRecommendation(
    keyword1: string,
    keyword2: string,
    similarity: number,
  ): string {
    if (similarity > 0.95) {
      return `Merge content for "${keyword1}" and "${keyword2}" into a single comprehensive page`;
    } else if (similarity > 0.85) {
      return `Differentiate content for "${keyword1}" and "${keyword2}" or consolidate into one page`;
    } else {
      return `Monitor "${keyword1}" and "${keyword2}" for potential cannibalization`;
    }
  }
}
