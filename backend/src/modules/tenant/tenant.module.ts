import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { Tenant } from '../../database/entities/tenant.entity';
import { UserTenant } from '../../database/entities/user-tenant.entity';

/**
 * Tenant Module
 * Provides tenant management functionality
 */
@Module({
  imports: [TypeOrmModule.forFeature([Tenant, UserTenant])],
  controllers: [TenantController],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
