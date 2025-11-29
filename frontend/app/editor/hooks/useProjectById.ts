import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface ProjectHistory {
  id: string;
  name: string;
  path: string;
  create_time: string;
  last_modified: string;
}

export function useProjectById(projectId: string | null) {
  const [project, setProject] = useState<ProjectHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const loadProject = async () => {
      try {
        const result = await invoke<ProjectHistory>("get_project_by_id", {
          id: projectId,
        });
        setProject(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load project 2"
        );
        setProject(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  return { project, isLoading, error };
}
