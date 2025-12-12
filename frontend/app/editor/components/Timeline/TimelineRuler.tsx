// TimelineRuler 组件 - 时间轴标尺

"use client";

import React from "react";
import { useTimelineStore } from "../../stores/timelineStore";
import {
  calculateTimeMarks,
  timeToPixels,
  pixelsToTime,
} from "../../utils/timeline";
import { TIMELINE_CONFIG } from "../../types/timeline";

interface TimelineRulerProps {
  width: number;
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({ width }) => {
  const pixelsPerSecond = useTimelineStore((state) => state.pixelsPerSecond);
  const scrollLeft = useTimelineStore((state) => state.scrollLeft);
  const duration = useTimelineStore((state) => state.duration);
  const setCurrentTime = useTimelineStore((state) => state.setCurrentTime);

  // 计算整个时间范围（不考虑滚动，因为外层容器通过 transform 处理滚动）
  const startTime = 0;
  const endTime = width / pixelsPerSecond;

  // 计算时间标记
  const timeMarks = calculateTimeMarks(startTime, endTime, pixelsPerSecond);

  // 点击标尺跳转到对应时间
  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    // 点击位置需要加上 scrollLeft，因为容器已经通过 transform 偏移了
    const time = pixelsToTime(x + scrollLeft, pixelsPerSecond);
    const clampedTime = Math.max(0, Math.min(duration, time));
    setCurrentTime(clampedTime);
  };

  return (
    <div
      className="relative bg-editor-bg border-editor-border select-none cursor-pointer"
      style={{
        height: TIMELINE_CONFIG.RULER_HEIGHT,
        width: "100%",
      }}
      onClick={handleRulerClick}
    >
      {/* 时间刻度 */}
      <div className="absolute inset-0">
        {timeMarks.map((mark, index) => {
          // 使用绝对位置，不减去 scrollLeft（外层容器通过 transform 处理滚动）
          const left = timeToPixels(mark.time, pixelsPerSecond);

          return (
            <div
              key={`${mark.time}-${index}`}
              className="absolute top-0"
              style={{ left: `${left}px` }}
            >
              {/* 刻度线 */}
              <div
                className={`${mark.isMajor ? "bg-text-tertiary" : "bg-text-muted"}`}
                style={{
                  width: "1px",
                  height: mark.isMajor ? "12px" : "6px",
                }}
              />

              {/* 时间标签 */}
              {mark.label && (
                <div
                  className="absolute top-3 text-xs text-text-muted"
                  style={{
                    transform: "translate(10%,-80%)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {mark.label}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
