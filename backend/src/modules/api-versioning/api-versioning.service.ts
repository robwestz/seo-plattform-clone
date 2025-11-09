import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiVersion, ApiVersionStatus } from './entities/api-version.entity';

/**
 * Version Resolution Strategy
 */
export enum VersionStrategy {
  HEADER = 'header', // X-API-Version header
  URL = 'url', // /v1/resource
  QUERY = 'query', // ?version=v1
  ACCEPT_HEADER = 'accept', // Accept: application/vnd.api.v1+json
}

/**
 * API Versioning Service
 * Manages API versions and their lifecycle
 */
@Injectable()
export class ApiVersioningService {
  private readonly logger = new Logger(ApiVersioningService.name);
  private versionsCache: Map<string, ApiVersion> = new Map();

  constructor(
    @InjectRepository(ApiVersion)
    private versionRepository: Repository<ApiVersion>,
  ) {
    this.loadVersionsCache();
  }

  /**
   * Extract version from request
   */
  extractVersion(
    strategy: VersionStrategy,
    headers: Record<string, string>,
    path: string,
    query: Record<string, string>,
  ): string | null {
    switch (strategy) {
      case VersionStrategy.HEADER:
        return headers['x-api-version'] || headers['api-version'] || null;

      case VersionStrategy.URL:
        const match = path.match(/^\/(v\d+)\//);
        return match ? match[1] : null;

      case VersionStrategy.QUERY:
        return query.version || null;

      case VersionStrategy.ACCEPT_HEADER:
        const accept = headers['accept'] || '';
        const acceptMatch = accept.match(/vnd\.api\.(v\d+)/);
        return acceptMatch ? acceptMatch[1] : null;

      default:
        return null;
    }
  }

  /**
   * Get version details
   */
  async getVersion(version: string): Promise<ApiVersion | null> {
    // Check cache first
    if (this.versionsCache.has(version)) {
      return this.versionsCache.get(version) || null;
    }

    // Load from database
    const apiVersion = await this.versionRepository.findOne({
      where: { version },
    });

    if (apiVersion) {
      this.versionsCache.set(version, apiVersion);
    }

    return apiVersion;
  }

  /**
   * Get default version
   */
  async getDefaultVersion(): Promise<ApiVersion | null> {
    const defaultVersion = await this.versionRepository.findOne({
      where: { isDefault: true },
    });

    if (!defaultVersion) {
      // Fallback to latest active version
      return this.versionRepository.findOne({
        where: { status: ApiVersionStatus.ACTIVE },
        order: { createdAt: 'DESC' },
      });
    }

    return defaultVersion;
  }

  /**
   * Get all active versions
   */
  async getActiveVersions(): Promise<ApiVersion[]> {
    return this.versionRepository.find({
      where: { status: ApiVersionStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Create new version
   */
  async createVersion(params: {
    version: string;
    name: string;
    description?: string;
    status?: ApiVersionStatus;
    isDefault?: boolean;
    breakingChanges?: any[];
  }): Promise<ApiVersion> {
    const version = this.versionRepository.create({
      ...params,
      releasedAt: new Date(),
    });

    const saved = await this.versionRepository.save(version);

    // Update cache
    this.versionsCache.set(saved.version, saved);

    return saved;
  }

  /**
   * Deprecate version
   */
  async deprecateVersion(
    version: string,
    sunsetDate: Date,
    migrateToVersion?: string,
  ): Promise<ApiVersion> {
    const apiVersion = await this.getVersion(version);

    if (!apiVersion) {
      throw new Error(`Version ${version} not found`);
    }

    apiVersion.status = ApiVersionStatus.DEPRECATED;
    apiVersion.deprecatedAt = new Date();
    apiVersion.sunsetAt = sunsetDate;

    if (migrateToVersion) {
      const targetVersion = await this.getVersion(migrateToVersion);
      if (targetVersion) {
        apiVersion.migrateToVersionId = targetVersion.id;
      }
    }

    const saved = await this.versionRepository.save(apiVersion);

    // Update cache
    this.versionsCache.set(saved.version, saved);

    this.logger.warn(
      `Version ${version} deprecated. Sunset date: ${sunsetDate.toISOString()}`,
    );

    return saved;
  }

  /**
   * Sunset version (remove)
   */
  async sunsetVersion(version: string): Promise<void> {
    const apiVersion = await this.getVersion(version);

    if (!apiVersion) {
      throw new Error(`Version ${version} not found`);
    }

    apiVersion.status = ApiVersionStatus.SUNSET;
    await this.versionRepository.save(apiVersion);

    // Remove from cache
    this.versionsCache.delete(version);

    this.logger.warn(`Version ${version} sunset and removed`);
  }

  /**
   * Check if version is valid
   */
  async isValidVersion(version: string): Promise<boolean> {
    const apiVersion = await this.getVersion(version);
    return apiVersion !== null && apiVersion.status !== ApiVersionStatus.SUNSET;
  }

  /**
   * Get deprecation warning
   */
  async getDeprecationWarning(version: string): Promise<string | null> {
    const apiVersion = await this.getVersion(version);

    if (!apiVersion || !apiVersion.isDeprecated) {
      return null;
    }

    const daysUntilSunset = apiVersion.daysUntilSunset;

    if (daysUntilSunset === null) {
      return `API version ${version} is deprecated. Please upgrade.`;
    }

    if (daysUntilSunset <= 0) {
      return `API version ${version} has been sunset and will be removed soon.`;
    }

    return `API version ${version} is deprecated and will be sunset in ${daysUntilSunset} days. Please upgrade to ${apiVersion.migrateToVersionId || 'latest version'}.`;
  }

  /**
   * Get version changelog
   */
  async getChangelog(version: string): Promise<any[]> {
    const apiVersion = await this.getVersion(version);
    return apiVersion?.changelog || [];
  }

  /**
   * Add changelog entry
   */
  async addChangelogEntry(
    version: string,
    entry: {
      type: 'feature' | 'bugfix' | 'breaking' | 'deprecation';
      description: string;
    },
  ): Promise<ApiVersion> {
    const apiVersion = await this.getVersion(version);

    if (!apiVersion) {
      throw new Error(`Version ${version} not found`);
    }

    const changelog = apiVersion.changelog || [];
    changelog.push({
      date: new Date().toISOString(),
      ...entry,
    });

    apiVersion.changelog = changelog;

    return this.versionRepository.save(apiVersion);
  }

  /**
   * Load versions cache
   */
  private async loadVersionsCache(): Promise<void> {
    const versions = await this.versionRepository.find();

    versions.forEach((version) => {
      this.versionsCache.set(version.version, version);
    });

    this.logger.log(`Loaded ${versions.length} API versions into cache`);
  }
}
