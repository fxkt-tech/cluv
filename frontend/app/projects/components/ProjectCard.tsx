import { ProjectHistory } from "../hooks/useProjectList";
import { useState } from "react";
import { useTauriCommands } from "@/app/hooks/useTauriCommands";

interface ProjectCardProps {
  project: ProjectHistory;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: (projectId: string) => void;
}

export function ProjectCard({
  project,
  isSelected,
  onSelect,
  onDelete,
}: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteProject, openProjectDir } = useTauriCommands();

  const createdDate = new Date(project.create_time).toLocaleString("sv-SE");

  const lastModifiedDate = new Date(project.last_modified).toLocaleString(
    "sv-SE",
  );

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteConfirming(true);
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await deleteProject(project.id);
      onDelete?.(project.id);
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteConfirming(false);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteConfirming(false);
  };

  const handleOpenFolder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await openProjectDir(project.path);
    } catch (error) {
      console.error("Failed to open folder:", error);
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsDeleteConfirming(false);
      }}
    >
      <button
        onClick={onSelect}
        className="w-full text-left p-4 rounded-lg border transition-all"
        style={{
          background: isSelected
            ? "var(--color-editor-bg-alt)"
            : "var(--color-editor-panel)",
          borderColor: isSelected
            ? "var(--color-accent-cyan)"
            : "var(--color-editor-border)",
          boxShadow: isSelected
            ? "0 10px 15px -3px rgba(137, 165, 168, 0.2)"
            : "none",
        }}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3
            className="text-lg font-semibold truncate flex-1"
            style={{ color: "var(--color-text-fg)" }}
          >
            {project.name}
          </h3>
          {isSelected && (
            <div
              className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "var(--color-accent-cyan)" }}
            >
              <span
                className="text-xs font-bold"
                style={{ color: "var(--color-editor-panel)" }}
              >
                ✓
              </span>
            </div>
          )}
        </div>

        <p
          className="text-xs mb-2 truncate cursor-pointer transition-colors"
          style={{ color: "var(--color-text-secondary)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--color-accent-cyan)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--color-text-secondary)")
          }
          onClick={handleOpenFolder}
          title="打开项目所在位置"
        >
          {project.path}
        </p>

        <div
          className="flex flex-col gap-1 pt-2 border-t"
          style={{ borderColor: "var(--color-editor-border)" }}
        >
          <span
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            创建: {createdDate}
          </span>
          <span
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            更新: {lastModifiedDate}
          </span>
        </div>
      </button>

      {/* Delete Button - visible on hover */}
      {isHovered && (
        <button
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className="absolute top-2 right-2 p-2 transition-colors disabled:opacity-50"
          style={{ color: "var(--color-text-secondary)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--color-accent-red)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--color-text-secondary)")
          }
          title="Delete project"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      )}

      {/* Confirmation Popup - positioned to the left of delete button */}
      {isDeleteConfirming && (
        <div
          className="absolute top-0 right-12 z-10 border rounded-lg shadow-xl p-3 w-48 pointer-events-auto"
          style={{
            background: "var(--color-editor-panel)",
            borderColor: "var(--color-editor-border)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm mb-3" style={{ color: "var(--color-text-fg)" }}>
            确定删除此项目？
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleCancelDelete}
              disabled={isDeleting}
              className="flex-1 px-3 py-1.5 text-sm rounded transition-colors disabled:opacity-50"
              style={{
                background: "var(--color-editor-bg-alt)",
                color: "var(--color-text-fg)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--color-editor-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background =
                  "var(--color-editor-bg-alt)")
              }
            >
              取消
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="flex-1 px-3 py-1.5 text-sm rounded transition-all disabled:opacity-50 flex items-center justify-center gap-1"
              style={{
                background: "var(--color-accent-red)",
                color: "var(--color-editor-panel)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              {isDeleting ? (
                <>
                  <div
                    className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: "var(--color-editor-panel)" }}
                  />
                  删除中
                </>
              ) : (
                "确定"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
