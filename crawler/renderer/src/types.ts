export interface RenderRequest {
  url: string;
  waitForSelector?: string;
  waitForTimeout?: number;
  screenshot?: boolean;
  fullPage?: boolean;
  blockResources?: boolean;
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
  headers?: Record<string, string>;
  cookies?: Array<{
    name: string;
    value: string;
    domain?: string;
  }>;
}

export interface RenderResponse {
  url: string;
  finalUrl: string;
  html: string;
  screenshot?: string;
  metrics?: PerformanceMetrics;
  status: string;
  error?: string;
  timestamp: string;
}

export interface RenderResult {
  url: string;
  finalUrl: string;
  html: string;
  screenshot?: string;
  metrics: PerformanceMetrics;
  status: string;
  error?: string;
}

export interface ScreenshotRequest {
  url: string;
  fullPage?: boolean;
  type?: 'png' | 'jpeg';
  quality?: number;
  viewport?: {
    width: number;
    height: number;
  };
}

export interface ScreenshotResult {
  url: string;
  screenshot: string;
}

export interface PerformanceMetrics {
  domContentLoaded: number;
  loadComplete: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  timeToInteractive?: number;
  totalBlockingTime?: number;
  cumulativeLayoutShift?: number;
  resourceCounts: {
    total: number;
    scripts: number;
    stylesheets: number;
    images: number;
    fonts: number;
    other: number;
  };
  transferSize: number;
}

export interface ClusterStats {
  activeWorkers: number;
  queueSize: number;
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
}
