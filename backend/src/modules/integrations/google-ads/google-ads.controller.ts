import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { GoogleAdsService } from './google-ads.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { KeywordIdeasDto, SearchVolumeDto } from './dto/google-ads-query.dto';

/**
 * Google Ads Controller
 * API endpoints for Google Ads integration
 */
@Controller('integrations/google-ads')
export class GoogleAdsController {
  private readonly logger = new Logger(GoogleAdsController.name);

  constructor(private readonly googleAdsService: GoogleAdsService) {}

  /**
   * Get keyword ideas
   * POST /integrations/google-ads/keyword-ideas
   */
  @Post('keyword-ideas')
  async getKeywordIdeas(
    @CurrentUser('id') userId: string,
    @CurrentTenant('id') tenantId: string,
    @Body() query: KeywordIdeasDto & { projectId: string },
  ) {
    this.logger.log('Getting keyword ideas from Google Ads');

    const result = await this.googleAdsService.getKeywordIdeas(
      userId,
      tenantId,
      query.projectId,
      query,
    );

    return {
      success: true,
      ...result,
    };
  }

  /**
   * Get search volume
   * POST /integrations/google-ads/search-volume
   */
  @Post('search-volume')
  async getSearchVolume(
    @CurrentUser('id') userId: string,
    @CurrentTenant('id') tenantId: string,
    @Body() query: SearchVolumeDto & { projectId: string },
  ) {
    this.logger.log('Getting search volume from Google Ads');

    const result = await this.googleAdsService.getSearchVolume(
      userId,
      tenantId,
      query.projectId,
      query,
    );

    return {
      success: true,
      ...result,
    };
  }

  /**
   * Get CPC data
   * POST /integrations/google-ads/cpc-data
   */
  @Post('cpc-data')
  async getCpcData(
    @CurrentUser('id') userId: string,
    @CurrentTenant('id') tenantId: string,
    @Body() body: { customerId: string; projectId: string },
  ) {
    this.logger.log('Getting CPC data from Google Ads');

    const result = await this.googleAdsService.getCpcData(
      userId,
      tenantId,
      body.projectId,
      body.customerId,
    );

    return {
      success: true,
      ...result,
    };
  }

  /**
   * Get stored keyword ideas
   * GET /integrations/google-ads/keyword-ideas/stored
   */
  @Get('keyword-ideas/stored')
  async getStoredKeywordIdeas(
    @CurrentTenant('id') tenantId: string,
    @Query('projectId') projectId: string,
    @Query('limit') limit?: number,
  ) {
    this.logger.log('Getting stored keyword ideas');

    const ideas = await this.googleAdsService.getStoredKeywordIdeas(
      tenantId,
      projectId,
      limit ? parseInt(limit.toString()) : 100,
    );

    return {
      success: true,
      ideas,
    };
  }

  /**
   * Get high volume keywords
   * GET /integrations/google-ads/keywords/high-volume
   */
  @Get('keywords/high-volume')
  async getHighVolumeKeywords(
    @CurrentTenant('id') tenantId: string,
    @Query('projectId') projectId: string,
    @Query('limit') limit?: number,
  ) {
    this.logger.log('Getting high volume keywords');

    const keywords = await this.googleAdsService.getHighVolumeKeywords(
      tenantId,
      projectId,
      limit ? parseInt(limit.toString()) : 10,
    );

    return {
      success: true,
      keywords,
    };
  }

  /**
   * Get best CPC keywords
   * GET /integrations/google-ads/keywords/best-cpc
   */
  @Get('keywords/best-cpc')
  async getBestCpcKeywords(
    @CurrentTenant('id') tenantId: string,
    @Query('projectId') projectId: string,
    @Query('limit') limit?: number,
  ) {
    this.logger.log('Getting best CPC keywords');

    const keywords = await this.googleAdsService.getBestCpcKeywords(
      tenantId,
      projectId,
      limit ? parseInt(limit.toString()) : 10,
    );

    return {
      success: true,
      keywords,
    };
  }
}
