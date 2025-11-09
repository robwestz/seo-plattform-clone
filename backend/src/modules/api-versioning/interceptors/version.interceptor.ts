import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { ApiVersioningService, VersionStrategy } from '../api-versioning.service';

/**
 * Version Interceptor
 * Handles API versioning for all requests
 */
@Injectable()
export class VersionInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private versioningService: ApiVersioningService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Extract version from request
    const requestedVersion = this.versioningService.extractVersion(
      VersionStrategy.HEADER, // Can be configured
      request.headers,
      request.path,
      request.query,
    );

    // Get version or use default
    const version = requestedVersion
      ? await this.versioningService.getVersion(requestedVersion)
      : await this.versioningService.getDefaultVersion();

    if (!version) {
      throw new HttpException(
        'Invalid API version or no default version configured',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if version is sunset
    if (version.isSunset) {
      throw new HttpException(
        `API version ${version.version} has been sunset`,
        HttpStatus.GONE,
      );
    }

    // Attach version to request
    (request as any).apiVersion = version;

    // Set version header in response
    response.setHeader('X-API-Version', version.version);

    // Add deprecation warning if applicable
    if (version.isDeprecated) {
      const warning = await this.versioningService.getDeprecationWarning(
        version.version,
      );
      if (warning) {
        response.setHeader('X-API-Deprecation-Warning', warning);

        if (version.sunsetAt) {
          response.setHeader(
            'X-API-Sunset-Date',
            version.sunsetAt.toISOString(),
          );
        }

        if (version.migrateToVersionId) {
          response.setHeader(
            'X-API-Migrate-To',
            version.migrateToVersionId,
          );
        }
      }
    }

    return next.handle().pipe(
      tap(() => {
        // Can add version-specific response transformation here
      }),
    );
  }
}
