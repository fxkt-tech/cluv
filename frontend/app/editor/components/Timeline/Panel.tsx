// Timeline 组件 - 主时间轴容器（四层布局架构）

"use client";

import React, {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { DragStartEvent, DragEndEvent, useDndMonitor } from "@dnd-kit/core";
import { useTimelineStore } from "../../stores/timelineStore";
import { TimelineRuler } from "./Ruler";
import { Playhead } from "./Playhead";
import { TimelineTrack } from "./Track";
import { TrackHeader } from "./TrackHeader";
import { TIMELINE_CONFIG, getTrackHeight } from "../../types/timeline";
import { DragData } from "../../types/timeline";
import { TimelineToolbar } from "./Toolbar";

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
    const zoomIn = useTimelineStore((state) => state.zoomIn);
    const zoomOut = useTimelineStore((state) => state.zoomOut);
    const currentTime = useTimelineStore((state) => state.currentTime);
    const setCurrentTime = useTimelineStore((state) => state.setCurrentTime);

    const mainScrollRef = useRef<HTMLDivElement>(null);
    const rulerContentRef = useRef<HTMLDivElement>(null);
    const headersContentRef = useRef<HTMLDivElement>(null);
    const timelineBodyRef = useRef<HTMLDivElement>(null);

    const [containerWidth, setContainerWidth] = useState<number>(0);
    const [containerHeight, setContainerHeight] = useState<number>(0);
    const [activeDragData, setActiveDragData] = useState<DragData | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const animationFrameRef = useRef<number | undefined>(undefined);

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
        <TimelineToolbar isPlaying={isPlaying} onPlayPause={handlePlayPause} />

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
          <div className="bg-editor-bg border-editor-border">
            <div className="flex items-center justify-center h-full text-xs text-text-muted">
              {/*Tracks*/}
            </div>
          </div>

          {/* 第2层：标尺区域（固定顶部，水平同步） */}
          <div className="overflow-hidden border-editor-border relative bg-editor-bg">
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
                <TimelineTrack
                  key={track.id}
                  track={track}
                  index={index}
                  isResourceDragging={
                    activeDragData !== null && "resourceId" in activeDragData
                  }
                  activeDragResourceType={
                    activeDragData &&
                    "resourceId" in activeDragData &&
                    (activeDragData.resourceType === "video" ||
                      activeDragData.resourceType === "audio" ||
                      activeDragData.resourceType === "image")
                      ? activeDragData.resourceType
                      : undefined
                  }
                />
              ))}
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
