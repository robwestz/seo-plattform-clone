import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OAuthService } from './oauth.service';
import { OAuthConnection, OAuthProvider } from './entities/oauth-connection.entity';
import { OAuthHealthCheck } from './entities/oauth-health-check.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import axios from 'axios';

/**
 * OAuth Manager Service
 * Handles automatic token refresh, health monitoring, and connection lifecycle
 */
@Injectable()
export class OAuthManagerService {
  private readonly logger = new Logger(OAuthManagerService.name);
  private refreshInProgress = new Map<string, boolean>();

  constructor(
    @InjectRepository(OAuthConnection)
    private connectionRepository: Repository<OAuthConnection>,
    @InjectRepository(OAuthHealthCheck)
    private healthCheckRepository: Repository<OAuthHealthCheck>,
    private oauthService: OAuthService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Automatically refresh tokens that will expire soon
   * Runs every 30 minutes
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async autoRefreshTokens() {
    this.logger.log('Starting automatic token refresh');

    // Find connections expiring in next hour
    const expiringIn = new Date(Date.now() + 60 * 60 * 1000);

    const expiringConnections = await this.connectionRepository.find({
      where: {
        expiresAt: LessThan(expiringIn),
        isActive: true,
      },
    });

    this.logger.log(`Found ${expiringConnections.length} connections to refresh`);

    const refreshPromises = expiringConnections.map(connection =>
      this.refreshTokenIfNeeded(connection).catch(error => {
        this.logger.error(
          `Failed to refresh token for connection ${connection.id}: ${error.message}`,
        );
      }),
    );

    await Promise.allSettled(refreshPromises);
    this.logger.log('Completed automatic token refresh');
  }

  /**
   * Refresh token if needed
   */
  async refreshTokenIfNeeded(
    connection: OAuthConnection,
  ): Promise<OAuthConnection> {
    const refreshKey = connection.id;

    // Prevent concurrent refreshes for same connection
    if (this.refreshInProgress.get(refreshKey)) {
      this.logger.debug(`Refresh already in progress for ${connection.id}`);
      return connection;
    }

    // Check if token needs refresh (expires in < 5 minutes)
    const needsRefresh =
      connection.expiresAt &&
      connection.expiresAt.getTime() - Date.now() < 5 * 60 * 1000;

    if (!needsRefresh) {
      return connection;
    }

    this.refreshInProgress.set(refreshKey, true);

    try {
      this.logger.log(`Refreshing token for connection ${connection.id}`);

      const newTokens = await this.oauthService.refreshAccessToken(
        connection.refreshToken,
        connection.provider,
      );

      connection.accessToken = newTokens.accessToken;
      if (newTokens.refreshToken) {
        connection.refreshToken = newTokens.refreshToken;
      }
      connection.expiresAt = new Date(Date.now() + newTokens.expiresIn * 1000);
      connection.lastRefreshedAt = new Date();

      await this.connectionRepository.save(connection);

      // Emit event
      this.eventEmitter.emit('oauth.token.refreshed', {
        connectionId: connection.id,
        provider: connection.provider,
        tenantId: connection.tenantId,
      });

      this.logger.log(`Successfully refreshed token for ${connection.id}`);

      return connection;
    } catch (error) {
      this.logger.error(
        `Failed to refresh token for ${connection.id}: ${error.message}`,
      );

      // Mark connection as unhealthy
      await this.recordHealthCheck(connection.id, false, error.message);

      throw error;
    } finally {
      this.refreshInProgress.delete(refreshKey);
    }
  }

  /**
   * Health check all active connections
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async healthCheckAllConnections() {
    this.logger.log('Starting health check for all OAuth connections');

    const activeConnections = await this.connectionRepository.find({
      where: { isActive: true },
    });

    const healthChecks = activeConnections.map(connection =>
      this.performHealthCheck(connection).catch(error => {
        this.logger.error(
          `Health check failed for ${connection.id}: ${error.message}`,
        );
      }),
    );

    await Promise.allSettled(healthChecks);
    this.logger.log('Completed OAuth health checks');
  }

  /**
   * Perform health check on a connection
   */
  async performHealthCheck(connection: OAuthConnection): Promise<boolean> {
    this.logger.debug(`Performing health check for connection ${connection.id}`);

    try {
      // First, ensure token is fresh
      const freshConnection = await this.refreshTokenIfNeeded(connection);

      // Test the connection with a simple API call
      const isHealthy = await this.testConnectionHealth(
        freshConnection.provider,
        freshConnection.accessToken,
      );

      await this.recordHealthCheck(connection.id, isHealthy);

      if (!isHealthy) {
        this.logger.warn(`Connection ${connection.id} failed health check`);

        // Emit unhealthy event
        this.eventEmitter.emit('oauth.connection.unhealthy', {
          connectionId: connection.id,
          provider: connection.provider,
          tenantId: connection.tenantId,
        });
      }

      return isHealthy;
    } catch (error) {
      await this.recordHealthCheck(connection.id, false, error.message);
      return false;
    }
  }

  /**
   * Test connection health with API call
   */
  private async testConnectionHealth(
    provider: OAuthProvider,
    accessToken: string,
  ): Promise<boolean> {
    const testEndpoints = {
      [OAuthProvider.GOOGLE]: 'https://www.googleapis.com/oauth2/v1/userinfo',
      [OAuthProvider.GOOGLE_SEARCH_CONSOLE]:
        'https://www.googleapis.com/webmasters/v3/sites',
      [OAuthProvider.GOOGLE_ANALYTICS]:
        'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
      [OAuthProvider.GOOGLE_ADS]:
        'https://googleads.googleapis.com/v14/customers:listAccessibleCustomers',
    };

    const endpoint = testEndpoints[provider];
    if (!endpoint) {
      this.logger.warn(`No health check endpoint for provider: ${provider}`);
      return true; // Assume healthy if no test endpoint
    }

    try {
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 5000,
      });

      return response.status >= 200 && response.status < 300;
    } catch (error) {
      if (error.response?.status === 401) {
        return false; // Unauthorized = unhealthy
      }

      // Other errors might be temporary
      this.logger.warn(
        `Health check request failed but may be temporary: ${error.message}`,
      );
      return true;
    }
  }

  /**
   * Record health check result
   */
  private async recordHealthCheck(
    connectionId: string,
    isHealthy: boolean,
    errorMessage?: string,
  ): Promise<void> {
    const healthCheck = this.healthCheckRepository.create({
      connectionId,
      isHealthy,
      errorMessage,
      checkedAt: new Date(),
    });

    await this.healthCheckRepository.save(healthCheck);

    // Update connection health status
    await this.connectionRepository.update(connectionId, {
      isHealthy,
      lastHealthCheckAt: new Date(),
    });
  }

  /**
   * Get health history for a connection
   */
  async getHealthHistory(
    connectionId: string,
    limit: number = 50,
  ): Promise<OAuthHealthCheck[]> {
    return this.healthCheckRepository.find({
      where: { connectionId },
      order: { checkedAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get connection health statistics
   */
  async getHealthStatistics(connectionId: string): Promise<{
    totalChecks: number;
    healthyChecks: number;
    unhealthyChecks: number;
    uptimePercentage: number;
    lastHealthyCheck: Date | null;
    lastUnhealthyCheck: Date | null;
  }> {
    const checks = await this.healthCheckRepository.find({
      where: { connectionId },
      order: { checkedAt: 'DESC' },
    });

    const totalChecks = checks.length;
    const healthyChecks = checks.filter(c => c.isHealthy).length;
    const unhealthyChecks = totalChecks - healthyChecks;

    const uptimePercentage =
      totalChecks > 0 ? (healthyChecks / totalChecks) * 100 : 100;

    const lastHealthy = checks.find(c => c.isHealthy);
    const lastUnhealthy = checks.find(c => !c.isHealthy);

    return {
      totalChecks,
      healthyChecks,
      unhealthyChecks,
      uptimePercentage,
      lastHealthyCheck: lastHealthy?.checkedAt || null,
      lastUnhealthyCheck: lastUnhealthy?.checkedAt || null,
    };
  }

  /**
   * Revoke OAuth connection
   */
  async revokeConnection(connectionId: string): Promise<void> {
    const connection = await this.connectionRepository.findOne({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    this.logger.log(`Revoking connection ${connectionId}`);

    try {
      // Attempt to revoke token with provider
      await this.revokeTokenWithProvider(
        connection.provider,
        connection.accessToken,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to revoke token with provider: ${error.message}. Proceeding with local deletion.`,
      );
    }

    // Delete connection
    await this.connectionRepository.delete(connectionId);

    // Delete health checks
    await this.healthCheckRepository.delete({ connectionId });

    // Emit event
    this.eventEmitter.emit('oauth.connection.revoked', {
      connectionId,
      provider: connection.provider,
      tenantId: connection.tenantId,
    });

    this.logger.log(`Successfully revoked connection ${connectionId}`);
  }

  /**
   * Revoke token with OAuth provider
   */
  private async revokeTokenWithProvider(
    provider: OAuthProvider,
    token: string,
  ): Promise<void> {
    const revokeUrls = {
      [OAuthProvider.GOOGLE]: 'https://oauth2.googleapis.com/revoke',
      [OAuthProvider.GOOGLE_SEARCH_CONSOLE]:
        'https://oauth2.googleapis.com/revoke',
      [OAuthProvider.GOOGLE_ANALYTICS]:
        'https://oauth2.googleapis.com/revoke',
      [OAuthProvider.GOOGLE_ADS]: 'https://oauth2.googleapis.com/revoke',
    };

    const revokeUrl = revokeUrls[provider];
    if (!revokeUrl) {
      this.logger.warn(`No revoke URL for provider: ${provider}`);
      return;
    }

    await axios.post(revokeUrl, null, {
      params: { token },
      timeout: 5000,
    });
  }

  /**
   * Get all connections for a tenant
   */
  async getTenantConnections(tenantId: string): Promise<
    Array<{
      id: string;
      provider: string;
      userId: string;
      isActive: boolean;
      isHealthy: boolean;
      expiresAt: Date;
      lastHealthCheckAt: Date;
      createdAt: Date;
    }>
  > {
    const connections = await this.connectionRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });

    return connections.map(c => ({
      id: c.id,
      provider: c.provider,
      userId: c.userId,
      isActive: c.isActive,
      isHealthy: c.isHealthy,
      expiresAt: c.expiresAt,
      lastHealthCheckAt: c.lastHealthCheckAt,
      createdAt: c.createdAt,
    }));
  }

  /**
   * Get connection status summary for tenant
   */
  async getConnectionsSummary(tenantId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    healthy: number;
    unhealthy: number;
    expiringIn24Hours: number;
    byProvider: {
      [provider: string]: {
        total: number;
        healthy: number;
      };
    };
  }> {
    const connections = await this.connectionRepository.find({
      where: { tenantId },
    });

    const now = Date.now();
    const in24Hours = now + 24 * 60 * 60 * 1000;

    const summary = {
      total: connections.length,
      active: connections.filter(c => c.isActive).length,
      inactive: connections.filter(c => !c.isActive).length,
      healthy: connections.filter(c => c.isHealthy).length,
      unhealthy: connections.filter(c => !c.isHealthy).length,
      expiringIn24Hours: connections.filter(
        c => c.expiresAt && c.expiresAt.getTime() < in24Hours,
      ).length,
      byProvider: {} as any,
    };

    connections.forEach(c => {
      if (!summary.byProvider[c.provider]) {
        summary.byProvider[c.provider] = { total: 0, healthy: 0 };
      }

      summary.byProvider[c.provider].total++;
      if (c.isHealthy) {
        summary.byProvider[c.provider].healthy++;
      }
    });

    return summary;
  }

  /**
   * Manually trigger health check for specific connection
   */
  async triggerHealthCheck(connectionId: string): Promise<boolean> {
    const connection = await this.connectionRepository.findOne({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    return this.performHealthCheck(connection);
  }

  /**
   * Get connections that need attention
   */
  async getConnectionsNeedingAttention(tenantId: string): Promise<
    Array<{
      connection: OAuthConnection;
      issues: string[];
      severity: 'low' | 'medium' | 'high';
    }>
  > {
    const connections = await this.connectionRepository.find({
      where: { tenantId, isActive: true },
    });

    const now = Date.now();
    const connectionsWithIssues = [];

    for (const connection of connections) {
      const issues: string[] = [];
      let severity: 'low' | 'medium' | 'high' = 'low';

      // Check if unhealthy
      if (!connection.isHealthy) {
        issues.push('Connection is unhealthy');
        severity = 'high';
      }

      // Check if expiring soon
      if (connection.expiresAt) {
        const expiresIn = connection.expiresAt.getTime() - now;
        const hoursUntilExpiry = expiresIn / (60 * 60 * 1000);

        if (hoursUntilExpiry < 1) {
          issues.push('Expires in less than 1 hour');
          severity = 'high';
        } else if (hoursUntilExpiry < 24) {
          issues.push('Expires in less than 24 hours');
          if (severity !== 'high') severity = 'medium';
        }
      }

      // Check if refresh token is missing
      if (!connection.refreshToken) {
        issues.push('No refresh token available');
        if (severity === 'low') severity = 'medium';
      }

      if (issues.length > 0) {
        connectionsWithIssues.push({
          connection,
          issues,
          severity,
        });
      }
    }

    return connectionsWithIssues.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }
}
