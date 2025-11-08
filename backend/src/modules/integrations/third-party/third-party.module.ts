import { Module } from '@nestjs/common';
import { AhrefsClient } from './ahrefs.client';
import { SemrushClient } from './semrush.client';
import { MozClient } from './moz.client';

@Module({
  providers: [AhrefsClient, SemrushClient, MozClient],
  exports: [AhrefsClient, SemrushClient, MozClient],
})
export class ThirdPartyModule {}
