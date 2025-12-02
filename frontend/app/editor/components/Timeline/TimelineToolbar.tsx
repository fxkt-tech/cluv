/**
 * TimelineToolbar Component
 * Timeline editing tools and controls
 */

import { TIMELINE_TOOLS } from "../../constants/data";

interface TimelineToolbarProps {
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
}

export function TimelineToolbar({
  zoomLevel = 1,
  onZoomChange,
}: TimelineToolbarProps) {
  return (
    <div className="h-8 border-b border-editor-border bg-editor-bg flex items-center px-4 gap-4 justify-between">
      <div className="flex gap-4 text-sm">
        {TIMELINE_TOOLS.map((tool) => (
          <button
            key={tool.label}
            className="text-text-secondary hover:text-text-fg transition-colors"
            aria-label={tool.label}
          >
            <span>{tool.label}</span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted">-</span>
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.1}
          value={zoomLevel}
          onChange={(e) => onZoomChange?.(Number(e.target.value))}
          className="w-24 h-1 rounded-lg appearance-none cursor-pointer bg-editor-hover accent-accent-blue"
          aria-label="Timeline zoom"
        />
        <span className="text-xs text-text-muted">+</span>
      </div>
    </div>
  );
}
