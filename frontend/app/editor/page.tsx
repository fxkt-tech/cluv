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
import { COLORS } from "./constants/theme";

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
      <div className="flex items-center justify-center h-screen w-screen" style={{ backgroundColor: COLORS.editor.bg }}>
        <div
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
          style={{ borderColor: COLORS.accent.blue, borderTopColor: "transparent", borderBottomColor: "transparent" }}
        ></div>
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="flex items-center justify-center h-screen w-screen" style={{ backgroundColor: COLORS.editor.bg }}>
        <div className="rounded-lg p-8 max-w-md" style={{ backgroundColor: COLORS.editor.panel }}>
          <p className="mb-4" style={{ color: COLORS.accent.red }}>
            {projectError || "Project not found"}
          </p>
          <button
            onClick={handleBackToHome}
            className="px-4 py-2 text-white rounded-lg transition-colors"
            style={{ backgroundColor: COLORS.accent.blue }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.accent.cyan;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.accent.blue;
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden font-sans"
      style={{
        backgroundColor: COLORS.editor.bg,
        color: COLORS.text.primary,
      }}
    >
      {/* Header */}
      <Header
        projectId={project.id}
        projectName={projectName}
        onExport={handleExport}
        onBack={handleBackToHome}
      />

      {/* Error Banner */}
      {resourceError && (
        <div className="border-b px-4 py-2" style={{ backgroundColor: `${COLORS.accent.red}20`, borderBottomColor: COLORS.accent.red }}>
          <p className="text-sm" style={{ color: COLORS.accent.red }}>⚠️ {resourceError}</p>
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
