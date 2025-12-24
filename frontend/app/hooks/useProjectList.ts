import { useState, useCallback, useEffect, useRef } from "react";
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
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const loadProjects = useCallback(async () => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const result = await invoke<ProjectHistory[]>("list_projects_history");

      // Check if component is still mounted
      if (isMountedRef.current) {
        setProjects(result || []);
      }
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      // Check if component is still mounted
      if (isMountedRef.current) {
        setError(
          err instanceof Error ? err.message : "Failed to load projects",
        );
        setProjects([]);
      }
    } finally {
      // Check if component is still mounted
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // Add a small delay to prevent blocking initial render
    const timer = setTimeout(() => {
      loadProjects();
    }, 100);

    return () => {
      clearTimeout(timer);
      isMountedRef.current = false;

      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [loadProjects]);

  const refreshProjects = useCallback(() => {
    // Add a small debounce to prevent rapid refreshes
    const timer = setTimeout(() => {
      loadProjects();
    }, 50);

    return () => clearTimeout(timer);
  }, [loadProjects]);

  return { projects, isLoading, error, refreshProjects };
}
