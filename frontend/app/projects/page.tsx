"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProjectList, ProjectHistory } from "./hooks/useProjectList";
import { ProjectCard } from "./components/ProjectCard";
import { CreateProjectModal } from "./components/CreateProjectModal";
import { WindowControls } from "@/app/components/WindowControls";
import { usePlatform } from "@/app/hooks/usePlatform";
import { useTheme } from "@/app/hooks/useTheme";

export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projects, isLoading, error, refreshProjects } = useProjectList();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const platformType = usePlatform();
  useTheme();

  // Initialize modal state from URL param
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(() => {
    return searchParams.get("create") === "true";
  });

  // Clean up URL param after initial render
  useEffect(() => {
    if (searchParams.get("create") === "true") {
      router.replace("/projects");
    }
  }, [router, searchParams]);

  const handleProjectSelect = (project: ProjectHistory) => {
    setSelectedProject(project.id);
    // Redirect to editor with project ID
    router.push(`/editor?id=${encodeURIComponent(project.id)}`);
  };

  const handleCreateProject = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateProjectClose = () => {
    setIsCreateModalOpen(false);
  };

  const handleProjectCreated = () => {
    refreshProjects();
  };

  const handleProjectDeleted = () => {
    setSelectedProject(null);
    refreshProjects();
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-editor-bg)" }}
    >
      {/* Custom Header with Window Controls */}
      <header
        className="h-8 flex items-center justify-between border-b shrink-0"
        style={{
          background: "var(--color-editor-panel)",
          borderColor: "var(--color-editor-border)",
        }}
      >
        {/* macOS 窗口控制按钮 - 左侧 */}
        <div className="flex items-center h-full">
          <WindowControls
            platform={platformType === "macos" ? "macos" : null}
          />
          <div
            data-tauri-drag-region
            className="flex items-center gap-2 font-bold text-lg px-4 select-none"
          >
            <span style={{ color: "var(--color-accent-cyan)" }}>KivaCut</span>
          </div>
        </div>

        {/* 中间拖拽区域 */}
        <div
          data-tauri-drag-region
          className="flex-1 flex items-center justify-center text-sm select-none"
          style={{ color: "var(--color-text-secondary)" }}
        >
          项目列表
        </div>

        {/* 右侧 - Windows 窗口控制 */}
        <div className="flex items-center h-full">
          <WindowControls
            platform={platformType === "windows" ? "windows" : null}
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <button
              onClick={handleCreateProject}
              style={{
                height: "100px",
                background: `linear-gradient(to right, var(--color-accent-blue), var(--color-accent-green))`,
                color: "var(--color-editor-panel)",
              }}
              className="w-full font-medium rounded-lg transition-all shadow-md flex items-center justify-center hover:opacity-90"
            >
              {"开始创作"}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="border rounded-lg px-4 py-3 mb-8"
              style={{
                background: "var(--color-accent-red)",
                borderColor: "var(--color-accent-red)",
                opacity: 0.3,
              }}
            >
              <p style={{ color: "var(--color-accent-red)" }}>⚠️ {error}</p>
            </div>
          )}

          {/* Projects Grid */}
          <div>
            <div className="mb-6">
              <h2
                className="text-xl font-semibold"
                style={{ color: "var(--color-text-fg)" }}
              >
                {"草稿"}
                {projects.length > 0 && (
                  <span
                    className="ml-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    ({projects.length})
                  </span>
                )}
              </h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div
                  className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2"
                  style={{ borderColor: "var(--color-accent-cyan)" }}
                ></div>
              </div>
            ) : projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    isSelected={selectedProject === project.id}
                    onSelect={() => handleProjectSelect(project)}
                    onDelete={handleProjectDeleted}
                  />
                ))}
              </div>
            ) : (
              <div
                className="rounded-lg border border-dashed p-8 text-center"
                style={{
                  background: "var(--color-editor-panel)",
                  borderColor: "var(--color-editor-border)",
                }}
              >
                <p
                  className="mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  还没有项目捏~
                </p>
                <p
                  className="text-sm"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  创建一个吧
                </p>
              </div>
            )}
          </div>

          {/* Create Project Modal */}
          <CreateProjectModal
            isOpen={isCreateModalOpen}
            onClose={handleCreateProjectClose}
            onProjectCreated={handleProjectCreated}
          />
        </div>
      </div>
    </div>
  );
}
