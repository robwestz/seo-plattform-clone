import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleAdsController } from './google-ads.controller';
import { GoogleAdsService } from './google-ads.service';
import { GoogleAdsData } from './entities/google-ads-data.entity';
import { OAuthModule } from '../oauth/oauth.module';

@Module({
  imports: [TypeOrmModule.forFeature([GoogleAdsData]), OAuthModule],
  controllers: [GoogleAdsController],
  providers: [GoogleAdsService],
  exports: [GoogleAdsService],
})
export class GoogleAdsModule {}
