// TrackDropZone 组件 - 轨道之间的拖放区域，用于在指定位置插入新轨道

"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";

interface TrackDropZoneProps {
  position: "above" | "below";
  trackIndex: number;
  isActive: boolean; // 是否有拖拽正在进行
  activeDragType?: "video" | "audio" | "image"; // 当前拖拽的资源类型
}

export const TrackDropZone: React.FC<TrackDropZoneProps> = ({
  position,
  trackIndex,
  isActive,
}) => {
  // 计算插入索引：above 使用当前索引，below 使用当前索引+1
  const insertIndex = position === "above" ? trackIndex : trackIndex + 1;

  const { setNodeRef, isOver } = useDroppable({
    id: `track-drop-zone-${position}-${trackIndex}`,
    data: {
      type: "track-drop-zone",
      position,
      trackIndex,
      insertIndex,
    },
  });

  // 只在拖拽资源时显示
  if (!isActive) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      className={`absolute left-0 right-0 z-50 transition-all ${
        position === "above" ? "-top-2" : "-bottom-2"
      }`}
      style={{
        height: isOver ? "24px" : "16px",
        marginTop: position === "above" ? "0" : "-8px",
        marginBottom: position === "below" ? "0" : "-8px",
      }}
    >
      <div
        className={`h-full transition-all ${
          isOver
            ? "bg-accent-blue/30 border-2 border-accent-blue border-dashed"
            : "bg-transparent hover:bg-accent-blue/10"
        }`}
        style={{
          borderRadius: "4px",
        }}
      >
        {isOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none"></div>
        )}
      </div>
    </div>
  );
};
