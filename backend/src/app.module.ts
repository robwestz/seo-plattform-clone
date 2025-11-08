import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

// Configuration
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { redisConfig } from './config/redis.config';
import { kafkaConfig } from './config/kafka.config';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { UserModule } from './modules/user/user.module';
import { ProjectModule } from './modules/project/project.module';
import { EventsModule } from './modules/events/events.module';

// Team Gamma - SEO Analysis Modules
import { KeywordModule } from './modules/keywords/keyword.module';
import { RankingModule } from './modules/rankings/ranking.module';
import { AuditModule } from './modules/audit/audit.module';
import { BacklinkModule } from './modules/backlinks/backlink.module';
import { CompetitorModule } from './modules/competitors/competitor.module';
import { ContentModule } from './modules/content/content.module';

// Team Kappa - Business Logic & Monetization Modules
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { BillingModule } from './modules/billing/billing.module';
import { UsageModule } from './modules/usage/usage.module';
import { WhiteLabelModule } from './modules/white-label/white-label.module';
import { AdminModule } from './modules/admin/admin.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

// Team Zeta - API Layer & Developer Experience
import { GraphQLModule } from './graphql/graphql.module';
import { WebSocketModule } from './websocket/websocket.module';
import { ApiModule } from './api/api.module';

// Middleware
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';
import { LoggingMiddleware } from './common/middleware/logging.middleware';

/**
 * Root application module
 * Configures all core modules, database, authentication, and middleware
 */
@Module({
  imports: [
    // Configuration module - must be first
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, redisConfig, kafkaConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Winston logger
    WinstonModule.forRootAsync({
      useFactory: () => ({
        transports: [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.colorize(),
              winston.format.printf(({ timestamp, level, message, context, trace }) => {
                return `${timestamp} [${context}] ${level}: ${message}${trace ? `\n${trace}` : ''}`;
              }),
            ),
          }),
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
          }),
        ],
      }),
    }),

    // TypeORM Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.user'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        schema: configService.get<string>('database.schema'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: configService.get<boolean>('database.sync', false),
        logging: configService.get<boolean>('database.logging', false),
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        extra: {
          max: 20, // Maximum pool size
          connectionTimeoutMillis: 5000,
        },
      }),
    }),

    // Feature modules
    AuthModule,
    TenantModule,
    UserModule,
    ProjectModule,
    EventsModule,

    // Team Gamma - SEO Analysis Modules
    KeywordModule,
    RankingModule,
    AuditModule,
    BacklinkModule,
    CompetitorModule,
    ContentModule,

    // Team Kappa - Business Logic & Monetization Modules
    SubscriptionModule,
    BillingModule,
    UsageModule,
    WhiteLabelModule,
    AdminModule,
    AnalyticsModule,

    // Team Zeta - API Layer & Developer Experience
    GraphQLModule,
    WebSocketModule,
    ApiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  /**
   * Configure middleware for all routes
   * @param consumer - Middleware consumer to apply middleware
   */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware, TenantContextMiddleware).forRoutes('*');
  }
}
