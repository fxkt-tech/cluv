// Timeline 组件 - 主时间轴容器（四层布局架构）

"use client";

import React, {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  DragStartEvent,
  DragEndEvent,
  useDroppable,
  useDndMonitor,
} from "@dnd-kit/core";
import { useTimelineStore } from "../../stores/timelineStore";
import { TimelineRuler } from "./TimelineRuler";
import { Playhead } from "./Playhead";
import { TimelineTrack } from "./TimelineTrack";
import { TrackHeader } from "./TrackHeader";
import { TIMELINE_CONFIG, getTrackHeight } from "../../types/timeline";
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
    const setScrollLeft = useTimelineStore((state) => state.setScrollLeft);
    const setScrollTop = useTimelineStore((state) => state.setScrollTop);
    const pixelsPerSecond = useTimelineStore((state) => state.pixelsPerSecond);
    const duration = useTimelineStore((state) => state.duration);
    const zoomLevel = useTimelineStore((state) => state.zoomLevel);
    const setZoomLevel = useTimelineStore((state) => state.setZoomLevel);
    const zoomIn = useTimelineStore((state) => state.zoomIn);
    const zoomOut = useTimelineStore((state) => state.zoomOut);
    const addTrack = useTimelineStore((state) => state.addTrack);
    const currentTime = useTimelineStore((state) => state.currentTime);
    const setCurrentTime = useTimelineStore((state) => state.setCurrentTime);
    const snappingEnabled = useTimelineStore((state) => state.snappingEnabled);
    const toggleSnapping = useTimelineStore((state) => state.toggleSnapping);
    const undo = useTimelineStore((state) => state.undo);
    const redo = useTimelineStore((state) => state.redo);
    const canUndo = useTimelineStore((state) => state.canUndo);
    const canRedo = useTimelineStore((state) => state.canRedo);

    const mainScrollRef = useRef<HTMLDivElement>(null);
    const rulerContentRef = useRef<HTMLDivElement>(null);
    const headersContentRef = useRef<HTMLDivElement>(null);
    const timelineBodyRef = useRef<HTMLDivElement>(null);

    const [containerWidth, setContainerWidth] = useState<number>(0);
    const [containerHeight, setContainerHeight] = useState<number>(0);
    const [activeDragData, setActiveDragData] = useState<DragData | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const animationFrameRef = useRef<number | undefined>(undefined);

    // 配置空白区域的 droppable
    const { setNodeRef: setEmptyAreaRef, isOver: isOverEmptyArea } =
      useDroppable({
        id: "timeline-empty-area",
        data: {
          type: "empty-area",
        },
      });

    // 监听拖拽事件以更新 activeDragData
    useDndMonitor({
      onDragStart: (event) => {
        const data = event.active.data.current;
        if (data && "resourceId" in data) {
          setActiveDragData(data as DragData);
        }
        onDragStart?.(event);
      },
      onDragEnd: (event) => {
        setActiveDragData(null);
        onDragEnd?.(event);
      },
      onDragCancel: () => {
        setActiveDragData(null);
      },
    });

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

    // 计算时间轴内容区域的总宽度和高度
    const totalWidth = Math.max(
      pixelsPerSecond * (duration + 10), // 额外增加10秒的空白区域
      containerWidth,
    );

    const totalHeight =
      tracks.reduce((sum, track) => {
        return sum + getTrackHeight(track.type);
      }, 0) + 100; // 额外增加100px的空白区域

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
        if (timelineBodyRef.current) {
          const rect = timelineBodyRef.current.getBoundingClientRect();
          setContainerWidth(rect.width - TIMELINE_CONFIG.TRACK_HEADER_WIDTH);
          setContainerHeight(rect.height - TIMELINE_CONFIG.RULER_HEIGHT);
        }
      };

      updateSize();
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }, []);

    // 处理主滚动区域的滚动事件
    const handleMainScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const newScrollLeft = target.scrollLeft;
      const newScrollTop = target.scrollTop;

      // 更新状态
      setScrollLeft(newScrollLeft);
      setScrollTop(newScrollTop);

      // 同步标尺区域（水平滚动）
      if (rulerContentRef.current) {
        rulerContentRef.current.style.transform = `translateX(-${newScrollLeft}px)`;
      }

      // 同步轨道头部区域（垂直滚动）
      if (headersContentRef.current) {
        headersContentRef.current.style.transform = `translateY(-${newScrollTop}px)`;
      }
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

    return (
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

        {/* 时间轴主体 - 四层Grid布局 */}
        <div
          ref={timelineBodyRef}
          className="flex-1 relative overflow-hidden"
          style={{
            display: "grid",
            gridTemplateColumns: `${TIMELINE_CONFIG.TRACK_HEADER_WIDTH}px 1fr`,
            gridTemplateRows: `${TIMELINE_CONFIG.RULER_HEIGHT}px 1fr`,
          }}
        >
          {/* 第1层：左上角占位区域 */}
          <div className="bg-editor-bg border-b border-r border-editor-border">
            <div className="flex items-center justify-center h-full text-xs text-text-muted">
              Tracks
            </div>
          </div>

          {/* 第2层：标尺区域（固定顶部，水平同步） */}
          <div className="overflow-hidden border-b border-editor-border relative bg-editor-bg">
            <div
              ref={rulerContentRef}
              style={{
                width: `${totalWidth}px`,
                willChange: "transform",
              }}
            >
              <TimelineRuler width={totalWidth} />
            </div>
          </div>

          {/* 第3层：轨道头部区域（固定左侧，垂直同步） */}
          <div className="overflow-hidden border-r border-editor-border relative bg-editor-bg">
            <div
              ref={headersContentRef}
              style={{
                willChange: "transform",
              }}
            >
              {tracks.map((track, index) => (
                <TrackHeader key={track.id} track={track} index={index} />
              ))}
            </div>
          </div>

          {/* 第4层：主滚动区域（唯一的滚动容器） */}
          <div
            ref={mainScrollRef}
            className="overflow-auto relative bg-editor-bg"
            onScroll={handleMainScroll}
            onWheel={handleWheel}
            data-timeline-content
          >
            {/* 内容容器 */}
            <div
              style={{
                width: `${totalWidth}px`,
                minHeight: `${Math.max(totalHeight, containerHeight)}px`,
              }}
            >
              {/* 轨道列表 */}
              {tracks.map((track, index) => (
                <TimelineTrack key={track.id} track={track} index={index} />
              ))}

              {/* 空白区域 - 用于拖拽创建新轨道 */}
              <div
                ref={setEmptyAreaRef}
                className={`relative transition-colors ${
                  isOverEmptyArea
                    ? "bg-accent-blue/10 ring-2 ring-inset ring-accent-blue"
                    : "bg-editor-bg"
                }`}
                style={{
                  minHeight: tracks.length === 0 ? "300px" : "100px",
                  borderTop:
                    tracks.length > 0
                      ? "1px solid var(--color-editor-border)"
                      : "none",
                }}
              >
                {isOverEmptyArea && activeDragData && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="px-4 py-2 bg-accent-blue text-white rounded-lg text-sm shadow-lg">
                      Create new{" "}
                      {activeDragData.resourceType === "audio"
                        ? "audio"
                        : "video"}{" "}
                      track
                    </div>
                  </div>
                )}

                {tracks.length === 0 && !isOverEmptyArea && (
                  <div className="absolute inset-0 flex items-center justify-center text-text-muted">
                    <div className="text-center">
                      <EmptyTimelineIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">Timeline is empty</p>
                      <p className="text-sm">
                        Drag media here to create tracks
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Playhead 覆盖层（独立于滚动，绝对定位） */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: TIMELINE_CONFIG.RULER_HEIGHT,
              left: TIMELINE_CONFIG.TRACK_HEADER_WIDTH,
              right: 0,
              bottom: 0,
              zIndex: 100,
            }}
          >
            <Playhead
              containerWidth={containerWidth}
              containerHeight={containerHeight}
            />
          </div>
        </div>
      </div>
    );
  },
);

Timeline.displayName = "Timeline";
