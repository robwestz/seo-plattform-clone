import { Page } from 'puppeteer';
import { logger } from './logger';
import {
  RenderRequest,
  RenderResult,
  ScreenshotRequest,
  ScreenshotResult,
  PerformanceMetrics,
} from './types';

export class Renderer {
  private readonly blockResources: boolean;
  private readonly blockAds: boolean;
  private readonly blockAnalytics: boolean;
  private readonly blockImages: boolean;
  private readonly navigationTimeout: number;

  constructor() {
    this.blockResources = process.env.BLOCK_RESOURCES === 'true';
    this.blockAds = process.env.BLOCK_ADS === 'true';
    this.blockAnalytics = process.env.BLOCK_ANALYTICS === 'true';
    this.blockImages = process.env.BLOCK_IMAGES === 'true';
    this.navigationTimeout = parseInt(process.env.NAVIGATION_TIMEOUT || '30000');
  }

  async render(page: Page, request: RenderRequest): Promise<RenderResult> {
    const startTime = Date.now();

    try {
      // Set viewport if provided
      if (request.viewport) {
        await page.setViewport(request.viewport);
      }

      // Set user agent if provided
      if (request.userAgent) {
        await page.setUserAgent(request.userAgent);
      }

      // Set custom headers if provided
      if (request.headers) {
        await page.setExtraHTTPHeaders(request.headers);
      }

      // Set cookies if provided
      if (request.cookies && request.cookies.length > 0) {
        await page.setCookie(...request.cookies);
      }

      // Enable request interception for resource blocking
      if (request.blockResources ?? this.blockResources) {
        await this.setupRequestInterception(page);
      }

      // Navigate to the URL
      logger.info(`Navigating to: ${request.url}`);

      const response = await page.goto(request.url, {
        waitUntil: 'networkidle2',
        timeout: this.navigationTimeout,
      });

      if (!response) {
        throw new Error('Failed to load page');
      }

      // Wait for specific selector if provided
      if (request.waitForSelector) {
        await page.waitForSelector(request.waitForSelector, {
          timeout: request.waitForTimeout || 5000,
        });
      }

      // Additional wait if specified
      if (request.waitForTimeout) {
        await page.waitForTimeout(request.waitForTimeout);
      }

      // Get final URL (after redirects)
      const finalUrl = page.url();

      // Get rendered HTML
      const html = await page.content();

      // Collect performance metrics
      const metrics = await this.collectMetrics(page);

      // Take screenshot if requested
      let screenshot: string | undefined;
      if (request.screenshot) {
        const screenshotBuffer = await page.screenshot({
          fullPage: request.fullPage ?? true,
          type: 'png',
        });
        screenshot = screenshotBuffer.toString('base64');
      }

      const duration = Date.now() - startTime;

      logger.info(`Rendered page successfully`, {
        url: request.url,
        finalUrl,
        duration,
        htmlSize: html.length,
      });

      return {
        url: request.url,
        finalUrl,
        html,
        screenshot,
        metrics,
        status: 'success',
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Render error:', {
        url: request.url,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        url: request.url,
        finalUrl: request.url,
        html: '',
        metrics: this.getEmptyMetrics(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async screenshot(page: Page, request: ScreenshotRequest): Promise<ScreenshotResult> {
    try {
      // Set viewport if provided
      if (request.viewport) {
        await page.setViewport(request.viewport);
      }

      // Navigate to the URL
      await page.goto(request.url, {
        waitUntil: 'networkidle2',
        timeout: this.navigationTimeout,
      });

      // Take screenshot
      const screenshotBuffer = await page.screenshot({
        fullPage: request.fullPage ?? true,
        type: request.type || 'png',
        quality: request.type === 'jpeg' ? request.quality || 80 : undefined,
      });

      const screenshot = screenshotBuffer.toString('base64');

      logger.info('Screenshot captured', {
        url: request.url,
        size: screenshot.length,
      });

      return {
        url: request.url,
        screenshot,
      };
    } catch (error) {
      logger.error('Screenshot error:', {
        url: request.url,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async setupRequestInterception(page: Page): Promise<void> {
    await page.setRequestInterception(true);

    const blockedResourceTypes = new Set<string>();
    if (this.blockImages) {
      blockedResourceTypes.add('image');
    }

    const blockedDomains = new Set<string>();
    if (this.blockAds || this.blockAnalytics) {
      // Common ad and analytics domains
      const domains = [
        'doubleclick.net',
        'googlesyndication.com',
        'googleadservices.com',
        'google-analytics.com',
        'googletagmanager.com',
        'facebook.net',
        'facebook.com/tr',
        'analytics.twitter.com',
        'hotjar.com',
        'mouseflow.com',
        'clarity.ms',
      ];
      domains.forEach((domain) => blockedDomains.add(domain));
    }

    page.on('request', (request) => {
      const url = request.url();
      const resourceType = request.resourceType();

      // Block specific resource types
      if (blockedResourceTypes.has(resourceType)) {
        request.abort();
        return;
      }

      // Block specific domains
      const shouldBlock = Array.from(blockedDomains).some((domain) =>
        url.includes(domain)
      );

      if (shouldBlock) {
        request.abort();
        return;
      }

      request.continue();
    });
  }

  private async collectMetrics(page: Page): Promise<PerformanceMetrics> {
    try {
      const metrics = await page.evaluate(() => {
        const perfData = window.performance.getEntriesByType('navigation')[0] as any;
        const paintEntries = window.performance.getEntriesByType('paint');

        const firstPaint = paintEntries.find((entry) => entry.name === 'first-paint');
        const fcp = paintEntries.find(
          (entry) => entry.name === 'first-contentful-paint'
        );

        // Get resource counts
        const resources = window.performance.getEntriesByType('resource') as any[];
        const resourceCounts = {
          total: resources.length,
          scripts: resources.filter((r) => r.initiatorType === 'script').length,
          stylesheets: resources.filter(
            (r) => r.initiatorType === 'link' || r.initiatorType === 'css'
          ).length,
          images: resources.filter((r) => r.initiatorType === 'img').length,
          fonts: resources.filter(
            (r) => r.initiatorType === 'font' || r.name.match(/\.(woff|woff2|ttf|eot)$/i)
          ).length,
          other: 0,
        };
        resourceCounts.other =
          resourceCounts.total -
          resourceCounts.scripts -
          resourceCounts.stylesheets -
          resourceCounts.images -
          resourceCounts.fonts;

        // Calculate transfer size
        const transferSize = resources.reduce(
          (sum, r) => sum + (r.transferSize || 0),
          0
        );

        return {
          domContentLoaded: perfData?.domContentLoadedEventEnd || 0,
          loadComplete: perfData?.loadEventEnd || 0,
          firstPaint: firstPaint?.startTime,
          firstContentfulPaint: fcp?.startTime,
          resourceCounts,
          transferSize,
        };
      });

      return metrics as PerformanceMetrics;
    } catch (error) {
      logger.warn('Failed to collect metrics:', error);
      return this.getEmptyMetrics();
    }
  }

  private getEmptyMetrics(): PerformanceMetrics {
    return {
      domContentLoaded: 0,
      loadComplete: 0,
      resourceCounts: {
        total: 0,
        scripts: 0,
        stylesheets: 0,
        images: 0,
        fonts: 0,
        other: 0,
      },
      transferSize: 0,
    };
  }
}
