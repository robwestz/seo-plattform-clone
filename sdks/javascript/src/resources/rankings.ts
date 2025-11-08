import { AxiosInstance } from 'axios';

export interface Ranking {
  id: string;
  keyword: any;
  url: string;
  position: number;
  previousPosition?: number;
  engine: string;
  location: string;
  device: string;
  trackedAt: string;
}

/**
 * Rankings resource
 * Track search engine rankings
 */
export class Rankings {
  constructor(private axios: AxiosInstance) {}

  /**
   * Get current rankings for a project
   */
  async list(projectId: string, params?: { limit?: number; offset?: number }): Promise<{ data: Ranking[] }> {
    const response = await this.axios.get(`/projects/${projectId}/rankings`, { params });
    return response.data;
  }

  /**
   * Get ranking history for a keyword
   */
  async history(keywordId: string, days: number = 30): Promise<any[]> {
    const response = await this.axios.get(`/keywords/${keywordId}/rankings/history`, {
      params: { days },
    });
    return response.data;
  }

  /**
   * Track rankings for keywords
   */
  async track(projectId: string, keywordIds: string[]): Promise<Ranking[]> {
    const response = await this.axios.post(`/projects/${projectId}/rankings/track`, {
      keywordIds,
    });
    return response.data;
  }
}
