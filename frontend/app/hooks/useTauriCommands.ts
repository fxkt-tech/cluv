/**
 * useTauriCommands Hook
 * Wrapper for Tauri IPC commands
 */

import { invoke } from "@tauri-apps/api/core";
import { useMemo } from "react";

export interface ProjectHistory {
  id: string;
  name: string;
  path: string;
  create_time: string;
  last_modified: string;
}

export interface Resource {
  id: string;
  name: string;
  path: string;
  resource_type: string;
}

export function useTauriCommands() {
  const createProject = async (
    projectName: string,
    projectPath: string
  ): Promise<ProjectHistory> => {
    try {
      return await invoke<ProjectHistory>("create_project", {
        projectName,
        projectPath,
      });
    } catch (error) {
      throw new Error(`Failed to create project: ${error}`);
    }
  };

  const listResources = async (projectPath: string): Promise<Resource[]> => {
    try {
      return await invoke<Resource[]>("list_resources", {
        projectPath,
      });
    } catch (error) {
      throw new Error(`Failed to list resources: ${error}`);
    }
  };

  const importResource = async (
    projectPath: string,
    sourcePath: string
  ): Promise<Resource> => {
    try {
      return await invoke<Resource>("import_resource", {
        projectPath,
        sourcePath,
      });
    } catch (error) {
      throw new Error(`Failed to import resource: ${error}`);
    }
  };

  const importResourceFile = async (
    projectPath: string,
    fileName: string,
    base64Content: string
  ): Promise<Resource> => {
    try {
      return await invoke<Resource>("import_resource_file", {
        projectPath,
        fileName,
        base64Content,
      });
    } catch (error) {
      throw new Error(`Failed to import resource file: ${error}`);
    }
  };

  const openProjectDir = async (projectPath: string): Promise<void> => {
    try {
      return await invoke<void>("open_project_dir", {
        projectPath,
      });
    } catch (error) {
      throw new Error(`Failed to open project directory: ${error}`);
    }
  };

  const deleteProject = async (projectId: string): Promise<void> => {
    try {
      return await invoke<void>("delete_project", {
        projectId,
      });
    } catch (error) {
      throw new Error(`Failed to delete project: ${error}`);
    }
  };

  const getDefaultProjectsDir = async (): Promise<string> => {
    try {
      return await invoke<string>("get_default_projects_dir");
    } catch (error) {
      throw new Error(`Failed to get default projects directory: ${error}`);
    }
  };

  return useMemo(
    () => ({
      createProject,
      listResources,
      importResource,
      importResourceFile,
      openProjectDir,
      deleteProject,
      getDefaultProjectsDir,
    }),
    []
  );
}
