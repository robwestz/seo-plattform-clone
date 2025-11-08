import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../database/entities/user-tenant.entity';

export const ROLES_KEY = 'roles';

/**
 * Roles Decorator
 * Specifies which roles are allowed to access a route
 * @param roles - Array of allowed roles
 * @example
 * ```typescript
 * @Roles(UserRole.ADMIN, UserRole.OWNER)
 * @Delete(':id')
 * deleteProject(@Param('id') id: string) {
 *   return this.projectService.delete(id);
 * }
 * ```
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
