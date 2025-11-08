import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleAnalyticsController } from './google-analytics.controller';
import { GoogleAnalyticsService } from './google-analytics.service';
import { GAData } from './entities/ga-data.entity';
import { OAuthModule } from '../oauth/oauth.module';

@Module({
  imports: [TypeOrmModule.forFeature([GAData]), OAuthModule],
  controllers: [GoogleAnalyticsController],
  providers: [GoogleAnalyticsService],
  exports: [GoogleAnalyticsService],
})
export class GoogleAnalyticsModule {}
