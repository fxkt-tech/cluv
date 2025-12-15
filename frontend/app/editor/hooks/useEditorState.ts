/**
 * useEditorState Hook
 * Centralized state management for the editor
 */

import { useState } from "react";
import { EditorState, Properties } from "../types/editor";
import { MOCK_TRACKS } from "../constants/data";

const INITIAL_PROPERTIES: Properties = {
  scale: 100,
  posX: 0,
  posY: 0,
  rotation: 0,
  opacity: 100,
};

const INITIAL_STATE: EditorState = {
  tracks: MOCK_TRACKS,
  selectedClipId: null,
  selectedTrackId: null,
  currentTime: 0,
  playbackTime: "00:00:00:00",
  zoomLevel: 1,
  activeTab: "media",
  activePropertyTab: "video",
  properties: INITIAL_PROPERTIES,
  isPlaying: false,
};

export function useEditorState() {
  const [state, setState] = useState<EditorState>(INITIAL_STATE);

  const updateProperty = (prop: keyof Properties, value: number) => {
    setState((prev) => ({
      ...prev,
      properties: {
        ...prev.properties,
        [prop]: value,
      },
    }));
  };

  const setActiveTab = (tab: string) => {
    setState((prev) => ({
      ...prev,
      activeTab: tab,
    }));
  };

  const setActivePropertyTab = (
    tab: "video" | "audio" | "speed" | "effects",
  ) => {
    setState((prev) => ({
      ...prev,
      activePropertyTab: tab,
    }));
  };

  const setPlaybackTime = (time: string) => {
    setState((prev) => ({
      ...prev,
      playbackTime: time,
    }));
  };

  const setCurrentTime = (time: number) => {
    setState((prev) => ({
      ...prev,
      currentTime: time,
    }));
  };

  const setIsPlaying = (playing: boolean) => {
    setState((prev) => ({
      ...prev,
      isPlaying: playing,
    }));
  };

  const setZoomLevel = (zoom: number) => {
    setState((prev) => ({
      ...prev,
      zoomLevel: Math.max(0.5, Math.min(zoom, 3)),
    }));
  };

  const selectClip = (clipId: string | null) => {
    setState((prev) => ({
      ...prev,
      selectedClipId: clipId,
    }));
  };

  const selectTrack = (trackId: string | null) => {
    setState((prev) => ({
      ...prev,
      selectedTrackId: trackId,
    }));
  };

  const resetProperties = () => {
    setState((prev) => ({
      ...prev,
      properties: INITIAL_PROPERTIES,
    }));
  };

  return {
    state,
    updateProperty,
    setActiveTab,
    setActivePropertyTab,
    setPlaybackTime,
    setCurrentTime,
    setIsPlaying,
    setZoomLevel,
    selectClip,
    selectTrack,
    resetProperties,
  };
}
