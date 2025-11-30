/**
 * ResourceGrid Component
 * Displays resource items in a grid layout
 */

import { COLORS } from "../constants/theme";
import { useState } from "react";
import { useTauriCommands } from "@/app/hooks/useTauriCommands";

interface BackendResource {
  id: string;
  name: string;
  path: string;
  resource_type: string;
}

interface ResourceGridProps {
  resources: BackendResource[];
  onSelect?: (resource: BackendResource) => void;
  projectPath?: string | null;
  onDelete?: () => void;
}

export function ResourceGrid({
  resources,
  onSelect,
  projectPath,
  onDelete,
}: ResourceGridProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { deleteMaterial } = useTauriCommands();

  const handleDelete = async (
    e: React.MouseEvent<HTMLButtonElement>,
    resource: BackendResource
  ) => {
    e.stopPropagation();
    if (!projectPath || deletingId) return;

    setDeletingId(resource.id);
    try {
      await deleteMaterial(projectPath, resource.id);
      onDelete?.();
    } catch (error) {
      console.error("Failed to delete material:", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {resources.map((resource) => (
        <div
          key={resource.id}
          onClick={() => onSelect?.(resource)}
          className="aspect-square rounded hover:border-2 cursor-pointer group relative transition-all"
          style={{
            backgroundColor: COLORS.editor.panel,
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-600 group-hover:text-neutral-400 rounded p-1 text-center">
            {resource.name}
          </div>

          {/* Delete button - hidden by default, shown on hover */}
          <button
            onClick={(e) => handleDelete(e, resource)}
            disabled={deletingId === resource.id}
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-600/80 disabled:opacity-50"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.6)",
              color: "white",
              fontSize: "12px",
            }}
            title="Delete material"
            aria-label="Delete material"
          >
            {deletingId === resource.id ? "..." : "✕"}
          </button>
        </div>
      ))}
    </div>
  );
}
