import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { OAuthConnection, OAuthProvider } from './entities/oauth-connection.entity';
import axios from 'axios';
import { randomBytes } from 'crypto';

/**
 * OAuth Service
 * Generic OAuth2 flow handler supporting multiple providers
 */
@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);
  private readonly stateStore = new Map<string, { userId: string; tenantId: string; provider: string; timestamp: number }>();

  constructor(
    @InjectRepository(OAuthConnection)
    private oauthConnectionRepository: Repository<OAuthConnection>,
    private configService: ConfigService,
  ) {
    // Clean up expired state tokens every hour
    setInterval(() => this.cleanupExpiredStates(), 60 * 60 * 1000);
  }

  /**
   * Get OAuth provider configuration
   */
  private getProviderConfig(provider: OAuthProvider) {
    const configs = {
      [OAuthProvider.GOOGLE]: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        clientId: this.configService.get<string>('GOOGLE_CLIENT_ID'),
        clientSecret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
        scopes: ['email', 'profile'],
      },
      [OAuthProvider.GOOGLE_SEARCH_CONSOLE]: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        clientId: this.configService.get<string>('GOOGLE_CLIENT_ID'),
        clientSecret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
      },
      [OAuthProvider.GOOGLE_ANALYTICS]: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        clientId: this.configService.get<string>('GOOGLE_CLIENT_ID'),
        clientSecret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
        scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
      },
      [OAuthProvider.GOOGLE_ADS]: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        clientId: this.configService.get<string>('GOOGLE_CLIENT_ID'),
        clientSecret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
        scopes: ['https://www.googleapis.com/auth/adwords'],
      },
    };

    return configs[provider];
  }

  /**
   * Generate authorization URL for OAuth flow
   */
  async generateAuthUrl(
    provider: OAuthProvider,
    userId: string,
    tenantId: string,
    redirectUri?: string,
  ): Promise<string> {
    this.logger.log(`Generating auth URL for provider: ${provider}, user: ${userId}`);

    const config = this.getProviderConfig(provider);
    if (!config) {
      throw new BadRequestException(`Unsupported OAuth provider: ${provider}`);
    }

    // Generate and store state token
    const state = randomBytes(32).toString('hex');
    this.stateStore.set(state, {
      userId,
      tenantId,
      provider,
      timestamp: Date.now(),
    });

    const baseRedirectUri = redirectUri || this.configService.get<string>('OAUTH_REDIRECT_URI');

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: `${baseRedirectUri}/${provider}`,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state,
      access_type: 'offline',
      prompt: 'consent',
    });

    return `${config.authUrl}?${params.toString()}`;
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleCallback(
    provider: OAuthProvider,
    code: string,
    state: string,
    redirectUri?: string,
  ): Promise<OAuthConnection> {
    this.logger.log(`Handling OAuth callback for provider: ${provider}`);

    // Validate state token
    const stateData = this.stateStore.get(state);
    if (!stateData) {
      throw new UnauthorizedException('Invalid or expired state token');
    }

    if (stateData.provider !== provider) {
      throw new BadRequestException('Provider mismatch');
    }

    // Clean up state token
    this.stateStore.delete(state);

    const config = this.getProviderConfig(provider);
    if (!config) {
      throw new BadRequestException(`Unsupported OAuth provider: ${provider}`);
    }

    try {
      // Exchange code for tokens
      const baseRedirectUri = redirectUri || this.configService.get<string>('OAUTH_REDIRECT_URI');
      const response = await axios.post(config.tokenUrl, {
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: `${baseRedirectUri}/${provider}`,
        grant_type: 'authorization_code',
      });

      const { access_token, refresh_token, expires_in, scope } = response.data;

      // Calculate expiration date
      const expiresAt = expires_in ? new Date(Date.now() + expires_in * 1000) : null;

      // Save or update OAuth connection
      let connection = await this.oauthConnectionRepository.findOne({
        where: {
          userId: stateData.userId,
          tenantId: stateData.tenantId,
          provider,
        },
      });

      if (connection) {
        connection.accessToken = access_token;
        connection.refreshToken = refresh_token || connection.refreshToken;
        connection.expiresAt = expiresAt;
        connection.scopes = scope ? scope.split(' ') : config.scopes;
        connection.active = true;
      } else {
        connection = this.oauthConnectionRepository.create({
          userId: stateData.userId,
          tenantId: stateData.tenantId,
          provider,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt,
          scopes: scope ? scope.split(' ') : config.scopes,
          active: true,
        });
      }

      await this.oauthConnectionRepository.save(connection);

      this.logger.log(`OAuth connection saved for provider: ${provider}, user: ${stateData.userId}`);

      return connection;
    } catch (error) {
      this.logger.error(`Failed to exchange OAuth code: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to complete OAuth flow');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(connectionId: string): Promise<OAuthConnection> {
    this.logger.log(`Refreshing access token for connection: ${connectionId}`);

    const connection = await this.oauthConnectionRepository.findOne({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new BadRequestException('OAuth connection not found');
    }

    if (!connection.refreshToken) {
      throw new BadRequestException('No refresh token available');
    }

    const config = this.getProviderConfig(connection.provider);
    if (!config) {
      throw new BadRequestException(`Unsupported OAuth provider: ${connection.provider}`);
    }

    try {
      const response = await axios.post(config.tokenUrl, {
        refresh_token: connection.refreshToken,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: 'refresh_token',
      });

      const { access_token, expires_in, refresh_token } = response.data;

      connection.accessToken = access_token;
      if (refresh_token) {
        connection.refreshToken = refresh_token;
      }
      connection.expiresAt = expires_in ? new Date(Date.now() + expires_in * 1000) : null;

      await this.oauthConnectionRepository.save(connection);

      this.logger.log(`Access token refreshed for connection: ${connectionId}`);

      return connection;
    } catch (error) {
      this.logger.error(`Failed to refresh access token: ${error.message}`, error.stack);
      connection.active = false;
      await this.oauthConnectionRepository.save(connection);
      throw new InternalServerErrorException('Failed to refresh access token');
    }
  }

  /**
   * Get active OAuth connection for a user and provider
   */
  async getConnection(
    userId: string,
    tenantId: string,
    provider: OAuthProvider,
  ): Promise<OAuthConnection> {
    const connection = await this.oauthConnectionRepository.findOne({
      where: { userId, tenantId, provider, active: true },
    });

    if (!connection) {
      throw new BadRequestException(`No active ${provider} connection found`);
    }

    // Auto-refresh if needed
    if (connection.needsRefresh() && connection.refreshToken) {
      return this.refreshAccessToken(connection.id);
    }

    return connection;
  }

  /**
   * Disconnect OAuth connection
   */
  async disconnect(userId: string, tenantId: string, provider: OAuthProvider): Promise<void> {
    this.logger.log(`Disconnecting OAuth provider: ${provider}, user: ${userId}`);

    await this.oauthConnectionRepository.update(
      { userId, tenantId, provider },
      { active: false },
    );
  }

  /**
   * Get all active connections for a user
   */
  async getUserConnections(userId: string, tenantId: string): Promise<OAuthConnection[]> {
    return this.oauthConnectionRepository.find({
      where: { userId, tenantId, active: true },
    });
  }

  /**
   * Clean up expired state tokens (older than 1 hour)
   */
  private cleanupExpiredStates(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [state, data] of this.stateStore.entries()) {
      if (data.timestamp < oneHourAgo) {
        this.stateStore.delete(state);
      }
    }
  }
}
