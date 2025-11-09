import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchIntentClassifierService } from './search-intent-classifier.service';
import { SearchIntentController } from './search-intent.controller';
import { IntentClassification } from './entities/intent-classification.entity';

/**
 * Search Intent Module
 * Provides ML-powered search intent classification
 */
@Module({
  imports: [TypeOrmModule.forFeature([IntentClassification])],
  controllers: [SearchIntentController],
  providers: [SearchIntentClassifierService],
  exports: [SearchIntentClassifierService],
})
export class SearchIntentModule {}
