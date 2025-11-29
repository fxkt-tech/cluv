/**
 * TimelineToolbar Component
 * Timeline editing tools and controls
 */

import { TIMELINE_TOOLS } from "../../constants/data";
import { COLORS, SIZES } from "../../constants/theme";

interface TimelineToolbarProps {
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
}

export function TimelineToolbar({
  zoomLevel = 1,
  onZoomChange,
}: TimelineToolbarProps) {
  return (
    <div
      className={`${SIZES.timelineToolbar} border-b flex items-center px-4 gap-4 justify-between`}
      style={{
        backgroundColor: COLORS.editor.bg,
        borderBottomColor: COLORS.editor.border,
      }}
    >
      <div className="flex gap-4 text-sm">
        {TIMELINE_TOOLS.map((tool) => (
          <button
            key={tool.label}
            className="hover:text-white transition-colors"
            aria-label={tool.label}
          >
            <span>{tool.label}</span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-500">-</span>
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.1}
          value={zoomLevel}
          onChange={(e) => onZoomChange?.(Number(e.target.value))}
          className="w-24 h-1 rounded-lg appearance-none cursor-pointer"
          style={{
            backgroundColor: COLORS.editor.hover,
            accentColor: COLORS.accent.cyan,
          }}
          aria-label="Timeline zoom"
        />
        <span className="text-xs text-neutral-500">+</span>
      </div>
    </div>
  );
}
