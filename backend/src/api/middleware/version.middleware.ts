import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * API Version Middleware
 * Handles API versioning via:
 * 1. URL path (/api/v1/... or /api/v2/...)
 * 2. Accept header (Accept: application/vnd.seo-platform.v1+json)
 * 3. Custom header (X-API-Version: 1)
 */
@Injectable()
export class VersionMiddleware implements NestMiddleware {
  private readonly supportedVersions = ['1', '2'];
  private readonly defaultVersion = '1';

  use(req: Request, res: Response, next: NextFunction) {
    let version = this.defaultVersion;

    // 1. Check URL path first (/api/v1/... or /api/v2/...)
    const pathMatch = req.path.match(/^\/api\/v(\d+)\//);
    if (pathMatch) {
      version = pathMatch[1];
    }
    // 2. Check custom header
    else if (req.headers['x-api-version']) {
      version = req.headers['x-api-version'] as string;
    }
    // 3. Check Accept header
    else if (req.headers.accept) {
      const acceptMatch = req.headers.accept.match(/application\/vnd\.seo-platform\.v(\d+)\+json/);
      if (acceptMatch) {
        version = acceptMatch[1];
      }
    }

    // Validate version
    if (!this.supportedVersions.includes(version)) {
      throw new BadRequestException(
        `Unsupported API version: v${version}. Supported versions: ${this.supportedVersions.map(v => `v${v}`).join(', ')}`,
      );
    }

    // Attach version to request
    (req as any).apiVersion = version;

    // Add version header to response
    res.setHeader('X-API-Version', version);

    next();
  }
}
