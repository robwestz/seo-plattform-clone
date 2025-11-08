import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Public Decorator
 * Marks a route as public (bypasses authentication)
 * @example
 * ```typescript
 * @Public()
 * @Post('register')
 * register(@Body() dto: RegisterDto) {
 *   return this.authService.register(dto);
 * }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
