/**
 * Project Types
 */

export interface Project {
  name: string;
  path: string;
  created_at: string;
}

export interface ProjectFormData {
  projectName: string;
  projectPath: string;
}

export type ProjectStatus = "idle" | "creating" | "error" | "success";
