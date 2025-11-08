import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OAuthService } from '../oauth/oauth.service';
import { OAuthProvider } from '../oauth/entities/oauth-connection.entity';
import { GoogleAdsData, GoogleAdsDataType } from './entities/google-ads-data.entity';
import { KeywordIdeasDto, SearchVolumeDto } from './dto/google-ads-query.dto';
import axios from 'axios';

/**
 * Google Ads Service
 * Handles integration with Google Ads API for keyword planner and search volume data
 */
@Injectable()
export class GoogleAdsService {
  private readonly logger = new Logger(GoogleAdsService.name);
  private readonly GOOGLE_ADS_API_BASE = 'https://googleads.googleapis.com/v15';

  constructor(
    @InjectRepository(GoogleAdsData)
    private googleAdsDataRepository: Repository<GoogleAdsData>,
    private oauthService: OAuthService,
  ) {}

  /**
   * Get authenticated API client
   */
  private async getAuthenticatedClient(userId: string, tenantId: string) {
    const connection = await this.oauthService.getConnection(
      userId,
      tenantId,
      OAuthProvider.GOOGLE_ADS,
    );

    return axios.create({
      baseURL: this.GOOGLE_ADS_API_BASE,
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        'Content-Type': 'application/json',
        'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
      },
    });
  }

  /**
   * Get keyword ideas from Google Ads Keyword Planner
   */
  async getKeywordIdeas(
    userId: string,
    tenantId: string,
    projectId: string,
    query: KeywordIdeasDto,
  ) {
    this.logger.log(`Getting keyword ideas for customer: ${query.customerId}`);

    try {
      const client = await this.getAuthenticatedClient(userId, tenantId);

      const requestBody = {
        keywordPlanIdeaService: {
          generateKeywordIdeas: {
            customerId: query.customerId,
            language: query.languageCode,
            geoTargetConstants: query.locationIds.map(id => `geoTargetConstants/${id}`),
            includeAdultKeywords: false,
            pageSize: query.pageSize || 100,
            ...(query.keywords && { keywordSeed: { keywords: query.keywords } }),
            ...(query.url && { urlSeed: { url: query.url } }),
          },
        },
      };

      const response = await client.post(
        `/customers/${query.customerId}/googleAds:searchStream`,
        {
          query: `
            SELECT
              keyword_plan_idea.text,
              keyword_plan_idea.keyword_idea_metrics.avg_monthly_searches,
              keyword_plan_idea.keyword_idea_metrics.competition,
              keyword_plan_idea.keyword_idea_metrics.competition_index,
              keyword_plan_idea.keyword_idea_metrics.low_top_of_page_bid_micros,
              keyword_plan_idea.keyword_idea_metrics.high_top_of_page_bid_micros
            FROM keyword_plan_idea
          `,
        },
      );

      const results = response.data.results || [];

      // Store keyword ideas in database
      const keywordIdeasData = results.map(result => {
        const idea = result.keywordPlanIdea;
        const metrics = idea.keywordIdeaMetrics;

        return this.googleAdsDataRepository.create({
          tenantId,
          projectId,
          dataType: GoogleAdsDataType.KEYWORD_IDEAS,
          keyword: idea.text,
          avgMonthlySearches: metrics.avgMonthlySearches || 0,
          lowTopOfPageBid: (metrics.lowTopOfPageBidMicros || 0) / 1000000,
          highTopOfPageBid: (metrics.highTopOfPageBidMicros || 0) / 1000000,
          competition: metrics.competition || 'UNKNOWN',
          competitionIndex: metrics.competitionIndex || null,
          monthlySearchVolumes: metrics.monthlySearchVolumes || [],
          keywordAnnotations: idea.keywordAnnotations || {},
        });
      });

      if (keywordIdeasData.length > 0) {
        await this.googleAdsDataRepository
          .createQueryBuilder()
          .insert()
          .into(GoogleAdsData)
          .values(keywordIdeasData)
          .orUpdate(
            ['avgMonthlySearches', 'lowTopOfPageBid', 'highTopOfPageBid', 'competition', 'competitionIndex', 'updatedAt'],
            ['tenantId', 'projectId', 'keyword', 'dataType'],
          )
          .execute();
      }

      this.logger.log(`Stored ${keywordIdeasData.length} keyword ideas`);

      return {
        totalIdeas: results.length,
        ideas: results,
      };
    } catch (error) {
      this.logger.error(`Failed to get keyword ideas: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get keyword ideas');
    }
  }

  /**
   * Get search volume and forecasts for specific keywords
   */
  async getSearchVolume(
    userId: string,
    tenantId: string,
    projectId: string,
    query: SearchVolumeDto,
  ) {
    this.logger.log(`Getting search volume for ${query.keywords.length} keywords`);

    try {
      const client = await this.getAuthenticatedClient(userId, tenantId);

      const response = await client.post(
        `/customers/${query.customerId}/googleAds:searchStream`,
        {
          query: `
            SELECT
              keyword_view.resource_name,
              metrics.impressions,
              metrics.clicks,
              metrics.cost_micros,
              metrics.average_cpc
            FROM keyword_view
            WHERE segments.date DURING LAST_30_DAYS
          `,
        },
      );

      const results = response.data.results || [];

      // Store search volume data
      const searchVolumeData = query.keywords.map(keyword => {
        const matchingResult = results.find(r => r.keywordView?.resourceName?.includes(keyword));
        const metrics = matchingResult?.metrics || {};

        return this.googleAdsDataRepository.create({
          tenantId,
          projectId,
          dataType: GoogleAdsDataType.SEARCH_VOLUME,
          keyword,
          avgMonthlySearches: metrics.impressions || 0,
          avgCpc: (metrics.averageCpc || 0) / 1000000,
          metadata: {
            clicks: metrics.clicks || 0,
            cost: (metrics.costMicros || 0) / 1000000,
          },
        });
      });

      if (searchVolumeData.length > 0) {
        await this.googleAdsDataRepository.save(searchVolumeData);
      }

      this.logger.log(`Stored search volume for ${searchVolumeData.length} keywords`);

      return {
        totalKeywords: query.keywords.length,
        data: results,
      };
    } catch (error) {
      this.logger.error(`Failed to get search volume: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get search volume');
    }
  }

  /**
   * Get CPC data for keywords
   */
  async getCpcData(
    userId: string,
    tenantId: string,
    projectId: string,
    customerId: string,
  ) {
    this.logger.log(`Getting CPC data for customer: ${customerId}`);

    try {
      const client = await this.getAuthenticatedClient(userId, tenantId);

      const response = await client.post(
        `/customers/${customerId}/googleAds:searchStream`,
        {
          query: `
            SELECT
              ad_group_criterion.keyword.text,
              metrics.average_cpc,
              metrics.cost_micros,
              ad_group_criterion.cpc_bid_micros
            FROM keyword_view
            WHERE segments.date DURING LAST_30_DAYS
          `,
        },
      );

      const results = response.data.results || [];

      return {
        totalKeywords: results.length,
        data: results,
      };
    } catch (error) {
      this.logger.error(`Failed to get CPC data: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get CPC data');
    }
  }

  /**
   * Get stored keyword ideas
   */
  async getStoredKeywordIdeas(tenantId: string, projectId: string, limit: number = 100) {
    return this.googleAdsDataRepository.find({
      where: {
        tenantId,
        projectId,
        dataType: GoogleAdsDataType.KEYWORD_IDEAS,
      },
      order: {
        avgMonthlySearches: 'DESC',
      },
      take: limit,
    });
  }

  /**
   * Get keywords with highest search volume
   */
  async getHighVolumeKeywords(tenantId: string, projectId: string, limit: number = 10) {
    return this.googleAdsDataRepository.find({
      where: {
        tenantId,
        projectId,
      },
      order: {
        avgMonthlySearches: 'DESC',
      },
      take: limit,
    });
  }

  /**
   * Get keywords with best CPC (lowest cost)
   */
  async getBestCpcKeywords(tenantId: string, projectId: string, limit: number = 10) {
    return this.googleAdsDataRepository
      .createQueryBuilder('ads')
      .where('ads.tenantId = :tenantId', { tenantId })
      .andWhere('ads.projectId = :projectId', { projectId })
      .andWhere('ads.avgCpc > 0')
      .orderBy('ads.avgCpc', 'ASC')
      .addOrderBy('ads.avgMonthlySearches', 'DESC')
      .limit(limit)
      .getMany();
  }
}
