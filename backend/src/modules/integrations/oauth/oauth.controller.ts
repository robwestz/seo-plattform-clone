import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  UseGuards,
  Param,
  Redirect,
  Logger,
} from '@nestjs/common';
import { OAuthService } from './oauth.service';
import { OAuthProvider } from './entities/oauth-connection.entity';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { OAuthCallbackDto, OAuthInitiateDto, OAuthDisconnectDto } from './dto/oauth-callback.dto';

/**
 * OAuth Controller
 * Handles OAuth2 flow endpoints for external service integrations
 */
@Controller('integrations/oauth')
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);

  constructor(private readonly oauthService: OAuthService) {}

  /**
   * Initiate OAuth flow
   * GET /integrations/oauth/authorize/:provider
   */
  @Get('authorize/:provider')
  @Redirect()
  async authorize(
    @Param('provider') provider: string,
    @CurrentUser('id') userId: string,
    @CurrentTenant('id') tenantId: string,
    @Query('redirect_uri') redirectUri?: string,
  ) {
    this.logger.log(`OAuth authorization initiated for provider: ${provider}`);

    const authUrl = await this.oauthService.generateAuthUrl(
      provider as OAuthProvider,
      userId,
      tenantId,
      redirectUri,
    );

    return { url: authUrl };
  }

  /**
   * Handle OAuth callback
   * GET /integrations/oauth/callback/:provider
   */
  @Get('callback/:provider')
  async callback(
    @Param('provider') provider: string,
    @Query() query: OAuthCallbackDto,
  ) {
    this.logger.log(`OAuth callback received for provider: ${provider}`);

    if (query.error) {
      this.logger.error(`OAuth error: ${query.error} - ${query.error_description}`);
      return {
        success: false,
        error: query.error,
        error_description: query.error_description,
      };
    }

    const connection = await this.oauthService.handleCallback(
      provider as OAuthProvider,
      query.code,
      query.state,
    );

    return {
      success: true,
      provider,
      connectionId: connection.id,
      message: 'Successfully connected to ' + provider,
    };
  }

  /**
   * Get all active OAuth connections
   * GET /integrations/oauth/connections
   */
  @Get('connections')
  async getConnections(
    @CurrentUser('id') userId: string,
    @CurrentTenant('id') tenantId: string,
  ) {
    const connections = await this.oauthService.getUserConnections(userId, tenantId);

    return {
      connections: connections.map(conn => ({
        id: conn.id,
        provider: conn.provider,
        scopes: conn.scopes,
        expiresAt: conn.expiresAt,
        createdAt: conn.createdAt,
      })),
    };
  }

  /**
   * Disconnect OAuth connection
   * DELETE /integrations/oauth/disconnect/:provider
   */
  @Delete('disconnect/:provider')
  async disconnect(
    @Param('provider') provider: string,
    @CurrentUser('id') userId: string,
    @CurrentTenant('id') tenantId: string,
  ) {
    this.logger.log(`Disconnecting OAuth provider: ${provider}`);

    await this.oauthService.disconnect(userId, tenantId, provider as OAuthProvider);

    return {
      success: true,
      message: `Disconnected from ${provider}`,
    };
  }

  /**
   * Refresh OAuth token manually
   * POST /integrations/oauth/refresh/:connectionId
   */
  @Post('refresh/:connectionId')
  async refreshToken(@Param('connectionId') connectionId: string) {
    this.logger.log(`Manual token refresh for connection: ${connectionId}`);

    const connection = await this.oauthService.refreshAccessToken(connectionId);

    return {
      success: true,
      expiresAt: connection.expiresAt,
      message: 'Token refreshed successfully',
    };
  }
}
