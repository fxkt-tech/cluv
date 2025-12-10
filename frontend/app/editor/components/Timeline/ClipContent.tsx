// ClipContent 组件 - 可复用的 Clip 视觉渲染组件

"use client";

import React from "react";
import { Clip, MediaType } from "../../types/timeline";
import { TIMELINE_CONFIG } from "../../types/timeline";
import { useTimelineStore } from "../../stores/timelineStore";
import { timeToPixels } from "../../utils/timeline";

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
        return "bg-blue-600 border-blue-500";
      case "audio":
        return "bg-green-600 border-green-500";
      case "image":
        return "bg-purple-600 border-purple-500";
      case "text":
        return "bg-yellow-600 border-yellow-500";
      default:
        return "bg-gray-600 border-gray-500";
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
        isSelected ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900" : ""
      } ${isDragging ? "opacity-50" : ""} ${className}`}
      style={mergedStyle}
    >
      {/* Clip 内容 */}
      <div className="px-2 py-1 h-full flex flex-col justify-between text-white text-xs">
        <div className="font-medium truncate">{clip.name}</div>
        <div className="text-[10px] opacity-75">
          {clip.duration.toFixed(2)}s
        </div>
      </div>
    </div>
  );
};
