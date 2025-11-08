import { Cluster } from 'puppeteer-cluster';
import puppeteer, { Browser, Page } from 'puppeteer';
import { logger } from './logger';
import { Renderer } from './renderer';
import {
  RenderRequest,
  RenderResult,
  ScreenshotRequest,
  ScreenshotResult,
  ClusterStats,
} from './types';

export interface ClusterConfig {
  maxConcurrency: number;
  timeout: number;
  retryLimit: number;
  retryDelay: number;
}

export class ClusterManager {
  private cluster: Cluster<RenderRequest> | null = null;
  private renderer: Renderer;
  private config: ClusterConfig;
  private stats = {
    totalJobs: 0,
    successfulJobs: 0,
    failedJobs: 0,
  };

  constructor(config: ClusterConfig) {
    this.config = config;
    this.renderer = new Renderer();
  }

  async init(): Promise<void> {
    try {
      logger.info('Initializing Puppeteer cluster...');

      const browserArgs = (process.env.BROWSER_ARGS || '').split(',').filter(Boolean);
      const headless = process.env.BROWSER_HEADLESS !== 'false';

      this.cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: this.config.maxConcurrency,
        timeout: this.config.timeout,
        retryLimit: this.config.retryLimit,
        retryDelay: this.config.retryDelay,
        puppeteerOptions: {
          headless: headless ? 'new' : false,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            ...browserArgs,
          ],
          defaultViewport: {
            width: parseInt(process.env.DEFAULT_VIEWPORT_WIDTH || '1920'),
            height: parseInt(process.env.DEFAULT_VIEWPORT_HEIGHT || '1080'),
          },
        },
        monitor: false,
      });

      // Set up error handling
      this.cluster.on('taskerror', (err, data) => {
        logger.error('Task error:', { error: err.message, url: data.url });
        this.stats.failedJobs++;
      });

      logger.info('Puppeteer cluster initialized successfully', {
        maxConcurrency: this.config.maxConcurrency,
        timeout: this.config.timeout,
      });
    } catch (error) {
      logger.error('Failed to initialize cluster:', error);
      throw error;
    }
  }

  async render(request: RenderRequest): Promise<RenderResult> {
    if (!this.cluster) {
      throw new Error('Cluster not initialized');
    }

    this.stats.totalJobs++;

    try {
      const result = await this.cluster.execute(request, async ({ page, data }) => {
        return await this.renderer.render(page, data);
      });

      this.stats.successfulJobs++;
      return result;
    } catch (error) {
      this.stats.failedJobs++;
      logger.error('Render failed:', { url: request.url, error });
      throw error;
    }
  }

  async screenshot(request: ScreenshotRequest): Promise<ScreenshotResult> {
    if (!this.cluster) {
      throw new Error('Cluster not initialized');
    }

    this.stats.totalJobs++;

    try {
      const result = await this.cluster.execute(request as any, async ({ page, data }) => {
        return await this.renderer.screenshot(page, data);
      });

      this.stats.successfulJobs++;
      return result;
    } catch (error) {
      this.stats.failedJobs++;
      logger.error('Screenshot failed:', { url: request.url, error });
      throw error;
    }
  }

  async getStats(): Promise<ClusterStats> {
    if (!this.cluster) {
      return {
        activeWorkers: 0,
        queueSize: 0,
        totalJobs: this.stats.totalJobs,
        successfulJobs: this.stats.successfulJobs,
        failedJobs: this.stats.failedJobs,
      };
    }

    return {
      activeWorkers: this.config.maxConcurrency,
      queueSize: 0, // Cluster doesn't expose queue size
      totalJobs: this.stats.totalJobs,
      successfulJobs: this.stats.successfulJobs,
      failedJobs: this.stats.failedJobs,
    };
  }

  async close(): Promise<void> {
    if (this.cluster) {
      logger.info('Closing Puppeteer cluster...');
      await this.cluster.idle();
      await this.cluster.close();
      this.cluster = null;
      logger.info('Puppeteer cluster closed');
    }
  }
}
