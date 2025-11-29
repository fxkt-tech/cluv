/**
 * useProjectForm Hook
 * Manage project creation form state
 */

import { useState, useCallback } from "react";
import { useTauriCommands } from "@/app/hooks/useTauriCommands";
import { ProjectFormData, ProjectStatus } from "../types";

export function useProjectForm() {
  const [formData, setFormData] = useState<ProjectFormData>({
    projectName: "",
    projectPath: "",
  });
  const [status, setStatus] = useState<ProjectStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const { createProject, getDefaultProjectsDir } = useTauriCommands();

  const updateField = useCallback(
    (field: keyof ProjectFormData, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      setError(null);
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setStatus("creating");
      setError(null);

      if (!formData.projectName.trim()) {
        setError("Project name is required");
        setStatus("error");
        return;
      }

      try {
        const projectsDir = await getDefaultProjectsDir();
        const projectPath = `${projectsDir}/${formData.projectName}`;

        await createProject(formData.projectName, projectPath);

        setStatus("success");
        setFormData({
          projectName: "",
          projectPath: "",
        });

        return projectPath;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        setStatus("error");
      }
    },
    [formData.projectName, createProject, getDefaultProjectsDir]
  );

  const reset = useCallback(() => {
    setFormData({
      projectName: "",
      projectPath: "",
    });
    setStatus("idle");
    setError(null);
  }, []);

  return {
    formData,
    status,
    error,
    updateField,
    handleSubmit,
    reset,
  };
}
