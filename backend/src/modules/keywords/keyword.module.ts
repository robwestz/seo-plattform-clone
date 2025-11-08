import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeywordService } from './keyword.service';
import { KeywordController } from './keyword.controller';
import { Keyword } from './entities/keyword.entity';
import { Project } from '../../database/entities/project.entity';
import { KeywordDifficultyCalculator } from './keyword-difficulty.calculator';
import { SuggestionService } from './suggestion.service';

/**
 * Keyword Module
 * Provides keyword research and tracking functionality
 */
@Module({
  imports: [TypeOrmModule.forFeature([Keyword, Project])],
  controllers: [KeywordController],
  providers: [KeywordService, KeywordDifficultyCalculator, SuggestionService],
  exports: [KeywordService, KeywordDifficultyCalculator, SuggestionService],
})
export class KeywordModule {}
