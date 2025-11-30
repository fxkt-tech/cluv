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
  const { deleteProject } = useTauriCommands();

  const createdDate = new Date(project.create_time).toLocaleString("sv-SE");

  const lastModifiedDate = new Date(project.last_modified).toLocaleString(
    "sv-SE"
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
        className={`w-full text-left p-4 rounded-lg border transition-all ${
          isSelected
            ? "bg-cyan-900/30 border-cyan-500 shadow-lg shadow-cyan-500/20"
            : "bg-slate-800 border-slate-700 hover:border-slate-600 hover:bg-slate-750"
        }`}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="text-lg font-semibold text-white truncate flex-1">
            {project.name}
          </h3>
          {isSelected && (
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
          )}
        </div>

        <p className="text-slate-400 text-xs mb-2 truncate">{project.path}</p>

        <div className="flex flex-col gap-1 pt-2 border-t border-slate-700">
          <span className="text-slate-500 text-xs">创建: {createdDate}</span>
          <span className="text-slate-500 text-xs">
            更新: {lastModifiedDate}
          </span>
        </div>
      </button>

      {/* Delete Button - visible on hover */}
      {isHovered && (
        <button
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className="absolute top-2 right-2 p-2 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
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
          className="absolute top-0 right-12 z-10 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-3 w-48 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-slate-300 text-sm mb-3">确定删除此项目？</p>
          <div className="flex gap-2">
            <button
              onClick={handleCancelDelete}
              disabled={isDeleting}
              className="flex-1 px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="flex-1 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-500 text-white rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {isDeleting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
