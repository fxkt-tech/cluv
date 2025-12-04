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
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { useTimelineStore } from "../stores/timelineStore";
import { TimelineRuler } from "./TimelineRuler";
import { Playhead } from "./Playhead";
import { TimelineTrack } from "./TimelineTrack";
import { TrackHeader } from "./TrackHeader";
import { TIMELINE_CONFIG } from "../types/timeline";
import { DragData } from "../types/timeline";
import {
  pixelsToTime,
  collectSnapPoints,
  calculateSnappedTime,
  getAllClipsFromTracks,
} from "../utils/timeline";
import { ClipDragPreview } from "./ClipDragPreview";
import { KeyboardShortcutsHelp } from "./KeyboardShortcutsHelp";

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
}

export const Timeline = forwardRef<TimelineRef, TimelineProps>(
  ({ className = "", onPlayPauseChange }, ref) => {
    const tracks = useTimelineStore((state) => state.tracks);
    const scrollLeft = useTimelineStore((state) => state.scrollLeft);
    const setScrollLeft = useTimelineStore((state) => state.setScrollLeft);
    const pixelsPerSecond = useTimelineStore((state) => state.pixelsPerSecond);
    const duration = useTimelineStore((state) => state.duration);
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

    // 配置拖拽传感器
    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 8, // 拖拽8像素后才激活
        },
      }),
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

    // 处理拖拽开始
    const handleDragStart = (event: DragStartEvent) => {
      const { active } = event;
      const data = active.data.current;

      // 判断是资源还是片段
      if (data && "resourceId" in data) {
        setActiveDragData(data as DragData);
      }
    };

    // 处理拖拽结束
    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveDragData(null);

      if (!over) return;

      const activeData = active.data.current;
      const dropData = over.data.current;

      if (!activeData || !dropData) return;

      // 情况1: 从资源面板拖拽到轨道
      if ("resourceId" in activeData && dropData.type === "track") {
        const dragData = activeData as DragData;
        const trackId = dropData.trackId;
        const track = tracks.find((t) => t.id === trackId);

        if (!track || track.locked) return;

        // 计算拖放的时间位置
        const rect = timelineContentRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = event.activatorEvent
          ? (event.activatorEvent as PointerEvent).clientX - rect.left
          : 0;
        let startTime = pixelsToTime(x + scrollLeft, pixelsPerSecond);

        // 应用吸附
        if (snappingEnabled) {
          const allClips = getAllClipsFromTracks(tracks);
          const snapPoints = collectSnapPoints(allClips, currentTime);
          const snapped = calculateSnappedTime(
            startTime,
            snapPoints,
            snapThreshold,
            pixelsPerSecond,
          );
          if (snapped.snapped) {
            startTime = snapped.time;
          }
        }

        // 根据资源类型确定默认时长
        const defaultDuration = dragData.resourceType === "audio" ? 5 : 3;

        // 添加片段到轨道
        addClip(trackId, {
          name: dragData.resourceName,
          type: dragData.resourceType,
          startTime: Math.max(0, startTime),
          duration: defaultDuration,
          resourceId: dragData.resourceId,
          resourceSrc: dragData.resourceSrc,
          trimStart: 0,
          trimEnd: defaultDuration,
          position: { x: 0, y: 0 },
          scale: 1,
          rotation: 0,
          opacity: 1,
          volume: 1,
        });
      }
      // 情况2: 在时间轴内拖拽片段
      else if (activeData.type === "clip" && dropData.type === "track") {
        const clipId = activeData.clipId;
        const sourceTrackId = activeData.trackId;
        const targetTrackId = dropData.trackId;

        const targetTrack = tracks.find((t) => t.id === targetTrackId);
        if (!targetTrack || targetTrack.locked) return;

        // 计算新的时间位置
        const rect = timelineContentRef.current?.getBoundingClientRect();
        if (!rect) return;

        const deltaX = event.delta.x;

        const clip = useTimelineStore.getState().getClipById(clipId);
        if (!clip) return;

        // 计算新的开始时间
        const deltaTime = pixelsToTime(deltaX, pixelsPerSecond);
        let newStartTime = Math.max(0, clip.startTime + deltaTime);

        // 应用吸附
        if (snappingEnabled) {
          const allClips = getAllClipsFromTracks(tracks);
          const snapPoints = collectSnapPoints(allClips, currentTime, clipId);
          const snapped = calculateSnappedTime(
            newStartTime,
            snapPoints,
            snapThreshold,
            pixelsPerSecond,
          );
          if (snapped.snapped) {
            newStartTime = snapped.time;
          }
        }

        // 如果是跨轨道拖拽
        if (sourceTrackId !== targetTrackId) {
          moveClip(clipId, targetTrackId, newStartTime);
        } else {
          // 同轨道内拖拽，只更新时间
          updateClip(clipId, { startTime: newStartTime });
        }
      }
    };

    return (
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className={`flex flex-col bg-gray-900 ${className}`}>
          {/* 工具栏 */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-2">
              {/* 播放控制 */}
              <button
                onClick={handlePlayPause}
                className={`p-2 rounded transition-colors ${
                  isPlaying
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                } text-white`}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg
                    className="w-4 h-4"
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
                    className="w-4 h-4"
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

              <div className="w-px h-6 bg-gray-700" />
              <button
                onClick={() => addTrack("video")}
                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                + Video Track
              </button>
              <button
                onClick={() => addTrack("audio")}
                className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
              >
                + Audio Track
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* 撤销/重做按钮 */}
              <button
                onClick={undo}
                disabled={!canUndo()}
                className="p-1 hover:bg-gray-700 text-gray-400 hover:text-white rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
                className="p-1 hover:bg-gray-700 text-gray-400 hover:text-white rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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

              <div className="w-px h-6 bg-gray-700" />

              {/* 吸附开关 */}
              <button
                onClick={toggleSnapping}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  snappingEnabled
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                }`}
                title={snappingEnabled ? "Snapping: ON" : "Snapping: OFF"}
              >
                <div className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Snap</span>
                </div>
              </button>

              <div className="w-px h-6 bg-gray-700" />

              {/* 快捷键帮助 */}
              <KeyboardShortcutsHelp />

              <button
                onClick={zoomOut}
                className="p-1 hover:bg-gray-700 text-gray-400 hover:text-white rounded transition-colors"
                title="Zoom Out"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <button
                onClick={zoomIn}
                className="p-1 hover:bg-gray-700 text-gray-400 hover:text-white rounded transition-colors"
                title="Zoom In"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" />
                </svg>
              </button>
            </div>
          </div>

          {/* 时间轴主体 */}
          <div className="flex flex-1 overflow-hidden">
            {/* 左侧轨道头部列 */}
            <div className="shrink-0 overflow-y-auto">
              {/* 标尺占位 */}
              <div
                className="bg-gray-800 border-b border-r border-gray-700"
                style={{
                  width: TIMELINE_CONFIG.TRACK_HEADER_WIDTH,
                  height: TIMELINE_CONFIG.RULER_HEIGHT,
                  minHeight: TIMELINE_CONFIG.RULER_HEIGHT,
                }}
              >
                <div className="flex items-center justify-center h-full text-xs text-gray-500">
                  Tracks
                </div>
              </div>

              {/* 轨道头部列表 */}
              {tracks.map((track, index) => (
                <TrackHeader key={track.id} track={track} index={index} />
              ))}

              {/* 空状态提示 */}
              {tracks.length === 0 && (
                <div className="flex items-center justify-center p-8 text-gray-500 text-sm">
                  <div className="text-center">
                    <p>No tracks yet</p>
                    <p className="text-xs mt-1">
                      Click &quot;+&quot; to add a track
                    </p>
                  </div>
                </div>
              )}
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
                      className="flex items-center justify-center text-gray-600"
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

        {/* 拖拽覆盖层 - 显示正在拖拽的内容 */}
        <DragOverlay dropAnimation={null}>
          {activeDragData ? (
            <ClipDragPreview data={activeDragData} type="resource" />
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  },
);

Timeline.displayName = "Timeline";
