import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminGuard } from '../../common/guards/admin.guard';
import { Tenant } from '../../database/entities/tenant.entity';
import { User } from '../../database/entities/user.entity';
import { Project } from '../../database/entities/project.entity';
import { Subscription } from '../subscription/entities/subscription.entity';
import { Invoice } from '../billing/entities/invoice.entity';
import { UsageEvent } from '../usage/entities/usage-event.entity';

/**
 * Admin Module
 * Provides admin-only functionality for system management
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, User, Project, Subscription, Invoice, UsageEvent]),
    ConfigModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminService],
})
export class AdminModule {}
