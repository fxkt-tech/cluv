/**
 * ResourceGrid Component
 * Displays resource items in a grid layout
 */

import { COLORS } from "../constants/theme";

interface BackendResource {
  id: string;
  name: string;
  path: string;
  resource_type: string;
}

interface ResourceGridProps {
  resources: BackendResource[];
  onSelect?: (resource: BackendResource) => void;
}

export function ResourceGrid({ resources, onSelect }: ResourceGridProps) {
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
        </div>
      ))}
    </div>
  );
}
