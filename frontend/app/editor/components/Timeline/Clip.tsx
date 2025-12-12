// TimelineClip 组件 - 时间轴上的片段

"use client";

import React, { useState, useRef, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Clip } from "../../types/timeline";
import { useTimelineStore } from "../../stores/timelineStore";
import { timeToPixels, pixelsToTime, snapToFrame } from "../../utils/timeline";
import { ClipContent } from "./ClipContent";

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
  const fps = useTimelineStore((state) => state.fps);

  // 边缘调整状态
  const [resizingEdge, setResizingEdge] = useState<ResizeEdge>(null);
  const resizeStartRef = useRef<{
    x: number;
    startTime: number;
    duration: number;
    trimStart: number;
    trimEnd: number;
  } | null>(null);

  // 计算 clip 的位置
  const left = timeToPixels(clip.startTime, pixelsPerSecond);

  // 配置拖拽（边缘调整时禁用）
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
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
        let newStartTime = Math.max(
          0,
          resizeStartRef.current.startTime + deltaTime,
        );
        // 应用帧对齐
        newStartTime = snapToFrame(newStartTime, fps);

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
        let newDuration = Math.max(
          0.1,
          resizeStartRef.current.duration + deltaTime,
        );
        // 应用帧对齐 - 通过对结束时间进行帧对齐来计算新的 duration
        const endTime = resizeStartRef.current.startTime + newDuration;
        const snappedEndTime = snapToFrame(endTime, fps);
        newDuration = snappedEndTime - resizeStartRef.current.startTime;

        const newTrimEnd = resizeStartRef.current.trimStart + newDuration;

        // 确保不超过原始媒体长度
        const originalDuration =
          resizeStartRef.current.trimEnd - resizeStartRef.current.trimStart;
        if (newDuration <= originalDuration + 0.01 && newDuration > 0) {
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
  }, [resizingEdge, clip.id, pixelsPerSecond, updateClip, fps]);

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...(!resizingEdge ? listeners : {})}
      className={`absolute top-1 ${
        resizingEdge ? "cursor-ew-resize" : "cursor-grab active:cursor-grabbing"
      }`}
      style={{
        left: `${left}px`,
        opacity: isDragging ? 0 : 1,
      }}
      onClick={handleClick}
    >
      <ClipContent
        clip={clip}
        isSelected={isSelected}
        isDragging={isDragging}
      />

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
