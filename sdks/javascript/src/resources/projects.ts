import { AxiosInstance } from 'axios';

export interface Project {
  id: string;
  name: string;
  domain: string;
  targetCountry: string;
  targetLanguage: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectParams {
  name: string;
  domain: string;
  targetCountry: string;
  targetLanguage: string;
}

export interface UpdateProjectParams {
  name?: string;
  domain?: string;
  targetCountry?: string;
  targetLanguage?: string;
  isActive?: boolean;
}

export interface ListProjectsParams {
  limit?: number;
  cursor?: string;
}

/**
 * Projects resource
 * Manage SEO projects
 */
export class Projects {
  constructor(private axios: AxiosInstance) {}

  /**
   * List all projects
   */
  async list(params?: ListProjectsParams): Promise<{ data: Project[]; pagination: any }> {
    const response = await this.axios.get('/projects', { params });
    return response.data;
  }

  /**
   * Get a project by ID
   */
  async get(projectId: string): Promise<Project> {
    const response = await this.axios.get(`/projects/${projectId}`);
    return response.data;
  }

  /**
   * Create a new project
   */
  async create(params: CreateProjectParams): Promise<Project> {
    const response = await this.axios.post('/projects', params);
    return response.data;
  }

  /**
   * Update a project
   */
  async update(projectId: string, params: UpdateProjectParams): Promise<Project> {
    const response = await this.axios.put(`/projects/${projectId}`, params);
    return response.data;
  }

  /**
   * Delete a project
   */
  async delete(projectId: string): Promise<void> {
    await this.axios.delete(`/projects/${projectId}`);
  }
}
