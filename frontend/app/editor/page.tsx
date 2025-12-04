"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { convertFileSrc } from "@tauri-apps/api/core";
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

  const [selectedVideoSrc, setSelectedVideoSrc] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // PlayerArea ref for external control
  const playerRef = useRef<PlayerAreaRef>(null);
  // Timeline ref for external control
  const timelineRef = useRef<TimelineRef>(null);

  // Initialize default tracks on mount
  useEffect(() => {
    if (tracks.length === 0) {
      // Add one video track and one audio track by default
      addTrack("video");
      addTrack("audio");
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
  );
}
