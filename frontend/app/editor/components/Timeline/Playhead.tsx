// Playhead 组件 - 播放指针（新架构：固定垂直位置和高度）

"use client";

import React, { useRef, useState, useEffect } from "react";
import { useTimelineStore } from "@/app/editor/stores/timelineStore";
import { pixelsToTime, timeToPixels } from "@/app/editor/utils/timeline";

interface PlayheadProps {
  containerWidth: number;
  containerHeight: number;
}

export const Playhead: React.FC<PlayheadProps> = ({
  containerWidth,
  containerHeight,
}) => {
  const currentTime = useTimelineStore((state) => state.currentTime);
  const setCurrentTime = useTimelineStore((state) => state.setCurrentTime);
  const pixelsPerSecond = useTimelineStore((state) => state.pixelsPerSecond);
  const scrollLeft = useTimelineStore((state) => state.scrollLeft);
  const duration = useTimelineStore((state) => state.duration);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; time: number } | null>(null);

  // 计算 playhead 在可视区域中的水平位置
  // playhead 的实际位置 = 时间对应的像素位置 - 滚动偏移量
  const playheadPosition = timeToPixels(currentTime, pixelsPerSecond);
  const playheadLeft = playheadPosition - scrollLeft;

  // 判断 playhead 是否在可视区域内
  const isVisible = playheadLeft >= -10 && playheadLeft <= containerWidth + 10;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      time: currentTime,
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaTime = pixelsToTime(deltaX, pixelsPerSecond);
      const newTime = Math.max(
        0,
        Math.min(duration, dragStartRef.current.time + deltaTime),
      );

      setCurrentTime(newTime);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, currentTime, pixelsPerSecond, duration, setCurrentTime]);

  if (!isVisible) {
    return null; // 不在可视区域内时不渲染
  }

  return (
    <div
      className="absolute top-0 pointer-events-none"
      style={{
        left: `${playheadLeft}px`,
        height: `${containerHeight}px`,
      }}
    >
      {/* Playhead 头部（可拖拽） */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 pointer-events-auto z-20 ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          width: "16px",
          height: "16px",
          marginTop: "-6px", // 向上偏移，让三角形在标尺区域
        }}
        onMouseDown={handleMouseDown}
        title={`Current Time: ${currentTime.toFixed(2)}s`}
      >
        {/* 三角形头部 */}
        <div
          className="w-0 h-0"
          style={{
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderTop: "8px solid #000",
          }}
        />
      </div>

      {/* Playhead 垂直线 */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "2px",
          height: "100%",
          backgroundColor: isDragging ? "#FF0000" : "#000000",
          opacity: isDragging ? 1 : 0.7,
          boxShadow: isDragging
            ? "0 0 4px rgba(255, 0, 0, 0.5)"
            : "0 0 2px rgba(0, 0, 0, 0.3)",
        }}
      />
    </div>
  );
};
