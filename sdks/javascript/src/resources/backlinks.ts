import { AxiosInstance } from 'axios';

export interface Backlink {
  id: string;
  sourceUrl: string;
  targetUrl: string;
  anchorText?: string;
  status: 'active' | 'lost' | 'pending';
  domainAuthority?: number;
  pageAuthority?: number;
  isDoFollow: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  lostAt?: string;
}

export interface BacklinkStats {
  total: number;
  active: number;
  lost: number;
  doFollow: number;
  noFollow: number;
  averageDomainAuthority: number;
}

/**
 * Backlinks resource
 * Monitor and analyze backlinks
 */
export class Backlinks {
  constructor(private axios: AxiosInstance) {}

  /**
   * List backlinks for a project
   */
  async list(projectId: string, status?: string): Promise<{ data: Backlink[] }> {
    const response = await this.axios.get(`/projects/${projectId}/backlinks`, {
      params: { status },
    });
    return response.data;
  }

  /**
   * Get backlink statistics
   */
  async stats(projectId: string): Promise<BacklinkStats> {
    const response = await this.axios.get(`/projects/${projectId}/backlinks/stats`);
    return response.data;
  }

  /**
   * Refresh backlinks for a project
   */
  async refresh(projectId: string): Promise<void> {
    await this.axios.post(`/projects/${projectId}/backlinks/refresh`);
  }
}
