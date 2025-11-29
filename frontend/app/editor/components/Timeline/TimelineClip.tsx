/**
 * TimelineClip Component
 * Individual clip element in timeline
 */

import { Clip } from "../types/editor";

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
  const bgColor =
    clip.type === "video"
      ? "bg-cyan-900/50 border-cyan-700"
      : "bg-green-900/50 border-green-700";

  const textColor = clip.type === "video" ? "text-cyan-200" : "text-green-200";

  return (
    <div
      onClick={() => onSelect?.(clip.id)}
      className={`h-8 border rounded-sm absolute flex items-center px-2 overflow-hidden cursor-pointer transition-opacity hover:opacity-80 ${bgColor} ${
        isSelected ? "ring-2 ring-yellow-400" : ""
      }`}
      style={{
        left: `${clip.position.x}px`,
        top: `${clip.position.y}px`,
        width: "300px",
      }}
    >
      <span className={`text-xs truncate ${textColor}`}>{clip.name}</span>
    </div>
  );
}
