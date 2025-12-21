"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProjectList, ProjectHistory } from "./hooks/useProjectList";
import { ProjectCard } from "./components/ProjectCard";
import { CreateProjectModal } from "./components/CreateProjectModal";
import { WindowControls } from "@/app/components/WindowControls";

export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projects, isLoading, error, refreshProjects } = useProjectList();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

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
    <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800 flex flex-col">
      {/* Custom Header with Window Controls */}
      <header className="h-8 flex items-center justify-between bg-slate-900/50 border-b border-slate-700 shrink-0">
        {/* macOS 窗口控制按钮 - 左侧 */}
        <div className="flex items-center h-full">
          <div className="mac-only">
            <WindowControls />
          </div>
          <div
            data-tauri-drag-region
            className="flex items-center gap-2 font-bold text-lg px-4 select-none"
          >
            <span className="text-cyan-400">KivaCut</span>
          </div>
        </div>

        {/* 中间拖拽区域 */}
        <div
          data-tauri-drag-region
          className="flex-1 flex items-center justify-center text-sm text-slate-400 select-none"
        >
          项目列表
        </div>

        {/* 右侧 - Windows 窗口控制 */}
        <div className="flex items-center h-full">
          <div className="windows-only">
            <WindowControls />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <button
              onClick={handleCreateProject}
              style={{ height: "100px" }}
              className="w-full bg-linear-to-r from-blue-500 to-green-400 hover:from-blue-600 hover:to-green-500 text-white font-medium rounded-lg transition-colors shadow-md flex items-center justify-center"
            >
              {"开始创作"}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg px-4 py-3 mb-8">
              <p className="text-red-400">⚠️ {error}</p>
            </div>
          )}

          {/* Projects Grid */}
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">
                {"草稿"}
                {projects.length > 0 && (
                  <span className="text-slate-400 ml-2">
                    ({projects.length})
                  </span>
                )}
              </h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400"></div>
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
              <div className="bg-slate-800 rounded-lg border border-slate-700 border-dashed p-8 text-center">
                <p className="text-slate-400 mb-2">还没有项目捏~</p>
                <p className="text-slate-500 text-sm">创建一个吧</p>
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
