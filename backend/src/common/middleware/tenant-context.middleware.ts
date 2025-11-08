import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Tenant Context Middleware
 * Extracts tenant ID from JWT token or header and attaches it to the request
 * Ensures all subsequent operations are scoped to the correct tenant
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantContextMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Extract tenant ID from header or JWT payload (set by auth guard)
    const tenantIdFromHeader = req.headers['x-tenant-id'] as string;
    const tenantIdFromUser = (req as any).user?.tenantId;

    const tenantId = tenantIdFromUser || tenantIdFromHeader;

    if (tenantId) {
      // Attach tenant ID to request for easy access
      (req as any).tenantId = tenantId;
      this.logger.debug(`Tenant context set: ${tenantId}`);
    }

    next();
  }
}
