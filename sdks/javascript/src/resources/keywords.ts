import { AxiosInstance } from 'axios';

export interface Keyword {
  id: string;
  keyword: string;
  searchVolume?: number;
  difficulty?: number;
  cpc?: number;
  intent?: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKeywordParams {
  keyword: string;
  tags?: string[];
}

/**
 * Keywords resource
 * Manage keyword tracking
 */
export class Keywords {
  constructor(private axios: AxiosInstance) {}

  /**
   * List keywords for a project
   */
  async list(projectId: string): Promise<{ data: Keyword[] }> {
    const response = await this.axios.get(`/projects/${projectId}/keywords`);
    return response.data;
  }

  /**
   * Get a keyword by ID
   */
  async get(keywordId: string): Promise<Keyword> {
    const response = await this.axios.get(`/keywords/${keywordId}`);
    return response.data;
  }

  /**
   * Add a keyword to a project
   */
  async create(projectId: string, params: CreateKeywordParams): Promise<Keyword> {
    const response = await this.axios.post(`/projects/${projectId}/keywords`, params);
    return response.data;
  }

  /**
   * Delete a keyword
   */
  async delete(keywordId: string): Promise<void> {
    await this.axios.delete(`/keywords/${keywordId}`);
  }

  /**
   * Get keyword suggestions
   */
  async suggestions(seed: string, limit: number = 10): Promise<any[]> {
    const response = await this.axios.get('/keywords/suggestions', {
      params: { seed, limit },
    });
    return response.data;
  }
}
