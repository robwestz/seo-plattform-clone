import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from '../../database/entities/user.entity';
import { UserTenant } from '../../database/entities/user-tenant.entity';

/**
 * User Module
 * Provides user management functionality
 */
@Module({
  imports: [TypeOrmModule.forFeature([User, UserTenant])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
