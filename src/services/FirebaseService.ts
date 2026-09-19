import { Project } from '../models/Bathroom';

const LOCAL_STORAGE_KEY = 'ai_bathroom_designer_projects';

export class FirebaseService {
  private static instance: FirebaseService;

  private constructor() {}

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  /**
   * Saves project to cloud/local storage.
   */
  public async saveProject(project: Project): Promise<{ success: boolean; id: string }> {
    try {
      const existing = this.getSavedProjects();
      const updated = existing.filter(p => p.id !== project.id);
      updated.unshift({
        ...project,
        updatedAt: new Date().toISOString()
      });

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return { success: true, id: project.id };
    } catch (err) {
      console.error('Error saving project:', err);
      return { success: false, id: project.id };
    }
  }

  /**
   * Loads project by ID.
   */
  public async loadProject(id: string): Promise<Project | null> {
    const projects = this.getSavedProjects();
    return projects.find(p => p.id === id) || null;
  }

  /**
   * Returns all saved projects.
   */
  public getSavedProjects(): Project[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Deletes a project by ID.
   */
  public deleteProject(id: string): boolean {
    try {
      const existing = this.getSavedProjects();
      const filtered = existing.filter(p => p.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch {
      return false;
    }
  }
}

export const firebaseService = FirebaseService.getInstance();
