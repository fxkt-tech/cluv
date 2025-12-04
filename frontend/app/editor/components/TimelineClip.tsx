// TimelineClip 组件 - 时间轴上的片段

"use client";

import React, { useState, useRef, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Clip } from "../types/timeline";
import { useTimelineStore } from "../stores/timelineStore";
import { timeToPixels, pixelsToTime } from "../utils/timeline";
import { TIMELINE_CONFIG } from "../types/timeline";

type ResizeEdge = "left" | "right" | null;

interface TimelineClipProps {
  clip: Clip;
  isSelected: boolean;
}

export const TimelineClip: React.FC<TimelineClipProps> = ({
  clip,
  isSelected,
}) => {
  const pixelsPerSecond = useTimelineStore((state) => state.pixelsPerSecond);
  const selectClip = useTimelineStore((state) => state.selectClip);
  const updateClip = useTimelineStore((state) => state.updateClip);

  // 边缘调整状态
  const [resizingEdge, setResizingEdge] = useState<ResizeEdge>(null);
  const resizeStartRef = useRef<{
    x: number;
    startTime: number;
    duration: number;
    trimStart: number;
    trimEnd: number;
  } | null>(null);

  // 计算 clip 的位置和宽度
  const left = timeToPixels(clip.startTime, pixelsPerSecond);
  const width = timeToPixels(clip.duration, pixelsPerSecond);

  // 配置拖拽（边缘调整时禁用）
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `clip-${clip.id}`,
      data: {
        type: "clip",
        clipId: clip.id,
        trackId: clip.trackId,
      },
      disabled: resizingEdge !== null,
    });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      selectClip(clip.id, true);
    } else {
      selectClip(clip.id, false);
    }
  };

  // 处理边缘拖拽开始
  const handleEdgeMouseDown = (e: React.MouseEvent, edge: "left" | "right") => {
    e.stopPropagation();
    setResizingEdge(edge);
    resizeStartRef.current = {
      x: e.clientX,
      startTime: clip.startTime,
      duration: clip.duration,
      trimStart: clip.trimStart,
      trimEnd: clip.trimEnd,
    };
  };

  // 处理边缘拖拽
  useEffect(() => {
    if (!resizingEdge || !resizeStartRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeStartRef.current) return;

      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaTime = pixelsToTime(deltaX, pixelsPerSecond);

      if (resizingEdge === "left") {
        // 左边缘调整：修改 startTime 和 trimStart
        const newStartTime = Math.max(
          0,
          resizeStartRef.current.startTime + deltaTime,
        );
        const actualDelta = newStartTime - resizeStartRef.current.startTime;
        const newDuration = Math.max(
          0.1,
          resizeStartRef.current.duration - actualDelta,
        );
        const newTrimStart = Math.max(
          0,
          resizeStartRef.current.trimStart + actualDelta,
        );

        // 确保不超过原始媒体长度
        if (newTrimStart < resizeStartRef.current.trimEnd) {
          updateClip(clip.id, {
            startTime: newStartTime,
            duration: newDuration,
            trimStart: newTrimStart,
          });
        }
      } else if (resizingEdge === "right") {
        // 右边缘调整：修改 duration 和 trimEnd
        const newDuration = Math.max(
          0.1,
          resizeStartRef.current.duration + deltaTime,
        );
        const newTrimEnd = resizeStartRef.current.trimStart + newDuration;

        // 确保不超过原始媒体长度
        const originalDuration =
          resizeStartRef.current.trimEnd - resizeStartRef.current.trimStart;
        if (newDuration <= originalDuration + 0.01) {
          updateClip(clip.id, {
            duration: newDuration,
            trimEnd: newTrimEnd,
          });
        }
      }
    };

    const handleMouseUp = () => {
      setResizingEdge(null);
      resizeStartRef.current = null;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizingEdge, clip.id, pixelsPerSecond, updateClip]);

  // 计算拖拽时的样式
  const dragStyle = transform
    ? {
        transform: CSS.Transform.toString(transform),
        zIndex: 1000,
      }
    : {};

  // 根据类型选择颜色
  const getClipColor = () => {
    switch (clip.type) {
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

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...(!resizingEdge ? listeners : {})}
      className={`absolute top-1 rounded border-2 overflow-hidden transition-all ${getClipColor()} ${
        isSelected ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900" : ""
      } ${isDragging ? "opacity-50" : ""} ${
        resizingEdge ? "cursor-ew-resize" : "cursor-grab active:cursor-grabbing"
      }`}
      style={{
        left: `${left}px`,
        width: `${Math.max(width, TIMELINE_CONFIG.MIN_CLIP_WIDTH)}px`,
        height: `${TIMELINE_CONFIG.TRACK_HEIGHT - 8}px`,
        ...dragStyle,
      }}
      onClick={handleClick}
    >
      {/* Clip 内容 */}
      <div className="px-2 py-1 h-full flex flex-col justify-between text-white text-xs">
        <div className="font-medium truncate">{clip.name}</div>
        <div className="text-[10px] opacity-75">
          {clip.duration.toFixed(2)}s
        </div>
      </div>

      {/* 左侧调整手柄 */}
      {!isDragging && (
        <>
          <div
            className={`absolute left-0 top-0 bottom-0 w-2 bg-white cursor-ew-resize z-10 transition-opacity ${
              resizingEdge === "left"
                ? "opacity-100"
                : "opacity-0 hover:opacity-100"
            }`}
            onMouseDown={(e) => handleEdgeMouseDown(e, "left")}
            style={{
              background:
                resizingEdge === "left"
                  ? "rgba(255, 255, 255, 0.8)"
                  : "rgba(255, 255, 255, 0.5)",
            }}
          />

          {/* 右侧调整手柄 */}
          <div
            className={`absolute right-0 top-0 bottom-0 w-2 bg-white cursor-ew-resize z-10 transition-opacity ${
              resizingEdge === "right"
                ? "opacity-100"
                : "opacity-0 hover:opacity-100"
            }`}
            onMouseDown={(e) => handleEdgeMouseDown(e, "right")}
            style={{
              background:
                resizingEdge === "right"
                  ? "rgba(255, 255, 255, 0.8)"
                  : "rgba(255, 255, 255, 0.5)",
            }}
          />
        </>
      )}
    </div>
  );
};
