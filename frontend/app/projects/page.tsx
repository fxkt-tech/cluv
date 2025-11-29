"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectList, ProjectHistory } from "./hooks/useProjectList";
import { ProjectCard } from "./components/ProjectCard";

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, isLoading, error } = useProjectList();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const handleProjectSelect = (project: ProjectHistory) => {
    setSelectedProject(project.id);
    // Redirect to editor with project ID
    router.push(`/editor?id=${encodeURIComponent(project.id)}`);
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <button
          onClick={handleBackToHome}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-6"
        >
          <span className="text-xl">←</span>
          <span>Back to Home</span>
        </button>

        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Open Project</h1>
            <p className="text-slate-400">
              Select a project to open and continue editing
            </p>
          </div>
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
              Available Projects
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
                />
              ))}
            </div>
          ) : (
            <div className="bg-slate-800 rounded-lg border border-slate-700 border-dashed p-8 text-center">
              <p className="text-slate-400 mb-2">No projects found</p>
              <p className="text-slate-500 text-sm">
                Create a new project to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
