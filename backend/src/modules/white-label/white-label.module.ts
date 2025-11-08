import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { MulterModule } from '@nestjs/platform-express';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WhiteLabelService } from './white-label.service';
import { WhiteLabelController, WhiteLabelMiddleware } from './white-label.controller';
import { WhiteLabelConfig } from './entities/white-label-config.entity';
import { EmailTemplate } from './entities/email-template.entity';
import { SubscriptionModule } from '../subscription/subscription.module';

/**
 * White Label Module
 * Manages tenant-specific branding and customization
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([WhiteLabelConfig, EmailTemplate]),
    CacheModule.register({
      ttl: 3600, // 1 hour
      max: 500,
    }),
    MulterModule.register({
      dest: './uploads',
    }),
    EventEmitterModule.forRoot(),
    SubscriptionModule,
  ],
  providers: [WhiteLabelService, WhiteLabelMiddleware],
  controllers: [WhiteLabelController],
  exports: [WhiteLabelService],
})
export class WhiteLabelModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(WhiteLabelMiddleware).forRoutes('*');
  }
}
