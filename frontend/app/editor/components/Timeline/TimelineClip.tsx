/**
 * TimelineClip Component
 * Individual clip element in timeline
 */

import { Clip } from "../../types/editor";
import { COLORS } from "../../constants/theme";

interface TimelineClipProps {
  clip: Clip;
  isSelected?: boolean;
  onSelect?: (clipId: string) => void;
}

export function TimelineClip({
  clip,
  isSelected,
  onSelect,
}: TimelineClipProps) {
  const clipColors =
    clip.type === "video"
      ? {
        bg: `${COLORS.accent.blue}40`,
        border: COLORS.accent.blue,
        text: COLORS.accent.blue,
      }
      : {
        bg: `${COLORS.accent.green}40`,
        border: COLORS.accent.green,
        text: COLORS.accent.green,
      };

  return (
    <div
      onClick={() => onSelect?.(clip.id)}
      className="h-8 border rounded-sm absolute flex items-center px-2 overflow-hidden cursor-pointer transition-opacity"
      style={{
        left: `${clip.position.x}px`,
        top: `${clip.position.y}px`,
        width: "300px",
        backgroundColor: clipColors.bg,
        borderColor: clipColors.border,
        outline: isSelected ? `2px solid ${COLORS.accent.orange}` : "none",
        outlineOffset: isSelected ? "1px" : "0",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "0.8";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "1";
      }}
    >
      <span className="text-xs truncate" style={{ color: clipColors.text }}>
        {clip.name}
      </span>
    </div>
  );
}
