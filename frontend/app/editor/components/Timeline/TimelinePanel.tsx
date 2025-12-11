// Timeline 组件 - 主时间轴容器

"use client";

import React, {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { useTimelineStore } from "../../stores/timelineStore";
import { TimelineRuler } from "./TimelineRuler";
import { Playhead } from "./Playhead";
import { TimelineTrack } from "./TimelineTrack";
import { TrackHeader } from "./TrackHeader";
import { TIMELINE_CONFIG } from "../../types/timeline";
import { DragData } from "../../types/timeline";
import {
  PlayCircleIcon,
  PauseCircleIcon,
  VideoTrackIcon,
  AudioTrackIcon,
  UndoIcon,
  RedoIcon,
  SnappingIcon,
  ZoomOutIcon,
  ZoomInIcon,
  EmptyTimelineIcon,
} from "../../icons";

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
          <div className="flex items-center justify-between px-4 py-1 bg-editor-bg border-y border-editor-border">
            <div className="flex items-center gap-2">
              {/* 播放控制 */}
              <button
                onClick={handlePlayPause}
                className="p-1 hover:bg-editor-hover text-text-muted hover:text-(--color-editor-dark) rounded transition-colors"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <PauseCircleIcon className="w-5 h-5" />
                ) : (
                  <PlayCircleIcon className="w-5 h-5" />
                )}
              </button>

              <div className="w-px h-6 bg-editor-border" />
              <button
                onClick={() => addTrack("video")}
                className="p-1 hover:bg-editor-hover text-text-muted hover:text-(--color-editor-dark) rounded transition-colors"
                title="Add Video Track"
              >
                <VideoTrackIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => addTrack("audio")}
                className="p-1 hover:bg-editor-hover text-text-muted hover:text-(--color-editor-dark) rounded transition-colors"
                title="Add Audio Track"
              >
                <AudioTrackIcon className="w-5 h-5" />
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
                <UndoIcon className="w-5 h-5" />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo()}
                className="p-1 hover:bg-editor-hover text-text-muted hover:text-(--color-editor-dark) rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Redo (Ctrl+Shift+Z)"
              >
                <RedoIcon className="w-5 h-5" />
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
                <SnappingIcon className="w-5 h-5" />
              </button>

              <div className="w-px h-6 bg-editor-border" />

              {/* 缩放控制 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={zoomOut}
                  className="p-1 hover:bg-editor-hover text-text-muted hover:text-(--color-editor-dark) rounded transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOutIcon className="w-5 h-5" />
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
                  <ZoomInIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* 时间轴主体 */}
          <div className="flex flex-1 overflow-hidden">
            {/* 左侧轨道头部列 */}
            <div className="shrink-0 overflow-y-auto flex flex-col">
              {/* 标尺占位 */}
              <div
                className="bg-editor-bg border-b border-r border-editor-border shrink-0"
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

              {/* 轨道头部列表容器 - 垂直居中 */}
              <div className="flex-1 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full">
                    {tracks.map((track, index) => (
                      <TrackHeader key={track.id} track={track} index={index} />
                    ))}
                  </div>
                </div>
              </div>
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
                className="overflow-auto relative flex items-center"
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
                  {/* Playhead - 贯穿整个容器 */}
                  <Playhead containerWidth={containerWidth} />

                  {/* 轨道列表容器 - 垂直居中 */}
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full">
                      {/* 轨道列表 */}
                      {tracks.map((track, index) => (
                        <TimelineTrack
                          key={track.id}
                          track={track}
                          index={index}
                        />
                      ))}

                      {/* 空状态 */}
                      {tracks.length === 0 && (
                        <div
                          className="flex items-center justify-center text-text-muted"
                          style={{ height: "300px" }}
                        >
                          <div className="text-center">
                            <EmptyTimelineIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
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
          </div>
        </div>
      </>
    );
  },
);

Timeline.displayName = "Timeline";
