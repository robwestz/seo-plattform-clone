import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Current Tenant Decorator
 * Extracts the current tenant ID from the request
 * @example
 * ```typescript
 * @Get('projects')
 * getProjects(@CurrentTenant() tenantId: string) {
 *   return this.projectService.findAll(tenantId);
 * }
 * ```
 */
export const CurrentTenant = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.tenantId || request.user?.tenantId;
});
