import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DataForSeoClient } from './dataforseo-client.service';
import { SemrushClient } from './semrush-client.service';
import { AhrefsClient } from './ahrefs-client.service';
import { ApiIntegrationsService } from './api-integrations.service';

/**
 * API Integrations Module
 * Provides unified access to DataForSEO, SEMrush, and Ahrefs APIs
 */
@Module({
  imports: [ConfigModule],
  providers: [
    DataForSeoClient,
    SemrushClient,
    AhrefsClient,
    ApiIntegrationsService,
  ],
  exports: [
    DataForSeoClient,
    SemrushClient,
    AhrefsClient,
    ApiIntegrationsService,
  ],
})
export class ApiIntegrationsModule {}
