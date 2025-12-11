// TimelineTrack 组件 - 时间轴轨道

"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { Track, getTrackHeight } from "../../types/timeline";
import { useTimelineStore } from "../../stores/timelineStore";
import { TimelineClip } from "./TimelineClip";

interface TimelineTrackProps {
  track: Track;
  index: number;
}

export const TimelineTrack: React.FC<TimelineTrackProps> = ({ track }) => {
  const selectedClipIds = useTimelineStore((state) => state.selectedClipIds);
  const selectedTrackId = useTimelineStore((state) => state.selectedTrackId);
  const selectTrack = useTimelineStore((state) => state.selectTrack);
  const clearSelection = useTimelineStore((state) => state.clearSelection);

  const isSelected = selectedTrackId === track.id;
  const trackHeight = getTrackHeight(track.type);

  // 配置拖拽放置区域
  const { setNodeRef, isOver } = useDroppable({
    id: `track-${track.id}`,
    data: {
      type: "track",
      trackId: track.id,
      trackType: track.type,
    },
    disabled: track.locked,
  });

  const handleTrackClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      clearSelection();
      selectTrack(track.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`relative border-t border-b border-editor-border ${
        isSelected ? "bg-(--color-editor-panel)" : "bg-editor-bg"
      } ${track.locked ? "opacity-50 cursor-not-allowed" : ""} ${
        isOver && !track.locked
          ? "bg-accent-blue/20 ring-2 ring-accent-blue"
          : ""
      }`}
      style={{
        height: trackHeight,
        minHeight: trackHeight,
      }}
      onClick={handleTrackClick}
    >
      {/* 拖拽悬停提示 */}
      {isOver && !track.locked && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="px-4 py-2 bg-accent-blue text-white rounded-lg text-sm">
            Drop here to add clip
          </div>
        </div>
      )}
      {/* 轨道背景网格 */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="h-full"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #fff 0, #fff 1px, transparent 1px, transparent 50px)",
          }}
        />
      </div>

      {/* Clips */}
      {track.visible && !track.locked && (
        <div className="relative h-full">
          {track.clips.map((clip) => (
            <TimelineClip
              key={clip.id}
              clip={clip}
              isSelected={selectedClipIds.includes(clip.id)}
            />
          ))}
        </div>
      )}

      {/* 锁定提示 */}
      {track.locked && (
        <div className="absolute inset-0 flex items-center justify-center text-text-muted text-sm pointer-events-none">
          Locked
        </div>
      )}

      {/* 隐藏提示 */}
      {!track.visible && (
        <div className="absolute inset-0 flex items-center justify-center text-text-muted text-sm pointer-events-none">
          Hidden
        </div>
      )}
    </div>
  );
};
