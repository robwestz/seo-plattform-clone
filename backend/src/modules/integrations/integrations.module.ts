import { Module } from '@nestjs/common';
import { OAuthModule } from './oauth/oauth.module';
import { GoogleSearchConsoleModule } from './google-search-console/google-search-console.module';
import { GoogleAnalyticsModule } from './google-analytics/google-analytics.module';
import { GoogleAdsModule } from './google-ads/google-ads.module';
import { ThirdPartyModule } from './third-party/third-party.module';
import { WebhookModule } from './webhooks/webhook.module';

/**
 * Integrations Module
 * Team Delta - Integrations & External APIs
 *
 * Provides:
 * - OAuth2 authentication for Google services
 * - Google Search Console integration
 * - Google Analytics 4 integration
 * - Google Ads integration
 * - Third-party SEO tools (Ahrefs, SEMrush, Moz)
 * - Webhooks system with delivery and retry logic
 */
@Module({
  imports: [
    OAuthModule,
    GoogleSearchConsoleModule,
    GoogleAnalyticsModule,
    GoogleAdsModule,
    ThirdPartyModule,
    WebhookModule,
  ],
  exports: [
    OAuthModule,
    GoogleSearchConsoleModule,
    GoogleAnalyticsModule,
    GoogleAdsModule,
    ThirdPartyModule,
    WebhookModule,
  ],
})
export class IntegrationsModule {}
