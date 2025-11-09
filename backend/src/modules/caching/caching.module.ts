import { Module, Global } from '@nestjs/common';
import { CacheStrategyService } from './cache-strategy.service';
import { CacheInterceptor } from './interceptors/cache.interceptor';

/**
 * Caching Module
 * Advanced caching with multiple strategies
 */
@Global()
@Module({
  providers: [CacheStrategyService, CacheInterceptor],
  exports: [CacheStrategyService, CacheInterceptor],
})
export class CachingModule {}
