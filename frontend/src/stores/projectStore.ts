import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Project interface
export interface Project {
  id: string;
  name: string;
  domain: string;
  description?: string;
  favicon?: string;
  status: 'active' | 'paused' | 'archived';
  tenantId: string;
  settings: {
    trackingEnabled: boolean;
    searchEngines: string[];
    locations: string[];
    languages: string[];
    competitors: string[];
    alertsEnabled: boolean;
    reportFrequency: 'daily' | 'weekly' | 'monthly';
  };
  stats: {
    totalKeywords: number;
    avgPosition: number;
    totalBacklinks: number;
    domainAuthority: number;
    organicTraffic: number;
    trafficChange: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Project state interface
export interface ProjectState {
  // State
  projects: Project[];
  selectedProject: Project | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProjects: () => Promise<void>;
  selectProject: (projectId: string) => void;
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  archiveProject: (projectId: string) => Promise<void>;
  updateProjectSettings: (projectId: string, settings: Partial<Project['settings']>) => Promise<void>;
  clearError: () => void;
  setLoading: (isLoading: boolean) => void;
}

// Create project store
export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      // Initial state
      projects: [],
      selectedProject: null,
      isLoading: false,
      error: null,

      // Fetch projects
      fetchProjects: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/projects', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch projects');
          }

          const projects = await response.json();

          set({
            projects,
            isLoading: false,
            error: null,
          });

          // Auto-select first project if none selected
          if (!get().selectedProject && projects.length > 0) {
            set({ selectedProject: projects[0] });
          }
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false,
          });
          throw error;
        }
      },

      // Select project
      selectProject: (projectId: string) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (project) {
          set({ selectedProject: project });

          // Persist selection
          localStorage.setItem('selected-project-id', projectId);
        }
      },

      // Create project
      createProject: async (projectData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/projects', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
            },
            body: JSON.stringify(projectData),
          });

          if (!response.ok) {
            throw new Error('Failed to create project');
          }

          const newProject = await response.json();

          set((state) => ({
            projects: [...state.projects, newProject],
            selectedProject: newProject,
            isLoading: false,
            error: null,
          }));

          return newProject;
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false,
          });
          throw error;
        }
      },

      // Update project
      updateProject: async (projectId: string, updates: Partial<Project>) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`/api/projects/${projectId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
            },
            body: JSON.stringify(updates),
          });

          if (!response.ok) {
            throw new Error('Failed to update project');
          }

          const updatedProject = await response.json();

          set((state) => ({
            projects: state.projects.map((p) => (p.id === projectId ? updatedProject : p)),
            selectedProject:
              state.selectedProject?.id === projectId ? updatedProject : state.selectedProject,
            isLoading: false,
            error: null,
          }));
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false,
          });
          throw error;
        }
      },

      // Delete project
      deleteProject: async (projectId: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`/api/projects/${projectId}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to delete project');
          }

          set((state) => {
            const filteredProjects = state.projects.filter((p) => p.id !== projectId);
            return {
              projects: filteredProjects,
              selectedProject:
                state.selectedProject?.id === projectId
                  ? filteredProjects[0] || null
                  : state.selectedProject,
              isLoading: false,
              error: null,
            };
          });
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false,
          });
          throw error;
        }
      },

      // Archive project
      archiveProject: async (projectId: string) => {
        await get().updateProject(projectId, { status: 'archived' });
      },

      // Update project settings
      updateProjectSettings: async (
        projectId: string,
        settings: Partial<Project['settings']>
      ) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (project) {
          await get().updateProject(projectId, {
            settings: { ...project.settings, ...settings },
          });
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Set loading
      setLoading: (isLoading: boolean) => set({ isLoading }),
    }),
    {
      name: 'project-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedProject: state.selectedProject,
      }),
    }
  )
);

export default useProjectStore;
