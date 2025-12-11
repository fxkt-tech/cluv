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
} from "./components";
import { Timeline } from "./components/Timeline/Timeline";
import { useEditorState } from "./hooks/useEditorState";
import { useProjectById } from "./hooks/useProjectById";
import { useEditor } from "./hooks/useEditor";
import { useTimelineStore } from "./stores/timelineStore";
import { Resource } from "./types/editor";
import { formatTimeWithDuration } from "./utils/time";
import type { PlayerAreaRef } from "./components/Player/PlayerArea";
import type { TimelineRef } from "./components/Timeline/Timeline";
import { DragData, MediaType, Clip } from "./types/timeline";
import {
  pixelsToTime,
  collectSnapPoints,
  calculateSnappedTime,
  getAllClipsFromTracks,
} from "./utils/timeline";
import { ClipDragPreview } from "./components/Timeline/ClipDragPreview";
import {
  CutProtocol,
  VideoMaterialProto,
  AudioMaterialProto,
  ImageMaterialProto,
} from "./types/protocol";

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
    protocol,
    isLoading: isLoadingProtocol,
    error: protocolError,
    saveProtocol,
    reloadProtocol,
  } = useEditor(projectId);

  const { state, updateProperty, setActiveTab, setActivePropertyTab } =
    useEditorState();

  // Timeline store
  const tracks = useTimelineStore((state) => state.tracks);
  const addTrack = useTimelineStore((state) => state.addTrack);
  const setTracks = useTimelineStore((state) => state.setTracks);
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
  const [selectedResource, setSelectedResource] = useState<{
    id: string;
    type: string;
    data: VideoMaterialProto | AudioMaterialProto | ImageMaterialProto;
  } | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeDragData, setActiveDragData] = useState<DragData | Clip | null>(
    null,
  );

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

  // Convert protocol materials to resources format
  const resources = useMemo(() => {
    if (!protocol) return [];

    const result: Array<{
      id: string;
      name: string;
      src: string;
      resource_type: string;
    }> = [];

    // Add videos
    protocol.materials.videos.forEach((video) => {
      result.push({
        id: video.id,
        name: video.name,
        src: video.src,
        resource_type: "video",
      });
    });

    // Add audios
    protocol.materials.audios.forEach((audio) => {
      result.push({
        id: audio.id,
        name: audio.name,
        src: audio.src,
        resource_type: "audio",
      });
    });

    // Add images
    protocol.materials.images.forEach((image) => {
      result.push({
        id: image.id,
        name: image.name,
        src: image.src,
        resource_type: "image",
      });
    });

    return result;
  }, [protocol]);

  // Initialize tracks from protocol
  useEffect(() => {
    if (!protocol) return;

    if (protocol.tracks.length > 0) {
      // Convert protocol tracks to timeline tracks
      const timelineTracks = protocol.tracks.map((track, index) => ({
        id: track.id,
        name: `Track ${index + 1}`,
        type: track.type as "video" | "audio",
        clips: track.segments.map((segment) => ({
          id: segment.id,
          name: segment.material_id,
          type: segment.type as MediaType,
          trackId: track.id,
          startTime: segment.target_timerange.start / 1000, // Convert ms to seconds
          duration: segment.target_timerange.duration / 1000,
          resourceId: segment.material_id,
          resourceSrc: "",
          trimStart: segment.source_timerange.start / 1000,
          trimEnd:
            (segment.source_timerange.start +
              segment.source_timerange.duration) /
            1000,
          position: segment.position || { x: 0, y: 0 },
          scale: segment.scale ? segment.scale.width / protocol.stage.width : 1,
          rotation: 0,
          opacity: 1,
          volume: 1,
        })),
        visible: true,
        locked: false,
        muted: false,
        order: index,
      }));

      setTracks(timelineTracks);
    } else if (tracks.length === 0) {
      // Add default track if no tracks exist
      addTrack("video");
    }
  }, [protocol]);

  // Get material duration helper
  const getMaterialDuration = (resourceId: string): number => {
    if (!protocol) return 3;

    const video = protocol.materials.videos.find((v) => v.id === resourceId);
    if (video && video.duration) {
      return video.duration / 1000; // Convert ms to seconds
    }

    const audio = protocol.materials.audios.find((a) => a.id === resourceId);
    if (audio && audio.duration) {
      return audio.duration / 1000;
    }

    // Default duration for images
    return 3;
  };

  // Save protocol to backend
  const handleSaveProtocol = async () => {
    if (!protocol) return;

    try {
      // Update protocol with current timeline state
      const updatedProtocol: CutProtocol = {
        ...protocol,
        tracks: tracks.map((track) => ({
          id: track.id,
          type: track.type,
          segments: track.clips.map((clip) => ({
            id: clip.id,
            type: clip.type,
            material_id: clip.resourceId || clip.id,
            target_timerange: {
              start: Math.round(clip.startTime * 1000), // Convert to ms
              duration: Math.round(clip.duration * 1000),
            },
            source_timerange: {
              start: Math.round(clip.trimStart * 1000),
              duration: Math.round((clip.trimEnd - clip.trimStart) * 1000),
            },
            scale: clip.scale
              ? {
                  width: Math.round(clip.scale * protocol.stage.width),
                  height: Math.round(clip.scale * protocol.stage.height),
                }
              : undefined,
            position: clip.position,
          })),
        })),
      };

      await saveProtocol(updatedProtocol);
      console.log("Protocol saved successfully");
    } catch (err) {
      console.error("Failed to save protocol:", err);
    }
  };

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

  const handleExport = async () => {
    console.log("Export clicked");
    // Save protocol before exporting
    await handleSaveProtocol();
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
    if (data && "resourceId" in data && !("clipId" in data)) {
      setActiveDragData(data as DragData);
    } else if (data && data.type === "clip") {
      // 处理 clip 拖拽 - 直接传递 clip 对象
      const clip = useTimelineStore.getState().getClipById(data.clipId);
      if (clip) {
        setActiveDragData(clip);
      }
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

      // Get actual duration from material
      const materialDuration = getMaterialDuration(dragData.resourceId);

      // 添加片段到轨道
      addClip(trackId, {
        name: dragData.resourceName,
        type: dragData.resourceType,
        startTime: Math.max(0, startTime),
        duration: materialDuration,
        resourceId: dragData.resourceId,
        resourceSrc: dragData.resourceSrc,
        trimStart: 0,
        trimEnd: materialDuration,
        position: { x: 0, y: 0 },
        scale: 1,
        rotation: 0,
        opacity: 1,
        volume: 1,
      });
    } else if (activeData.type === "clip" && dropData.type === "track") {
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
    if (resource && resource.src) {
      // Find the material in protocol
      if (protocol) {
        const video = protocol.materials.videos.find(
          (v) => v.id === resource.id,
        );
        if (video) {
          setSelectedResource({
            id: video.id,
            type: "video",
            data: video,
          });
          // Convert file path to Tauri asset protocol URL
          const assetUrl = convertFileSrc(video.src);
          setSelectedVideoSrc(assetUrl);
          setCurrentTime(0);
          setDuration(0);
          setIsPlaying(false);
          return;
        }

        const audio = protocol.materials.audios.find(
          (a) => a.id === resource.id,
        );
        if (audio) {
          setSelectedResource({
            id: audio.id,
            type: "audio",
            data: audio,
          });
          // Clear video for audio
          setSelectedVideoSrc(null);
          setCurrentTime(0);
          setDuration(0);
          setIsPlaying(false);
          return;
        }

        const image = protocol.materials.images.find(
          (i) => i.id === resource.id,
        );
        if (image) {
          setSelectedResource({
            id: image.id,
            type: "image",
            data: image,
          });
          // Convert file path to Tauri asset protocol URL
          const assetUrl = convertFileSrc(image.src);
          setSelectedVideoSrc(assetUrl);
          setCurrentTime(0);
          setDuration(0);
          setIsPlaying(false);
          return;
        }
      }
    } else {
      // Clear selection
      setSelectedResource(null);
      setSelectedVideoSrc(null);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
    }
  };

  if (isLoadingProject || isLoadingProtocol) {
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
        {protocolError && (
          <div className="border-b border-accent-red bg-accent-red/10 px-4 py-2">
            <p className="text-sm text-accent-red">⚠️ {protocolError}</p>
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
              isLoading={isLoadingProtocol}
              onResourceSelect={handleResourceSelect}
              projectPath={project?.path || null}
              loadResources={reloadProtocol}
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
              selectedResource={selectedResource}
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
          <ClipDragPreview
            data={activeDragData}
            type={"name" in activeDragData ? "clip" : "resource"}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
