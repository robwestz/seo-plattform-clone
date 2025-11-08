import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { KeywordService } from './keyword.service';
import { CreateKeywordDto } from './dto/create-keyword.dto';
import { UpdateKeywordDto } from './dto/update-keyword.dto';
import { KeywordQueryDto } from './dto/keyword-query.dto';
import { KeywordResearchDto } from './dto/keyword-research.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

/**
 * Keyword Controller
 * Handles keyword research, tracking, and management
 */
@Controller('projects/:projectId/keywords')
@UseGuards(JwtAuthGuard)
export class KeywordController {
  constructor(private readonly keywordService: KeywordService) {}

  /**
   * Create a new keyword for tracking
   * POST /projects/:projectId/keywords
   */
  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() createKeywordDto: CreateKeywordDto,
  ) {
    return this.keywordService.create(createKeywordDto, projectId);
  }

  /**
   * Get all keywords for a project
   * GET /projects/:projectId/keywords
   */
  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @Query() query: KeywordQueryDto,
  ) {
    return this.keywordService.findAll(projectId, query);
  }

  /**
   * Get keyword statistics
   * GET /projects/:projectId/keywords/statistics
   */
  @Get('statistics')
  getStatistics(@Param('projectId') projectId: string) {
    return this.keywordService.getStatistics(projectId);
  }

  /**
   * Research keywords (get suggestions)
   * POST /projects/:projectId/keywords/research
   */
  @Post('research')
  research(
    @Param('projectId') projectId: string,
    @Body() researchDto: KeywordResearchDto,
  ) {
    return this.keywordService.researchKeywords(
      researchDto.seedKeyword,
      projectId,
      researchDto.limit,
    );
  }

  /**
   * Bulk import keywords
   * POST /projects/:projectId/keywords/bulk-import
   */
  @Post('bulk-import')
  bulkImport(
    @Param('projectId') projectId: string,
    @Body() keywords: CreateKeywordDto[],
  ) {
    return this.keywordService.bulkImport(keywords, projectId);
  }

  /**
   * Get a specific keyword
   * GET /projects/:projectId/keywords/:id
   */
  @Get(':id')
  findOne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.keywordService.findOne(id, projectId);
  }

  /**
   * Update a keyword
   * PATCH /projects/:projectId/keywords/:id
   */
  @Patch(':id')
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateKeywordDto: UpdateKeywordDto,
  ) {
    return this.keywordService.update(id, updateKeywordDto, projectId);
  }

  /**
   * Delete a keyword
   * DELETE /projects/:projectId/keywords/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.keywordService.remove(id, projectId);
  }

  /**
   * Update keyword position
   * PATCH /projects/:projectId/keywords/:id/position
   */
  @Patch(':id/position')
  updatePosition(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body('position') position: number,
  ) {
    return this.keywordService.updatePosition(id, position, projectId);
  }
}
