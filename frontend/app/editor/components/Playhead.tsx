// Playhead 组件 - 播放指针

"use client";

import React, { useRef, useState } from "react";
import { useTimelineStore } from "../stores/timelineStore";
import { pixelsToTime, timeToPixels } from "../utils/timeline";
import { TIMELINE_CONFIG } from "../types/timeline";

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

  // 计算 playhead 的位置
  const playheadLeft = timeToPixels(currentTime, pixelsPerSecond) - scrollLeft;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      time: currentTime,
    };
  };

  React.useEffect(() => {
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

  // 点击标尺跳转
  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return; // 拖拽时不响应点击

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = pixelsToTime(x + scrollLeft, pixelsPerSecond);
    const clampedTime = Math.max(0, Math.min(duration, time));
    setCurrentTime(clampedTime);
  };

  return (
    <>
      {/* 点击区域覆盖层 */}
      <div
        className="absolute top-0 left-0 right-0 cursor-pointer"
        style={{
          height: TIMELINE_CONFIG.RULER_HEIGHT,
          zIndex: 5,
        }}
        onClick={handleRulerClick}
      />

      {/* Playhead 线和头部 */}
      <div
        className="absolute top-0 pointer-events-none"
        style={{
          left: `${playheadLeft}px`,
          height: `${containerHeight}px`,
          zIndex: 10,
        }}
      >
        {/* Playhead 头部（可拖拽） */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 pointer-events-auto cursor-ew-resize ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={{
            width: "14px",
            height: "14px",
            marginTop: "2px",
          }}
          onMouseDown={handleMouseDown}
        >
          {/* 三角形头部 */}
          <div
            className="w-0 h-0"
            style={{
              borderLeft: "7px solid transparent",
              borderRight: "7px solid transparent",
              borderTop: "10px solid #3b82f6",
            }}
          />
        </div>

        {/* Playhead 垂直线 */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 bg-blue-500"
          style={{
            width: "2px",
            height: "100%",
            opacity: isDragging ? 0.8 : 0.6,
          }}
        />
      </div>
    </>
  );
};
