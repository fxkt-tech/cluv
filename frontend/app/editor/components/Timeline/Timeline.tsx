// Timeline 组件 - 主时间轴容器

"use client";

import React, {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  useDndContext,
} from "@dnd-kit/core";
import { useTimelineStore } from "../../stores/timelineStore";
import { TimelineRuler } from "./TimelineRuler";
import { Playhead } from "./Playhead";
import { TimelineTrack } from "./TimelineTrack";
import { TrackHeader } from "./TrackHeader";
import { TIMELINE_CONFIG } from "../../types/timeline";
import { DragData } from "../../types/timeline";
import {
  pixelsToTime,
  collectSnapPoints,
  calculateSnappedTime,
  getAllClipsFromTracks,
} from "../../utils/timeline";
import { ClipDragPreview } from "./ClipDragPreview";
import { KeyboardShortcutsHelp } from "../KeyboardShortcutsHelp";

/**
 * Timeline 暴露的方法接口
 */
export interface TimelineRef {
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
}

interface TimelineProps {
  className?: string;
  onPlayPauseChange?: (isPlaying: boolean) => void;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
}

export const Timeline = forwardRef<TimelineRef, TimelineProps>(
  ({ className = "", onPlayPauseChange, onDragStart, onDragEnd }, ref) => {
    const tracks = useTimelineStore((state) => state.tracks);
    const scrollLeft = useTimelineStore((state) => state.scrollLeft);
    const setScrollLeft = useTimelineStore((state) => state.setScrollLeft);
    const pixelsPerSecond = useTimelineStore((state) => state.pixelsPerSecond);
    const duration = useTimelineStore((state) => state.duration);
    const zoomLevel = useTimelineStore((state) => state.zoomLevel);
    const setZoomLevel = useTimelineStore((state) => state.setZoomLevel);
    const zoomIn = useTimelineStore((state) => state.zoomIn);
    const zoomOut = useTimelineStore((state) => state.zoomOut);
    const addTrack = useTimelineStore((state) => state.addTrack);
    const addClip = useTimelineStore((state) => state.addClip);
    const moveClip = useTimelineStore((state) => state.moveClip);
    const updateClip = useTimelineStore((state) => state.updateClip);
    const currentTime = useTimelineStore((state) => state.currentTime);
    const setCurrentTime = useTimelineStore((state) => state.setCurrentTime);
    const snappingEnabled = useTimelineStore((state) => state.snappingEnabled);
    const snapThreshold = useTimelineStore((state) => state.snapThreshold);
    const toggleSnapping = useTimelineStore((state) => state.toggleSnapping);
    const undo = useTimelineStore((state) => state.undo);
    const redo = useTimelineStore((state) => state.redo);
    const canUndo = useTimelineStore((state) => state.canUndo);
    const canRedo = useTimelineStore((state) => state.canRedo);

    const timelineContentRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState<number>(0);
    const [activeDragData, setActiveDragData] = useState<DragData | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const animationFrameRef = useRef<number | undefined>(undefined);

    // 暴露方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        play: () => {
          setIsPlaying(true);
          onPlayPauseChange?.(true);
        },
        pause: () => {
          setIsPlaying(false);
          onPlayPauseChange?.(false);
        },
        togglePlayPause: () => {
          const newState = !isPlaying;
          setIsPlaying(newState);
          onPlayPauseChange?.(newState);
        },
      }),
      [isPlaying, onPlayPauseChange],
    );

    // 计算时间轴内容区域的总宽度
    const totalWidth = Math.max(
      pixelsPerSecond * (duration + 10), // 额外增加10秒的空白区域
      containerWidth,
    );

    // 播放动画循环
    useEffect(() => {
      if (isPlaying) {
        const startTime = performance.now();
        const initialTime = currentTime;

        const animate = () => {
          const elapsed = (performance.now() - startTime) / 1000;
          const newTime = initialTime + elapsed;

          if (newTime >= duration) {
            setIsPlaying(false);
            setCurrentTime(duration);
            onPlayPauseChange?.(false);
          } else {
            setCurrentTime(newTime);
            animationFrameRef.current = requestAnimationFrame(animate);
          }
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
        };
      }
    }, [isPlaying, currentTime, duration, setCurrentTime, onPlayPauseChange]);

    // 监听容器尺寸变化
    useEffect(() => {
      const updateSize = () => {
        if (timelineContentRef.current) {
          const rect = timelineContentRef.current.getBoundingClientRect();
          setContainerWidth(rect.width);
        }
      };

      updateSize();
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }, []);

    // 处理水平滚动
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      setScrollLeft(target.scrollLeft);
    };

    // 处理鼠标滚轮缩放
    const handleWheel = (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          zoomIn();
        } else {
          zoomOut();
        }
      }
    };

    // 处理播放/暂停
    const handlePlayPause = () => {
      const newState = !isPlaying;
      setIsPlaying(newState);
      onPlayPauseChange?.(newState);
    };

    // 内部拖拽处理
    useEffect(() => {
      if (onDragStart) {
        // 父组件会处理拖拽开始
      }
    }, [onDragStart]);

    useEffect(() => {
      if (onDragEnd) {
        // 父组件会处理拖拽结束
      }
    }, [onDragEnd]);

    return (
      <>
        <div className={`flex flex-col bg-editor-bg ${className}`}>
          {/* 工具栏 */}
          <div className="flex items-center justify-between px-4 py-1 bg-editor-panel border-y border-editor-border">
            <div className="flex items-center gap-2">
              {/* 播放控制 */}
              <button
                onClick={handlePlayPause}
                className="p-1 hover:bg-editor-hover text-text-muted hover:text-(--color-editor-dark) rounded transition-colors"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>

              <div className="w-px h-6 bg-editor-border" />
              <button
                onClick={() => addTrack("video")}
                className="p-1 hover:bg-editor-hover text-text-muted hover:text-(--color-editor-dark) rounded transition-colors"
                title="Add Video Track"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
              </button>
              <button
                onClick={() => addTrack("audio")}
                className="p-1 hover:bg-editor-hover text-text-muted hover:text-(--color-editor-dark) rounded transition-colors"
                title="Add Audio Track"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* 撤销/重做按钮 */}
              <button
                onClick={undo}
                disabled={!canUndo()}
                className="p-1 hover:bg-editor-hover text-text-muted hover:text-(--color-editor-dark) rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Undo (Ctrl+Z)"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <button
                onClick={redo}
                disabled={!canRedo()}
                className="p-1 hover:bg-editor-hover text-text-muted hover:text-(--color-editor-dark) rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Redo (Ctrl+Shift+Z)"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.293 3.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 9H9a5 5 0 00-5 5v2a1 1 0 11-2 0v-2a7 7 0 017-7h5.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              <div className="w-px h-6 bg-editor-border" />

              {/* 吸附开关 */}
              <button
                onClick={toggleSnapping}
                className={`p-1 rounded transition-colors ${
                  snappingEnabled
                    ? "bg-accent-magenta text-white hover:bg-accent-magenta/90"
                    : "hover:bg-editor-hover text-text-muted hover:text-(--color-editor-dark)"
                }`}
                title={snappingEnabled ? "Snapping: ON" : "Snapping: OFF"}
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              <div className="w-px h-6 bg-editor-border" />

              {/* 快捷键帮助 */}
              <KeyboardShortcutsHelp />

              {/* 缩放控制 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={zoomOut}
                  className="p-1 hover:bg-editor-hover text-text-muted hover:text-(--color-editor-dark) rounded transition-colors"
                  title="Zoom Out"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={zoomLevel}
                  onChange={(e) => {
                    setZoomLevel(Number(e.target.value));
                  }}
                  className="w-24 h-1 bg-editor-hover rounded-lg appearance-none cursor-pointer accent-accent-blue"
                  title={`Zoom Level: ${zoomLevel.toFixed(1)}x`}
                  style={{
                    background: `linear-gradient(to right, var(--color-accent-blue) 0%, var(--color-accent-blue) ${((zoomLevel - 0.1) / 9.9) * 100}%, var(--color-editor-hover) ${((zoomLevel - 0.1) / 9.9) * 100}%, var(--color-editor-hover) 100%)`,
                  }}
                />
                <button
                  onClick={zoomIn}
                  className="p-1 hover:bg-editor-hover text-text-muted hover:text-(--color-editor-dark) rounded transition-colors"
                  title="Zoom In"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* 时间轴主体 */}
          <div className="flex flex-1 overflow-hidden">
            {/* 左侧轨道头部列 */}
            <div className="shrink-0 overflow-y-auto">
              {/* 标尺占位 */}
              <div
                className="bg-(--color-editor-panel) border-b border-r border-editor-border"
                style={{
                  width: TIMELINE_CONFIG.TRACK_HEADER_WIDTH,
                  height: TIMELINE_CONFIG.RULER_HEIGHT,
                  minHeight: TIMELINE_CONFIG.RULER_HEIGHT,
                }}
              >
                <div className="flex items-center justify-center h-full text-xs text-text-muted">
                  Tracks
                </div>
              </div>

              {/* 轨道头部列表 */}
              {tracks.map((track, index) => (
                <TrackHeader key={track.id} track={track} index={index} />
              ))}
            </div>

            {/* 右侧时间轴内容区域 */}
            <div className="flex-1 overflow-hidden relative">
              {/* 标尺区域（固定在顶部） */}
              <div className="relative z-20">
                <TimelineRuler width={containerWidth} />
              </div>

              {/* 可滚动的轨道内容区域 */}
              <div
                ref={timelineContentRef}
                data-timeline-content
                className="overflow-auto relative"
                style={{
                  height: "calc(100% - 30px)", // 减去标尺高度
                }}
                onScroll={handleScroll}
                onWheel={handleWheel}
              >
                {/* 时间轴内容容器 */}
                <div
                  className="relative"
                  style={{
                    width: `${totalWidth}px`,
                    minHeight: "100%",
                  }}
                >
                  {/* Playhead */}
                  <Playhead
                    containerWidth={containerWidth}
                    containerHeight={
                      tracks.length * TIMELINE_CONFIG.TRACK_HEIGHT || 300
                    }
                  />

                  {/* 轨道列表 */}
                  {tracks.map((track, index) => (
                    <TimelineTrack key={track.id} track={track} index={index} />
                  ))}

                  {/* 空状态 */}
                  {tracks.length === 0 && (
                    <div
                      className="flex items-center justify-center text-[var(--color-text-muted)]"
                      style={{ height: "300px" }}
                    >
                      <div className="text-center">
                        <svg
                          className="w-16 h-16 mx-auto mb-4 opacity-50"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                        <p className="text-lg mb-2">Timeline is empty</p>
                        <p className="text-sm">
                          Add tracks and drag media from the resource panel
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  },
);

Timeline.displayName = "Timeline";
