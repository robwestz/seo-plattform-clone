import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * API Deprecation Middleware
 * Adds deprecation warnings to response headers for deprecated endpoints
 */
@Injectable()
export class DeprecationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(DeprecationMiddleware.name);

  // Map of deprecated endpoints with sunset dates
  private readonly deprecatedEndpoints = new Map<string, { sunsetDate: string; replacement?: string }>([
    // Example: Old authentication endpoint
    ['/api/v1/auth/login', { sunsetDate: '2025-12-31', replacement: '/api/v2/auth/login' }],
    // Add more deprecated endpoints here
  ]);

  use(req: Request, res: Response, next: NextFunction) {
    const fullPath = req.path;

    // Check if endpoint is deprecated
    const deprecationInfo = this.deprecatedEndpoints.get(fullPath);

    if (deprecationInfo) {
      // Add deprecation warning header (RFC 8594)
      res.setHeader('Deprecation', 'true');
      res.setHeader('Sunset', deprecationInfo.sunsetDate);

      if (deprecationInfo.replacement) {
        res.setHeader('Link', `<${deprecationInfo.replacement}>; rel="alternate"`);
      }

      // Add custom warning header
      const warningMessage = deprecationInfo.replacement
        ? `This endpoint is deprecated and will be removed on ${deprecationInfo.sunsetDate}. Use ${deprecationInfo.replacement} instead.`
        : `This endpoint is deprecated and will be removed on ${deprecationInfo.sunsetDate}.`;

      res.setHeader('X-API-Warn', warningMessage);

      // Log deprecation usage
      this.logger.warn(
        `Deprecated endpoint accessed: ${fullPath} by ${req.ip}`,
      );
    }

    next();
  }
}
