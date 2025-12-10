// ClipDragPreview 组件 - 拖拽时的预览组件

"use client";

import React from "react";
import { DragData, Clip, MediaType } from "../../types/timeline";
import { ClipContent } from "./ClipContent";

interface ClipDragPreviewProps {
  data: DragData | Clip;
  type: "resource" | "clip";
}

export const ClipDragPreview: React.FC<ClipDragPreviewProps> = ({
  data,
  type,
}) => {
  // 如果是拖动 Clip，直接使用 ClipContent 组件保持一致性
  if (type === "clip" && "name" in data) {
    return <ClipContent clip={data as Clip} isDragging={false} />;
  }

  // 以下是拖动 Resource 时的卡片样式
  const getName = () => {
    if ("resourceName" in data) {
      return data.resourceName;
    }
    return "name" in data ? data.name : "";
  };

  const getMediaType = (): MediaType => {
    if ("resourceType" in data) {
      return data.resourceType;
    }
    return "type" in data ? data.type : "video";
  };

  const getTypeColor = () => {
    const mediaType = getMediaType();
    switch (mediaType) {
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

  const getTypeIcon = () => {
    const mediaType = getMediaType();
    switch (mediaType) {
      case "video":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
        );
      case "audio":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "image":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "text":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 shadow-xl ${getTypeColor()} text-white`}
      style={{
        minWidth: "150px",
        maxWidth: "250px",
      }}
    >
      {/* 图标 */}
      <div className="shrink-0">{getTypeIcon()}</div>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate">{getName()}</div>
      </div>

      {/* 拖拽图标 */}
      <div className="shrink-0 opacity-75">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </div>
    </div>
  );
};
