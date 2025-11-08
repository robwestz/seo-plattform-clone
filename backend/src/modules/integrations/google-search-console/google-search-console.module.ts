import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleSearchConsoleController } from './google-search-console.controller';
import { GoogleSearchConsoleService } from './google-search-console.service';
import { GSCData } from './entities/gsc-data.entity';
import { OAuthModule } from '../oauth/oauth.module';

@Module({
  imports: [TypeOrmModule.forFeature([GSCData]), OAuthModule],
  controllers: [GoogleSearchConsoleController],
  providers: [GoogleSearchConsoleService],
  exports: [GoogleSearchConsoleService],
})
export class GoogleSearchConsoleModule {}
