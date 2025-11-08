import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { io, Socket } from 'socket.io-client';
import { Projects } from './resources/projects';
import { Keywords } from './resources/keywords';
import { Rankings } from './resources/rankings';
import { Audits } from './resources/audits';
import { Backlinks } from './resources/backlinks';

/**
 * Configuration options for the SEO Platform SDK
 */
export interface SEOPlatformConfig {
  /**
   * API key or JWT token for authentication
   */
  apiKey: string;

  /**
   * Base URL for the API (default: https://api.seo-platform.com)
   */
  baseURL?: string;

  /**
   * API version (default: v1)
   */
  version?: string;

  /**
   * Request timeout in milliseconds (default: 30000)
   */
  timeout?: number;

  /**
   * Enable WebSocket real-time updates (default: false)
   */
  enableWebSocket?: boolean;

  /**
   * Custom headers to include in all requests
   */
  headers?: Record<string, string>;
}

/**
 * SEO Intelligence Platform SDK Client
 *
 * @example
 * ```typescript
 * import { SEOPlatform } from '@seo-platform/sdk';
 *
 * const client = new SEOPlatform({
 *   apiKey: 'your-api-key',
 * });
 *
 * // List projects
 * const projects = await client.projects.list();
 *
 * // Track keyword rankings
 * const rankings = await client.rankings.track('project-id', ['keyword-id-1']);
 *
 * // Listen to real-time updates
 * client.on('ranking:updated', (data) => {
 *   console.log('Ranking updated:', data);
 * });
 * ```
 */
export class SEOPlatform {
  private axios: AxiosInstance;
  private socket?: Socket;
  private config: Required<SEOPlatformConfig>;

  // Resource accessors
  public readonly projects: Projects;
  public readonly keywords: Keywords;
  public readonly rankings: Rankings;
  public readonly audits: Audits;
  public readonly backlinks: Backlinks;

  constructor(config: SEOPlatformConfig) {
    // Set default configuration
    this.config = {
      apiKey: config.apiKey,
      baseURL: config.baseURL || 'https://api.seo-platform.com',
      version: config.version || 'v1',
      timeout: config.timeout || 30000,
      enableWebSocket: config.enableWebSocket || false,
      headers: config.headers || {},
    };

    // Initialize Axios client
    this.axios = axios.create({
      baseURL: `${this.config.baseURL}/api/${this.config.version}`,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'X-API-Version': this.config.version,
        ...this.config.headers,
      },
    });

    // Add response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          // Handle rate limiting
          if (error.response.status === 429) {
            const retryAfter = error.response.headers['retry-after'];
            throw new Error(
              `Rate limit exceeded. Retry after ${retryAfter} seconds.`
            );
          }

          // Handle authentication errors
          if (error.response.status === 401) {
            throw new Error('Authentication failed. Check your API key.');
          }

          // Handle other errors
          throw new Error(
            error.response.data?.message || 'An error occurred'
          );
        }
        throw error;
      }
    );

    // Initialize resource clients
    this.projects = new Projects(this.axios);
    this.keywords = new Keywords(this.axios);
    this.rankings = new Rankings(this.axios);
    this.audits = new Audits(this.axios);
    this.backlinks = new Backlinks(this.axios);

    // Initialize WebSocket if enabled
    if (this.config.enableWebSocket) {
      this.initializeWebSocket();
    }
  }

  /**
   * Initialize WebSocket connection for real-time updates
   */
  private initializeWebSocket() {
    this.socket = io(`${this.config.baseURL}/realtime`, {
      auth: {
        token: this.config.apiKey,
      },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('error', (error: any) => {
      console.error('WebSocket error:', error);
    });
  }

  /**
   * Subscribe to project events
   */
  public subscribeToProject(projectId: string) {
    if (!this.socket) {
      throw new Error('WebSocket not enabled. Set enableWebSocket: true in config.');
    }

    this.socket.emit('subscribe:project', { projectId });
  }

  /**
   * Unsubscribe from project events
   */
  public unsubscribeFromProject(projectId: string) {
    if (!this.socket) return;

    this.socket.emit('unsubscribe:project', { projectId });
  }

  /**
   * Listen to WebSocket events
   */
  public on(event: string, callback: (data: any) => void) {
    if (!this.socket) {
      throw new Error('WebSocket not enabled. Set enableWebSocket: true in config.');
    }

    this.socket.on(event, callback);
  }

  /**
   * Remove WebSocket event listener
   */
  public off(event: string, callback?: (data: any) => void) {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  /**
   * Close WebSocket connection
   */
  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  /**
   * Get rate limit status
   */
  public async getRateLimitStatus() {
    const response = await this.axios.get('/rate-limit/status');
    return response.data;
  }

  /**
   * Make a custom API request
   */
  public async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.request<T>(config);
    return response.data;
  }
}

export default SEOPlatform;
