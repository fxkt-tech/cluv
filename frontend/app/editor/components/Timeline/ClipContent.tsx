// ClipContent 组件 - 可复用的 Clip 视觉渲染组件

"use client";

import React from "react";
import { Clip, MediaType } from "../../types/timeline";
import { TIMELINE_CONFIG } from "../../types/timeline";
import { useTimelineStore } from "../../stores/timelineStore";
import { timeToPixels } from "../../utils/timeline";
import { formatTime } from "../../utils/time";

interface ClipContentProps {
  clip: Clip;
  isSelected?: boolean;
  isDragging?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const ClipContent: React.FC<ClipContentProps> = ({
  clip,
  isSelected = false,
  isDragging = false,
  className = "",
  style = {},
}) => {
  const pixelsPerSecond = useTimelineStore((state) => state.pixelsPerSecond);

  // 计算宽度
  const width = timeToPixels(clip.duration, pixelsPerSecond);

  // 根据类型选择颜色
  const getClipColor = (type: MediaType) => {
    switch (type) {
      case "video":
        return "bg-accent-blue border-accent-blue/80";
      case "audio":
        return "bg-accent-green border-accent-green/80";
      case "image":
        return "bg-accent-magenta border-accent-magenta/80";
      case "text":
        return "bg-accent-yellow border-accent-yellow/80";
      default:
        return "bg-text-muted border-text-muted/80";
    }
  };

  const mergedStyle = {
    width: `${Math.max(width, TIMELINE_CONFIG.MIN_CLIP_WIDTH)}px`,
    height: `${TIMELINE_CONFIG.TRACK_HEIGHT - 8}px`,
    ...style,
  };

  return (
    <div
      className={`rounded border-2 overflow-hidden ${getClipColor(clip.type)} ${
        isSelected
          ? "ring-2 ring-white ring-offset-2 ring-offset-editor-bg"
          : ""
      } ${isDragging ? "opacity-50" : ""} ${className}`}
      style={mergedStyle}
    >
      {/* Clip 内容 */}
      <div className="px-2 py-1 h-full flex flex-col justify-between text-white text-xs">
        <div className="font-medium truncate">{clip.name}</div>
        <div className="text-[10px] opacity-75">
          {formatTime(clip.duration)}
          {/*{clip.duration.toFixed(2)}s*/}
        </div>
      </div>
    </div>
  );
};
