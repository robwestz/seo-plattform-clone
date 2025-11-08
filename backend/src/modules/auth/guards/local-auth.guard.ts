import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Local Authentication Guard
 * Used for login endpoint to validate email/password
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
