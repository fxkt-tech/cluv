/**
 * useProjectResources Hook
 * Load and manage project resources from Tauri backend
 */

import { useState, useEffect, useCallback } from "react";
import { useTauriCommands, Resource } from "@/app/hooks/useTauriCommands";

export function useProjectResources(projectPath: string | null) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { listResources } = useTauriCommands();

  const loadResources = useCallback(async () => {
    if (!projectPath) {
      setResources([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const loadedResources = await listResources(projectPath);
      setResources(loadedResources);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load resources");
      setResources([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectPath, listResources]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const getResourcesByType = useCallback(
    (type: string) => {
      return resources.filter((r) => r.resource_type === type);
    },
    [resources]
  );

  return {
    resources,
    isLoading,
    error,
    getResourcesByType,
    loadResources,
  };
}
