import { AxiosInstance } from 'axios';

export interface Audit {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  pagesScanned: number;
  issuesFound: number;
  score: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

/**
 * Audits resource
 * Manage site audits
 */
export class Audits {
  constructor(private axios: AxiosInstance) {}

  /**
   * List audits for a project
   */
  async list(projectId: string): Promise<Audit[]> {
    const response = await this.axios.get(`/projects/${projectId}/audits`);
    return response.data;
  }

  /**
   * Get an audit by ID
   */
  async get(auditId: string): Promise<Audit> {
    const response = await this.axios.get(`/audits/${auditId}`);
    return response.data;
  }

  /**
   * Start a new audit
   */
  async start(projectId: string, maxPages?: number): Promise<Audit> {
    const response = await this.axios.post(`/projects/${projectId}/audits`, {
      maxPages,
    });
    return response.data;
  }

  /**
   * Cancel a running audit
   */
  async cancel(auditId: string): Promise<void> {
    await this.axios.post(`/audits/${auditId}/cancel`);
  }

  /**
   * Get latest audit for a project
   */
  async latest(projectId: string): Promise<Audit> {
    const response = await this.axios.get(`/projects/${projectId}/audits/latest`);
    return response.data;
  }
}
