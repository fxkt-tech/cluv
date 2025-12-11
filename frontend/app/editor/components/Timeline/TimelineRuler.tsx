// TimelineRuler 组件 - 时间轴标尺

"use client";

import React from "react";
import { useTimelineStore } from "../../stores/timelineStore";
import {
  calculateTimeMarks,
  formatTimeSimple,
  timeToPixels,
} from "../../utils/timeline";
import { TIMELINE_CONFIG } from "../../types/timeline";

interface TimelineRulerProps {
  width: number;
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({ width }) => {
  const pixelsPerSecond = useTimelineStore((state) => state.pixelsPerSecond);
  const scrollLeft = useTimelineStore((state) => state.scrollLeft);
  const duration = useTimelineStore((state) => state.duration);

  // 计算可见时间范围
  const startTime = scrollLeft / pixelsPerSecond;
  const endTime = (scrollLeft + width) / pixelsPerSecond;

  // 计算时间标记
  const timeMarks = calculateTimeMarks(startTime, endTime, pixelsPerSecond);

  return (
    <div
      className="relative bg-editor-bg border-b border-editor-border select-none"
      style={{
        height: TIMELINE_CONFIG.RULER_HEIGHT,
        width: "100%",
      }}
    >
      {/* 时间刻度 */}
      <div className="absolute inset-0">
        {timeMarks.map((mark, index) => {
          const left = timeToPixels(mark.time, pixelsPerSecond) - scrollLeft;

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
                    transform: "translateX(-50%)",
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

      {/* 总时长显示 */}
      <div className="absolute right-2 top-1 text-xs text-text-muted">
        Total: {formatTimeSimple(duration)}
      </div>
    </div>
  );
};
