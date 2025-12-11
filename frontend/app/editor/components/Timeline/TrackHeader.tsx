// TrackHeader 组件 - 轨道头部控制面板

"use client";

import React from "react";
import { Track } from "../../types/timeline";
import { useTimelineStore } from "../../stores/timelineStore";
import { TIMELINE_CONFIG } from "../../types/timeline";
import {
  VideoTrackIcon,
  AudioTrackIcon,
  EyeIcon,
  EyeOffIcon,
  LockClosedIcon,
  LockOpenIcon,
  VolumeOffIcon,
  VolumeUpIcon,
  TrashIcon,
} from "../icons";

interface TrackHeaderProps {
  track: Track;
  index: number;
}

export const TrackHeader: React.FC<TrackHeaderProps> = ({ track }) => {
  const updateTrack = useTimelineStore((state) => state.updateTrack);
  const removeTrack = useTimelineStore((state) => state.removeTrack);
  const selectedTrackId = useTimelineStore((state) => state.selectedTrackId);

  const isSelected = selectedTrackId === track.id;

  const handleToggleVisible = () => {
    updateTrack(track.id, { visible: !track.visible });
  };

  const handleToggleLocked = () => {
    updateTrack(track.id, { locked: !track.locked });
  };

  const handleToggleMuted = () => {
    updateTrack(track.id, { muted: !track.muted });
  };

  const handleDelete = () => {
    if (confirm(`Delete track "${track.name}"?`)) {
      removeTrack(track.id);
    }
  };

  return (
    <div
      className={`flex items-center justify-center border-b border-r border-editor-border px-2 py-2 ${
        isSelected ? "bg-(--color-editor-panel)" : "bg-editor-bg"
      }`}
      style={{
        width: TIMELINE_CONFIG.TRACK_HEADER_WIDTH,
        height: TIMELINE_CONFIG.TRACK_HEIGHT,
        minWidth: TIMELINE_CONFIG.TRACK_HEADER_WIDTH,
      }}
    >
      <div className="flex items-center gap-2">
        {/* 轨道类型图标 */}
        <div className="shrink-0">
          {track.type === "video" ? (
            <VideoTrackIcon className="w-4 h-4 text-accent-blue" />
          ) : (
            <AudioTrackIcon className="w-4 h-4 text-accent-green" />
          )}
        </div>

        {/* 竖线分隔符 */}
        <div className="h-4 w-px bg-editor-border" />

        {/* 锁定按钮 */}
        <button
          onClick={handleToggleLocked}
          className={`p-1 rounded hover:bg-editor-hover transition-colors ${
            track.locked ? "text-accent-red" : "text-text-muted"
          }`}
          title={track.locked ? "Unlock track" : "Lock track"}
        >
          {track.locked ? (
            <LockClosedIcon className="w-4 h-4" />
          ) : (
            <LockOpenIcon className="w-4 h-4" />
          )}
        </button>

        {/* 可见性按钮 */}
        <button
          onClick={handleToggleVisible}
          className={`p-1 rounded hover:bg-editor-hover transition-colors ${
            track.visible ? "text-accent-blue" : "text-text-muted"
          }`}
          title={track.visible ? "Hide track" : "Show track"}
        >
          {track.visible ? (
            <EyeIcon className="w-4 h-4" />
          ) : (
            <EyeOffIcon className="w-4 h-4" />
          )}
        </button>

        {/* 静音按钮 */}
        <button
          onClick={handleToggleMuted}
          className={`p-1 rounded hover:bg-editor-hover transition-colors ${
            track.muted ? "text-accent-yellow" : "text-text-muted"
          }`}
          title={track.muted ? "Unmute track" : "Mute track"}
          disabled={track.locked}
        >
          {track.muted ? (
            <VolumeOffIcon className="w-4 h-4" />
          ) : (
            <VolumeUpIcon className="w-4 h-4" />
          )}
        </button>

        {/* 删除按钮 */}
        <button
          onClick={handleDelete}
          className="p-1 rounded hover:bg-accent-red/20 text-text-muted hover:text-accent-red transition-colors"
          title="Delete track"
          disabled={track.locked}
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
