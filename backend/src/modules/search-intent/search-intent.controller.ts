import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SearchIntentClassifierService } from './search-intent-classifier.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ClassifyIntentDto,
  ClassifyBatchDto,
  TrainModelDto,
  VerifyClassificationDto,
} from './dto/classify-intent.dto';
import { IntentType } from './entities/intent-classification.entity';

/**
 * Search Intent Controller
 * Provides ML-powered search intent classification
 */
@ApiTags('search-intent')
@Controller('projects/:projectId/search-intent')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchIntentController {
  constructor(private readonly classifier: SearchIntentClassifierService) {}

  /**
   * Classify keyword intent
   */
  @Post('classify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Classify keyword intent',
    description: 'Use ML to classify search intent of a keyword',
  })
  @ApiResponse({ status: 200, description: 'Intent classified' })
  async classifyIntent(@Param('projectId') projectId: string, @Body() dto: ClassifyIntentDto) {
    return this.classifier.classifyIntent(projectId, dto.keyword, {
      searchVolume: dto.searchVolume,
      serpSignals: dto.serpSignals,
      useCache: dto.useCache,
    });
  }

  /**
   * Classify multiple keywords in batch
   */
  @Post('classify-batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Batch classify keywords',
    description: 'Classify intent for multiple keywords at once',
  })
  @ApiResponse({ status: 200, description: 'Keywords classified' })
  async classifyBatch(@Param('projectId') projectId: string, @Body() dto: ClassifyBatchDto) {
    return this.classifier.classifyBatch(
      projectId,
      dto.keywords.map((kw) => ({
        keyword: kw.keyword,
        searchVolume: kw.searchVolume,
        serpSignals: kw.serpSignals,
      })),
    );
  }

  /**
   * Get intent distribution for project
   */
  @Get('distribution')
  @ApiOperation({
    summary: 'Get intent distribution',
    description: 'Get distribution of search intents across project keywords',
  })
  @ApiResponse({ status: 200, description: 'Intent distribution retrieved' })
  async getIntentDistribution(@Param('projectId') projectId: string) {
    return this.classifier.getIntentDistribution(projectId);
  }

  /**
   * Get keywords by intent
   */
  @Get('by-intent/:intent')
  @ApiOperation({
    summary: 'Get keywords by intent',
    description: 'Get all keywords classified with specific intent',
  })
  @ApiResponse({ status: 200, description: 'Keywords retrieved' })
  async getByIntent(@Param('projectId') projectId: string, @Param('intent') intent: IntentType) {
    return this.classifier.getByIntent(projectId, intent);
  }

  /**
   * Get low-confidence classifications needing review
   */
  @Get('needs-review')
  @ApiOperation({
    summary: 'Get classifications needing review',
    description: 'Get low-confidence classifications that need manual verification',
  })
  @ApiResponse({ status: 200, description: 'Classifications retrieved' })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 50 })
  async getNeedsReview(
    @Param('projectId') projectId: string,
    @Query('limit') limit?: number,
  ) {
    return this.classifier.getLowConfidenceClassifications(projectId, limit);
  }

  /**
   * Verify classification manually
   */
  @Patch('classifications/:classificationId/verify')
  @ApiOperation({
    summary: 'Verify classification',
    description: 'Manually verify and correct a classification',
  })
  @ApiResponse({ status: 200, description: 'Classification verified' })
  async verifyClassification(
    @Param('classificationId') classificationId: string,
    @Body() dto: VerifyClassificationDto,
  ) {
    return this.classifier.verifyClassification(
      classificationId,
      dto.correctIntent,
      dto.verifiedBy,
    );
  }

  /**
   * Train model with labeled data
   */
  @Post('train')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Train classification model',
    description: 'Train the ML model with labeled training data',
  })
  @ApiResponse({ status: 200, description: 'Model trained successfully' })
  async trainModel(@Body() dto: TrainModelDto) {
    return this.classifier.trainModel(dto.trainingData);
  }

  /**
   * Get informational keywords
   */
  @Get('informational')
  @ApiOperation({ summary: 'Get informational keywords' })
  @ApiResponse({ status: 200, description: 'Informational keywords retrieved' })
  async getInformationalKeywords(@Param('projectId') projectId: string) {
    return this.classifier.getByIntent(projectId, IntentType.INFORMATIONAL);
  }

  /**
   * Get transactional keywords
   */
  @Get('transactional')
  @ApiOperation({ summary: 'Get transactional keywords' })
  @ApiResponse({ status: 200, description: 'Transactional keywords retrieved' })
  async getTransactionalKeywords(@Param('projectId') projectId: string) {
    return this.classifier.getByIntent(projectId, IntentType.TRANSACTIONAL);
  }

  /**
   * Get commercial keywords
   */
  @Get('commercial')
  @ApiOperation({ summary: 'Get commercial keywords' })
  @ApiResponse({ status: 200, description: 'Commercial keywords retrieved' })
  async getCommercialKeywords(@Param('projectId') projectId: string) {
    return this.classifier.getByIntent(projectId, IntentType.COMMERCIAL);
  }

  /**
   * Get navigational keywords
   */
  @Get('navigational')
  @ApiOperation({ summary: 'Get navigational keywords' })
  @ApiResponse({ status: 200, description: 'Navigational keywords retrieved' })
  async getNavigationalKeywords(@Param('projectId') projectId: string) {
    return this.classifier.getByIntent(projectId, IntentType.NAVIGATIONAL);
  }
}
