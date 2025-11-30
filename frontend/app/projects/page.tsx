"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProjectList, ProjectHistory } from "./hooks/useProjectList";
import { ProjectCard } from "./components/ProjectCard";
import { CreateProjectModal } from "./components/CreateProjectModal";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="mb-12">
          <button
            onClick={handleCreateProject}
            style={{ height: "100px" }}
            className="w-full bg-gradient-to-r from-blue-500 to-green-400 hover:from-blue-600 hover:to-green-500 text-white font-medium rounded-lg transition-colors shadow-md flex items-center justify-center"
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
                <span className="text-slate-400 ml-2">({projects.length})</span>
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
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={handleCreateProjectClose}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}
