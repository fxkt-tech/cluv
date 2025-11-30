/**
 * CreateProjectModal Component
 * Modal dialog for creating a new project
 */

import { useState, useCallback } from "react";
import { useTauriCommands } from "@/app/hooks/useTauriCommands";

export interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onProjectCreated,
}: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState("");
  const [status, setStatus] = useState<
    "idle" | "creating" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const { createProject, getDefaultProjectsDir } = useTauriCommands();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setStatus("creating");
      setError(null);

      if (!projectName.trim()) {
        setError("Project name is required");
        setStatus("error");
        return;
      }

      try {
        const projectsDir = await getDefaultProjectsDir();
        // Pass only the base path; the backend will generate the project ID as the directory name
        await createProject(projectName, projectsDir);

        setStatus("success");
        setProjectName("");

        // Close modal after a short delay to show success message
        setTimeout(() => {
          onClose();
          onProjectCreated();
        }, 1000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        setStatus("error");
      }
    },
    [
      projectName,
      createProject,
      getDefaultProjectsDir,
      onClose,
      onProjectCreated,
    ]
  );

  const handleClose = () => {
    if (status === "creating") return;
    setProjectName("");
    setStatus("idle");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-lg shadow-2xl border border-slate-700 w-full max-w-md">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">创建新项目</h2>
            <button
              onClick={handleClose}
              disabled={status === "creating"}
              className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Project Name Input */}
            <div>
              <input
                type="text"
                value={projectName}
                onChange={(e) => {
                  setProjectName(e.target.value);
                  setError(null);
                }}
                placeholder="项目名称"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                disabled={status === "creating"}
                autoFocus
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {status === "success" && (
              <div className="p-3 bg-green-900/20 border border-green-800 rounded-lg">
                <p className="text-sm text-green-400">
                  ✓ Project created successfully!
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={status === "creating"}
                className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
              >
                {status === "creating" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {"创建中..."}
                  </>
                ) : (
                  "创建"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
