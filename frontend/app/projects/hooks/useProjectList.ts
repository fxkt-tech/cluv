import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface ProjectHistory {
  id: string;
  name: string;
  path: string;
  create_time: string;
  last_modified: string;
}

export function useProjectList() {
  const [projects, setProjects] = useState<ProjectHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await invoke<ProjectHistory[]>("list_projects_history");
      setProjects(result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const refreshProjects = useCallback(() => {
    loadProjects();
  }, [loadProjects]);

  return { projects, isLoading, error, refreshProjects };
}
