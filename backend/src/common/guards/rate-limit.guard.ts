import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

/**
 * Rate limit configuration per subscription tier
 */
export const RATE_LIMITS = {
  FREE: {
    points: 100, // Number of requests
    duration: 3600, // Per hour
    blockDuration: 600, // Block for 10 minutes if exceeded
  },
  STARTER: {
    points: 1000,
    duration: 3600,
    blockDuration: 300,
  },
  PROFESSIONAL: {
    points: 5000,
    duration: 3600,
    blockDuration: 60,
  },
  ENTERPRISE: {
    points: 50000,
    duration: 3600,
    blockDuration: 0,
  },
};

/**
 * Custom decorator to set rate limit configuration
 */
export const RateLimit = (points: number, duration: number) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('rateLimit', { points, duration }, descriptor.value);
    return descriptor;
  };
};

/**
 * Rate Limiting Guard
 * Implements Redis-backed rate limiting with different limits per subscription tier
 * Adds X-RateLimit-* headers to responses
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private rateLimiters: Map<string, RateLimiterRedis> = new Map();

  constructor(
    private reflector: Reflector,
    // @InjectRedis() private readonly redis: Redis, // Uncomment when Redis module is configured
  ) {
    this.initializeRateLimiters();
  }

  /**
   * Initialize rate limiters for each tier
   */
  private initializeRateLimiters() {
    // For now, create a mock Redis client for demonstration
    // In production, use the injected Redis instance
    const mockRedis = {
      set: async () => {},
      get: async () => null,
      del: async () => {},
      expire: async () => {},
    };

    for (const [tier, config] of Object.entries(RATE_LIMITS)) {
      this.rateLimiters.set(
        tier,
        new RateLimiterRedis({
          storeClient: mockRedis as any, // Replace with this.redis in production
          keyPrefix: `rate_limit:${tier}:`,
          points: config.points,
          duration: config.duration,
          blockDuration: config.blockDuration,
        }),
      );
    }

    this.logger.log('Rate limiters initialized');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Get user from request (set by authentication middleware)
    const user = request.user;

    // Allow requests without authentication (will be handled by auth guards)
    if (!user) {
      return true;
    }

    // Get subscription tier (default to FREE if not available)
    const tier = user.subscription?.tier || 'FREE';

    // Get rate limiter for this tier
    const rateLimiter = this.rateLimiters.get(tier);

    if (!rateLimiter) {
      this.logger.error(`No rate limiter found for tier: ${tier}`);
      return true; // Allow request but log error
    }

    // Create unique key for this user
    const key = `${user.id}:${tier}`;

    try {
      // Consume 1 point
      const rateLimiterRes: RateLimiterRes = await rateLimiter.consume(key, 1);

      // Add rate limit headers to response
      this.addRateLimitHeaders(response, rateLimiterRes, RATE_LIMITS[tier as keyof typeof RATE_LIMITS]);

      return true;
    } catch (rateLimiterRes) {
      // Rate limit exceeded
      if (rateLimiterRes instanceof Error) {
        this.logger.error('Rate limiter error:', rateLimiterRes);
        throw rateLimiterRes;
      }

      // Add rate limit headers
      this.addRateLimitHeaders(
        response,
        rateLimiterRes as RateLimiterRes,
        RATE_LIMITS[tier as keyof typeof RATE_LIMITS],
      );

      this.logger.warn(
        `Rate limit exceeded for user ${user.id} (tier: ${tier})`,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded',
          error: 'Too Many Requests',
          retryAfter: Math.round((rateLimiterRes as RateLimiterRes).msBeforeNext / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /**
   * Add standard rate limit headers to response
   */
  private addRateLimitHeaders(
    response: any,
    rateLimiterRes: RateLimiterRes,
    config: { points: number; duration: number },
  ) {
    response.setHeader('X-RateLimit-Limit', config.points);
    response.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints);
    response.setHeader('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());

    // If limit exceeded, add Retry-After header
    if (rateLimiterRes.remainingPoints === 0) {
      response.setHeader('Retry-After', Math.round(rateLimiterRes.msBeforeNext / 1000));
    }
  }

  /**
   * Get current rate limit status for a user
   */
  async getRateLimitStatus(userId: string, tier: string) {
    const rateLimiter = this.rateLimiters.get(tier);
    if (!rateLimiter) {
      return null;
    }

    const key = `${userId}:${tier}`;

    try {
      const res = await rateLimiter.get(key);
      if (!res) {
        return {
          limit: RATE_LIMITS[tier as keyof typeof RATE_LIMITS].points,
          remaining: RATE_LIMITS[tier as keyof typeof RATE_LIMITS].points,
          reset: new Date(Date.now() + RATE_LIMITS[tier as keyof typeof RATE_LIMITS].duration * 1000),
        };
      }

      return {
        limit: RATE_LIMITS[tier as keyof typeof RATE_LIMITS].points,
        remaining: res.remainingPoints,
        reset: new Date(Date.now() + res.msBeforeNext),
      };
    } catch (error) {
      this.logger.error('Error getting rate limit status:', error);
      return null;
    }
  }
}
