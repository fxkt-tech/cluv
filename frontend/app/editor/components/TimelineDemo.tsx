// Timeline 演示组件 - 用于测试和展示 Timeline 功能

"use client";

import React, { useEffect } from "react";
import { useTimelineStore } from "../stores/timelineStore";
import { MediaType } from "../types/timeline";

export const TimelineDemo: React.FC = () => {
  const tracks = useTimelineStore((state) => state.tracks);
  const addTrack = useTimelineStore((state) => state.addTrack);
  const addClip = useTimelineStore((state) => state.addClip);
  const currentTime = useTimelineStore((state) => state.currentTime);
  const duration = useTimelineStore((state) => state.duration);
  const selectedClipIds = useTimelineStore((state) => state.selectedClipIds);
  const zoomLevel = useTimelineStore((state) => state.zoomLevel);

  // 初始化演示数据
  useEffect(() => {
    if (tracks.length === 0) {
      // 添加视频轨道
      addTrack("video");
      addTrack("audio");
    }
  }, [tracks.length, addTrack]);

  // 添加示例片段
  const handleAddSampleClip = (type: MediaType) => {
    if (tracks.length === 0) return;

    const targetTrack = tracks.find((t) =>
      type === "audio" ? t.type === "audio" : t.type === "video"
    );

    if (!targetTrack) return;

    const randomStart = Math.random() * 10;
    const randomDuration = 2 + Math.random() * 5;

    addClip(targetTrack.id, {
      name: `Sample ${type} ${Date.now()}`,
      type,
      startTime: randomStart,
      duration: randomDuration,
      resourceId: `resource_${Date.now()}`,
      resourceSrc: `/samples/${type}.mp4`,
      trimStart: 0,
      trimEnd: randomDuration,
      position: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
      opacity: 1,
      volume: 1,
    });
  };

  return (
    <div className="fixed top-4 right-4 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-xl z-50 max-w-xs">
      <h3 className="text-white font-bold mb-3 text-sm">Timeline Debug Panel</h3>

      {/* 状态信息 */}
      <div className="space-y-2 mb-4 text-xs text-gray-300">
        <div className="flex justify-between">
          <span>Tracks:</span>
          <span className="text-white font-mono">{tracks.length}</span>
        </div>
        <div className="flex justify-between">
          <span>Total Clips:</span>
          <span className="text-white font-mono">
            {tracks.reduce((sum, t) => sum + t.clips.length, 0)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Current Time:</span>
          <span className="text-white font-mono">{currentTime.toFixed(2)}s</span>
        </div>
        <div className="flex justify-between">
          <span>Duration:</span>
          <span className="text-white font-mono">{duration.toFixed(2)}s</span>
        </div>
        <div className="flex justify-between">
          <span>Zoom Level:</span>
          <span className="text-white font-mono">{zoomLevel.toFixed(2)}x</span>
        </div>
        <div className="flex justify-between">
          <span>Selected:</span>
          <span className="text-white font-mono">{selectedClipIds.length}</span>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="space-y-2">
        <div className="text-xs text-gray-400 mb-1">Quick Actions:</div>

        <button
          onClick={() => handleAddSampleClip("video")}
          className="w-full px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          disabled={tracks.length === 0}
        >
          + Add Video Clip
        </button>

        <button
          onClick={() => handleAddSampleClip("audio")}
          className="w-full px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
          disabled={tracks.length === 0}
        >
          + Add Audio Clip
        </button>

        <button
          onClick={() => handleAddSampleClip("image")}
          className="w-full px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
          disabled={tracks.length === 0}
        >
          + Add Image Clip
        </button>

        <button
          onClick={() => handleAddSampleClip("text")}
          className="w-full px-3 py-1.5 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
          disabled={tracks.length === 0}
        >
          + Add Text Clip
        </button>
      </div>

      {/* 轨道信息 */}
      {tracks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-2">Tracks Info:</div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="text-xs bg-gray-900 rounded p-2"
              >
                <div className="text-white font-medium truncate">
                  {track.name}
                </div>
                <div className="text-gray-400 flex justify-between mt-1">
                  <span>{track.type}</span>
                  <span>{track.clips.length} clips</span>
                </div>
                <div className="flex gap-1 mt-1">
                  {!track.visible && (
                    <span className="px-1 py-0.5 bg-gray-700 rounded text-[10px]">
                      Hidden
                    </span>
                  )}
                  {track.locked && (
                    <span className="px-1 py-0.5 bg-red-900 rounded text-[10px]">
                      Locked
                    </span>
                  )}
                  {track.muted && (
                    <span className="px-1 py-0.5 bg-yellow-900 rounded text-[10px]">
                      Muted
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
