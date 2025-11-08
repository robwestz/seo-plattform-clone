import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { V1Controller } from './v1/v1.controller';
import { V2Controller } from './v2/v2.controller';
import { VersionMiddleware } from './middleware/version.middleware';
import { DeprecationMiddleware } from './middleware/deprecation.middleware';

/**
 * API Module
 * Manages versioned REST API endpoints
 */
@Module({
  controllers: [V1Controller, V2Controller],
  providers: [],
})
export class ApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply version and deprecation middleware to all API routes
    consumer
      .apply(VersionMiddleware, DeprecationMiddleware)
      .forRoutes('api/*');
  }
}
