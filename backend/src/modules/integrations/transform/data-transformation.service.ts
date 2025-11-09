import { Injectable, Logger } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';

/**
 * Data Transformation Service
 * Standardizes data from different integrations into unified models
 * with validation, enrichment, and format conversion
 */
@Injectable()
export class DataTransformationService {
  private readonly logger = new Logger(DataTransformationService.name);

  /**
   * Transform Google Search Console data to standard format
   */
  transformGSCData(rawData: any): {
    standardized: any[];
    errors: string[];
  } {
    const standardized = [];
    const errors = [];

    if (!rawData || !Array.isArray(rawData.rows)) {
      errors.push('Invalid GSC data format');
      return { standardized, errors };
    }

    rawData.rows.forEach((row, index) => {
      try {
        const transformed = {
          source: 'google-search-console',
          metric: 'search_performance',
          timestamp: new Date(),
          dimensions: {
            query: row.keys?.[0] || null,
            page: row.keys?.[1] || null,
            date: row.keys?.[2] || null,
            country: row.keys?.[3] || null,
            device: row.keys?.[4] || null,
          },
          metrics: {
            clicks: this.safeNumber(row.clicks, 0),
            impressions: this.safeNumber(row.impressions, 0),
            ctr: this.safeNumber(row.ctr, 0),
            position: this.safeNumber(row.position, 0),
          },
          metadata: {
            rawKeys: row.keys,
          },
        };

        standardized.push(transformed);
      } catch (error) {
        errors.push(`Row ${index}: ${error.message}`);
      }
    });

    return { standardized, errors };
  }

  /**
   * Transform Google Analytics data to standard format
   */
  transformGAData(rawData: any): {
    standardized: any[];
    errors: string[];
  } {
    const standardized = [];
    const errors = [];

    if (!rawData || !Array.isArray(rawData.rows)) {
      errors.push('Invalid GA data format');
      return { standardized, errors };
    }

    rawData.rows.forEach((row, index) => {
      try {
        const dimensions = this.extractGADimensions(row, rawData.dimensionHeaders);
        const metrics = this.extractGAMetrics(row, rawData.metricHeaders);

        const transformed = {
          source: 'google-analytics',
          metric: 'analytics',
          timestamp: new Date(),
          dimensions,
          metrics,
          metadata: {
            rawRow: row,
          },
        };

        standardized.push(transformed);
      } catch (error) {
        errors.push(`Row ${index}: ${error.message}`);
      }
    });

    return { standardized, errors };
  }

  /**
   * Extract GA4 dimensions
   */
  private extractGADimensions(row: any, headers: any[]): Record<string, any> {
    const dimensions = {};

    if (!headers || !row.dimensionValues) return dimensions;

    headers.forEach((header, index) => {
      const value = row.dimensionValues[index]?.value;
      dimensions[header.name] = value || null;
    });

    return dimensions;
  }

  /**
   * Extract GA4 metrics
   */
  private extractGAMetrics(row: any, headers: any[]): Record<string, number> {
    const metrics = {};

    if (!headers || !row.metricValues) return metrics;

    headers.forEach((header, index) => {
      const value = row.metricValues[index]?.value;
      metrics[header.name] = this.safeNumber(value, 0);
    });

    return metrics;
  }

  /**
   * Transform Ahrefs backlink data to standard format
   */
  transformAhrefsBacklinks(rawData: any): {
    standardized: any[];
    errors: string[];
  } {
    const standardized = [];
    const errors = [];

    if (!rawData || !Array.isArray(rawData.backlinks)) {
      errors.push('Invalid Ahrefs backlinks format');
      return { standardized, errors };
    }

    rawData.backlinks.forEach((backlink, index) => {
      try {
        const transformed = {
          source: 'ahrefs',
          metric: 'backlink',
          timestamp: new Date(),
          data: {
            url: backlink.url_from || null,
            targetUrl: backlink.url_to || null,
            anchorText: backlink.anchor || null,
            linkType: backlink.link_type || 'text',
            firstSeen: backlink.first_seen ? new Date(backlink.first_seen) : null,
            lastSeen: backlink.last_seen ? new Date(backlink.last_seen) : null,
            domainRating: this.safeNumber(backlink.domain_rating, 0),
            urlRating: this.safeNumber(backlink.url_rating, 0),
            isDoFollow: backlink.nofollow === false,
            isLive: backlink.is_lost === false,
          },
          metadata: {
            provider: 'ahrefs',
            rawData: backlink,
          },
        };

        standardized.push(transformed);
      } catch (error) {
        errors.push(`Backlink ${index}: ${error.message}`);
      }
    });

    return { standardized, errors };
  }

  /**
   * Transform SEMrush keyword data to standard format
   */
  transformSEMrushKeywords(rawData: any): {
    standardized: any[];
    errors: string[];
  } {
    const standardized = [];
    const errors = [];

    if (!rawData || !Array.isArray(rawData.rows)) {
      errors.push('Invalid SEMrush keywords format');
      return { standardized, errors };
    }

    rawData.rows.forEach((row, index) => {
      try {
        const transformed = {
          source: 'semrush',
          metric: 'keyword',
          timestamp: new Date(),
          data: {
            keyword: row.keyword || null,
            searchVolume: this.safeNumber(row.search_volume, 0),
            cpc: this.safeNumber(row.cpc, 0),
            competition: this.safeNumber(row.competition, 0),
            competitionLevel: row.competition_level || null,
            difficulty: this.safeNumber(row.keyword_difficulty, 0),
            trend: row.trend || [],
            intent: row.intent || null,
            features: row.serp_features || [],
          },
          metadata: {
            provider: 'semrush',
            rawData: row,
          },
        };

        standardized.push(transformed);
      } catch (error) {
        errors.push(`Keyword ${index}: ${error.message}`);
      }
    });

    return { standardized, errors };
  }

  /**
   * Aggregate data from multiple sources
   */
  aggregateMultiSource(datasets: Array<{
    source: string;
    data: any[];
  }>): {
    aggregated: any[];
    coverage: {
      [source: string]: number;
    };
  } {
    const aggregationMap = new Map<string, any>();
    const coverage = {};

    datasets.forEach(dataset => {
      coverage[dataset.source] = dataset.data.length;

      dataset.data.forEach(item => {
        const key = this.generateAggregationKey(item);

        if (!aggregationMap.has(key)) {
          aggregationMap.set(key, {
            key,
            sources: [],
            data: {},
          });
        }

        const existing = aggregationMap.get(key);
        existing.sources.push(dataset.source);
        existing.data[dataset.source] = item;
      });
    });

    const aggregated = Array.from(aggregationMap.values()).map(item => ({
      ...item,
      confidence: this.calculateConfidence(item.sources.length, datasets.length),
      merged: this.mergeDataFromSources(item.data),
    }));

    return { aggregated, coverage };
  }

  /**
   * Generate aggregation key from data item
   */
  private generateAggregationKey(item: any): string {
    // Use primary identifier based on metric type
    if (item.data?.keyword) {
      return `keyword:${item.data.keyword.toLowerCase()}`;
    }
    if (item.data?.url || item.data?.targetUrl) {
      return `url:${item.data.url || item.data.targetUrl}`;
    }
    if (item.dimensions?.query) {
      return `query:${item.dimensions.query.toLowerCase()}`;
    }
    if (item.dimensions?.page) {
      return `page:${item.dimensions.page}`;
    }

    return `unknown:${JSON.stringify(item).slice(0, 100)}`;
  }

  /**
   * Calculate confidence based on source coverage
   */
  private calculateConfidence(sourceCount: number, totalSources: number): number {
    return (sourceCount / totalSources) * 100;
  }

  /**
   * Merge data from multiple sources
   */
  private mergeDataFromSources(sources: Record<string, any>): any {
    const merged = {
      values: {},
      conflicts: [],
    };

    // Collect all unique keys
    const allKeys = new Set<string>();
    Object.values(sources).forEach(source => {
      Object.keys(source.data || source.metrics || {}).forEach(key =>
        allKeys.add(key),
      );
    });

    // For each key, merge values
    allKeys.forEach(key => {
      const values = [];
      Object.entries(sources).forEach(([sourceName, sourceData]) => {
        const data = sourceData.data || sourceData.metrics || {};
        if (data[key] !== undefined && data[key] !== null) {
          values.push({ source: sourceName, value: data[key] });
        }
      });

      if (values.length === 0) {
        merged.values[key] = null;
      } else if (values.length === 1) {
        merged.values[key] = values[0].value;
      } else {
        // Multiple sources - check for conflicts
        const uniqueValues = new Set(values.map(v => JSON.stringify(v.value)));

        if (uniqueValues.size === 1) {
          // All sources agree
          merged.values[key] = values[0].value;
        } else {
          // Conflict - use averaging for numbers, first value for strings
          const numericValues = values
            .map(v => v.value)
            .filter(v => typeof v === 'number');

          if (numericValues.length === values.length) {
            // All numeric - average
            merged.values[key] =
              numericValues.reduce((sum, v) => sum + v, 0) / numericValues.length;
          } else {
            // Mixed types - use first value
            merged.values[key] = values[0].value;
          }

          merged.conflicts.push({
            key,
            values,
            resolved: merged.values[key],
          });
        }
      }
    });

    return merged;
  }

  /**
   * Enrich data with additional computed fields
   */
  enrichData(data: any[]): {
    enriched: any[];
    enrichmentCount: number;
  } {
    const enriched = data.map(item => {
      const enrichments = {};
      let count = 0;

      // Add search intent classification
      if (item.data?.keyword || item.dimensions?.query) {
        const keyword = item.data?.keyword || item.dimensions?.query;
        enrichments['computedIntent'] = this.classifySearchIntent(keyword);
        count++;
      }

      // Add CTR benchmarks
      if (item.metrics?.position !== undefined) {
        enrichments['expectedCtr'] = this.getExpectedCTR(item.metrics.position);
        count++;

        if (item.metrics?.ctr !== undefined) {
          enrichments['ctrPerformance'] =
            item.metrics.ctr / enrichments['expectedCtr'];
          count++;
        }
      }

      // Add quality scores
      if (item.data?.searchVolume !== undefined && item.data?.difficulty !== undefined) {
        enrichments['opportunityScore'] = this.calculateOpportunityScore(
          item.data.searchVolume,
          item.data.difficulty,
        );
        count++;
      }

      return {
        ...item,
        enrichments,
      };
    });

    return {
      enriched,
      enrichmentCount: enriched.reduce((sum, item) =>
        sum + Object.keys(item.enrichments).length, 0,
      ),
    };
  }

  /**
   * Classify search intent from keyword
   */
  private classifySearchIntent(keyword: string): string {
    const lower = keyword.toLowerCase();

    const informationalKeywords = ['how', 'what', 'why', 'when', 'where', 'guide', 'tutorial'];
    const navigationalKeywords = ['login', 'sign in', 'website', 'official'];
    const transactionalKeywords = ['buy', 'purchase', 'order', 'price', 'download'];
    const commercialKeywords = ['best', 'top', 'review', 'compare', 'vs', 'alternative'];

    if (informationalKeywords.some(kw => lower.includes(kw))) {
      return 'informational';
    }
    if (navigationalKeywords.some(kw => lower.includes(kw))) {
      return 'navigational';
    }
    if (transactionalKeywords.some(kw => lower.includes(kw))) {
      return 'transactional';
    }
    if (commercialKeywords.some(kw => lower.includes(kw))) {
      return 'commercial';
    }

    return 'informational'; // Default
  }

  /**
   * Get expected CTR by position
   */
  private getExpectedCTR(position: number): number {
    const benchmarks = {
      1: 28.5,
      2: 15.7,
      3: 11.0,
      4: 8.0,
      5: 7.2,
      6: 5.1,
      7: 4.0,
      8: 3.2,
      9: 2.8,
      10: 2.5,
    };

    if (position <= 10) {
      return benchmarks[Math.floor(position)] || 2.0;
    }

    return 1.0; // Below position 10
  }

  /**
   * Calculate opportunity score for keyword
   */
  private calculateOpportunityScore(
    searchVolume: number,
    difficulty: number,
  ): number {
    // Higher volume = better
    const volumeScore = Math.min(searchVolume / 1000, 10);

    // Lower difficulty = better
    const difficultyScore = Math.max(0, 10 - difficulty / 10);

    return parseFloat(((volumeScore + difficultyScore) / 2).toFixed(2));
  }

  /**
   * Validate data against schema
   */
  async validateData<T>(
    data: any[],
    dtoClass: new () => T,
  ): Promise<{
    valid: T[];
    invalid: Array<{ data: any; errors: ValidationError[] }>;
  }> {
    const valid: T[] = [];
    const invalid = [];

    for (const item of data) {
      const instance = plainToClass(dtoClass, item);
      const errors = await validate(instance as any);

      if (errors.length === 0) {
        valid.push(instance);
      } else {
        invalid.push({ data: item, errors });
      }
    }

    return { valid, invalid };
  }

  /**
   * Deduplicate data based on key
   */
  deduplicateData(
    data: any[],
    keyExtractor: (item: any) => string,
    strategy: 'first' | 'last' | 'merge' = 'last',
  ): {
    deduplicated: any[];
    duplicatesRemoved: number;
  } {
    const map = new Map<string, any>();

    data.forEach(item => {
      const key = keyExtractor(item);

      if (!map.has(key)) {
        map.set(key, item);
      } else {
        if (strategy === 'last') {
          map.set(key, item);
        } else if (strategy === 'merge') {
          const existing = map.get(key);
          map.set(key, { ...existing, ...item });
        }
        // 'first' strategy: do nothing, keep existing
      }
    });

    return {
      deduplicated: Array.from(map.values()),
      duplicatesRemoved: data.length - map.size,
    };
  }

  /**
   * Convert data format
   */
  convertFormat(
    data: any[],
    format: 'json' | 'csv' | 'tsv',
  ): string {
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    if (format === 'csv' || format === 'tsv') {
      return this.convertToDelimited(data, format === 'csv' ? ',' : '\t');
    }

    throw new Error(`Unsupported format: ${format}`);
  }

  /**
   * Convert to delimited format (CSV/TSV)
   */
  private convertToDelimited(data: any[], delimiter: string): string {
    if (data.length === 0) return '';

    // Extract all possible keys
    const allKeys = new Set<string>();
    data.forEach(item => {
      Object.keys(this.flattenObject(item)).forEach(key => allKeys.add(key));
    });

    const keys = Array.from(allKeys);

    // Header row
    const rows = [keys.join(delimiter)];

    // Data rows
    data.forEach(item => {
      const flat = this.flattenObject(item);
      const row = keys.map(key => {
        const value = flat[key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(delimiter)) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      });
      rows.push(row.join(delimiter));
    });

    return rows.join('\n');
  }

  /**
   * Flatten nested object
   */
  private flattenObject(obj: any, prefix = ''): Record<string, any> {
    const flat = {};

    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flat, this.flattenObject(value, newKey));
      } else {
        flat[newKey] = value;
      }
    });

    return flat;
  }

  /**
   * Safe number conversion
   */
  private safeNumber(value: any, defaultValue: number = 0): number {
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  }
}
