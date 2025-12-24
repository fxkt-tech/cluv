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
    ],
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
        <div
          className="rounded-lg shadow-2xl border w-full max-w-md"
          style={{
            background: "var(--color-editor-panel)",
            borderColor: "var(--color-editor-border)",
          }}
        >
          {/* Header */}
          <div
            className="px-6 py-4 border-b flex justify-between items-center"
            style={{ borderColor: "var(--color-editor-border)" }}
          >
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--color-text-fg)" }}
            >
              创建新项目
            </h2>
            <button
              onClick={handleClose}
              disabled={status === "creating"}
              className="transition-colors disabled:opacity-50"
              style={{ color: "var(--color-text-secondary)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--color-text-fg)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--color-text-secondary)")
              }
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
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 transition-all"
                style={{
                  background: "var(--color-editor-bg-alt)",
                  borderColor: "var(--color-editor-border)",
                  color: "var(--color-text-fg)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor =
                    "var(--color-accent-cyan)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor =
                    "var(--color-editor-border)";
                }}
                disabled={status === "creating"}
                autoFocus
              />
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="p-3 border rounded-lg"
                style={{
                  background: "var(--color-accent-red)",
                  borderColor: "var(--color-accent-red)",
                  opacity: 0.3,
                }}
              >
                <p
                  className="text-sm"
                  style={{ color: "var(--color-accent-red)" }}
                >
                  {error}
                </p>
              </div>
            )}

            {/* Success Message */}
            {status === "success" && (
              <div
                className="p-3 border rounded-lg"
                style={{
                  background: "var(--color-accent-green)",
                  borderColor: "var(--color-accent-green)",
                  opacity: 0.3,
                }}
              >
                <p
                  className="text-sm"
                  style={{ color: "var(--color-accent-green)" }}
                >
                  ✓ Project created successfully!
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={status === "creating"}
                className="flex-1 px-4 py-2 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
                style={{
                  background: "var(--color-accent-cyan)",
                  color: "var(--color-editor-panel)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {status === "creating" ? (
                  <>
                    <div
                      className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: "var(--color-editor-panel)" }}
                    />
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
