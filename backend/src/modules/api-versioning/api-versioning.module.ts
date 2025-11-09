import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiVersioningService } from './api-versioning.service';
import { VersionInterceptor } from './interceptors/version.interceptor';
import { ApiVersion } from './entities/api-version.entity';

/**
 * API Versioning Module
 * Manages API versions and lifecycle
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ApiVersion])],
  providers: [ApiVersioningService, VersionInterceptor],
  exports: [ApiVersioningService, VersionInterceptor],
})
export class ApiVersioningModule {}
