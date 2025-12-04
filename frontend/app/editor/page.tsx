"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { convertFileSrc } from "@tauri-apps/api/core";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import {
  Header,
  ResourcePanel,
  PlayerArea,
  PropertiesPanel,
  Timeline,
} from "./components";
import { useEditorState } from "./hooks/useEditorState";
import { useProjectResources } from "./hooks/useProjectResources";
import { useProjectById } from "./hooks/useProjectById";
import { useTimelineStore } from "./stores/timelineStore";
import { Resource } from "./types/editor";
import { formatTimeWithDuration } from "./utils/time";
import type { PlayerAreaRef } from "./components/PlayerArea";
import type { TimelineRef } from "./components/Timeline";
import { DragData } from "./types/timeline";
import {
  pixelsToTime,
  collectSnapPoints,
  calculateSnappedTime,
  getAllClipsFromTracks,
} from "./utils/timeline";
import { ClipDragPreview } from "./components/ClipDragPreview";

export default function EditorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get("id");

  const {
    project,
    isLoading: isLoadingProject,
    error: projectError,
  } = useProjectById(projectId);
  const {
    resources,
    isLoading: isLoadingResources,
    error: resourceError,
    loadResources,
  } = useProjectResources(project?.path || null);
  const { state, updateProperty, setActiveTab, setActivePropertyTab } =
    useEditorState();

  // Timeline store
  const tracks = useTimelineStore((state) => state.tracks);
  const addTrack = useTimelineStore((state) => state.addTrack);
  const timelineCurrentTime = useTimelineStore((state) => state.currentTime);
  const setTimelineCurrentTime = useTimelineStore(
    (state) => state.setCurrentTime,
  );
  const timelineDuration = useTimelineStore((state) => state.duration);
  const setTimelineDuration = useTimelineStore((state) => state.setDuration);
  const addClip = useTimelineStore((state) => state.addClip);
  const moveClip = useTimelineStore((state) => state.moveClip);
  const updateClip = useTimelineStore((state) => state.updateClip);
  const pixelsPerSecond = useTimelineStore((state) => state.pixelsPerSecond);
  const scrollLeft = useTimelineStore((state) => state.scrollLeft);
  const snappingEnabled = useTimelineStore((state) => state.snappingEnabled);
  const snapThreshold = useTimelineStore((state) => state.snapThreshold);

  const [selectedVideoSrc, setSelectedVideoSrc] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeDragData, setActiveDragData] = useState<DragData | null>(null);

  // PlayerArea ref for external control
  const playerRef = useRef<PlayerAreaRef>(null);
  // Timeline ref for external control
  const timelineRef = useRef<TimelineRef>(null);

  // 全局拖拽传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // Initialize default tracks on mount
  useEffect(() => {
    if (tracks.length === 0) {
      // Add one video track and one audio track by default
      addTrack("video");
      // addTrack("audio");
    }
  }, []);

  // Sync Timeline time to local state
  useEffect(() => {
    setCurrentTime(timelineCurrentTime);
  }, [timelineCurrentTime]);

  // Sync Timeline duration to local state
  useEffect(() => {
    setDuration(timelineDuration);
  }, [timelineDuration]);

  const projectName = useMemo(() => {
    if (project) {
      return project.name;
    }
    return "Untitled Project";
  }, [project]);

  const handleExport = () => {
    console.log("Export clicked");
    // TODO: Implement export functionality
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    console.log("Play/Pause clicked", { isPlaying: !isPlaying });
  };

  const handlePrevious = () => {
    console.log("Previous frame clicked");
  };

  const handleNext = () => {
    console.log("Next frame clicked");
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
    // Update Timeline when player time changes (only when playing)
    if (isPlaying) {
      setTimelineCurrentTime(time);
    }
  };

  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
    // Update Timeline duration
    setTimelineDuration(newDuration);
  };

  // Handle Timeline seek
  const handleTimelineSeek = (time: number) => {
    // Update Timeline store
    setTimelineCurrentTime(time);
    // Update PlayerArea
    if (playerRef.current) {
      playerRef.current.seekTo(time);
    }
  };

  // Handle play/pause state change from Timeline
  const handleTimelinePlayPauseChange = (playing: boolean) => {
    setIsPlaying(playing);
    if (playerRef.current) {
      if (playing) {
        playerRef.current.play();
      } else {
        playerRef.current.pause();
      }
    }
  };

  const handleBackToHome = () => {
    router.push("/");
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
      const rect = document
        .querySelector("[data-timeline-content]")
        ?.getBoundingClientRect();
      if (!rect) return;

      const x = event.activatorEvent
        ? (event.activatorEvent as PointerEvent).clientX - rect.left
        : 0;
      let startTime = pixelsToTime(x + scrollLeft, pixelsPerSecond);

      // 应用吸附
      if (snappingEnabled) {
        const allClips = getAllClipsFromTracks(tracks);
        const snapPoints = collectSnapPoints(allClips, timelineCurrentTime);
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
      const rect = document
        .querySelector("[data-timeline-content]")
        ?.getBoundingClientRect();
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
        const snapPoints = collectSnapPoints(
          allClips,
          timelineCurrentTime,
          clipId,
        );
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
        // 同轨道内拖拽,只更新时间
        updateClip(clipId, { startTime: newStartTime });
      }
    }
  };

  // 键盘快捷键
  useKeyboardShortcuts({
    enabled: true,
    onPlayPause: () => {
      if (timelineRef.current) {
        timelineRef.current.togglePlayPause();
      }
    },
    onStepForward: () => {
      if (playerRef.current) {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        playerRef.current.seekTo(Math.min(duration, currentTime + 1 / 30));
      }
    },
    onStepBackward: () => {
      if (playerRef.current) {
        const currentTime = playerRef.current.getCurrentTime();
        playerRef.current.seekTo(Math.max(0, currentTime - 1 / 30));
      }
    },
  });

  const handleResourceSelect = (resource: Resource | null) => {
    if (resource && resource.type === "media" && resource.src) {
      // Convert file path to Tauri asset protocol URL
      const assetUrl = convertFileSrc(resource.src);
      setSelectedVideoSrc(assetUrl);
      // Reset playback state when new video is selected
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
    } else {
      // Clear video when resource is deselected
      setSelectedVideoSrc(null);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
    }
  };

  if (isLoadingProject) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-editor-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-accent-blue border-t-transparent" />
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-editor-bg">
        <div className="rounded-lg p-8 max-w-md bg-editor-panel">
          <p className="mb-4 text-accent-red">
            {projectError || "Project not found"}
          </p>
          <button
            onClick={handleBackToHome}
            className="px-4 py-2 text-white rounded-lg bg-accent-blue hover:bg-accent-cyan transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-screen w-screen overflow-hidden font-sans bg-editor-bg text-text-primary">
        {/* Header */}
        <Header
          projectId={project.id}
          projectName={projectName}
          onExport={handleExport}
          onBack={handleBackToHome}
        />

        {/* Error Banner */}
        {resourceError && (
          <div className="border-b border-accent-red bg-accent-red/10 px-4 py-2">
            <p className="text-sm text-accent-red">⚠️ {resourceError}</p>
          </div>
        )}

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Top Section */}
          <div className="flex-1 flex min-h-0">
            {/* Left Sidebar: Resources */}
            <ResourcePanel
              activeTab={state.activeTab}
              onTabChange={setActiveTab}
              resources={resources}
              isLoading={isLoadingResources}
              onResourceSelect={handleResourceSelect}
              projectPath={project?.path || null}
              loadResources={loadResources}
            />

            {/* Center: Player */}
            <PlayerArea
              ref={playerRef}
              videoSrc={selectedVideoSrc}
              playbackTime={formatTimeWithDuration(currentTime, duration)}
              onPlayPause={handlePlayPause}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onTimeUpdate={handleTimeUpdate}
              onDurationChange={handleDurationChange}
              externalTime={timelineCurrentTime}
            />

            {/* Right Sidebar: Properties */}
            <PropertiesPanel
              activeTab={state.activePropertyTab}
              onTabChange={setActivePropertyTab}
              properties={state.properties}
              onPropertyChange={updateProperty}
            />
          </div>

          {/* Bottom Section: Timeline */}
          <Timeline
            ref={timelineRef}
            className="h-80"
            onPlayPauseChange={handleTimelinePlayPauseChange}
          />
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
}
