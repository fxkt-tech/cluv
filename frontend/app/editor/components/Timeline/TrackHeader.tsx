// TrackHeader 组件 - 轨道头部控制面板

"use client";

import React from "react";
import { Track } from "../../types/timeline";
import { useTimelineStore } from "../../stores/timelineStore";
import { TIMELINE_CONFIG } from "../../types/timeline";

interface TrackHeaderProps {
  track: Track;
  index: number;
}

export const TrackHeader: React.FC<TrackHeaderProps> = ({ track, index }) => {
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
      className={`flex flex-col justify-between border-b border-r border-gray-700 px-2 py-2 ${
        isSelected ? "bg-gray-800" : "bg-gray-900"
      }`}
      style={{
        width: TIMELINE_CONFIG.TRACK_HEADER_WIDTH,
        height: TIMELINE_CONFIG.TRACK_HEIGHT,
        minWidth: TIMELINE_CONFIG.TRACK_HEADER_WIDTH,
      }}
    >
      {/* 轨道名称 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* 轨道类型图标 */}
          <div className="shrink-0">
            {track.type === "video" ? (
              <svg
                className="w-4 h-4 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>

          {/* 轨道名称 */}
          <input
            type="text"
            value={track.name}
            onChange={(e) => updateTrack(track.id, { name: e.target.value })}
            className="bg-transparent text-white text-sm font-medium truncate outline-none focus:bg-gray-800 px-1 rounded flex-1 min-w-0"
            disabled={track.locked}
          />
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center gap-1">
        {/* 可见性按钮 */}
        <button
          onClick={handleToggleVisible}
          className={`p-1 rounded hover:bg-gray-700 transition-colors ${
            track.visible ? "text-blue-400" : "text-gray-500"
          }`}
          title={track.visible ? "Hide track" : "Show track"}
        >
          {track.visible ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fillRule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                clipRule="evenodd"
              />
              <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
            </svg>
          )}
        </button>

        {/* 锁定按钮 */}
        <button
          onClick={handleToggleLocked}
          className={`p-1 rounded hover:bg-gray-700 transition-colors ${
            track.locked ? "text-red-400" : "text-gray-500"
          }`}
          title={track.locked ? "Unlock track" : "Lock track"}
        >
          {track.locked ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
            </svg>
          )}
        </button>

        {/* 静音按钮 */}
        {track.type === "audio" && (
          <button
            onClick={handleToggleMuted}
            className={`p-1 rounded hover:bg-gray-700 transition-colors ${
              track.muted ? "text-yellow-400" : "text-gray-500"
            }`}
            title={track.muted ? "Unmute track" : "Mute track"}
            disabled={track.locked}
          >
            {track.muted ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        )}

        {/* 删除按钮 */}
        <button
          onClick={handleDelete}
          className="p-1 rounded hover:bg-red-900 text-gray-500 hover:text-red-400 transition-colors ml-auto"
          title="Delete track"
          disabled={track.locked}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
