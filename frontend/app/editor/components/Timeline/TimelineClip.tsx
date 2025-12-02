/**
 * TimelineClip Component
 * Individual clip element in timeline
 */

import { Clip } from "../../types/editor";

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
  const isVideo = clip.type === "video";

  return (
    <div
      onClick={() => onSelect?.(clip.id)}
      className={`h-8 border rounded-sm absolute flex items-center px-2 overflow-hidden cursor-pointer transition-opacity hover:opacity-80 ${
        isVideo
          ? "bg-accent-blue/25 border-accent-blue text-accent-blue"
          : "bg-accent-green/25 border-accent-green text-accent-green"
      } ${isSelected ? "outline outline-2 outline-accent-orange outline-offset-1" : ""}`}
      style={{
        left: `${clip.position.x}px`,
        top: `${clip.position.y}px`,
        width: "300px",
      }}
    >
      <span className="text-xs truncate">{clip.name}</span>
    </div>
  );
}
