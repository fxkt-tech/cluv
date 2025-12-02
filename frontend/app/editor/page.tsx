"use client";

import { useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

  const {
    state,
    updateProperty,
    setActiveTab,
    setActivePropertyTab,
    setZoomLevel,
    selectClip,
  } = useEditorState();

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
    console.log("Play/Pause clicked");
    // TODO: Implement playback
  };

  const handleBackToHome = () => {
    router.push("/");
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
            projectPath={project?.path || null}
            loadResources={loadResources}
          />

          {/* Center: Player */}
          <PlayerArea
            playbackTime={state.playbackTime}
            onPlayPause={handlePlayPause}
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
          tracks={state.tracks}
          selectedClipId={state.selectedClipId}
          zoomLevel={state.zoomLevel}
          onClipSelect={selectClip}
          onZoomChange={setZoomLevel}
        />
      </div>
    </div>
  );
}
